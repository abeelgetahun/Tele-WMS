import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuthorization, type AuthenticatedRequest } from "@/lib/middleware"

// GET /api/warehouse-images?warehouseId=
export const GET = withAuthorization(
  "warehouse-images",
  "read",
  async (request: AuthenticatedRequest) => {
    const { user } = request
    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get("warehouseId") || user.warehouseId

    // Enforce warehouse scope for non-admins
    if (user.role !== "ADMIN" && user.role !== "AUDITOR") {
      if (!warehouseId || (user.warehouseId && user.warehouseId !== warehouseId)) {
        return NextResponse.json({ error: "Access denied to this warehouse" }, { status: 403 })
      }
    }

  const images = await (prisma as any).warehouseImage.findMany({
      where: warehouseId ? { warehouseId } : {},
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(images)
  }
)

// POST /api/warehouse-images
export const POST = withAuthorization(
  "warehouse-images",
  "create",
  async (request: AuthenticatedRequest) => {
    const { user } = request
    const body = await request.json()
    const { warehouseId: bodyWarehouseId, url, title, description } = body

    const warehouseId = bodyWarehouseId || user.warehouseId
    if (!warehouseId) return NextResponse.json({ error: "warehouseId is required" }, { status: 400 })

    if (user.role !== "ADMIN" && user.warehouseId !== warehouseId) {
      return NextResponse.json({ error: "Access denied to this warehouse" }, { status: 403 })
    }

    if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 })

  const image = await (prisma as any).warehouseImage.create({
      data: { warehouseId, url, title, description },
    })
    return NextResponse.json(image, { status: 201 })
  }
)

// PUT /api/warehouse-images
export const PUT = withAuthorization(
  "warehouse-images",
  "update",
  async (request: AuthenticatedRequest) => {
    const { user } = request
    const body = await request.json()
    const { id, title, description } = body
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

  const existing = await (prisma as any).warehouseImage.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (user.role !== "ADMIN" && user.warehouseId !== existing.warehouseId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

  const updated = await (prisma as any).warehouseImage.update({
      where: { id },
      data: { title, description },
    })
    return NextResponse.json(updated)
  }
)

// DELETE /api/warehouse-images?id=
export const DELETE = withAuthorization(
  "warehouse-images",
  "delete",
  async (request: AuthenticatedRequest) => {
    const { user } = request
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id") || undefined
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

  const existing = await (prisma as any).warehouseImage.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (user.role !== "ADMIN" && user.warehouseId !== existing.warehouseId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

  await (prisma as any).warehouseImage.delete({ where: { id } })
    return NextResponse.json({ success: true })
  }
)
