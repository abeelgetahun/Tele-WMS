import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withReadAccess, withWarehouseManagement, type AuthenticatedRequest } from "@/lib/middleware"
import { warehouseSchema } from "@/lib/validators"

// GET /api/warehouses
export const GET = withReadAccess("warehouses", async (request: AuthenticatedRequest) => {
  try {
    const { user } = request
    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get("warehouseId")

    // Build where clause based on user role
    const where: any = {}
    
    // If user is warehouse-scoped, only show their warehouse
    if (user.warehouseId && user.role !== "ADMIN" && user.role !== "AUDITOR" && user.role !== "TECHNICIAN") {
      where.id = user.warehouseId
    }
    
    // If specific warehouse is requested, check access
    if (warehouseId) {
      if (user.role !== "ADMIN" && user.role !== "AUDITOR" && user.role !== "TECHNICIAN" && user.warehouseId !== warehouseId) {
        return NextResponse.json({ error: "Access denied to this warehouse" }, { status: 403 })
      }
      where.id = warehouseId
    }

    const warehouses = await prisma.warehouse.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            inventoryItems: true,
            users: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Calculate current stock for each warehouse
    const warehousesWithStock = await Promise.all(
      warehouses.map(async (warehouse: { id: any }) => {
        const totalStock = await prisma.inventoryItem.aggregate({
          where: { warehouseId: warehouse.id },
          _sum: { quantity: true },
        })

        return {
          ...warehouse,
          currentStock: totalStock._sum.quantity || 0,
        }
      }),
    )

    return NextResponse.json(warehousesWithStock)
  } catch (error) {
    console.error("Get warehouses error:", error)
    return NextResponse.json({ error: "Failed to fetch warehouses" }, { status: 500 })
  }
})

// POST /api/warehouses
export const POST = withWarehouseManagement(async (request: AuthenticatedRequest) => {
  try {
    const { user } = request
    const body = await request.json()

    // Validate input
    const validatedData = warehouseSchema.parse(body)

    // Check if warehouse name already exists
    const existingWarehouse = await prisma.warehouse.findFirst({
      where: { name: validatedData.name },
    })

    if (existingWarehouse) {
      return NextResponse.json({ error: "Warehouse name already exists" }, { status: 400 })
    }

    // Create warehouse
    const warehouse = await prisma.warehouse.create({
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

    return NextResponse.json(warehouse, { status: 201 })
  } catch (error) {
    console.error("Create warehouse error:", error)
    return NextResponse.json({ error: "Failed to create warehouse" }, { status: 500 })
  }
})
