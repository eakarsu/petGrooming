import { ProductCategory } from '@prisma/client'
import { z } from 'zod'
import { db } from '@/lib/db'
import { MANAGEMENT } from '@/lib/operations/access'
import { endpoint,readJson,mutate } from '@/lib/operations/core'
import { productSchema,saveProduct } from '@/lib/operations/inventory'
export const GET=endpoint(undefined,async request=>{const category=request.nextUrl.searchParams.get('category');return db.product.findMany({where:{...(request.nextUrl.searchParams.get('active')==='true'?{isActive:true}:{}),...(category?{category:z.nativeEnum(ProductCategory).parse(category)}:{})},orderBy:[{category:'asc'},{name:'asc'}],take:1000})})
export const POST=endpoint(MANAGEMENT,async(request,actor)=>{const input=productSchema.parse(await readJson(request));return mutate(actor.id,request.headers.get('Idempotency-Key'),'product.create',input,tx=>saveProduct(tx,actor.id,undefined,input),MANAGEMENT)})
