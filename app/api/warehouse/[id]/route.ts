import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/middleware"
import { warehouseSchema } from "@/lib/validators"

// GET /api/warehouses/[id]
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
  const { id } = await context.params
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        inventoryItems: {
          include: {
            category: true,
          },
        },
        _count: {
          select: {
            users: true,
            inventoryItems: true,
            transfersFrom: true,
            transfersTo: true,
          },
        },
      },
    })

    if (!warehouse) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 })
    }

    // Calculate current stock
    const totalStock = await prisma.inventoryItem.aggregate({
      where: { warehouseId: warehouse.id },
      _sum: { quantity: true },
    })

    return NextResponse.json({
      ...warehouse,
      currentStock: totalStock._sum.quantity || 0,
    })
  } catch (error) {
    console.error("Get warehouse error:", error)
    return NextResponse.json({ error: "Failed to fetch warehouse" }, { status: 500 })
  }
}

// PUT /api/warehouses/[id]
export const PUT = withAuth(
  async (request: NextRequest & { user: any }, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params
      const body = await request.json()

      // Validate input
      const validatedData = warehouseSchema.parse(body)

      // Check if warehouse exists
      const existingWarehouse = await prisma.warehouse.findUnique({
        where: { id },
      })

      if (!existingWarehouse) {
        return NextResponse.json({ error: "Warehouse not found" }, { status: 404 })
      }

      // Check if name conflicts with other warehouses
      const nameConflict = await prisma.warehouse.findFirst({
        where: {
          name: validatedData.name,
          id: { not: id },
        },
      })

      if (nameConflict) {
        return NextResponse.json({ error: "Warehouse name already exists" }, { status: 400 })
      }

      // Update warehouse
      const warehouse = await prisma.warehouse.update({
        where: { id },
        data: validatedData,
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return NextResponse.json(warehouse)
    } catch (error) {
      console.error("Update warehouse error:", error)
      return NextResponse.json({ error: "Failed to update warehouse" }, { status: 500 })
    }
  }
)

// DELETE /api/warehouses/[id]
export const DELETE = withAuth(
  async (request: NextRequest & { user: any }, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params
      // Check if warehouse exists and has no inventory items
      const warehouse = await prisma.warehouse.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              inventoryItems: true,
              users: true,
            },
          },
        },
      })

      if (!warehouse) {
        return NextResponse.json({ error: "Warehouse not found" }, { status: 404 })
      }

      if (warehouse._count.inventoryItems > 0) {
        return NextResponse.json(
          { error: "Cannot delete warehouse with inventory items" },
          { status: 400 }
        )
      }

      if (warehouse._count.users > 0) {
        return NextResponse.json(
          { error: "Cannot delete warehouse with assigned users" },
          { status: 400 }
        )
      }

      // Delete warehouse
      await prisma.warehouse.delete({
        where: { id },
      })

      return NextResponse.json({ message: "Warehouse deleted successfully" })
    } catch (error) {
      console.error("Delete warehouse error:", error)
      return NextResponse.json({ error: "Failed to delete warehouse" }, { status: 500 })
    }
  }
)
