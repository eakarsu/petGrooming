import { NextResponse } from 'next/server'
import { endpoint } from '@/lib/operations/core'
import { AI_ROLES } from '@/lib/operations/assistant'
// Old free-form calls bypassed source review, retry suppression and usage limits.
export const POST=endpoint(AI_ROLES,async()=>NextResponse.json({error:'Use AI Drafts & Knowledge at /assistant to select evidence and review a saved draft.'},{status:410}))
