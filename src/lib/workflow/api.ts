import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { WorkflowError, asWorkflowError } from './errors'
import { NextResponse } from 'next/server'

export async function requireApiActor(roles?: string[]) {
  const session = await getServerSession(authOptions)
  const sessionUser = session?.user as { id?: string; authVersion?: number; role?: string } | undefined
  if (!sessionUser?.id || (session as any)?.invalid) throw new WorkflowError('UNAUTHENTICATED', 'Sign in is required', 401)
  const user = await db.user.findUnique({ where: { id: sessionUser.id }, select: { id: true, role: true, isActive: true, authVersion: true } })
  if (!user?.isActive || user.authVersion !== sessionUser.authVersion) throw new WorkflowError('SESSION_REVOKED', 'The session is no longer active', 401)
  if (roles && !roles.includes(user.role)) throw new WorkflowError('ROLE_FORBIDDEN', 'This role cannot perform the requested operation', 403)
  return user
}

export function workflowResponse(error: unknown) {
  const known = asWorkflowError(error)
  if (known.status >= 500) console.error(`[workflow:${known.code}]`, error)
  return NextResponse.json({ error: known.code, message: known.message }, { status: known.status })
}
