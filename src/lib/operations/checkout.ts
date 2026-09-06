import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { audit, cents, money, OperationError } from './core'
import { changePoints, spendCard } from './balances'
export const checkoutSchema=z.object({
 clientId:z.string().min(1).max(100),petId:z.string().max(100).optional(),
 items:z.array(z.object({id:z.string().min(1).max(100),type:z.enum(['SERVICE','PRODUCT','PACKAGE']),quantity:z.number().int().min(1).max(100)}).strict()).min(1).max(100),
 discountPercent:z.number().min(0).max(100).multipleOf(0.01).default(0),discountReason:z.string().max(1000).default(''),tip:money.default(0),
 paymentMethod:z.enum(['CASH','GIFT_CARD','LOYALTY_POINTS']),giftCardCode:z.string().max(100).optional(),cashReceived:money.optional(),
 expectedTotal:money,
}).strict()
export async function checkout(tx:Prisma.TransactionClient,actor:{id:string;role:string},input:z.infer<typeof checkoutSchema>){
 const settings=await tx.businessSettings.findUnique({where:{id:'default'}})
 if(!settings?.taxConfigured)throw new OperationError('A manager must review and save tax settings before checkout',409)
 if(!await tx.client.findFirst({where:{id:input.clientId,isActive:true}}))throw new OperationError('Active client not found',404)
 const pet=input.petId?await tx.pet.findFirst({where:{id:input.petId,clientId:input.clientId,isActive:true}}):null
 if(input.petId&&!pet)throw new OperationError('Pet does not belong to this client',409)
 if(input.discountPercent>0&&(!['ADMIN','MANAGER'].includes(actor.role)||input.discountReason.trim().length<5))throw new OperationError('Discounts require a manager and a reason',403)
 const seen=new Set<string>();const lines=[]
 for(const item of input.items){
  const key=`${item.type}:${item.id}`;if(seen.has(key))throw new OperationError('Combine duplicate cart items');seen.add(key)
  let price=0
  if(item.type==='SERVICE'){
   const service=await tx.service.findFirst({where:{id:item.id,isActive:true}});if(!service)throw new OperationError('Service is no longer available',409)
   const modifier=pet?await tx.breedService.findUnique({where:{breedId_serviceId:{breedId:pet.breedId,serviceId:service.id}}}):null
   price=cents(service.basePrice)+cents(modifier?.priceModifier??0)
  }else if(item.type==='PRODUCT'){
   const product=await tx.product.findFirst({where:{id:item.id,isActive:true}});if(!product)throw new OperationError('Product is no longer available',409)
   price=cents(product.price)
  }else{const pack=await tx.servicePackage.findFirst({where:{id:item.id,isActive:true}});if(!pack)throw new OperationError('Package is no longer available',409);price=cents(pack.price)}
  if(price<0)throw new OperationError('Catalog contains a negative price',409)
  lines.push({itemType:item.type,serviceId:item.type==='SERVICE'?item.id:null,productId:item.type==='PRODUCT'?item.id:null,packageId:item.type==='PACKAGE'?item.id:null,quantity:item.quantity,unitPrice:price/100,total:price*item.quantity/100})
 }
 const subtotal=lines.reduce((sum,line)=>sum+cents(line.total),0),discount=Math.round(subtotal*input.discountPercent/100),tax=Math.round((subtotal-discount)*settings.taxRate/100),tip=cents(input.tip),total=subtotal-discount+tax+tip
 if(total>1000000000)throw new OperationError('Sale exceeds the supported limit')
 if(cents(input.expectedTotal)!==total)throw new OperationError(`Prices changed or checkout total differs. Current total is ${settings.currency} ${(total/100).toFixed(2)}; refresh the catalog before confirming.`,409)
 if(total<=0)throw new OperationError('Checkout total must be positive')
 if(input.paymentMethod==='CASH'&&(input.cashReceived===undefined||cents(input.cashReceived)<total))throw new OperationError('Record cash received covering the total')
 const earned=input.paymentMethod==='LOYALTY_POINTS'?0:Math.floor((subtotal-discount)/100*settings.loyaltyPointsPerDollar)
 const sale=await tx.transaction.create({data:{clientId:input.clientId,staffId:actor.id,subtotal:subtotal/100,tax:tax/100,discount:discount/100,tip:tip/100,total:total/100,totalCents:total,currency:settings.currency,paymentMethod:input.paymentMethod,paymentStatus:'COMPLETED',verifiedAt:new Date(),loyaltyPointsEarned:earned,items:{create:lines}}})
 if(input.paymentMethod==='GIFT_CARD'){
  if(!input.giftCardCode)throw new OperationError('Gift card code is required')
  const spent=await spendCard(tx,actor.id,input.giftCardCode,total,'Checkout payment',sale.id)
  await tx.transaction.update({where:{id:sale.id},data:{giftCardId:spent.giftCard.id,giftCardAmount:total/100}})
 }
 if(input.paymentMethod==='LOYALTY_POINTS'){
  const pointValue=cents(settings.loyaltyPointsValue)
  if(pointValue<=0||total%pointValue!==0)throw new OperationError('Total cannot be covered exactly with the configured points value')
  const points=total/pointValue
  await changePoints(tx,actor.id,input.clientId,-points,'Checkout payment',sale.id)
  await tx.transaction.update({where:{id:sale.id},data:{loyaltyPointsUsed:points}})
 }
 for(const line of lines.filter(l=>l.productId)){
  const changed=await tx.$executeRaw`UPDATE "Product" SET "quantity"="quantity"-${line.quantity},"updatedAt"=NOW() WHERE "id"=${line.productId} AND "isActive"=true AND "quantity"-"reservedQuantity">=${line.quantity}`
  if(changed!==1)throw new OperationError('Insufficient unreserved stock; refresh the cart',409)
  await tx.inventoryMovement.create({data:{productId:line.productId!,movementType:'POS_SALE',quantity:-line.quantity,idempotencyKey:`pos:${sale.id}:${line.productId}`}})
 }
 if(earned)await changePoints(tx,actor.id,input.clientId,earned,'Checkout earnings',sale.id)
 await audit(tx,actor.id,'pos.checkout',sale.id,{totalCents:total,currency:settings.currency,paymentMethod:input.paymentMethod,cashReceived:input.cashReceived,changeCents:input.cashReceived===undefined?undefined:cents(input.cashReceived)-total,discountReason:input.discountReason})
 return {...sale,items:lines,change:input.cashReceived===undefined?0:(cents(input.cashReceived)-total)/100}
}
export const refundSchema=z.object({transactionId:z.string().min(1).max(100),reason:z.string().trim().min(5).max(1000),cashReturnedConfirmed:z.boolean().default(false)}).strict()
export async function refundSale(tx:Prisma.TransactionClient,actorId:string,input:z.infer<typeof refundSchema>){
 const sale=await tx.transaction.findUnique({where:{id:input.transactionId}})
 if(!sale?.verifiedAt||sale.totalCents===null||sale.paymentStatus!=='COMPLETED'||sale.refundedCents)throw new OperationError('Only an unrefunded, verified sale can be refunded here',409)
 if(sale.paymentMethod==='CASH'&&!input.cashReturnedConfirmed)throw new OperationError('Confirm the cash was returned')
 if(!['CASH','GIFT_CARD','LOYALTY_POINTS'].includes(sale.paymentMethod))throw new OperationError('Use the provider-backed workflow to refund this payment',409)
 if(sale.loyaltyPointsEarned)await changePoints(tx,actorId,sale.clientId,-sale.loyaltyPointsEarned,'Reverse sale earnings on refund',sale.id)
 if(sale.loyaltyPointsUsed)await changePoints(tx,actorId,sale.clientId,sale.loyaltyPointsUsed,'Return redeemed points on refund',sale.id)
 if(sale.paymentMethod==='GIFT_CARD'){
  if(!sale.giftCardId)throw new OperationError('Original gift card is missing',409)
  const card=await tx.giftCard.update({where:{id:sale.giftCardId},data:{balanceCents:{increment:sale.totalCents},currentBalance:{increment:sale.totalCents/100}}})
  await tx.petBalanceEntry.create({data:{accountType:'GIFT_CARD',accountId:card.id,delta:sale.totalCents,balanceAfter:card.balanceCents,actorId,reason:input.reason,reference:sale.id}})
 }
 const updated=await tx.transaction.updateMany({where:{id:sale.id,paymentStatus:'COMPLETED',refundedCents:0},data:{paymentStatus:'REFUNDED',refundedCents:sale.totalCents}})
 if(!updated.count)throw new OperationError('Sale changed; reload',409)
 await audit(tx,actorId,'pos.refund',sale.id,{reason:input.reason,amountCents:sale.totalCents,currency:sale.currency,method:sale.paymentMethod})
 return {success:true,transactionId:sale.id,refundedCents:sale.totalCents}
}
