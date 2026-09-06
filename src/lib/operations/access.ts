import { NextResponse } from 'next/server'
import { requireApiActor } from '@/lib/workflow/api'
import { WorkflowError } from '@/lib/workflow/errors'
export const OFFICE = ['ADMIN', 'MANAGER', 'RECEPTIONIST']
export const MANAGEMENT = ['ADMIN', 'MANAGER']
export const safeStaff = { id: true, name: true, role: true, avatar: true } as const
export function withAccess<T extends (...args: any[]) => Promise<Response>>(roles: string[] | undefined, handler: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      await requireApiActor(roles)
      return await handler(...args)
    } catch (error) {
      if (error instanceof WorkflowError) return NextResponse.json({ error: error.message }, { status: error.status })
      console.error('Request failed', error instanceof Error ? error.name : 'unknown')
      return NextResponse.json({ error: 'Request could not be completed' }, { status: 500 })
    }
  }) as T
}
