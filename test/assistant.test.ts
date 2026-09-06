import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { db } from '../src/lib/db'
import { draftInput, generate, getDraft, knowledgeInput, review, saveKnowledge, sources, usage, validateOutput } from '../src/lib/operations/assistant'
import { mutate } from '../src/lib/operations/core'
if(!new URL(process.env.DATABASE_URL||'postgresql://invalid/invalid').pathname.startsWith('/petgroom_test_'))throw Error('Use npm run test:isolated')
const fakeOutput=(evidence:any[])=>({title:'Reviewed fixture draft',content:'Fixture grooming advice for staff review.',citations:[{sourceId:evidence[0].id,quote:evidence[0].text.slice(0,70)}],limitations:['Test data only; confirm in person.'],escalations:['Refer health concerns to qualified staff.']})
let calls=0,lastRequest:any
const provider:typeof fetch=async(_url,init)=>{calls++;lastRequest=JSON.parse(String(init?.body));const content=lastRequest.messages[1].content;const prompt=JSON.parse(typeof content==='string'?content:content[0].text);return Response.json({id:'fixture-'+calls,model:'fixture/model',choices:[{finish_reason:'stop',message:{content:JSON.stringify(fakeOutput(prompt.sources))}}],usage:{prompt_tokens:80,completion_tokens:50,cost:0.002}})}
async function fixtures(){const id=randomUUID();const manager=await db.user.create({data:{name:'Manager',email:id+'m@test.invalid',password:'unused',role:'MANAGER'}}),reviewer=await db.user.create({data:{name:'Reviewer',email:id+'r@test.invalid',password:'unused',role:'MANAGER'}}),groomer=await db.user.create({data:{name:'Groomer',email:id+'g@test.invalid',password:'unused',role:'GROOMER'}}),staff=await db.user.create({data:{name:'Staff',email:id+'s@test.invalid',password:'unused',role:'STAFF'}})
 const client=await db.client.create({data:{firstName:'Private',lastName:'Owner',email:id+'private@test.invalid',phone:'secret-number'}}),breed=await db.breed.create({data:{name:'Fixture breed '+id,size:'MEDIUM'}}),pet=await db.pet.create({data:{name:'Pepper',breedId:breed.id,clientId:client.id,gender:'FEMALE',temperament:'Calm'}})
 process.env.OPENROUTER_API_KEY='fixture-only';process.env.OPENROUTER_MODEL='fixture/model';process.env.OPENROUTER_VISION_MODEL='fixture/vision';process.env.OPENROUTER_BASE_URL='https://openrouter.ai/api/v1';process.env.PET_AI_DAILY_LIMIT='500';process.env.PET_AI_DAILY_REPORTED_COST_USD='100'
 return{manager,reviewer,groomer,staff,client,pet}}
