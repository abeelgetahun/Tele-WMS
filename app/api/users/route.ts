import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withReadAccess, withUserManagement, type AuthenticatedRequest } from "@/lib/middleware"
import { hashPassword } from "@/lib/auth"
import { z } from "zod"

const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "WAREHOUSE_MANAGER", "INVENTORY_CLERK", "TECHNICIAN", "AUDITOR"]),
  warehouseId: z.string().optional(),
  isActive: z.boolean().default(true),
})

// GET /api/users
export const GET = withReadAccess("users", async (request: AuthenticatedRequest) => {
  try {
    const { user } = request
    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get("warehouseId")

    // Build where clause based on user role and warehouse access
    const where: any = { isActive: true }
    
    // If user is warehouse-scoped, only show users from their warehouse
    if (user.warehouseId && user.role !== "ADMIN" && user.role !== "AUDITOR") {
      where.warehouseId = user.warehouseId
    }
    
    // If specific warehouse is requested, check access
    if (warehouseId) {
      if (user.role !== "ADMIN" && user.role !== "AUDITOR" && user.warehouseId !== warehouseId) {
        return NextResponse.json({ error: "Access denied to this warehouse" }, { status: 403 })
      }
      where.warehouseId = warehouseId
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Remove passwords from response
    const sanitizedUsers = users.map(({ password, ...user }) => user)

    return NextResponse.json(sanitizedUsers)
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
})

// POST /api/users
export const POST = withUserManagement(async (request: AuthenticatedRequest) => {
  try {
    const { user } = request
    const body = await request.json()

    // Validate input
    const validatedData = userSchema.parse(body)
    const normalizedEmail = validatedData.email.trim().toLowerCase()

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    // Role assignment restrictions
    if (user.role !== "ADMIN") {
      // Non-admin users cannot create admin users
      if (validatedData.role === "ADMIN") {
        return NextResponse.json({ error: "Only administrators can create admin users" }, { status: 403 })
      }
      
      // Warehouse managers can only create clerks and technicians for their warehouse
      if (user.role === "WAREHOUSE_MANAGER") {
        if (!["INVENTORY_CLERK", "TECHNICIAN"].includes(validatedData.role)) {
          return NextResponse.json({ error: "Managers can only create clerks and technicians" }, { status: 403 })
        }
        
        // Ensure the new user is assigned to the manager's warehouse
        if (validatedData.warehouseId && validatedData.warehouseId !== user.warehouseId) {
          return NextResponse.json({ error: "Managers can only assign users to their own warehouse" }, { status: 403 })
        }
        
        // Auto-assign to manager's warehouse if not specified
        if (!validatedData.warehouseId) {
          validatedData.warehouseId = user.warehouseId
        }
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        ...validatedData,
        email: normalizedEmail,
        password: hashedPassword,
      },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Remove password from response
    const { password, ...sanitizedUser } = newUser

    return NextResponse.json(sanitizedUser, { status: 201 })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
})
