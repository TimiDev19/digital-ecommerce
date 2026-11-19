import {NextResponse} from 'next/server';
import {z} from 'zod';
import {adminDatabase} from '@/lib/admin-db';
import {sameCatalogCategory} from '@/lib/products';

const schema=z.object({fulfillment_status:z.enum(['pending','completed']),esimItems:z.array(z.object({id:z.string().min(1),delivery_number:z.string().trim().max(120),delivery_pin:z.string().trim().max(120)})).optional().default([])});

export async function PATCH(request:Request,{params}:{params:{id:string}}){
 const context=await adminDatabase();if('response'in context)return context.response;
 try{
  const input=schema.parse(await request.json());
  const {data:order,error:orderError}=await context.db.from('orders').select('id').eq('id',params.id).maybeSingle();
  if(orderError)throw orderError;if(!order)return NextResponse.json({error:'Order not found.'},{status:404});
  const {data:items,error:itemError}=await context.db.from('order_items').select('id,products(category)').eq('order_id',params.id);
  if(itemError)throw itemError;
  const esimItems=(items||[]).filter((item:any)=>sameCatalogCategory(item.products?.category,'eSIM'));
  const submitted=new Map(input.esimItems.map(item=>[item.id,item]));
  if(submitted.size!==input.esimItems.length||input.esimItems.some(item=>!esimItems.some((row:any)=>row.id===item.id)))return NextResponse.json({error:'One or more eSIM items do not belong to this order.'},{status:400});
  if(input.fulfillment_status==='completed'&&esimItems.some((item:any)=>{const data=submitted.get(item.id);return !data?.delivery_number||!data?.delivery_pin}))return NextResponse.json({error:'Enter the eSIM number and PIN for every eSIM item before marking this order completed.'},{status:400});
  for(const item of esimItems){const details=submitted.get(item.id);if(!details)continue;const {error}=await context.db.from('order_items').update({delivery_number:details.delivery_number||null,delivery_pin:details.delivery_pin||null}).eq('id',item.id).eq('order_id',params.id);if(error)throw error;}
  const {error}=await context.db.from('orders').update({fulfillment_status:input.fulfillment_status}).eq('id',params.id);
  if(error)throw error;
  return NextResponse.json({saved:true});
 }catch(error){const message=error instanceof Error?error.message:'Could not update the order.';return NextResponse.json({error:message},{status:400});}
}
