import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/middleware"
import { inventoryItemSchema } from "@/lib/validators"

// GET /api/inventory/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
        stockTransfers: {
          include: {
            fromWarehouse: { select: { name: true } },
            toWarehouse: { select: { name: true } },
            requestedBy: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!inventoryItem) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
    }

    // Add calculated status
    const calculatedStatus =
      inventoryItem.quantity === 0
        ? "OUT_OF_STOCK"
        : inventoryItem.quantity <= inventoryItem.minStock
          ? "LOW_STOCK"
          : "IN_STOCK"

    return NextResponse.json({
      ...inventoryItem,
      calculatedStatus,
    })
  } catch (error) {
    console.error("Get inventory item error:", error)
    return NextResponse.json({ error: "Failed to fetch inventory item" }, { status: 500 })
  }
}

// PUT /api/inventory/[id]
export const PUT = withAuth(async (request: NextRequest & { user: any }, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = inventoryItemSchema.parse(body)

    // Check if item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
    })

    if (!existingItem) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
    }

    // Check if SKU conflicts with other items
    const skuConflict = await prisma.inventoryItem.findFirst({
      where: {
        sku: validatedData.sku,
        id: { not: params.id },
      },
    })

    if (skuConflict) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 })
    }

    // Determine status based on quantity
    const status =
      validatedData.quantity === 0
        ? "OUT_OF_STOCK"
        : validatedData.quantity <= validatedData.minStock
          ? "LOW_STOCK"
          : "IN_STOCK"

    // Update inventory item
    const inventoryItem = await prisma.inventoryItem.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        status: status as any,
      },
      include: {
        category: true,
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(inventoryItem)
  } catch (error) {
    console.error("Update inventory item error:", error)
    return NextResponse.json({ error: "Failed to update inventory item" }, { status: 500 })
  }
})

// DELETE /api/inventory/[id]
export const DELETE = withAuth(async (request: NextRequest & { user: any }, { params }: { params: { id: string } }) => {
  try {
    // Check if item exists and has no pending transfers
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            stockTransfers: {
              where: {
                status: { not: "COMPLETED" },
              },
            },
          },
        },
      },
    })

    if (!inventoryItem) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
    }

    if (inventoryItem._count.stockTransfers > 0) {
      return NextResponse.json({ error: "Cannot delete item with pending transfers" }, { status: 400 })
    }

    // Delete inventory item
    await prisma.inventoryItem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Inventory item deleted successfully" })
  } catch (error) {
    console.error("Delete inventory item error:", error)
    return NextResponse.json({ error: "Failed to delete inventory item" }, { status: 500 })
  }
})
