import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {supabaseServer} from '@/lib/supabase/server';
import {legacyPlaceholderProductIds} from '@/lib/products';

function errorMessage(error:unknown){
 if(error&&typeof error==='object'&&'message'in error&&typeof error.message==='string')return error.message;
 if(error instanceof Error)return error.message;
 return 'Checkout could not start.';
}

export async function POST(req:Request){
 try{
  if(!process.env.PAYSTACK_SECRET_KEY)throw new Error('Payments are not configured yet.');
  const auth=await supabaseServer();
  const {data:{user}}=await auth.auth.getUser();
  if(!user)return NextResponse.json({error:'Sign in before checkout.'},{status:401});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)throw new Error('Server database credentials are not configured.');
  const db=createClient(url,key,{auth:{persistSession:false}});
  const payload=await req.json() as {productIds:string[]};
  const productIds=payload.productIds;
  if(!Array.isArray(productIds)||!productIds.length||productIds.length>50||productIds.some(id=>typeof id!=='string'))return NextResponse.json({error:'Your cart is empty or invalid.'},{status:400});
  const quantities=new Map<string,number>();
  for(const id of productIds){const quantity=(quantities.get(id)||0)+1;if(quantity>99)return NextResponse.json({error:'A product quantity cannot exceed 99.'},{status:400});quantities.set(id,quantity)}
  const ids=[...quantities.keys()];
  if(ids.some(id=>legacyPlaceholderProductIds.has(id)))return NextResponse.json({error:'One or more products are unavailable.'},{status:400});
  const {data:products,error}=await db.from('products').select('id,price_ngn,is_active').in('id',ids).eq('is_active',true);
  if(error)throw error;
  if(!products||products.length!==ids.length)return NextResponse.json({error:'One or more products are unavailable.'},{status:400});
  const amount=products.reduce((sum,product)=>sum+Number(product.price_ngn)*(quantities.get(product.id)||0),0);
  if(!Number.isSafeInteger(amount)||amount<=0)throw new Error('Invalid order amount.');
  const paystackAmount=amount*100;
  if(!Number.isSafeInteger(paystackAmount))throw new Error('Order amount is too large.');
  const {data:order,error:orderError}=await db.from('orders').insert({user_id:user.id,status:'pending',currency:'NGN',total_amount:amount}).select('id').single();
  if(orderError)throw orderError;
  const {error:itemError}=await db.from('order_items').insert(products.map(product=>({order_id:order.id,product_id:product.id,unit_amount:Number(product.price_ngn),quantity:quantities.get(product.id)||1})));
  if(itemError)throw itemError;
  const response=await fetch('https://api.paystack.co/transaction/initialize',{method:'POST',headers:{Authorization:`Bearer ${process.env.PAYSTACK_SECRET_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({email:user.email,amount:paystackAmount,currency:'NGN',reference:order.id,callback_url:`${process.env.NEXT_PUBLIC_SITE_URL||new URL(req.url).origin}/checkout/return`,metadata:{order_id:order.id,user_id:user.id}})});
  const result=await response.json();
  if(!result.status||!result.data?.authorization_url)throw new Error(result.message||'Paystack could not initialize payment.');
  const {error:paymentError}=await db.from('payments').insert({order_id:order.id,provider:'paystack',reference:result.data.reference,amount,currency:'NGN',status:'initialized'});
  if(paymentError)throw paymentError;
  return NextResponse.json({authorizationUrl:result.data.authorization_url});
 }catch(error){return NextResponse.json({error:errorMessage(error)},{status:500})}
}
