import type { Prisma } from '@prisma/client'
import { WorkflowError } from './errors'

export async function requireWorkflowActor(tx: Prisma.TransactionClient, actorId: string, allowedRoles?: string[]) {
  const user = await tx.user.findUnique({ where: { id: actorId }, select: { id: true, role: true, isActive: true } })
  if (!user?.isActive) throw new WorkflowError('ACTOR_NOT_ACTIVE', 'An active staff account is required', 401)
  if (allowedRoles && !allowedRoles.includes(user.role)) throw new WorkflowError('ROLE_FORBIDDEN', 'This role cannot perform the requested operation', 403)
  return user
}

export const OFFICE_ROLES = ['ADMIN', 'MANAGER', 'RECEPTIONIST']
export const SUPERVISOR_ROLES = ['ADMIN', 'MANAGER']
