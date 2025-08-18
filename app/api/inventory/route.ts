import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuthorization, withInventoryManagement, type AuthenticatedRequest } from "@/lib/middleware"
import { inventoryItemSchema } from "@/lib/validators"
import { ZodError } from "zod"

// GET /api/inventory
export const GET = withAuthorization(
  "inventory",
  "read",
  async (request: AuthenticatedRequest) => {
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

    // Filter by status (use stored status in single-unit model)
    const filteredItems = inventoryItems.filter((item) => {
      if (!status || status === "all") return true
      return item.status === status
    })

    // Add calculatedStatus equal to stored status for compatibility
    const itemsWithStatus = filteredItems.map((item) => ({ ...item, calculatedStatus: item.status }))

    return NextResponse.json(itemsWithStatus)
  } catch (error) {
    console.error("Get inventory error:", error)
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 })
  }
  },
  {
    warehouseIdExtractor: (request) => {
      const { searchParams } = new URL(request.url)
      return searchParams.get("warehouseId") || (request as AuthenticatedRequest).user.warehouseId
    },
  },
)

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

    // Create inventory item
    const inventoryItem = await prisma.inventoryItem.create({
      data: {
  ...validatedData,
  // Single-unit SKU model
  quantity: 1,
  status: "IN_STOCK" as any,
  // Remove legacy fields if present in payload
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
    if (error instanceof ZodError) {
      const message = error.issues.map((i) => i.message).join("; ")
      return NextResponse.json({ error: message }, { status: 400 })
    }
    console.error("Create inventory item error:", error)
    return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 })
  }
})
