import jwt, { type Secret, type SignOptions } from "jsonwebtoken"
import bcrypt from "bcryptjs"
import type { User } from "@prisma/client"

// Use a development default to avoid hard failures when JWT_SECRET is not defined locally.
// For production, always set JWT_SECRET in the environment.
const JWT_SECRET: Secret = (process.env.JWT_SECRET || "dev-secret-change-me") as Secret
const JWT_EXPIRES_IN: SignOptions["expiresIn"] = (process.env.JWT_EXPIRES_IN as any) || "7d"

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export function signJWT(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function sanitizeUser(user: User) {
  const { password, ...sanitizedUser } = user
  return sanitizedUser
}
