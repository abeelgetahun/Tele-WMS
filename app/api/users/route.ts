import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/middleware"
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
export async function GET() {
  try {
    const users = await prisma.user.findMany({
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
}

// POST /api/users
export const POST = withAuth(async (request: NextRequest & { user: any }) => {
  try {
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

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)

    // Create user
  const user = await prisma.user.create({
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
    const { password, ...sanitizedUser } = user

    return NextResponse.json(sanitizedUser, { status: 201 })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
})
