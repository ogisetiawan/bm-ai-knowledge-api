# Core Chat RBAC

## Confirmed from Core API samples

- Menus (`api-getmenus.md`): `dashboard`, `chat`, `knowledge` (app `bmai`)
- Permissions (`api-getmenupermission.md`): each menu only has `show-list-data`

## Gateway wiring

- Constant: `ai-orchestrator.constants.ts` → `AI_CHAT_MENU_KEY = 'chat'`
- Controllers: `chat-messages.controller.ts`, `conversations.controller.ts`
- Pattern: `@MenuKey(AI_CHAT_MENU_KEY)` + `@RequirePermission('show-list-data')` + `CoreBearerGuard`
- `MenuPermissionGuard` is registered as `APP_GUARD` in `app.module.ts` (not only `@UseGuards`)

## Gotcha

Do not use CRUD-style permissions (`create-data`, `update-data`, `show-detail-data`) until Core actually grants them for `chat`.

## Gotcha — silent guard drop

Nest `GuardsContextCreator.getGuardInstance()` returns `null` when a `@UseGuards(GuardWithDeps)` class is not resolved in the module `injectables` map, then filters it out. Result: only `CoreBearerGuard` runs, `@RequirePermission` is ignored, `MenuPermissionsService` never logs, and fake permissions still succeed. Fix: register `MenuPermissionGuard` via `APP_GUARD`.

## Gotcha — `start:gateway` uses stale `dist/`

`pnpm start:gateway` runs `dist/apps/api-gateway/.../main.js` (no watch). Source edits (menu key, RequirePermission, APP_GUARD) do nothing until `pnpm run build:gateway` + restart. For live reload use `pnpm start:gateway:dev`.
