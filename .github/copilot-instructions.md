# Tele-WMS: AI coding agent guide

This repo is a Next.js 15 App Router app with Prisma/Postgres and RBAC. Use the patterns below to stay consistent and productive.

## Architecture overview
- App Router structure under `app/`.
  - UI pages (server components by default) live in `app/**/page.tsx`; use `"use client"` for client state.
  - API routes live in `app/api/**/route.ts` and return `NextResponse.json`.
- Data layer: Prisma with PostgreSQL. Schema in `prisma/schema.prisma`; client exported from `lib/prisma.ts`.
- Auth: JWT in `lib/auth.ts`; middleware wrappers in `lib/middleware.ts` add `request.user` and enforce RBAC.
- RBAC: Centralized permissions in `lib/permissions.ts`; use `hasPermission` and helpers. Sidebar routes are derived via `getAccessibleRoutes`.
- Validation: zod schemas in `lib/validators.ts` for API input.
- Client data access: `lib/api-client.ts` wraps fetch, attaches `Authorization` header from `localStorage` token.

## Key patterns
- API handlers must use middleware wrappers:
  - Read: `withReadAccess(resource, handler)`
  - Write: `withAuthorization(resource, action, handler, { requireWarehouseAccess?, warehouseIdExtractor? })`
  - Shortcuts: `withWarehouseManagement`, `withInventoryManagement`, etc.
  - Handler signature typically `(request: AuthenticatedRequest) => NextResponse`.
- Warehouse scoping:
  - Use `hasPermission(role, resource, action, userWarehouseId, targetWarehouseId)` for action checks.
  - Use `canAccessWarehouse(role, userWarehouseId, targetWarehouseId)` for cross-warehouse reads/writes.
- Derive navigation from RBAC: `getAccessibleRoutes(user.role)`; the sidebar maps route.icon keys to `lucide-react` icons.
- Validation-first API:
  - Parse `await request.json()`, then `schema.parse(body)` from `lib/validators.ts`.
  - Return `NextResponse.json({ error: "..." }, { status: 400|403|500 })` on failures.
- Prisma queries:
  - Prefer `include`/`select` to shape responses.
  - Use aggregates when attaching counts or stock sums (see `app/api/warehouse/route.ts`).

## Developer workflows
- Env: copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_SECRET`.
- Install/generate DB client:
  - `npm install`
  - `npm run db:generate`
  - `npm run db:push` (and optional `npm run db:seed`)
- Run:
  - `npm run dev` (logs include Prisma SQL)
- Build:
  - `npm run build` (ESLint is configured to be ignored during builds via `next.config.ts`)
  - Lint locally with `npm run lint` and fix reported issues (e.g., replace `any`, remove unused vars).
- RBAC sanity script: `node scripts/test-rbac.js` prints permission/route coverage.

## Conventions
- Types:
  - Avoid `any`; prefer Prisma types (`@prisma/client`) and `z.infer<typeof schema>`.
  - Optional chaining: don’t assert non-null (`?.!`); guard or use `??` defaults.
- API client: in `lib/api-client.ts`, new endpoints should be added as typed wrappers calling `get/post/put/delete`.
- Images: prefer `next/image` over `<img>`.
- Side effects: React hooks should include dependencies or wrap callbacks with `useCallback`.

## Files to study first
- RBAC: `lib/permissions.ts`, `lib/middleware.ts`, `components/layout/sidebar.tsx`.
- Data model: `prisma/schema.prisma`.
- Example API: `app/api/warehouse/route.ts` (read + create with zod + Prisma + RBAC).
- Client data access: `lib/api-client.ts`.

## Adding features (example)
- New resource `foo`:
  - Add permissions to `lib/permissions.ts`.
  - Create `app/api/foo/route.ts` with `withReadAccess("foo", ...)` and writes via `withAuthorization("foo", "create", ...)`.
  - Add zod schema in `lib/validators.ts`.
  - Extend `lib/api-client.ts` with typed methods.
  - If user-facing, add route via `getAccessibleRoutes` and map icon in the sidebar.

Questions or gaps? Point to the file you’re not sure about and what you want to change; we’ll refine these instructions accordingly.
