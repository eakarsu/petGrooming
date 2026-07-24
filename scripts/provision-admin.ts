import { hash } from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

function required(name: string) {
  const value = String(process.env[name] || '').trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}

async function main() {
  const prisma = new PrismaClient()
  try {
    const password = required('PROVISION_ADMIN_PASSWORD')
    if (password.length < 14) throw new Error('PROVISION_ADMIN_PASSWORD must be at least 14 characters')
    const email = required('PROVISION_ADMIN_EMAIL').toLowerCase()
    const name = required('PROVISION_ADMIN_NAME')
    const passwordHash = await hash(password, 12)
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, name, password: passwordHash, role: 'ADMIN', isActive: true },
      update: { name, password: passwordHash, role: 'ADMIN', isActive: true, authVersion: { increment: 1 } },
      select: { id: true, email: true, role: true },
    })
    console.log(`Configured ${user.role} ${user.email} (${user.id})`)
  } finally { await prisma.$disconnect() }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1 })
