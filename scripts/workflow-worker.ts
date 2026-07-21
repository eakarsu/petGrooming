import { randomUUID } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { processOneIntegrationOperation } from '../src/lib/workflow/worker'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
const prisma = new PrismaClient()
const once = process.argv.includes('--once')
const workerId = process.env.WORKER_ID || `pet-grooming-worker:${randomUUID()}`
let stopping = false
process.on('SIGINT', () => { stopping = true })
process.on('SIGTERM', () => { stopping = true })

async function main() {
  do {
    const result = await processOneIntegrationOperation(prisma, workerId)
    if (once) break
    if (result === 'idle') await new Promise((resolve) => setTimeout(resolve, 1000))
  } while (!stopping)
}

main().catch((error) => {
  console.error('Workflow worker failed', error instanceof Error ? error.message : error)
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
