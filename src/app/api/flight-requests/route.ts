import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {z} from 'zod';
import {supabaseServer} from '@/lib/supabase/server';
import {orderEmail} from '@/lib/products';
import {sendTransactionalEmail} from '@/lib/order-email';

const requestSchema=z.object({
 firstName:z.string().trim().min(1).max(120),lastName:z.string().trim().min(1).max(120),dateOfBirth:z.string().date(),
 flightClass:z.enum(['Economy','Business','First class']),travelingFrom:z.string().trim().min(2).max(160),travelingTo:z.string().trim().min(2).max(160),
 gender:z.enum(['Female','Male','Other']),flightDate:z.string().date(),tripType:z.enum(['One way','Round trip']),
 requestedPriceNgn:z.number().int().positive().max(100000000).nullable().optional(),
}).refine(value=>value.travelingFrom.toLowerCase()!==value.travelingTo.toLowerCase(),{message:'Departure and destination must be different.'});
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const money=(amount:number)=>`₦${amount.toLocaleString('en-NG')}`;

export async function POST(request:Request){
 let db:any;let orderId:string|undefined;let linkedFlightRequestId:string|undefined;
 try{
  const auth=await supabaseServer();const {data:{user}}=await auth.auth.getUser();
  if(!user?.email)return NextResponse.json({error:'Sign in to send a flight ticket request.'},{status:401});
  const parsed=requestSchema.safeParse(await request.json());
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||'Check your flight details.'},{status:400});
  const today=new Date().toISOString().slice(0,10);
  if(parsed.data.dateOfBirth>=today)return NextResponse.json({error:'Date of birth must be in the past.'},{status:400});
  if(parsed.data.flightDate<today)return NextResponse.json({error:'Flight date must be today or later.'},{status:400});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return NextResponse.json({error:'Flight requests are not configured yet.'},{status:503});
  db=createClient(url,key,{auth:{persistSession:false}});
  const details=parsed.data,price=details.requestedPriceNgn??null;
  const {data:flightRequest,error}=await db.from('flight_ticket_requests').insert({
   user_id:user.id,customer_email:user.email,first_name:details.firstName,last_name:details.lastName,
   date_of_birth:details.dateOfBirth,flight_class:details.flightClass,traveling_from:details.travelingFrom,
   traveling_to:details.travelingTo,gender:details.gender,flight_date:details.flightDate,
   trip_type:details.tripType,requested_price_ngn:price,
  }).select('id,reference').single();
  if(error){if(error.code==='42P01')return NextResponse.json({error:'Apply the flight ticket requests migration before submitting flight requests.'},{status:503});throw error}

  if(price===null){
   const summary=`Reference: ${flightRequest.reference}\nCustomer: ${user.email}\nTraveler: ${details.firstName} ${details.lastName}\nDOB: ${details.dateOfBirth}\nGender: ${details.gender}\nRoute: ${details.travelingFrom} to ${details.travelingTo}\nDeparture: ${details.flightDate}\nClass: ${details.flightClass}\nTrip: ${details.tripType}\nPrice: Not provided — no payment was collected.`;
   const notify=[
    {to:orderEmail,subject:`Unpaid flight order request · ${flightRequest.reference}`,intro:'A custom flight order was submitted without a price. Follow up with the customer to arrange pricing and payment.'},
    {to:user.email,subject:`Flight order request received · ${flightRequest.reference}`,intro:'We received your flight order request. No payment was collected. Our team will contact you about availability and pricing.'},
   ];
   await Promise.allSettled(notify.map(message=>sendTransactionalEmail({to:message.to,subject:message.subject,text:`${message.intro}\n\n${summary}`,html:`<p>${escapeHtml(message.intro)}</p><p>${escapeHtml(summary).replace(/\n/g,'<br>')}</p>`})));
   return NextResponse.json({request:{id:flightRequest.id,reference:flightRequest.reference},paymentRequired:false},{status:201});
  }

  const paystackAmount=price*100;
  if(!Number.isSafeInteger(paystackAmount))return NextResponse.json({error:'The price is too large to process.'},{status:400});
  const {data:order,error:orderError}=await db.from('orders').insert({user_id:user.id,status:'pending',currency:'NGN',total_amount:price}).select('id').single();
  if(orderError)throw orderError;orderId=order.id;
  const {error:itemError}=await db.from('order_items').insert({order_id:order.id,product_id:'custom-flight-ticket',unit_amount:price,quantity:1,fulfillment_options:{flightRequestReference:flightRequest.reference}});
  if(itemError)throw itemError;
  const {error:linkError}=await db.from('flight_ticket_requests').update({order_id:order.id,status:'awaiting_payment',updated_at:new Date().toISOString()}).eq('id',flightRequest.id);
  if(linkError)throw linkError;linkedFlightRequestId=flightRequest.id;
  if(!process.env.PAYSTACK_SECRET_KEY)throw new Error('Payments are not configured yet.');
  const response=await fetch('https://api.paystack.co/transaction/initialize',{method:'POST',headers:{Authorization:`Bearer ${process.env.PAYSTACK_SECRET_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({email:user.email,amount:paystackAmount,currency:'NGN',reference:order.id,callback_url:`${process.env.NEXT_PUBLIC_SITE_URL||new URL(request.url).origin}/checkout/return`,metadata:{order_id:order.id,user_id:user.id,flight_request_id:flightRequest.id}})});
  const result=await response.json();if(!response.ok||!result.status||!result.data?.authorization_url)throw new Error(result.message||'Paystack could not initialize payment.');
  const {error:paymentError}=await db.from('payments').insert({order_id:order.id,provider:'paystack',reference:result.data.reference,amount:price,currency:'NGN',status:'initialized'});
  if(paymentError)throw paymentError;
  return NextResponse.json({request:{id:flightRequest.id,reference:flightRequest.reference},paymentRequired:true,authorizationUrl:result.data.authorization_url},{status:201});
 }catch(error){if(db&&orderId)await db.from('orders').update({status:'failed'}).eq('id',orderId).eq('status','pending');if(db&&linkedFlightRequestId)await db.from('flight_ticket_requests').update({status:'requested',order_id:null,updated_at:new Date().toISOString()}).eq('id',linkedFlightRequestId);return NextResponse.json({error:error instanceof Error?error.message:'Could not submit the flight request.'},{status:500})}
}
