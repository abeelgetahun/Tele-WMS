import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/middleware"
import { stockTransferSchema } from "@/lib/validators"

// GET /api/transfers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const warehouseId = searchParams.get("warehouseId")

    // Build where clause
    const where: any = {}
    if (status && status !== "all") where.status = status
    if (warehouseId) {
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
}

// POST /api/transfers
export const POST = withAuth(async (request: NextRequest & { user: any }) => {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = stockTransferSchema.parse(body)

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
        requestedById: request.user.userId,
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
