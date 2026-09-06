import { db } from '@/lib/db'
import { OFFICE,MANAGEMENT,safeStaff } from '@/lib/operations/access'
import { endpoint,readJson,mutate } from '@/lib/operations/core'
import { checkoutSchema,checkout,refundSchema,refundSale } from '@/lib/operations/checkout'
export const GET=endpoint(OFFICE,async request=>db.transaction.findMany({where:request.nextUrl.searchParams.get('clientId')?{clientId:request.nextUrl.searchParams.get('clientId')!}:{},include:{client:{select:{id:true,firstName:true,lastName:true}},staff:{select:safeStaff},items:{include:{service:true,product:true,package:true}}},orderBy:{createdAt:'desc'},take:100}))
export const POST=endpoint(OFFICE,async(request,actor)=>{const input=checkoutSchema.parse(await readJson(request));return mutate(actor.id,request.headers.get('Idempotency-Key'),'pos.checkout',input,tx=>checkout(tx,actor,input),OFFICE)})
export const PATCH=endpoint(MANAGEMENT,async(request,actor)=>{const input=refundSchema.parse(await readJson(request));return mutate(actor.id,request.headers.get('Idempotency-Key'),'pos.refund',input,tx=>refundSale(tx,actor.id,input),MANAGEMENT)})
