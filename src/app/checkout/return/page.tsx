import {createClient} from '@supabase/supabase-js';
import {redirect} from 'next/navigation';

type PaystackVerification={status?:boolean;data?:{reference?:string;status?:string;amount?:number;currency?:string}};

async function verifyAndRecord(reference:string,cancelled:boolean):Promise<'success'|'failed'|'unconfirmed'>{
 const secret=process.env.PAYSTACK_SECRET_KEY;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!secret||!url||!key)return 'unconfirmed';

 try{
  const response=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,{headers:{Authorization:`Bearer ${secret}`},cache:'no-store'});
  const verification=await response.json() as PaystackVerification;
  if(!response.ok||!verification.status||verification.data?.reference!==reference)return 'unconfirmed';

  const db=createClient(url,key,{auth:{persistSession:false}});
  const {data:payment,error:paymentLookupError}=await db.from('payments').select('order_id,amount,currency').eq('reference',reference).maybeSingle();
  if(paymentLookupError||!payment)return 'unconfirmed';
  const {data:order,error:orderLookupError}=await db.from('orders').select('id,total_amount,currency,status').eq('id',payment.order_id).maybeSingle();
  if(orderLookupError||!order)return 'unconfirmed';

  const validAmount=Number(verification.data?.amount)===Number(order.total_amount)*100&&Number(payment.amount)===Number(order.total_amount);
  const validCurrency=verification.data?.currency===order.currency&&payment.currency===order.currency;
  if(!validAmount||!validCurrency)return 'unconfirmed';

  const verifiedAt=new Date().toISOString();
  if(verification.data?.status==='success'){
   const [{error:paymentUpdateError},{error:orderUpdateError}]=await Promise.all([
    db.from('payments').update({status:'success',verified_at:verifiedAt}).eq('reference',reference),
    db.from('orders').update({status:'paid',paid_at:verifiedAt}).eq('id',order.id).neq('status','paid'),
   ]);
   if(paymentUpdateError||orderUpdateError)return 'unconfirmed';
   return 'success';
  }

  const confirmedFailure=verification.data?.status==='failed'||verification.data?.status==='abandoned'||cancelled;
  if(confirmedFailure){
   await Promise.all([
    db.from('payments').update({status:'failed',verified_at:verifiedAt}).eq('reference',reference),
    db.from('orders').update({status:'failed'}).eq('id',order.id).neq('status','paid'),
   ]);
   return 'failed';
  }

  return 'unconfirmed';
 }catch{return 'unconfirmed'}
}

export default async function ReturnPage({searchParams}:{searchParams:{reference?:string;cancelled?:string}}){
 const reference=searchParams.reference?.trim();
 if(!reference||reference.length>100)redirect('/payment/failed?reason=missing');
 const result=await verifyAndRecord(reference,searchParams.cancelled==='1');
 if(result==='success')redirect(`/payment/success?reference=${encodeURIComponent(reference)}`);
 if(result==='failed')redirect('/payment/failed?reason=failed');
 redirect('/payment/failed?reason=unconfirmed');
}
