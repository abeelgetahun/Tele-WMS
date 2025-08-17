import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withReadAccess, withInventoryManagement, type AuthenticatedRequest } from "@/lib/middleware"
import { inventoryItemSchema } from "@/lib/validators"

// GET /api/inventory
export const GET = withReadAccess("inventory", async (request: AuthenticatedRequest) => {
  try {
    const { user } = request
    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get("warehouseId")
    const categoryId = searchParams.get("categoryId")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    // Build where clause
    const where: any = {}
    
    // Apply warehouse filtering based on user role
    if (user.warehouseId && user.role !== "ADMIN" && user.role !== "AUDITOR" && user.role !== "TECHNICIAN") {
      // Warehouse-scoped users can only see their warehouse inventory
      where.warehouseId = user.warehouseId
    } else if (warehouseId) {
      // If specific warehouse is requested, check access
      if (user.role !== "ADMIN" && user.role !== "AUDITOR" && user.role !== "TECHNICIAN" && user.warehouseId !== warehouseId) {
        return NextResponse.json({ error: "Access denied to this warehouse" }, { status: 403 })
      }
      where.warehouseId = warehouseId
    }
    
    if (categoryId) where.categoryId = categoryId
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { supplier: { contains: search, mode: "insensitive" } },
      ]
    }

    const inventoryItems = await prisma.inventoryItem.findMany({
      where,
      include: {
        category: true,
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Filter by status if provided (calculated field)
    const filteredItems = inventoryItems.filter((item) => {
      if (!status || status === "all") return true

      const itemStatus =
        item.quantity === 0 ? "OUT_OF_STOCK" : item.quantity <= item.minStock ? "LOW_STOCK" : "IN_STOCK"

      return itemStatus === status
    })

    // Add calculated status to each item
    const itemsWithStatus = filteredItems.map((item) => ({
      ...item,
      calculatedStatus:
        item.quantity === 0 ? "OUT_OF_STOCK" : item.quantity <= item.minStock ? "LOW_STOCK" : "IN_STOCK",
    }))

    return NextResponse.json(itemsWithStatus)
  } catch (error) {
    console.error("Get inventory error:", error)
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 })
  }
})

// POST /api/inventory
export const POST = withInventoryManagement(async (request: AuthenticatedRequest) => {
  try {
    const { user } = request
    const body = await request.json()

    // Validate input
    const validatedData = inventoryItemSchema.parse(body)

    // Check if SKU already exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { sku: validatedData.sku },
    })

    if (existingItem) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 })
    }

    // Warehouse assignment validation
    if (user.warehouseId && user.role !== "ADMIN") {
      // Non-admin users can only create items in their assigned warehouse
      if (validatedData.warehouseId && validatedData.warehouseId !== user.warehouseId) {
        return NextResponse.json({ error: "You can only create inventory items in your assigned warehouse" }, { status: 403 })
      }
      
      // Auto-assign to user's warehouse if not specified
      if (!validatedData.warehouseId) {
        validatedData.warehouseId = user.warehouseId
      }
    }

    // Determine initial status based on quantity
    const status =
      validatedData.quantity === 0
        ? "OUT_OF_STOCK"
        : validatedData.quantity <= validatedData.minStock
          ? "LOW_STOCK"
          : "IN_STOCK"

    // Create inventory item
    const inventoryItem = await prisma.inventoryItem.create({
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

    return NextResponse.json(inventoryItem, { status: 201 })
  } catch (error) {
    console.error("Create inventory item error:", error)
    return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 })
  }
})
