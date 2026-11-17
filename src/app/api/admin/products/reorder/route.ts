import {NextResponse} from 'next/server';
import {z} from 'zod';
import {adminDatabase} from '@/lib/admin-db';

const reorderSchema=z.object({productIds:z.array(z.string().min(1).max(100)).min(1).max(500)}).refine(({productIds})=>new Set(productIds).size===productIds.length,{message:'Gift list contains duplicate products.'});

export async function PATCH(request:Request){
 const context=await adminDatabase();
 if('response'in context)return context.response;
 try{
  const {productIds}=reorderSchema.parse(await request.json());
  const {data:giftRows,error:lookupError}=await context.db.from('products').select('id').ilike('category','gifts').eq('is_active',true);
  if(lookupError)throw lookupError;
  const giftIds=new Set((giftRows||[]).map(product=>product.id));
  if(giftIds.size!==productIds.length||productIds.some(id=>!giftIds.has(id)))return NextResponse.json({error:'Gift list changed. Reload the admin page and try again.'},{status:409});
  const updates=await Promise.all(productIds.map((id,index)=>context.db.from('products').update({sort_order:index+1,updated_at:new Date().toISOString()}).eq('id',id).ilike('category','gifts').eq('is_active',true)));
  const failed=updates.find(result=>result.error);
  if(failed?.error)throw failed.error;
  return NextResponse.json({ok:true});
 }catch(error){
  const message=error&&typeof error==='object'&&'message'in error&&typeof error.message==='string'?error.message:'Could not save gift order.';
  return NextResponse.json({error:message},{status:400});
 }
}