const runReview=(actorId:string,row:any,action:string)=>{const input={id:row.id,action,expectedUpdatedAt:row.updatedAt.toISOString(),notes:'Fixture evidence reviewed by staff',reviewConfirmed:true};return mutate(actorId,randomUUID(),'assistant.review',input,tx=>review(tx,actorId,input))}
test('AI evidence enforces current roles, assigned pet access and independent guidance approval',async()=>{
 const f=await fixtures();const input={task:'GROOMING_PLAN',petId:f.pet.id,knowledgeIds:[],instructions:'Prepare a careful grooming plan',sharingConfirmed:true}
 assert.equal(draftInput.safeParse(input).success,false)
 const k={action:'SAVE',expectedVersion:0,title:'Grooming guidance',content:'Confirm owner instructions and inspect the coat before grooming.'}
 const saved=await mutate(f.manager.id,randomUUID(),'knowledge',k,tx=>saveKnowledge(tx,f.manager.id,k)) as any
 const approval={...k,id:saved.id,action:'APPROVE',expectedVersion:saved.version}
 await assert.rejects(()=>mutate(f.manager.id,randomUUID(),'knowledge',approval,tx=>saveKnowledge(tx,f.manager.id,approval)),/different active manager/)
 await mutate(f.reviewer.id,randomUUID(),'knowledge',approval,tx=>saveKnowledge(tx,f.reviewer.id,approval))
 const selected={...input,knowledgeIds:[saved.id]};await assert.rejects(()=>generate(f.staff.id,randomUUID(),selected,provider),/role/)
 await assert.rejects(()=>generate(f.groomer.id,randomUUID(),selected,provider),/assigned/)
 await db.groomingSession.create({data:{petId:f.pet.id,groomerId:f.groomer.id,servicesNotes:'Bath completed'}})
 const row=await generate(f.groomer.id,randomUUID(),selected,provider)
 assert.equal(row.status,'DRAFT');assert.equal(JSON.stringify(lastRequest).includes(f.client.email),false);assert.equal(JSON.stringify(lastRequest).includes('secret-number'),false)
 await assert.rejects(()=>getDraft(db,f.reviewer.id,'missing'),/unavailable/)
 await db.groomingSession.deleteMany({where:{groomerId:f.groomer.id}})
 await assert.rejects(()=>getDraft(db,f.groomer.id,row.id),/removed/)
 await db.user.update({where:{id:f.reviewer.id},data:{isActive:false}})
 await assert.rejects(()=>generate(f.manager.id,randomUUID(),selected,provider),/active staff/)
})
test('AI requests and reviews replay once; changed sources cannot be approved',async()=>{
 const f=await fixtures();const input={task:'INTAKE_SUMMARY',petId:f.pet.id,knowledgeIds:[],instructions:'Summarize saved pet evidence',sharingConfirmed:true};const key=randomUUID(),before=calls
 const [a,b]=await Promise.all([generate(f.manager.id,key,input,provider),generate(f.manager.id,key,input,provider)])
 assert.equal(a.id,b.id);assert.equal(calls,before+1)
 const row=await getDraft(db,f.manager.id,a.id);assert.equal(row.status,'DRAFT');assert.equal(row.costUsd?.toNumber(),0.002)
 assert.equal((await db.pet.findUniqueOrThrow({where:{id:f.pet.id}})).temperament,'Calm')
 await assert.rejects(()=>generate(f.manager.id,key,{...input,instructions:'A different request'},provider),/different input/)
 const decision={id:row.id,action:'APPROVE',expectedUpdatedAt:row.updatedAt.toISOString(),notes:'Exact evidence checked',reviewConfirmed:true},reviewKey=randomUUID()
 const result=await mutate(f.manager.id,reviewKey,'assistant.review',decision,tx=>review(tx,f.manager.id,decision)) as any
 assert.equal(result.status,'APPROVED');await mutate(f.manager.id,reviewKey,'assistant.review',decision,tx=>review(tx,f.manager.id,decision))
 assert.equal(await db.petAudit.count({where:{entityId:row.id,action:'assistant.approve'}}),1)
 const stale=await generate(f.manager.id,randomUUID(),input,provider);await db.pet.update({where:{id:f.pet.id},data:{temperament:'Needs a quiet room'}})
 await assert.rejects(()=>runReview(f.manager.id,stale,'APPROVE'),/evidence changed/)
 await runReview(f.manager.id,stale,'REJECT')
})
test('Invalid quotations retain provider usage; unknown requests never auto resend and can be cancelled',async()=>{
 const f=await fixtures(),input={task:'INTAKE_SUMMARY',petId:f.pet.id,knowledgeIds:[],instructions:'Summarize evidence',sharingConfirmed:true}
 assert.throws(()=>validateOutput({...fakeOutput([{id:'operator',text:'Trusted text'}]),citations:[{sourceId:'operator',quote:'invented'}]},[{id:'operator',title:'Operator',text:'Trusted text'}]),/citation/)
 const invalid:typeof fetch=async()=>Response.json({id:'bad-output-fixture',model:'fixture/model',usage:{cost:0.004,prompt_tokens:100,completion_tokens:80},choices:[{finish_reason:'stop',message:{content:JSON.stringify({...fakeOutput([{id:'made-up',text:'fabrication'}])})}}]})
 const failed=await generate(f.manager.id,randomUUID(),input,invalid);assert.equal(failed.status,'FAILED');assert.equal(failed.costUsd?.toNumber(),0.004)
 let attempts=0;const timeout:typeof fetch=async()=>{attempts++;throw Error('fixture timeout')},key=randomUUID()
 const unknown=await generate(f.manager.id,key,input,timeout);assert.equal(unknown.status,'UNKNOWN');await generate(f.manager.id,key,input,timeout);assert.equal(attempts,1)
 const cancelled=await runReview(f.manager.id,unknown,'CANCEL') as any;assert.equal(cancelled.status,'CANCELLED');await generate(f.manager.id,key,input,timeout);assert.equal(attempts,1)
})
test('Photos require actual image bytes and permission; private review and deletion preserve audit and billing',async()=>{
 const f=await fixtures();const image='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lZkAAAAASUVORK5CYII='
 const input={task:'PHOTO_OBSERVATIONS',petId:f.pet.id,knowledgeIds:[],instructions:'Describe cosmetic coat observations only',sharingConfirmed:true,photo:{type:'image/png',data:image,consent:'Owner fixture authorized private storage and provider sharing today'}}
 assert.equal(draftInput.safeParse({...input,sharingConfirmed:false}).success,false)
 await assert.rejects(()=>generate(f.manager.id,randomUUID(),{...input,photo:{...input.photo,data:Buffer.from('not an image at all and no magic').toString('base64')}},provider),/content does not match/)
 const row=await generate(f.manager.id,randomUUID(),input,provider);assert.equal(row.status,'DRAFT');assert.ok(lastRequest.messages[1].content[1].image_url.url.startsWith('data:image/png;base64,'));assert.equal('photoBytes' in row,false)
 await runReview(f.manager.id,row,'APPROVE');const approved=await getDraft(db,f.manager.id,row.id);await runReview(f.manager.id,approved,'DELETE_PHOTO')
 const erased=await db.petAiDraft.findUniqueOrThrow({where:{id:row.id}});assert.equal(erased.photoBytes,null);assert.ok(erased.photoHash);assert.ok(erased.photoDeletedAt);assert.ok(erased.providerRef)
 assert.equal(JSON.stringify(await db.petOperation.findMany({where:{actorId:f.manager.id}})).includes(image),false)
 assert.equal(JSON.stringify(await db.petAudit.findMany({where:{entityId:row.id}})).includes(image),false)
})
test('Concurrent cancellation does not discard provider usage; daily limits block new work',async()=>{
 const f=await fixtures(),input={task:'INTAKE_SUMMARY',petId:f.pet.id,knowledgeIds:[],instructions:'Summarize evidence',sharingConfirmed:true}
 let release!:()=>void,started!:()=>void;const gate=new Promise<void>(r=>release=r),ready=new Promise<void>(r=>started=r)
 const delayed:typeof fetch=async(url,init)=>{started();await gate;return provider(url,init)}
 const work=generate(f.manager.id,randomUUID(),input,delayed);await ready
 const current=await db.petAiDraft.findFirstOrThrow({where:{actorId:f.manager.id,status:'RUNNING'}});await runReview(f.manager.id,current,'CANCEL');release();const row=await work
 assert.equal(row.status,'CANCELLED');assert.ok(row.providerRef);assert.equal(row.costUsd?.toNumber(),0.002)
 process.env.PET_AI_DAILY_LIMIT='1';await assert.rejects(()=>generate(f.manager.id,randomUUID(),input,provider),/Daily AI/)
 process.env.PET_AI_DAILY_LIMIT='500';process.env.PET_AI_DAILY_REPORTED_COST_USD='0.000001';await assert.rejects(()=>generate(f.manager.id,randomUUID(),input,provider),/Daily AI/)
 process.env.PET_AI_DAILY_REPORTED_COST_USD='100';assert.ok((await usage(db)).requests>0)
 await db.$disconnect()
})
