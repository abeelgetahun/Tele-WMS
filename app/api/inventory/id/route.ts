import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuthorization, type AuthenticatedRequest } from "@/lib/middleware"
import { inventoryItemSchema } from "@/lib/validators"

// GET /api/inventory/[id]
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id },
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

  // For single-unit SKU model, use stored status directly
  const calculatedStatus = inventoryItem.status

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
export const PUT = withAuthorization("inventory", "update", async (request: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
  const { id } = await context.params
  const body = await request.json()

    // Validate input
    const validatedData = inventoryItemSchema.parse(body)

    // Check if item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id },
    })

    if (!existingItem) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
    }

    // Enforce warehouse scoping for non-admin/non-auditor/technician
    const user = request.user
    const isPrivileged = user.role === "ADMIN" || user.role === "AUDITOR" || user.role === "TECHNICIAN"
    if (!isPrivileged && user.warehouseId) {
      // Can only update items in own warehouse
      if (existingItem.warehouseId !== user.warehouseId) {
        return NextResponse.json({ error: "Access denied to update this item" }, { status: 403 })
      }
      // If changing warehouseId, force it to user's warehouse
      if (validatedData.warehouseId && validatedData.warehouseId !== user.warehouseId) {
        return NextResponse.json({ error: "Cannot move item to another warehouse" }, { status: 403 })
      }
    }

    // Check if SKU conflicts with other items
    const skuConflict = await prisma.inventoryItem.findFirst({
      where: {
        sku: validatedData.sku,
        id: { not: id },
      },
    })

    if (skuConflict) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 })
    }

    // Update inventory item
    const inventoryItem = await prisma.inventoryItem.update({
      where: { id },
      data: {
  // Only update editable fields (single-unit model)
  name: validatedData.name,
  description: validatedData.description,
  sku: validatedData.sku,
  barcode: validatedData.barcode,
  unitPrice: validatedData.unitPrice as any,
  supplier: validatedData.supplier,
  categoryId: validatedData.categoryId,
  warehouseId: validatedData.warehouseId,
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
export const DELETE = withAuthorization("inventory", "delete", async (request: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    // Check if item exists and has no pending transfers
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id },
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

    // Enforce warehouse scoping for non-admin/non-auditor/technician
    const user = request.user
    const isPrivileged = user.role === "ADMIN" || user.role === "AUDITOR" || user.role === "TECHNICIAN"
    if (!isPrivileged && user.warehouseId) {
      if (inventoryItem.warehouseId !== user.warehouseId) {
        return NextResponse.json({ error: "Access denied to delete this item" }, { status: 403 })
      }
    }

    // Delete inventory item
    await prisma.inventoryItem.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Inventory item deleted successfully" })
  } catch (error) {
    console.error("Delete inventory item error:", error)
    return NextResponse.json({ error: "Failed to delete inventory item" }, { status: 500 })
  }
})
