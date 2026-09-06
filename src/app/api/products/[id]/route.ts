import { db } from '@/lib/db'
import { MANAGEMENT } from '@/lib/operations/access'
import { endpoint,readJson,mutate,OperationError,audit } from '@/lib/operations/core'
import { productSchema,saveProduct } from '@/lib/operations/inventory'
type Context={params:Promise<{id:string}>}
export const GET=endpoint<Context>(undefined,async(_request,_actor,context)=>{const product=await db.product.findUnique({where:{id:(await context.params).id}});if(!product)throw new OperationError('Product not found',404);return product})
export const PUT=endpoint<Context>(MANAGEMENT,async(request,actor,context)=>{const id=(await context.params).id,input=productSchema.parse(await readJson(request));return mutate(actor.id,request.headers.get('Idempotency-Key'),'product.update',{id,...input},tx=>saveProduct(tx,actor.id,id,input),MANAGEMENT)})
export const DELETE=endpoint<Context>(MANAGEMENT,async(request,actor,context)=>{const id=(await context.params).id;return mutate(actor.id,request.headers.get('Idempotency-Key'),'product.archive',{id},async tx=>{const changed=await tx.product.updateMany({where:{id,reservedQuantity:0},data:{isActive:false}});if(!changed.count)throw new OperationError('Product is missing or has reserved stock',409);await audit(tx,actor.id,'product.archive',id,{});return {success:true}},MANAGEMENT)})
