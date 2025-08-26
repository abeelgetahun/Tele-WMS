import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

async function main() {
  const [,, emailArg, passwordArg] = process.argv
  if (!emailArg || !passwordArg) {
    console.error("Usage: npx tsx scripts/check-login.ts <email> <password>")
    process.exit(1)
  }
  const email = emailArg.trim().toLowerCase()
  const password = passwordArg

  const prisma = new PrismaClient()
  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, isActive: true, password: true, role: true, warehouseId: true } })
    if (!user) {
      console.log("Result: user not found for email", email)
      return
    }
    console.log("Found user:", { id: user.id, email: user.email, isActive: user.isActive, role: user.role, warehouseId: user.warehouseId })
    const looksHashed = user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$")
    console.log("Password looks hashed:", looksHashed)
    let ok = false
    try {
      ok = await bcrypt.compare(password, user.password)
    } catch (e) {
      console.warn("bcrypt.compare error:", e)
    }
    console.log("bcrypt compare result:", ok)
    if (!ok && !looksHashed) {
      console.log("Stored password may be plaintext. Direct equality:", password === user.password)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
