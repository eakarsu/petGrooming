import { db } from '@/lib/db'
import { AI_ROLES, getDraft } from '@/lib/operations/assistant'
import { endpoint, OperationError } from '@/lib/operations/core'
export const dynamic='force-dynamic'
export const GET=endpoint(AI_ROLES,async(request,actor)=>{
 const id=request.nextUrl.searchParams.get('id');if(!id||id.length>100)throw new OperationError('Draft ID is required',400)
 const row=await getDraft(db,actor.id,id)
 const photo=await db.petAiDraft.findUnique({where:{id},select:{photoBytes:true}})
 if(!photo?.photoBytes||row.photoDeletedAt)throw new OperationError('Photo unavailable',404)
 return new Response(new Uint8Array(photo.photoBytes),{headers:{'Content-Type':row.photoType!,'Content-Length':String(photo.photoBytes.length),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Content-Disposition':'inline; filename="review-photo.'+(row.photoType==='image/png'?'png':'jpg')+'"'}})
})
