# Project: bm-ai-orchestrator-gateway

## PURPOSE

This repository is a **NestJS API Gateway only**. It sits between:

| System | URL | Role |
|--------|-----|------|
| Core Platform (WEB Core) | `https://core.behnmeyer.com/bmd/api` | Auth, login, profile, menu permissions |
| bm-ai-orchestrator (AI Chat) | `https://ai.behnmeyer.com/v1/` | Downstream AI Chat API |

Clients never call the AI Orchestrator directly. They send Core Bearer tokens to this gateway; the gateway authenticates against Core, enforces menu RBAC, then proxies AI Chat traffic to the orchestrator.

## SCOPE (IN)

- Single app: `apps/api-gateway`
- Auth against Core (`/auth/profile`, `/auth/menupermissions`; login only if Core is the login source)
- RBAC via Core menu permissions (`@MenuKey` + `@RequirePermission`)
- HTTP proxy / BFF routes to `https://ai.behnmeyer.com/v1/`
- Shared libs used by the gateway: `libs/common`, `libs/auth` (AuthContext)
- Swagger at `/api-docs` (gateway only)
- Helmet, CORS, throttling, RFC 7807 errors, Joi env validation

## SCOPE (OUT)

Do **not** use, add, or extend:

- `apps/api-services` (NestJS internal services app) — leftover starterkit; **not part of this project**
- Prisma, SQL Server, `libs/database`, repositories, master-data, local business APIs
- Proxying to a local `SERVICES_BASE_URL` / `:3001` Nest service
- Internal JWT trust-boundary designed for in-repo `api-services` (`aud=api-services`)
- New NestJS microservices, queues, or domain modules that belong in Core or in bm-ai-orchestrator

If leftover `api-services` / Prisma files exist, treat them as **out of scope**. Do not wire gateway routes to them.

## ROLE
You are a senior backend architect specialized in NestJS API Gateway / BFF
patterns. Generate production-ready code, not pseudo-code. Keep this repo
thin: auth + RBAC + proxy. Business/AI logic lives in Core or in
bm-ai-orchestrator, not here.

## Task list


## CODING RULES
- TS strict, NO `any` (use `unknown` + type guards)
- ConfigService only, NEVER `process.env.X`
- HTTP clients: @nestjs/axios with timeout 5s + 3x retry (Core and AI Orchestrator)
- Error response: RFC 7807 `application/problem+json`
- Env vars: UPPER_SNAKE_CASE
- Every guard/interceptor MUST have `.spec.ts` (happy + sad path)
- Service method returns domain-shaped object, controller maps to DTO
- Downstream base URL: `AI_ORCHESTRATOR_BASE_URL` (prod: `https://ai.behnmeyer.com/v1`)
- Core base URL: `CORE_BASE_URL` (prod: `https://core.behnmeyer.com/bmd/api`)

## SECURITY BASELINE
- User token: Core-issued Bearer. Gateway does **not** verify JWT signature locally.
  Validate by calling Core `GET /auth/profile`. Core 401 → reject.
- Menu RBAC: Core `GET /auth/menupermissions` is the source of truth.
- Do not introduce an in-repo `api-services` trust boundary (RS256 internal JWT
  with `aud=api-services`, shared `GATEWAY_API_KEY` to a Nest service in this repo).
- If the AI Orchestrator requires identity headers, forward only what that API
  documents (plus `x-request-id`). Do not invent a services-style header contract.
- Helmet, strict CORS, @nestjs/throttler (100 req/min/IP)
- Sentry: error-only, no PII
- Env validated with Joi at bootstrap

## Mode
- Edit files only. STOP when finished.
- DO NOT run: build, lint, test, docker, prisma, install.
- Wait for "NEXT" for the next step.

## If verification is needed
Ask first: "Run <command>? (y/n)".
