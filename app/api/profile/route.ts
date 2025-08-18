import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware"

// GET /api/profile
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user } = request
    // For manual tokens, we don't have DB user necessarily; try DB first
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, email: true, name: true, role: true, warehouseId: true, warehouse: { select: { id: true, name: true } } },
    })

    if (dbUser) {
      return NextResponse.json(dbUser)
    }

    // Fallback: manual session user info
    return NextResponse.json({
      id: user.userId,
      email: user.email,
      name: user.email.split("@")[0],
      role: user.role,
      warehouseId: user.warehouseId,
      warehouse: user.warehouseId ? { id: user.warehouseId, name: "Assigned Warehouse" } : null,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
})

// PUT /api/profile
export const PUT = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user } = request
    const body = await request.json()

    const updateData: any = {}
    if (typeof body.name === "string" && body.name.trim().length > 0) updateData.name = body.name.trim()
    if (typeof body.avatar === "string") updateData.avatar = body.avatar

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    // Only DB users can be updated server-side
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } })
    if (!dbUser) {
      return NextResponse.json({ error: "Profile updates not supported for manual sessions" }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, warehouseId: true, warehouse: { select: { id: true, name: true } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
})
