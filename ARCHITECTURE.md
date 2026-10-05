# ARCHITECTURE

**bm-ai-orchestrator-gateway** is a NestJS **API Gateway / BFF only**.

It is **not** a monorepo of gateway + internal Nest services. It does **not** host business logic, Prisma, or `api-services`. Downstream AI Chat lives in **bm-ai-orchestrator**; identity lives in **Core**.

```
WEB Core — Auth / Login / Menu Permissions
CORE_BASE_URL
   │  HTTP + Bearer token
   ▼
[api-gateway]  ← this repository
   1. CoreBearerGuard      → pastikan Authorization Bearer ada
   2. MenuPermissionGuard  → RBAC menu dari Core `GET /auth/menupermissions`
        - @MenuKey(...)
        - @RequirePermission('show-list-data' | ... )
   3. ContextInjectionInterceptor
        - validate token via Core `GET /auth/profile`
        - bangun AuthContext
        - inject `x-request-id` (dan header identitas lain hanya jika AI Orchestrator membutuhkannya)
   4. ProxyController      → forward ke bm-ai-orchestrator
   5. Swagger at /api-docs (gateway only)
   │  HTTP
   ▼
bm-ai-orchestrator — AI Chat
AI_ORCHESTRATOR_BASE_URL
```

## Purpose & boundaries

| In scope | Out of scope |
|----------|----------------|
| `apps/api-gateway` | `apps/api-services` (starterkit leftover; do not use) |
| Proxy Core ↔ AI Chat | Prisma, SQL Server, `libs/database` |
| Core auth + menu RBAC | Master data / activity CRUD as a product of this repo |
| Swagger, health, security middleware | NestJS internal microservices in this repo |

Client **tidak** memanggil `AI_ORCHESTRATOR_BASE_URL` langsung untuk traffic yang melewati gateway. Semua request lewat **api-gateway**. Core adalah sumber autentikasi dan permission.

# FOLDER STRUCTURE

Target layout (gateway-only):

```
bm-ai-orchestrator-gateway/
├── apps/
│   └── api-gateway/
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           ├── config/{configuration.ts,validation.schema.ts}
│           ├── modules/
│           │   ├── auth/           # Core client: profile, menupermissions
│           │   ├── proxy/          # forward request ke AI Orchestrator /v1
│           │   ├── health/
│           │   └── swagger/
│           └── interceptors/context-injection.interceptor.ts
│
├── libs/
│   ├── common/                     # filters, logger, constants, dto umum
│   │   └── src/
│   │       ├── constants/{headers.constants.ts,error-codes.constants.ts}
│   │       ├── filters/http-exception.filter.ts    # RFC 7807
│   │       ├── interceptors/{logging.interceptor.ts,request-id.interceptor.ts}
│   │       ├── logger/logger.module.ts
│   │       ├── dto/{pagination.dto.ts,api-response.dto.ts}
│   │       └── index.ts
│   └── auth/                       # AuthContext, @CurrentUser
│       └── src/
│           ├── interfaces/auth-context.interface.ts
│           ├── decorators/current-user.decorator.ts
│           └── index.ts
│
├── docker/{api-gateway.Dockerfile}
├── docker-compose.yml
├── .env.example
├── nest-cli.json
├── tsconfig.base.json
├── package.json
├── AGENTS.md
├── ARCHITECTURE.md
└── README.md
```

Do not add `apps/api-services`, `prisma/`, or `libs/database` as part of this architecture. If those paths still exist from bm-starterkit-be, they are **not** in the request path.

# TECH STACK

- NestJS 10 + TypeScript (api-gateway only)
- HTTP: `@nestjs/axios` (Core + AI Orchestrator), timeout 5s + 3x retry
- Auth / RBAC: Core Bearer + `MenuPermissionGuard` (bukan CASL lokal, bukan JWT_SECRET lokal)
- helmet & cors di api-gateway
- Validation: class-validator & class-transformer
- Package manager: pnpm
- API docs: Swagger (`/api-docs`)
- Env: Joi at bootstrap
- **Bukan bagian stack ini:** Prisma, SQL Server, `@nestjs/microservices`, in-repo api-services

# INTEGRATION (Core → Gateway → AI Orchestrator)

```
Client              api-gateway (:3000)           Core API                         AI Orchestrator
                    this repo                     CORE_BASE_URL                AI_ORCHESTRATOR_BASE_URL
  |                       |                            |                                |
  |  (login di WEB Core; token Core)                   |                                |
  |                       |                            |                                |
  |-- AI Chat request --->|                            |                                |
  |   Authorization:      |-- GET /auth/profile ------>|                                |
  |   Bearer <Core token> |   Bearer <Core token>      |                                |
  |                       |<------ profile ------------|                                |
  |                       |                            |                                |
  |                       |-- GET /auth/menupermissions |                                |
  |                       |<------ menus --------------|                                |
  |                       |                            |                                |
  |                       | map profile → AuthContext  |                                |
  |                       | inject x-request-id        |                                |
  |                       |-- proxy AI Chat ------------------------------------------->|
  |<---- JSON / stream ---|<-----------------------------------------------------------|
```

## FLOW API

