import { z } from 'zod'
import { hash } from 'bcryptjs'
import { UserRole } from '@prisma/client'
import { db } from '@/lib/db'
import { endpoint,readJson,mutate,audit } from '@/lib/operations/core'
const safeUser={id:true,name:true,email:true,role:true,phone:true,avatar:true,isActive:true,createdAt:true} as const
const schema=z.object({name:z.string().trim().min(1).max(150),email:z.string().trim().toLowerCase().email().max(254),password:z.string().min(14).refine(s=>Buffer.byteLength(s,'utf8')<=72,'Password must not exceed 72 UTF-8 bytes'),role:z.nativeEnum(UserRole).default('STAFF'),phone:z.string().max(50).optional()}).strict()
export const GET=endpoint(undefined,async request=>{const role=request.nextUrl.searchParams.get('role');return db.user.findMany({where:{isActive:true,...(role?{role:z.nativeEnum(UserRole).parse(role)}:{})},select:safeUser,orderBy:{name:'asc'},take:500})})
export const POST=endpoint(['ADMIN'],async(request,actor)=>{const input=schema.parse(await readJson(request));const password=await hash(input.password,12);return mutate(actor.id,request.headers.get('Idempotency-Key'),'user.create',{...input,password:undefined,passwordDigest:await import('node:crypto').then(c=>c.createHash('sha256').update(input.password).digest('hex'))},async tx=>{const user=await tx.user.create({data:{...input,password},select:safeUser});await audit(tx,actor.id,'user.create',user.id,{email:user.email,role:user.role});return user},['ADMIN'])})
