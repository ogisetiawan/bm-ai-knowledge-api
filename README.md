# 🚀 BM Starter Kit BE

> **Production-ready NestJS Monorepo Starter Kit** for building scalable backend applications with API Gateway, internal services, authentication, RBAC, Prisma ORM, and SQL Server.

[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs\&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript\&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma\&logoColor=white)](https://www.prisma.io/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-CC2927?logo=microsoft-sql-server\&logoColor=white)](https://www.microsoft.com/en-us/sql-server/)
[![pnpm](https://img.shields.io/badge/pnpm-8-F69220?logo=pnpm\&logoColor=white)](https://pnpm.io/)
[![Monorepo](https://img.shields.io/badge/Monorepo-Nx%20%2F%20Turbo-111111?logo=nx\&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

---

## 📌 Overview

**BM Starter Kit BE** is a modular NestJS monorepo designed as a foundation for enterprise backend applications.

The architecture separates the **API Gateway / BFF layer** from **internal business services**, while providing shared libraries for authentication, common infrastructure, and database abstractions.

### Applications

| Application       |   Port | Responsibility                                               |
| ----------------- | -----: | ------------------------------------------------------------ |
| 🌐 `api-gateway`  | `3000` | BFF, authentication, RBAC, context injection, proxy, Swagger |
| ⚙️ `api-services` | `3001` | Business logic, master data, Prisma ORM, database access     |

### Shared Libraries

| Library         | Responsibility                                        |
| --------------- | ----------------------------------------------------- |
| `libs/common`   | Filters, interceptors, logger, constants, shared DTOs |
| `libs/auth`     | Internal JWT service, `@CurrentUser`, `AuthContext`   |
| `libs/database` | Database abstractions such as `BaseRepository`        |

---

## 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │      Frontend        │
                         │   Web / Mobile App   │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     API Gateway      │
                         │        :3000         │
                         │                      │
                         │ • Authentication     │
                         │ • RBAC               │
                         │ • Context Injection  │
                         │ • Proxy              │
                         │ • Swagger            │
                         └──────────┬───────────┘
                                    │
                         x-api-key + internal JWT
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    API Services      │
                         │        :3001         │
                         │                      │
                         │ • Business Logic     │
                         │ • Master Data        │
                         │ • Prisma             │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      SQL Server      │
                         └──────────────────────┘


        ┌─────────────────────────────────────────┐
        │              Shared Libraries           │
        │                                         │
        │  common       auth       database       │
        └─────────────────────────────────────────┘
```

### Request Flow

```text
Client
  │
  │ HTTP Request
  ▼
API Gateway
  │
  ├── Validate Authentication
  ├── Check RBAC / Permissions
  ├── Build AuthContext
  ├── Generate Internal JWT
  │
  ▼
API Services
  │
  ├── Validate Internal JWT
  ├── Execute Business Logic
  ├── Access Database through Prisma
  │
  ▼
SQL Server
```

---

## 🧰 Tech Stack

### Backend

* **NestJS 10** — Backend framework
* **TypeScript 5** — Type-safe development
* **Prisma 5** — ORM
* **SQL Server** — Relational database
* **Swagger / OpenAPI** — API documentation

### Package Management

* **pnpm 8**

### Architecture

* Monorepo
* API Gateway / BFF
* Internal Service Architecture
* Shared Libraries
* Repository Abstraction
* JWT-based internal service authentication

### Security

* JWT
* RSA key pair
* API Key
* RBAC
* Authentication Context
* Internal Service Token

---

# 📁 Project Structure

```text
bm-starterkit-be/
│
├── apps/
│   ├── api-gateway/
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── proxy/
│   │   │   ├── permissions/
│   │   │   └── ...
│   │   └── ...
│   │
│   └── api-services/
│       ├── prisma/
│       │   └── schema.prisma
│       │
│       ├── src/
│       │   ├── modules/
│       │   ├── prisma/
│       │   └── ...
│       └── ...
│
├── libs/
│   ├── common/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   ├── logger/
│   │   ├── constants/
│   │   └── dto/
│   │
│   ├── auth/
│   │   ├── jwt/
│   │   ├── decorators/
│   │   └── context/
│   │
│   └── database/
│       └── base.repository.ts
│
├── scripts/
│   └── generate-keys.mjs
│
├── .env.example
├── package.json
├── pnpm-lock.yaml
└── README.md
```

---

# ⚙️ Getting Started

## 1. Prerequisites

Make sure the following are installed:

* Node.js
* pnpm
* SQL Server
* Git

Check your environment:

```bash
node --version
pnpm --version
```

---

## 2. Installation

Clone the repository:

```bash
git clone <repository-url>
cd bm-starterkit-be
```

Install dependencies:

```bash
pnpm install
```

Create your environment file:

```bash
cp .env.example .env
```

Then configure the required environment variables.

---

# 🔐 Environment Variables

| Variable                   | Used By            | Description                                |
| -------------------------- | ------------------ | ------------------------------------------ |
| `CORE_BASE_URL`            | Gateway            | Base URL for Core API (set in `.env`)      |
| `CORE_APP_CODE`            | Gateway            | Application code injected during login     |
| `AI_ORCHESTRATOR_BASE_URL` | Gateway            | Base URL for the AI Orchestrator           |
| `AI_ORCHESTRATOR_API_KEY`  | Gateway            | Server API key for the AI Orchestrator     |
| `GATEWAY_API_KEY`          | Gateway + Services | Shared `x-api-key` secret                  |
| `INTERNAL_JWT_PRIVATE_KEY` | Gateway            | RSA private key used to sign internal JWT  |
| `INTERNAL_JWT_PUBLIC_KEY`  | Services           | RSA public key used to verify internal JWT |
| `DATABASE_URL`             | Docker             | Database URL for Docker environment        |
| `DATABASE_URL_SERVICE`     | Services           | SQL Server connection string               |

### Example

```env
CORE_BASE_URL=https://YOUR_CORE_HOST/api
CORE_APP_CODE=YOUR_APP_CODE
AI_ORCHESTRATOR_BASE_URL=https://YOUR_AI_ORCHESTRATOR_HOST/v1
AI_ORCHESTRATOR_API_KEY=YOUR_ORCHESTRATOR_API_KEY

GATEWAY_API_KEY=YOUR_64_CHARACTER_SECRET

INTERNAL_JWT_PRIVATE_KEY=BASE64_ENCODED_PRIVATE_KEY
INTERNAL_JWT_PUBLIC_KEY=BASE64_ENCODED_PUBLIC_KEY

DATABASE_URL=YOUR_DATABASE_URL

DATABASE_URL_SERVICE="sqlserver://127.0.0.1:1433;database=YOUR_DATABASE;user=sa;password=YOUR_PASSWORD;trustServerCertificate=true"
```

> ⚠️ **Never commit `.env` or private keys to Git.**

---

# 🔑 Generate Security Keys

The project provides a Node.js-based key generator.

No OpenSSL or additional dependencies are required.

### Generate and print keys

```bash
pnpm generate:keys
```

### Generate and write directly to `.env`

```bash
pnpm generate:keys --write
```

The script:

```text
scripts/generate-keys.mjs
```

generates:

* `GATEWAY_API_KEY` — 64 hexadecimal characters
* `INTERNAL_JWT_PRIVATE_KEY` — RSA private key encoded as Base64
* `INTERNAL_JWT_PUBLIC_KEY` — RSA public key encoded as Base64

### Security Model

```text
API Gateway
     │
     │ Sign
     ▼
Private RSA Key
     │
     │ Internal JWT
     ▼
API Services
     │
     │ Verify
     ▼
Public RSA Key
```

> 🔒 Keep the private key **only inside the Gateway environment**.

---

# 🗄️ Database Setup

The project uses:

| Component  | Technology                               |
| ---------- | ---------------------------------------- |
| ORM        | Prisma                                   |
| Database   | Microsoft SQL Server                     |
| Schema     | `apps/api-services/prisma/schema.prisma` |
| Connection | `DATABASE_URL_SERVICE`                   |

---

## 1. Configure Database Connection

Add your SQL Server connection string to `.env`:

```env
DATABASE_URL_SERVICE="sqlserver://127.0.0.1:1433;database=YOUR_DATABASE;user=sa;password=YOUR_PASSWORD;trustServerCertificate=true"
```

Make sure:

* SQL Server is running
* Database exists
* Credentials are valid
* Port `1433` is accessible

---

## 2. Pull Existing Database Schema

This project is designed primarily for an **existing SQL Server database**.

Run:

```bash
pnpm prisma:pull
```

Equivalent command:

```bash
prisma db pull \
  --schema=apps/api-services/prisma/schema.prisma
```

This introspects the existing database and updates:

```text
apps/api-services/prisma/schema.prisma
```

Example:

```text
SQL Server
    │
    │ prisma db pull
    ▼
schema.prisma
```

---

## 3. Generate Prisma Client

After pulling or modifying the schema:

```bash
pnpm prisma:generate
```

Equivalent:

```bash
prisma generate \
  --schema=apps/api-services/prisma/schema.prisma
```

This generates the Prisma Client used by `PrismaService`.

---

## 4. Prisma Studio

To inspect database records through Prisma Studio:

```bash
pnpm prisma:studio
```

---

## 📌 Prisma Notes

| Command                | Purpose                    |
| ---------------------- | -------------------------- |
| `pnpm prisma:pull`     | SQL Server → Prisma schema |
| `pnpm prisma:generate` | Generate Prisma Client     |
| `pnpm prisma:studio`   | Open database UI           |

### Important

The Prisma schema exists only in:

```text
apps/api-services/prisma/schema.prisma
```

Do **not** create another Prisma schema under:

```text
libs/database/
```

This project uses an **existing database workflow**, therefore:

```text
prisma db pull
       ↓
schema.prisma
       ↓
prisma generate
       ↓
Prisma Client
       ↓
api-services
```

`prisma migrate` is not required unless the project is later changed to manage database migrations.

---

# ▶️ Running the Applications

The project consists of two applications.

### API Gateway

```bash
pnpm start:gateway:dev
```

Runs on:

```text
http://localhost:3000
```

### API Services

```bash
pnpm start:services:dev
```

Runs on:

```text
http://localhost:3001
```

### Run Both

Open two terminals:

```bash
# Terminal 1
pnpm start:gateway:dev
```

```bash
# Terminal 2
pnpm start:services:dev
```

---

# 📚 API Documentation

Swagger is available through the API Gateway:

```text
http://localhost:3000/api-docs
```

The Gateway acts as the primary entry point for API consumers.

```text
Frontend
   │
   ▼
Gateway :3000
   │
   ├── Swagger
   ├── Authentication
   ├── RBAC
   └── Proxy
        │
        ▼
Services :3001
```

---

# 🏗️ Build

Build both applications:

```bash
pnpm build
```

Generated output:

```text
dist/
├── apps/
│   ├── api-gateway/
│   └── api-services/
```

### Run Gateway

```bash
pnpm start:gateway
```

### Run Services

```bash
pnpm start:services
```

---

# 🧪 Development Workflow

Recommended development flow:

```text
1. Install dependencies
        ↓
2. Configure .env
        ↓
3. Generate security keys
        ↓
4. Configure SQL Server
        ↓
5. prisma db pull
        ↓
6. prisma generate
        ↓
7. Start API Services
        ↓
8. Start API Gateway
        ↓
9. Test through Swagger
```

### Quick Start

```bash
pnpm install

cp .env.example .env

pnpm generate:keys --write

pnpm prisma:pull

pnpm prisma:generate

pnpm start:services:dev

pnpm start:gateway:dev
```

Then open:

```text
http://localhost:3000/api-docs
```

---

# 🔐 Security Architecture

The Gateway and Services communicate using two layers of protection:

### 1. API Key

```http
x-api-key: <GATEWAY_API_KEY>
```

The same secret is configured between Gateway and Services.

### 2. Internal JWT

The Gateway generates an internal JWT signed using the RSA private key.

```text
Gateway
   │
   │ RSA Private Key
   ▼
Internal JWT
   │
   ▼
API Services
   │
   │ RSA Public Key
   ▼
JWT Verification
```

This prevents external clients from directly impersonating trusted internal requests.

---

# 🧩 Shared Libraries

## `libs/common`

Contains cross-application infrastructure:

```text
common/
├── filters/
├── interceptors/
├── logger/
├── constants/
└── dto/
```

Used for:

* Exception handling
* Logging
* Response transformation
* Shared constants
* Common DTOs

---

## `libs/auth`

Centralized authentication utilities:

```text
auth/
├── jwt/
├── decorators/
└── context/
```

Provides:

* Internal JWT service
* `@CurrentUser()`
* `AuthContext`
* Authentication-related utilities

Example:

```typescript
@Get('profile')
getProfile(@CurrentUser() user: AuthContext) {
  return user;
}
```

---

## `libs/database`

Contains database abstractions without coupling the shared library directly to Prisma.

Example:

```typescript
export abstract class BaseRepository<T> {
  abstract findById(id: string): Promise<T | null>;

  abstract findAll(): Promise<T[]>;

  abstract create(data: unknown): Promise<T>;

  abstract update(
    id: string,
    data: unknown,
  ): Promise<T>;
}
```

Prisma-specific implementation remains inside `api-services`.

This keeps:

```text
libs/database
       │
       └── Generic abstraction

api-services
       │
       └── Prisma implementation
```

---

# 📋 Available Scripts

| Command                      | Description                     |
| ---------------------------- | ------------------------------- |
| `pnpm install`               | Install dependencies            |
| `pnpm generate:keys`         | Generate security keys          |
| `pnpm generate:keys --write` | Generate keys and update `.env` |
| `pnpm prisma:pull`           | Pull existing DB schema         |
| `pnpm prisma:generate`       | Generate Prisma Client          |
| `pnpm prisma:studio`         | Open Prisma Studio              |
| `pnpm start:gateway:dev`     | Start Gateway in watch mode     |
| `pnpm start:services:dev`    | Start Services in watch mode    |
| `pnpm build`                 | Build all applications          |
| `pnpm start:gateway`         | Start compiled Gateway          |
| `pnpm start:services`        | Start compiled Services         |
| `pnpm changelog`             | Generate `CHANGELOG.md`         |

---

# 📝 Changelog

Generate the changelog using:

```bash
pnpm changelog
```

Output:

```text
CHANGELOG.md
```

---

# 🚧 Future Improvements

Potential extensions for this starter kit:

* [ ] Unit testing
* [ ] Integration testing
* [ ] E2E testing
* [ ] Docker Compose
* [ ] CI/CD pipeline
* [ ] Health checks
* [ ] Rate limiting
* [ ] Request tracing
* [ ] Centralized observability
* [ ] Redis caching
* [ ] Message broker integration
* [ ] API versioning
* [ ] OpenTelemetry
* [ ] Centralized configuration management

---

# 📄 License

This project is licensed under the **MIT License**.

---

<p align="center">
  Built with ❤️ using NestJS, TypeScript, Prisma & SQL Server.
</p>