1. **Login Core** — User login di WEB Core (`CORE_BASE_URL`). Gateway **bukan** identity provider. Token yang dipakai client adalah access token Core.
2. **Request AI Chat** — Client kirim `Authorization: Bearer <accessToken>` ke gateway (route proxy AI, bukan ke orchestrator langsung).
3. **Validasi ke Core** — Gateway **tidak** memverifikasi signature JWT sendiri. Token diteruskan ke Core `GET /auth/profile`. Jika Core 401 → request ditolak.
4. **RBAC menu** — `MenuPermissionGuard` memanggil Core `GET /auth/menupermissions`, cocokkan `menu_key` + permission. 403 jika tidak ada.
5. **Bangun AuthContext** — Profile Core di-map ke `{ userId, appCode, roles, employee, raw }`.
6. **Proxy** — Gateway forward ke `AI_ORCHESTRATOR_BASE_URL`. Path, method, query, dan body mengikuti kontrak AI Chat orchestrator.
7. **Tidak ada api-services** — Tidak ada hop ke Nest service di repo ini, tidak ada Prisma, tidak ada `ApiKeyGuard` / `InternalAuthGuard` in-repo.

## Header contract

| Header | Arah | Isi |
|--------|------|-----|
| `Authorization: Bearer <jwt>` | Client → Gateway | Token dari Core |
| `Authorization: Bearer <jwt>` | Gateway → Core | Token yang sama, untuk `/auth/profile` dan `/auth/menupermissions` |
| `x-request-id` | Gateway → AI Orchestrator | UUID v4 untuk tracing |
| identity headers ke orchestrator | Gateway → AI Orchestrator | Hanya sesuai kontrak bm-ai-orchestrator (jangan pakai kontrak `x-api-key` / `x-internal-token` milik starterkit api-services) |

### Contoh cepat (Swagger / curl)

```bash
# Token diambil dari WEB Core (bukan dari api-services).
# Pakai token Core ke endpoint gateway yang mem-proxy AI Chat.

curl -s http://localhost:3000/<ai-chat-path> \
  -H "Authorization: Bearer <accessToken>"
```

Di Swagger: Authorize → paste **hanya** `accessToken` (tanpa kata `Bearer`). Token harus diterbitkan oleh Core yang sama dengan `CORE_BASE_URL`.

## Env (gateway)

| Variable | Description |
|----------|-------------|
| `CORE_BASE_URL` | Core API. Nilai ada di `.env`, bukan di repo. |
| `CORE_APP_CODE` | Application code untuk konteks Core. Nilai ada di `.env`. |
| `AI_ORCHESTRATOR_BASE_URL` | AI Chat API. Nilai ada di `.env`, bukan di repo. |
| `GATEWAY_PORT` | Listen port gateway (default `3000`) |
| `SWAGGER_ENABLED` | Swagger di luar development |

Jangan andalkan `SERVICES_BASE_URL` / `SERVICES_PORT` sebagai downstream. Downstream resmi adalah AI Orchestrator.

## RBAC — Menu Permission (Gateway)

RBAC di gateway **tidak** menyimpan permission lokal. Sumber kebenaran = Core `GET /auth/menupermissions`. Gateway hanya mengecek apakah user punya permission untuk `menu_key` tertentu sebelum proxy ke AI Orchestrator.

### Alur

```
Client → Gateway route (@MenuKey + @RequirePermission)
       → CoreBearerGuard (Bearer wajib)
       → MenuPermissionGuard
            → GET {CORE_BASE_URL}/auth/menupermissions
            → cari menu_key → cek permission
            → 403 jika tidak ada
       → ContextInjectionInterceptor → Proxy → AI_ORCHESTRATOR_BASE_URL
```

### Response Core (envelope)

```json
{
  "status": true,
  "message": "Retrieved successfully",
  "data": {
    "records": [
      {
        "menu_key": "chat",
        "permissions": [
          "show-list-data"
        ]
      }
    ],
    "meta": { "page": 1, "limit": -1, "total": 1, "pageTotal": 1 }
  }
}
```

Gateway menormalisasi `data.records[]` menjadi `{ menu_key, permissions[] }`.

### Decorator di proxy controller

| Decorator | Contoh | Fungsi |
|-----------|--------|--------|
| `@MenuKey(...)` | `@MenuKey('chat')` (`AI_CHAT_MENU_KEY`) | Menu yang dicek di Core |
| `@RequirePermission(...)` | `@RequirePermission('show-list-data')` | Permission wajib per endpoint |

Core BM AI One saat ini hanya mengekspos `show-list-data` untuk `menu_key=chat`. Semua route chat-messages & conversations memakai permission itu. Menu lain: `dashboard`, `knowledge` (belum di-wire di gateway).

### File terkait

- `apps/api-gateway/src/modules/auth/menu-permissions.service.ts`
- `apps/api-gateway/src/modules/auth/guards/menu-permission.guard.ts`
- `apps/api-gateway/src/modules/auth/decorators/{menu-key,require-permission}.decorator.ts`
- `apps/api-gateway/src/modules/proxy/` — proxy ke AI Orchestrator (bukan ke `api-services`)

# NEXT
- Ganti downstream proxy dari leftover api-services ke `AI_ORCHESTRATOR_BASE_URL`
- Route AI Chat + menu_key Core yang sesuai
- Hapus / abaikan `apps/api-services` dari path arsitektur ini
