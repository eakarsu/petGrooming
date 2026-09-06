import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { db } from '../src/lib/db'
import { mutate,cents,readJson } from '../src/lib/operations/core'
import { issueCard,spendCard,changePoints,redeemSchema } from '../src/lib/operations/balances'
import { checkout,checkoutSchema,refundSale } from '../src/lib/operations/checkout'
import { settingsSchema,defaultSettings } from '../src/lib/operations/settings'
import { dayBounds } from '../src/lib/operations/time'
const url=new URL(process.env.DATABASE_URL||'postgresql://invalid/invalid')
if(!url.pathname.startsWith('/petgroom_test_'))throw Error('Use npm run test:isolated; operational tests require a disposable petgroom_test_ database')
test('money rejects negative redemption, excess decimals and oversized JSON; business days respect DST',async()=>{
 assert.equal(cents(12.34),1234);assert.throws(()=>cents(0.001));assert.equal(redeemSchema.safeParse({code:'validcode',amount:-1,reason:'Testing'}).success,false)
 await assert.rejects(()=>readJson(new Request('http://local',{method:'POST',body:'x'.repeat(1000001)})),/1 MB/)
 assert.equal((dayBounds(new Date('2026-03-08T12:00:00Z'),'America/New_York').end.getTime()-dayBounds(new Date('2026-03-08T12:00:00Z'),'America/New_York').start.getTime())/3600000,23)
 const {id,updatedAt,...defaults}=defaultSettings
 assert.equal(settingsSchema.safeParse({...defaults,expectedUpdatedAt:null}).success,true)
})
test('receipts replay once; gift cards and points cannot overspend; checkout cannot oversell or trust totals; refunds reverse ledgers',async()=>{
 const suffix=randomUUID();const actor=await db.user.create({data:{email:suffix+'@test.local',name:'Manager',password:'unused',role:'MANAGER'}})
 const other=await db.user.create({data:{email:suffix+'g@test.local',name:'Groomer',password:'unused',role:'GROOMER'}})
 const client=await db.client.create({data:{firstName:'Test',lastName:'Client',email:suffix+'c@test.local',phone:'123',loyaltyPoints:100}})
 const execute=(key:string,action:string,input:unknown,work:Parameters<typeof mutate>[4])=>mutate(actor.id,key,action,input,work,['MANAGER'])
 const input={amount:10,reason:'Fixture issuance',clientId:client.id}
 const key=randomUUID();const card=(await execute(key,'gift.issue',input,tx=>issueCard(tx,actor.id,input))) as any
 assert.deepEqual(await execute(key,'gift.issue',input,tx=>issueCard(tx,actor.id,input)),card)
 await assert.rejects(()=>execute(key,'gift.issue',{amount:20},tx=>issueCard(tx,actor.id,input)),/different input/)
 await assert.rejects(()=>mutate(other.id,randomUUID(),'forbidden',{},async()=>({}),['MANAGER']),/role/)
 const spends=await Promise.allSettled([1,2].map(n=>execute(randomUUID(),'gift.spend',{n},tx=>spendCard(tx,actor.id,card.giftCard.code,700,'Fixture redemption'))))
 assert.equal(spends.filter(r=>r.status==='fulfilled').length,1);assert.equal((await db.giftCard.findUniqueOrThrow({where:{id:card.giftCard.id}})).balanceCents,300)
 const points=await Promise.allSettled([1,2].map(n=>execute(randomUUID(),'points.spend',{n},tx=>changePoints(tx,actor.id,client.id,-70,'Fixture redemption'))))
 assert.equal(points.filter(r=>r.status==='fulfilled').length,1);assert.equal((await db.client.findUniqueOrThrow({where:{id:client.id}})).loyaltyPoints,30)
 await db.businessSettings.upsert({where:{id:'default'},create:{id:'default',businessName:'Test',taxConfigured:true,taxRate:0},update:{taxConfigured:true,taxRate:0}})
 const product=await db.product.create({data:{sku:suffix,name:'Shampoo',price:12.34,quantity:2,reservedQuantity:1,category:'SHAMPOO'}})
 const cart=checkoutSchema.parse({clientId:client.id,items:[{id:product.id,type:'PRODUCT',quantity:1}],paymentMethod:'CASH',cashReceived:20,expectedTotal:12.34})
 await assert.rejects(()=>execute(randomUUID(),'pos.bad',{},tx=>checkout(tx,actor,{...cart,expectedTotal:1})),/total differs/)
 const outcomes=await Promise.allSettled([1,2].map(n=>execute(randomUUID(),'pos.checkout',{n},tx=>checkout(tx,actor,cart))))
 assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1)
 const sale=(outcomes.find(r=>r.status==='fulfilled') as PromiseFulfilledResult<any>).value
 assert.equal(sale.change,7.66);assert.equal((await db.product.findUniqueOrThrow({where:{id:product.id}})).quantity,1)
 assert.equal((await db.client.findUniqueOrThrow({where:{id:client.id}})).loyaltyPoints,42)
 const refundKey=randomUUID();const refundInput={transactionId:sale.id,reason:'Fixture full refund',cashReturnedConfirmed:true}
 await execute(refundKey,'pos.refund',refundInput,tx=>refundSale(tx,actor.id,refundInput));await execute(refundKey,'pos.refund',refundInput,tx=>refundSale(tx,actor.id,refundInput))
 assert.equal((await db.client.findUniqueOrThrow({where:{id:client.id}})).loyaltyPoints,30)
 await assert.rejects(()=>execute(randomUUID(),'pos.refund',refundInput,tx=>refundSale(tx,actor.id,refundInput)),/unrefunded/)
 assert.equal(await db.petAudit.count({where:{entityId:sale.id,action:'pos.refund'}}),1)
 await db.$disconnect()
})
test('booking verifies ownership, skills, availability, conflicts, stale edits and atomic recurring series',async()=>{
 const {createBooking,changeBooking,bookingSchema}=await import('../src/lib/operations/booking')
 const {localInstant}=await import('../src/lib/operations/time')
 const suffix=randomUUID(),actor=await db.user.create({data:{email:suffix+'admin@test.local',name:'Manager',password:'unused',role:'MANAGER'}})
 const groomer=await db.user.create({data:{email:suffix+'groom@test.local',name:'Groomer',password:'unused',role:'GROOMER'}})
 const client=await db.client.create({data:{firstName:'Test',lastName:'Family',email:suffix+'client@test.local',phone:'123'}})
 const breed=await db.breed.create({data:{name:suffix,size:'MEDIUM'}})
 const pet=await db.pet.create({data:{name:'Pepper',clientId:client.id,breedId:breed.id,gender:'FEMALE'}})
 const service=await db.service.create({data:{name:'Groom',category:'HAIRCUT',basePrice:50,baseDuration:60}})
 await db.breedService.create({data:{breedId:breed.id,serviceId:service.id,priceModifier:5,durationModifier:15}})
 await db.technicianProfile.create({data:{userId:groomer.id,baseLatitude:42,baseLongitude:-73,maxTravelKm:50}})
 await db.technicianSkill.create({data:{technicianId:groomer.id,serviceId:service.id}})
 await db.technicianAvailability.create({data:{technicianId:groomer.id,startsAt:new Date(),endsAt:new Date(Date.now()+366*86400000),available:true,source:'FIXTURE'}})
 const hours=JSON.stringify(Object.fromEntries(['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].map(day=>[day,{open:'08:00',close:'18:00',closed:false}])))
 await db.businessSettings.update({where:{id:'default'},data:{operatingHours:hours,maxAdvanceBooking:365,bookingLeadTime:0}})
 const day=new Date(Date.now()+14*86400000).toISOString().slice(0,10)
 const input=bookingSchema.parse({clientId:client.id,petId:pet.id,groomerId:groomer.id,services:[service.id],scheduledDate:day,scheduledTime:'10:00',duration:15})
 const run=(data:typeof input)=>mutate(actor.id,randomUUID(),'booking',data,tx=>createBooking(tx,actor.id,data),['MANAGER'])
 await assert.rejects(()=>run({...input,clientId:'wrong-client'}),/belong/)
 const results=await Promise.allSettled([run(input),run(input)])
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1)
 const booked=(results.find(r=>r.status==='fulfilled') as PromiseFulfilledResult<any>).value
 assert.equal(booked.duration,75);assert.equal(booked.services[0].price,55)
 await assert.rejects(()=>mutate(actor.id,randomUUID(),'change',{},tx=>changeBooking(tx,actor,booked.id,{expectedUpdatedAt:'2000-01-01T00:00:00.000Z',status:'CONFIRMED'})),/changed/)
 const updated=await mutate(actor.id,randomUUID(),'confirm',{},tx=>changeBooking(tx,actor,booked.id,{expectedUpdatedAt:booked.updatedAt,status:'CONFIRMED'})) as any
 await assert.rejects(()=>mutate(actor.id,randomUUID(),'complete',{},tx=>changeBooking(tx,actor,booked.id,{expectedUpdatedAt:updated.updatedAt,status:'COMPLETED'})),/Cannot transition/)
 // A later recurring occurrence conflicts; none of the preceding occurrences may remain.
 const first=new Date(day+'T12:00:00Z');first.setUTCDate(first.getUTCDate()-7)
 const before=await db.appointment.count()
 await assert.rejects(()=>run({...input,scheduledDate:first.toISOString().slice(0,10),isRecurring:true,recurrenceRule:'FREQ=WEEKLY;INTERVAL=1;COUNT=2'}))
 assert.equal(await db.appointment.count(),before)
 assert.throws(()=>localInstant('2026-11-01','01:30','America/New_York'),/ambiguous/)
 await db.$disconnect()
})
