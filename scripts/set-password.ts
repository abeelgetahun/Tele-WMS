import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

async function main() {
  const [,, emailArg, newPassword] = process.argv
  if (!emailArg || !newPassword) {
    console.error("Usage: npx tsx scripts/set-password.ts <email> <newPassword>")
    process.exit(1)
  }
  const email = emailArg.trim().toLowerCase()
  const prisma = new PrismaClient()
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      console.error("User not found:", email)
      process.exit(2)
    }
    const hash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: user.id }, data: { password: hash, isActive: true } })
    console.log("Password updated for:", email)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
