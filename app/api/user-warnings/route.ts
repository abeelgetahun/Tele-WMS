import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuthorization, type AuthenticatedRequest } from "@/lib/middleware"
import { z } from "zod"

const warningSchema = z.object({
  userId: z.string().min(1),
  message: z.string().min(1),
  level: z.enum(["INFO", "WARNING", "CRITICAL"]).optional(),
  status: z.enum(["ACTIVE", "RESOLVED"]).optional(),
})

// GET /api/user-warnings?warehouseId=
export const GET = withAuthorization("user-warnings", "read", async (request: AuthenticatedRequest) => {
  try {
    const { user } = request
    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get("warehouseId") || user.warehouseId

    if (!warehouseId) {
      return NextResponse.json({ error: "Warehouse scope required" }, { status: 400 })
    }

    const warnings = await prisma.userWarning.findMany({
      where: { warehouseId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(warnings)
  } catch (error) {
    console.error("Get warnings error:", error)
    return NextResponse.json({ error: "Failed to fetch warnings" }, { status: 500 })
  }
})

// POST /api/user-warnings
export const POST = withAuthorization("user-warnings", "create", async (request: AuthenticatedRequest) => {
  try {
    const { user } = request
    const body = await request.json()
    const data = warningSchema.parse(body)

    // Ensure manager is scoped to their warehouse
    if (!user.warehouseId) {
      return NextResponse.json({ error: "Warehouse scope required" }, { status: 403 })
    }

    // Ensure warned user belongs to same warehouse
    const targetUser = await prisma.user.findUnique({ where: { id: data.userId } })
    if (!targetUser || targetUser.warehouseId !== user.warehouseId) {
      return NextResponse.json({ error: "User not in your warehouse" }, { status: 403 })
    }

    const created = await prisma.userWarning.create({
      data: {
        warehouseId: user.warehouseId,
        managerId: user.userId,
        userId: data.userId,
        message: data.message,
        level: (data.level || "INFO") as any,
        status: (data.status || "ACTIVE") as any,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Create warning error:", error)
    return NextResponse.json({ error: "Failed to create warning" }, { status: 500 })
  }
})

// PUT /api/user-warnings?id=
export const PUT = withAuthorization("user-warnings", "update", async (request: AuthenticatedRequest) => {
  try {
    const { user } = request
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const body = await request.json()
    const data = warningSchema.partial().parse(body)

    // Verify warning exists and belongs to manager's warehouse
    const existing = await prisma.userWarning.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Warning not found" }, { status: 404 })
    if (user.warehouseId && existing.warehouseId !== user.warehouseId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const updated = await prisma.userWarning.update({
      where: { id },
      data: {
        message: data.message,
        level: data.level as any,
        status: data.status as any,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update warning error:", error)
    return NextResponse.json({ error: "Failed to update warning" }, { status: 500 })
  }
})
