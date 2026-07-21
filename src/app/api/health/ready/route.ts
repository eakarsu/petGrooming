import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const EXPECTED_MIGRATION = '20260720120947_mobile_grooming_workflow'

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    const migrations = await db.$queryRawUnsafe<Array<{ migration_name: string }>>('SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY finished_at DESC LIMIT 1')
    if (migrations[0]?.migration_name !== EXPECTED_MIGRATION) return NextResponse.json({ status: 'not-ready', reason: 'migration-mismatch' }, { status: 503 })
    return NextResponse.json({ status: 'ready', migration: EXPECTED_MIGRATION })
  } catch {
    return NextResponse.json({ status: 'not-ready', reason: 'database-unavailable' }, { status: 503 })
  }
}
