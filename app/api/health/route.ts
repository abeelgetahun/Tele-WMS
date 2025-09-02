import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Ensure Node.js runtime and no caching
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const payload: any = {
    env: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      DIRECT_URL: Boolean(process.env.DIRECT_URL),
      JWT_SECRET: Boolean(process.env.JWT_SECRET),
      NODE_ENV: process.env.NODE_ENV || null,
    },
    db: { ok: false as boolean, error: null as string | null },
    timestamp: new Date().toISOString(),
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    payload.db.ok = true
  } catch (e: any) {
    payload.db.ok = false
    payload.db.error = (e?.message || String(e)).slice(0, 300)
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  })
}
