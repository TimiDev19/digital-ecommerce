import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import {supabaseServer} from '@/lib/supabase/server';
import {legacyPlaceholderProductIds,isCatalogProductCategoryName,tmobileRefillAmountsUsd,tmobileRefillNgn} from '@/lib/products';
import {countryCallingCodes} from '@/lib/country-calling-codes';

const deliveryDetailsSchema=z.object({receiverName:z.string().trim().min(1,'Receiver name is required.').max(120),sender:z.string().trim().min(1,'Sender is required.').max(120),senderWhatsappNumber:z.string().trim().min(7,'Enter your WhatsApp number.').max(32,'Your WhatsApp number is too long.'),receiverWhatsappNumber:z.string().trim().max(32,'The receiver’s number is too long.').optional().default(''),country:z.string().trim().min(1,'Choose a delivery country.').max(120),address:z.string().trim().min(1,'Address is required.').max(500),apartment:z.string().trim().max(120).optional().default(''),city:z.string().trim().min(1,'City is required.').max(120),state:z.string().trim().min(1,'State is required.').max(120),zipCode:z.string().trim().min(1,'ZIP code is required.').max(32),note:z.string().max(250).optional().default('')});
const validDeliveryCountries=new Set(countryCallingCodes.map(item=>item.country));
const clothingSizes=['S','M','L','XL','XXL','XXXL'];
const ringSizes=['4.5','5','5.5','6','6.5','7','7.5','8','8.5','9','9.5'];
const allowedMime=new Set(['image/jpeg','image/png','image/webp','image/avif']);
function errorMessage(error:unknown){if(error&&typeof error==='object'&&'message'in error&&typeof error.message==='string')return error.message;if(error instanceof Error)return error.message;return 'Checkout could not start.'}
function parseJson<T>(value:FormDataEntryValue|null){if(typeof value!=='string')return null;try{return JSON.parse(value) as T}catch{return null}}
export async function POST(req:Request){
 try{
  if(!process.env.PAYSTACK_SECRET_KEY)throw new Error('Payments are not configured yet.');
  const auth=await supabaseServer();const {data:{user}}=await auth.auth.getUser();if(!user)return NextResponse.json({error:'Sign in before checkout.'},{status:401});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error('Server database credentials are not configured.');
  const db=createClient(url,key,{auth:{persistSession:false}});const form=await req.formData();
  const itemsSchema=z.array(z.object({id:z.string().min(1),quantity:z.number().int().min(1).max(99),options:z.object({clothingSize:z.string().optional(),ringSize:z.string().optional(),customizationType:z.enum(['text','image']).optional(),customizationText:z.string().optional(),firstName:z.string().optional(),lastName:z.string().optional(),imei:z.string().optional(),eid:z.string().optional(),zipCode:z.string().optional(),email:z.string().optional(),mobileNumber:z.string().optional(),tmobileRefillUsd:z.string().optional()}).optional()})).min(1).max(50);
  const parsedItems=itemsSchema.safeParse(parseJson(form.get('items')));if(!parsedItems.success)return NextResponse.json({error:parsedItems.error.issues[0]?.message||'Your cart is invalid.'},{status:400});
  const parsedDelivery= form.has('deliveryDetails')?deliveryDetailsSchema.safeParse(parseJson(form.get('deliveryDetails'))):undefined;
  if(parsedDelivery&&!parsedDelivery.success)return NextResponse.json({error:parsedDelivery.error.issues[0]?.message||'Delivery details are invalid.'},{status:400});
  const quantities=new Map<string,number>();const optionsById=new Map<string,Record<string,string>>();
  for(const item of parsedItems.data){const quantity=(quantities.get(item.id)||0)+item.quantity;if(quantity>99)return NextResponse.json({error:'A product quantity cannot exceed 99.'},{status:400});quantities.set(item.id,quantity);optionsById.set(item.id,(item.options||{}) as Record<string,string>)}
  const ids=[...quantities.keys()];if(ids.some(id=>legacyPlaceholderProductIds.has(id)))return NextResponse.json({error:'One or more products are unavailable.'},{status:400});
  const {data:products,error}=await db.from('products').select('id,name,price_ngn,is_active,category,requires_clothing_size,requires_ring_size,allows_customization,allows_tmobile_refill').in('id',ids).eq('is_active',true);if(error)throw error;if(!products||products.length!==ids.length)return NextResponse.json({error:'One or more products are unavailable.'},{status:400});
  if(products.some(product=>!isCatalogProductCategoryName(product.category)))return NextResponse.json({error:'One or more products are no longer available.'},{status:400});const containsGift=products.some(product=>product.category==='Gifts');if(containsGift&&!parsedDelivery?.success)return NextResponse.json({error:'Complete all required delivery details before payment.'},{status:400});if(containsGift&&parsedDelivery?.success&&!validDeliveryCountries.has(parsedDelivery.data.country))return NextResponse.json({error:'Choose a valid delivery country.'},{status:400});
  for(const product of products){const options=optionsById.get(product.id)||{};
   if(product.allows_tmobile_refill&&!tmobileRefillAmountsUsd.some(amount=>amount===Number(options.tmobileRefillUsd)))return NextResponse.json({error:`Choose a valid refill amount for ${product.name}.`},{status:400});if(!product.allows_tmobile_refill&&options.tmobileRefillUsd)return NextResponse.json({error:`A T Mobile refill amount is not required for ${product.name}.`},{status:400});
   if(product.allows_tmobile_refill){if(!options.mobileNumber?.trim()||options.mobileNumber.trim().length<7||options.mobileNumber.trim().length>32)return NextResponse.json({error:`Enter a valid mobile number for ${product.name}.`},{status:400});if(options.firstName||options.lastName||options.imei||options.eid||options.zipCode||options.email||options.clothingSize||options.ringSize||options.customizationType||options.customizationText)return NextResponse.json({error:`Only a mobile number is needed for ${product.name}.`},{status:400})}
   else if(product.category==='eSIM'){for(const [key,label] of [['firstName','first name'],['lastName','last name'],['imei','IMEI'],['eid','EID'],['zipCode','ZIP code'],['email','email']] as const){if(!options[key]?.trim())return NextResponse.json({error:`Enter the ${label} for ${product.name}.`},{status:400})}if(!z.string().email().safeParse(options.email).success)return NextResponse.json({error:`Enter a valid email address for ${product.name}.`},{status:400});if(options.mobileNumber)return NextResponse.json({error:`A mobile number is not required for ${product.name}.`},{status:400})}
   else if(options.firstName||options.lastName||options.imei||options.eid||options.zipCode||options.email||options.mobileNumber)return NextResponse.json({error:`eSIM details are not required for ${product.name}.`},{status:400});
   if(!product.allows_tmobile_refill){
    if(product.requires_clothing_size&&!clothingSizes.includes(options.clothingSize||''))return NextResponse.json({error:`Choose a clothing size for ${product.name}.`},{status:400});
    if(product.requires_ring_size&&!ringSizes.includes(options.ringSize||''))return NextResponse.json({error:`Choose a ring size for ${product.name}.`},{status:400});
    if(product.allows_customization){if(!['text','image'].includes(options.customizationType||''))return NextResponse.json({error:`Choose text or image customization for ${product.name}.`},{status:400});if(options.customizationType==='text'&&!options.customizationText?.trim())return NextResponse.json({error:`Enter the custom text for ${product.name}.`},{status:400});if(options.customizationType==='image'){const file=form.get(`customizationImage:${product.id}`);if(!(file instanceof File)||file.size===0||file.size>5*1024*1024||!allowedMime.has(file.type))return NextResponse.json({error:`Upload a valid image (up to 5 MB) for ${product.name}.`},{status:400})}}
    else if(options.customizationType||options.customizationText)return NextResponse.json({error:`Customization is not enabled for ${product.name}.`},{status:400});
    if(!product.requires_clothing_size&&options.clothingSize)return NextResponse.json({error:`Clothing size is not required for ${product.name}.`},{status:400});
    if(!product.requires_ring_size&&options.ringSize)return NextResponse.json({error:`Ring size is not required for ${product.name}.`},{status:400});
   }
  }
  const amount=products.reduce((sum,product)=>{const options=optionsById.get(product.id)||{};const unitAmount=product.allows_tmobile_refill?tmobileRefillNgn(Number(options.tmobileRefillUsd)):Number(product.price_ngn);return sum+unitAmount*(quantities.get(product.id)||0)},0);if(!Number.isSafeInteger(amount)||amount<=0)throw new Error('Invalid order amount.');const paystackAmount=amount*100;if(!Number.isSafeInteger(paystackAmount))throw new Error('Order amount is too large.');
  const {data:order,error:orderError}=await db.from('orders').insert({user_id:user.id,status:'pending',currency:'NGN',total_amount:amount,delivery_details:containsGift&&parsedDelivery?.success?parsedDelivery.data:null}).select('id').single();if(orderError)throw orderError;
  const uploadedPaths:string[]=[];
  const orderItems=[];
  for(const product of products){const opts=optionsById.get(product.id)||{};const saved:Record<string,string>={};if(opts.clothingSize)saved.clothingSize=opts.clothingSize;if(opts.ringSize)saved.ringSize=opts.ringSize;if(product.allows_tmobile_refill&&opts.mobileNumber)saved.mobileNumber=opts.mobileNumber.trim();else if(product.category==='eSIM'){for(const key of ['firstName','lastName','imei','eid','zipCode','email'])if(opts[key])saved[key]=opts[key]}if(product.allows_tmobile_refill&&opts.tmobileRefillUsd)saved.tmobileRefillUsd=opts.tmobileRefillUsd;
   if(opts.customizationType==='text')saved.customizationText=opts.customizationText!.trim();
   if(opts.customizationType==='image'){const file=form.get(`customizationImage:${product.id}`) as File;const extension=file.type==='image/jpeg'?'jpg':file.type.split('/')[1];const path=`${user.id}/${order.id}/${product.id}/${randomUUID()}.${extension}`;const {error:uploadError}=await db.storage.from('customization-files').upload(path,Buffer.from(await file.arrayBuffer()),{contentType:file.type,upsert:false});if(uploadError)throw uploadError;uploadedPaths.push(path);saved.customizationImagePath=path}
   orderItems.push({order_id:order.id,product_id:product.id,unit_amount:product.allows_tmobile_refill?tmobileRefillNgn(Number(opts.tmobileRefillUsd)):Number(product.price_ngn),quantity:quantities.get(product.id)||1,fulfillment_options:saved});
  }
  const {error:itemError}=await db.from('order_items').insert(orderItems);if(itemError){if(uploadedPaths.length)await db.storage.from('customization-files').remove(uploadedPaths);throw itemError}
  const response=await fetch('https://api.paystack.co/transaction/initialize',{method:'POST',headers:{Authorization:`Bearer ${process.env.PAYSTACK_SECRET_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({email:user.email,amount:paystackAmount,currency:'NGN',reference:order.id,callback_url:`${process.env.NEXT_PUBLIC_SITE_URL||new URL(req.url).origin}/checkout/return`,metadata:{order_id:order.id,user_id:user.id}})});
  const result=await response.json();if(!result.status||!result.data?.authorization_url)throw new Error(result.message||'Paystack could not initialize payment.');
  const {error:paymentError}=await db.from('payments').insert({order_id:order.id,provider:'paystack',reference:result.data.reference,amount,currency:'NGN',status:'initialized'});if(paymentError)throw paymentError;
  return NextResponse.json({authorizationUrl:result.data.authorization_url});
 }catch(error){return NextResponse.json({error:errorMessage(error)},{status:500})}
}
