import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { comparePassword, signJWT, sanitizeUser, hashPassword } from "@/lib/auth"
import { loginSchema } from "@/lib/validators"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = loginSchema.parse(body)

    // Normalize email to reduce case/whitespace mismatches
    const normalizedEmail = validatedData.email.trim().toLowerCase()

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { warehouse: true },
    })

    if (!user) {
      console.debug("LOGIN_DEBUG: user not found for email", normalizedEmail)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (!user.isActive) {
      console.debug("LOGIN_DEBUG: user inactive", { id: user.id, email: user.email })
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check password (supports legacy plaintext passwords and auto-migrates to bcrypt)
    let isValidPassword = false
    try {
      isValidPassword = await comparePassword(validatedData.password, user.password)
    } catch (e) {
      console.debug("LOGIN_DEBUG: bcrypt compare threw", e)
      // fall through to legacy check below
    }

    if (!isValidPassword) {
      const looksHashed = user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$")
      // If the stored password doesn't look like bcrypt, treat it as plaintext for a one-time migration
      if (!looksHashed && validatedData.password === user.password) {
        isValidPassword = true
        // Auto-migrate: hash and store the password securely for next time
        try {
          const newHash = await hashPassword(validatedData.password)
          await prisma.user.update({ where: { id: user.id }, data: { password: newHash } })
        } catch (e) {
          // Non-fatal: login can proceed even if rehash fails
          console.warn("Password rehash failed during login migration:", e)
        }
      } else {
        console.debug("LOGIN_DEBUG: bcrypt mismatch and stored password is hashed")
      }
    }

    if (!isValidPassword) {
      console.debug("LOGIN_DEBUG: password invalid for user", { id: user.id, email: user.email })
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Generate JWT token
    const token = signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return NextResponse.json({
      token,
      user: sanitizeUser(user),
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
