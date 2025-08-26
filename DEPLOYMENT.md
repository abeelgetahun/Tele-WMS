# Tele-WMS deployment guide (Vercel + Neon)

This project is a Next.js 15 App Router app using Prisma + PostgreSQL. Below are the steps to deploy on Vercel with a Neon Postgres database.

## 0) Prerequisites
- Vercel account (with the Vercel CLI optional)
- Neon account
- Node 18+ locally

## 1) Create a Neon Postgres database
1. Create a new project and database in Neon.
2. Create two connection strings:
   - Pooled (for runtime): add `?sslmode=require&pgbouncer=true&connection_limit=1`
   - Direct (for migrations/Prisma): add `?sslmode=require` (no PgBouncer params)
3. Note both URLs.

## 2) Set environment variables
Copy `.env.example` to `.env` locally for dev.
In Vercel Project Settings > Environment Variables add:
- DATABASE_URL = pooled Neon URL
- DIRECT_URL = direct Neon URL
- JWT_SECRET = a strong random string (required in production)
- JWT_EXPIRES_IN = 7d (optional)

## 3) Push schema and seed data
From your local machine (recommended so you can run seed):
- Ensure `.env` is configured with the Neon DIRECT_URL and DATABASE_URL
- Run: `npm run db:generate`
- Run: `npx prisma migrate deploy` OR `npm run db:push` for non-migration workflow
- Seed: `npm run db:seed`

Alternatively, you can run `prisma migrate deploy` as a Vercel Build Step using a script; however Neon recommends running migrations from CI or locally using DIRECT_URL.

## 4) Deploy to Vercel
- Push your repo to GitHub (if not already)
- Import the project into Vercel
- During import, set the same env vars as above
- Build & deploy

The app uses Next.js App Router API routes; Prisma client is generated via `postinstall`.

## 5) Runtime checks
- If you see database connection errors on Vercel, verify:
  - DATABASE_URL includes `sslmode=require&pgbouncer=true&connection_limit=1`
  - DIRECT_URL is set (even if not used at runtime) for consistency
  - JWT_SECRET is set
- Use Neon dashboard to confirm connections. Reduce Prisma log noise by not logging in prod (already configured).

## 6) Optional: Vercel environment promotion
- Use `Preview` env for PRs; add the same env vars there
- Promote to `Production` when ready

## 7) Security notes
- Change default passwords from seed data in production, or skip seeding there
- Rotate JWT_SECRET when needed

## 8) Local development against Neon
- You can point local `.env` to Neon URLs to work against cloud DB
- Or run Postgres locally; update DATABASE_URL/DIRECT_URL accordingly

