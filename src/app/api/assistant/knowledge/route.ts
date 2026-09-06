import { knowledgeInput, saveKnowledge } from '@/lib/operations/assistant'
import { endpoint, mutate, readJson } from '@/lib/operations/core'
import { SUPERVISOR_ROLES } from '@/lib/workflow/authz'
export const POST=endpoint(SUPERVISOR_ROLES,async(request,actor)=>{const input=knowledgeInput.parse(await readJson(request));return mutate(actor.id,request.headers.get('Idempotency-Key'),'knowledge.update',input,tx=>saveKnowledge(tx,actor.id,input),SUPERVISOR_ROLES)})
