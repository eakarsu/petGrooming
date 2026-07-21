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
    if (await prisma.user.count() !== 0) throw new Error('Provisioning refused because at least one user already exists')
    const password = required('PROVISION_ADMIN_PASSWORD')
    if (password.length < 14) throw new Error('PROVISION_ADMIN_PASSWORD must be at least 14 characters')
    const user = await prisma.user.create({
      data: { email: required('PROVISION_ADMIN_EMAIL').toLowerCase(), name: required('PROVISION_ADMIN_NAME'), password: await hash(password, 12), role: 'ADMIN' },
      select: { id: true, email: true, role: true },
    })
    console.log(`Provisioned ${user.role} ${user.email} (${user.id})`)
  } finally { await prisma.$disconnect() }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1 })
