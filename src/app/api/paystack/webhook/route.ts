import {NextResponse} from 'next/server';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {buildOrderEmails,sendTransactionalEmail,type OrderDeliveryDetails,type OrderEmailLine} from '@/lib/order-email';

function jsonError(message:string,status=500){return NextResponse.json({error:message},{status})}
export async function POST(req:Request){
 const secret=process.env.PAYSTACK_SECRET_KEY;const signature=req.headers.get('x-paystack-signature');const raw=await req.text();
 if(!secret||!signature||!/^[a-f0-9]{128}$/i.test(signature))return jsonError('Unauthorized',401);
 const expected=crypto.createHmac('sha512',secret).update(raw).digest('hex');if(!crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return jsonError('Invalid signature',401);
 let event:any;try{event=JSON.parse(raw)}catch{return jsonError('Invalid event',400)}if(event.event!=='charge.success')return NextResponse.json({received:true});
 const tx=event.data;if(!tx.reference||!tx.metadata?.order_id||!tx.metadata?.user_id)return jsonError('Missing order metadata',400);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return jsonError('Service unavailable');
 try{
  const verificationResponse=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(tx.reference)}`,{headers:{Authorization:`Bearer ${secret}`}});const verification=await verificationResponse.json();
  if(!verificationResponse.ok||!verification.status||verification.data?.status!=='success'||verification.data.reference!==tx.reference)return jsonError('Transaction not verified',400);
  const db=createClient(url,key,{auth:{persistSession:false}});
  const {data:order,error:orderError}=await db.from('orders').select('id,user_id,total_amount,currency,status,delivery_details').eq('id',tx.metadata.order_id).single();
  if(orderError||!order||order.user_id!==tx.metadata.user_id)return jsonError('Payment does not match order',400);
  if(Number(verification.data.amount)!==Number(order.total_amount)*100||verification.data.currency!==order.currency)return jsonError('Payment does not match order',400);
  const verifiedAt=new Date().toISOString();
  const {error:paymentError}=await db.from('payments').upsert({order_id:order.id,provider:'paystack',reference:tx.reference,amount:order.total_amount,currency:order.currency,status:'success',verified_at:verifiedAt},{onConflict:'reference'});if(paymentError)return jsonError('Payment record failed');
  if(order.status!=='paid'){const {error}=await db.from('orders').update({status:'paid',paid_at:verifiedAt}).eq('id',order.id).eq('status','pending');if(error)return jsonError('Order status update failed');}
  const [{data:userResult,error:userError},{data:orderRows,error:itemsError}]=await Promise.all([db.auth.admin.getUserById(order.user_id),db.from('order_items').select('quantity,unit_amount,fulfillment_options,products(name,category)').eq('order_id',order.id)]);
  if(userError||!userResult.user?.email)return jsonError('Could not load the customer email.');if(itemsError||!orderRows?.length)return jsonError('Could not load the order summary.');
  const items:OrderEmailLine[]=orderRows.map((row:any)=>({name:row.products?.name||'Product',category:row.products?.category||'StephGifts',quantity:row.quantity,unitAmount:Number(row.unit_amount),options:row.fulfillment_options||{}}));
  const merchantEmail=process.env.ORDER_NOTIFICATION_EMAIL||'oduneyestephen04@gmail.com';
  const messages=buildOrderEmails({orderId:order.id,customerEmail:userResult.user.email,merchantEmail,items,total:Number(order.total_amount),currency:String(order.currency).trim(),delivery:order.delivery_details as OrderDeliveryDetails|null});
  const {error:seedError}=await db.from('order_email_notifications').upsert(messages.map(message=>({order_id:order.id,kind:message.kind,recipient:message.recipient,status:'pending'})),{onConflict:'order_id,kind',ignoreDuplicates:true});if(seedError)return jsonError('Could not prepare order emails.');
  const staleBefore=new Date(Date.now()-5*60*1000).toISOString();await db.from('order_email_notifications').update({status:'failed',last_error:'Previous send attempt timed out; retrying.',updated_at:new Date().toISOString()}).eq('order_id',order.id).eq('status','sending').lt('updated_at',staleBefore);
  const {data:notifications,error:notificationError}=await db.from('order_email_notifications').select('kind,recipient,status,attempts').eq('order_id',order.id);if(notificationError)return jsonError('Could not load order email status.');
  const failures:string[]=[];let lastEmailRequestAt=0;
  for(const notification of notifications||[]){if(notification.status==='sent')continue;const message=messages.find(item=>item.kind===notification.kind);if(!message)continue;
   const now=new Date().toISOString();const {data:claim,error:claimError}=await db.from('order_email_notifications').update({status:'sending',attempts:Number(notification.attempts||0)+1,last_error:null,updated_at:now}).eq('order_id',order.id).eq('kind',notification.kind).in('status',['pending','failed']).select('kind').maybeSingle();
   if(claimError){failures.push(`${notification.kind}: ${claimError.message}`);continue;}if(!claim){failures.push(`${notification.kind}: another send attempt is in progress.`);continue;}
   try{const waitMs=Math.max(0,1000-(Date.now()-lastEmailRequestAt));if(lastEmailRequestAt&&waitMs)await new Promise(resolve=>setTimeout(resolve,waitMs));lastEmailRequestAt=Date.now();const providerId=await sendTransactionalEmail({kind:message.kind,to:notification.recipient,subject:message.subject,html:message.html,text:message.text,});const {error:updateError}=await db.from('order_email_notifications').update({status:'sent',provider_id:providerId,sent_at:new Date().toISOString(),updated_at:new Date().toISOString(),last_error:null}).eq('order_id',order.id).eq('kind',notification.kind);if(updateError)throw updateError}
   catch(error){const reason=error instanceof Error?error.message:'Email delivery failed.';await db.from('order_email_notifications').update({status:'failed',last_error:reason,updated_at:new Date().toISOString()}).eq('order_id',order.id).eq('kind',notification.kind);failures.push(`${notification.kind}: ${reason}`)}
  }
  if(failures.length)return NextResponse.json({received:true,emailError:'Payment is confirmed; order emails will be retried.',details:failures},{status:500});
  return NextResponse.json({received:true});
 }catch(error){return jsonError(error instanceof Error?error.message:'Webhook processing failed.')}
}
