import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/middleware"
import { z } from "zod"

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
})

// GET /api/categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            inventoryItems: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Get categories error:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

// POST /api/categories
export const POST = withAuth(async (request: NextRequest & { user: any }) => {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = categorySchema.parse(body)

    // Check if category name already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name: validatedData.name },
    })

    if (existingCategory) {
      return NextResponse.json({ error: "Category name already exists" }, { status: 400 })
    }

    // Create category
    const category = await prisma.category.create({
      data: validatedData,
      include: {
        _count: {
          select: {
            inventoryItems: true,
          },
        },
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Create category error:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
})
