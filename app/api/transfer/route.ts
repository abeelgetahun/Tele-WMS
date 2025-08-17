import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withReadAccess, withAuthorization, type AuthenticatedRequest } from "@/lib/middleware"
import { stockTransferSchema } from "@/lib/validators"

// GET /api/transfers
export const GET = withReadAccess("transfers", async (request: AuthenticatedRequest) => {
  try {
    const { user } = request
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const warehouseId = searchParams.get("warehouseId")

    // Build where clause
    const where: any = {}
    if (status && status !== "all") where.status = status
    
    // Apply warehouse filtering based on user role
    if (user.warehouseId && user.role !== "ADMIN" && user.role !== "AUDITOR" && user.role !== "TECHNICIAN") {
      // Warehouse-scoped users can only see transfers involving their warehouse
      where.OR = [{ fromWarehouseId: user.warehouseId }, { toWarehouseId: user.warehouseId }]
    } else if (warehouseId) {
      // If specific warehouse is requested, check access
      if (user.role !== "ADMIN" && user.role !== "AUDITOR" && user.role !== "TECHNICIAN" && user.warehouseId !== warehouseId) {
        return NextResponse.json({ error: "Access denied to this warehouse" }, { status: 403 })
      }
      where.OR = [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }]
    }

    const transfers = await prisma.stockTransfer.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        fromWarehouse: {
          select: {
            id: true,
            name: true,
          },
        },
        toWarehouse: {
          select: {
            id: true,
            name: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(transfers)
  } catch (error) {
    console.error("Get transfers error:", error)
    return NextResponse.json({ error: "Failed to fetch transfers" }, { status: 500 })
  }
})

// POST /api/transfers - Only managers and admins can create transfers
export const POST = withAuthorization("transfers", "create", async (request: AuthenticatedRequest) => {
  try {
    const { user } = request
    const body = await request.json()

    // Validate input
    const validatedData = stockTransferSchema.parse(body)

    // Warehouse access validation for non-admin users
    if (user.warehouseId && user.role !== "ADMIN") {
      // Non-admin users can only create transfers from their assigned warehouse
      if (validatedData.fromWarehouseId !== user.warehouseId) {
        return NextResponse.json({ error: "You can only create transfers from your assigned warehouse" }, { status: 403 })
      }
    }

    // Check if item exists and has sufficient quantity
    const item = await prisma.inventoryItem.findUnique({
      where: { id: validatedData.itemId },
      include: {
        warehouse: true,
      },
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    if (item.warehouseId !== validatedData.fromWarehouseId) {
      return NextResponse.json({ error: "Item is not in the specified source warehouse" }, { status: 400 })
    }

    if (item.quantity < validatedData.quantity) {
      return NextResponse.json({ error: "Insufficient quantity in source warehouse" }, { status: 400 })
    }

    // Prevent transfer to same warehouse
    if (validatedData.fromWarehouseId === validatedData.toWarehouseId) {
      return NextResponse.json({ error: "Cannot transfer to the same warehouse" }, { status: 400 })
    }

    // Create transfer request
    const transfer = await prisma.stockTransfer.create({
      data: {
        ...validatedData,
        requestedById: user.userId,
        status: "PENDING",
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        fromWarehouse: {
          select: {
            id: true,
            name: true,
          },
        },
        toWarehouse: {
          select: {
            id: true,
            name: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(transfer, { status: 201 })
  } catch (error) {
    console.error("Create transfer error:", error)
    return NextResponse.json({ error: "Failed to create transfer request" }, { status: 500 })
  }
})
