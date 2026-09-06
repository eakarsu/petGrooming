import type { Prisma } from '@prisma/client'
import { ProductCategory } from '@prisma/client'
import { z } from 'zod'
import { audit, money, OperationError } from './core'
export const productSchema=z.object({name:z.string().trim().min(1).max(200),description:z.string().max(5000).default(''),sku:z.string().trim().min(1).max(100),category:z.nativeEnum(ProductCategory),price:money,cost:money.nullable().optional(),quantity:z.number().int().min(0).max(10000000),reorderLevel:z.number().int().min(0).max(10000000),isActive:z.boolean().default(true),reason:z.string().trim().max(1000).default(''),expectedUpdatedAt:z.string().datetime().optional()}).strict()
export async function saveProduct(tx:Prisma.TransactionClient,actorId:string,id:string|undefined,input:z.infer<typeof productSchema>){
 const old=id?await tx.product.findUnique({where:{id}}):null
 if(id&&!old)throw new OperationError('Product not found',404)
 if(old&&old.updatedAt.toISOString()!==input.expectedUpdatedAt)throw new OperationError('Product changed; refresh before editing',409)
 const delta=input.quantity-(old?.quantity??0)
 if(delta&&input.reason.length<5)throw new OperationError('Stock changes require a reason')
 if(input.quantity<(old?.reservedQuantity??0)||!input.isActive&&(old?.reservedQuantity??0)>0)throw new OperationError('Stock reserved for grooming cannot be removed or archived',409)
 const {expectedUpdatedAt,reason,...data}=input
 if(old){
  const changed=await tx.product.updateMany({where:{id:old.id,updatedAt:old.updatedAt,reservedQuantity:old.reservedQuantity},data})
  if(!changed.count)throw new OperationError('Stock changed; refresh and retry',409)
 }
 const product=old?await tx.product.findUniqueOrThrow({where:{id:old.id}}):await tx.product.create({data})
 if(delta)await tx.inventoryMovement.create({data:{productId:product.id,movementType:old?'MANUAL_ADJUSTMENT':'OPENING_STOCK',quantity:delta,idempotencyKey:`stock:${product.id}:${crypto.randomUUID()}`}})
 await audit(tx,actorId,old?'product.update':'product.create',product.id,{before:old,after:product,reason})
 return product
}
