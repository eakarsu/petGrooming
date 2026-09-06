import { db } from '@/lib/db'
import { AI_ROLES, TASKS, generate, petScope, safeDraftSelect, getDraft, review, reviewInput, usage } from '@/lib/operations/assistant'
import { endpoint, mutate, readJson } from '@/lib/operations/core'
import { OFFICE_ROLES, SUPERVISOR_ROLES } from '@/lib/workflow/authz'
export const dynamic='force-dynamic'
export const GET=endpoint(AI_ROLES,async(request,actor)=>{
 const office=OFFICE_ROLES.includes(actor.role)
 const [pets,drafts,knowledge,daily]=await Promise.all([
  db.pet.findMany({where:{isActive:true,client:{isActive:true},...petScope(actor)},take:500,orderBy:{name:'asc'},select:{id:true,name:true,breed:{select:{name:true}}}}),
  db.petAiDraft.findMany({where:office?{}:{actorId:actor.id,OR:[{petId:null},{petId:{in:(await db.pet.findMany({where:petScope(actor),select:{id:true}})).map(p=>p.id)}}]},orderBy:{createdAt:'desc'},take:100,select:safeDraftSelect}),
  db.petKnowledge.findMany({where:SUPERVISOR_ROLES.includes(actor.role)?{}:{isActive:true,approvedAt:{not:null}},orderBy:{title:'asc'},take:100}),
  usage(db)
 ])
 return{pets,drafts,knowledge,daily,canManage:SUPERVISOR_ROLES.includes(actor.role),tasks:office?TASKS:TASKS.filter(t=>!['STOCK_REVIEW','CAMPAIGN_DRAFT','REVIEW_RESPONSE'].includes(t)),configured:Boolean(process.env.OPENROUTER_API_KEY&&process.env.OPENROUTER_MODEL&&process.env.OPENROUTER_BASE_URL==='https://openrouter.ai/api/v1'),visionConfigured:Boolean(process.env.OPENROUTER_VISION_MODEL)}
})
export const POST=endpoint(AI_ROLES,async(request,actor)=>generate(actor.id,request.headers.get('Idempotency-Key'),await readJson(request)))
export const PATCH=endpoint(AI_ROLES,async(request,actor)=>{const input=reviewInput.parse(await readJson(request));await getDraft(db,actor.id,input.id);return mutate(actor.id,request.headers.get('Idempotency-Key'),'assistant.review',input,tx=>review(tx,actor.id,input),AI_ROLES)})
