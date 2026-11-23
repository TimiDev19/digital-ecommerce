import Link from 'next/link';
import {redirect} from 'next/navigation';
import {ArrowLeft,ArrowUpRight,Package} from 'lucide-react';
import {supabaseServer} from '@/lib/supabase/server';
import {formatNaira} from '@/lib/products';
import './orders.css';

function orderDate(value:string){return new Date(value).toLocaleString('en-NG',{dateStyle:'medium',timeStyle:'short'})}
function missingOptionalColumn(error:any){return error?.code==='42703'||error?.code==='PGRST204'||/column .* does not exist|schema cache/i.test(String(error?.message||''))}
function optionSummary(options:Record<string,unknown>|null){
 if(!options)return [];
 const labels:[string,string][]=[['clothingSize','Clothing size'],['shoeSize','Shoe size'],['ringSize','Ring size'],['tmobileRefillUsd','Refill amount'],['mobileNumber','Mobile number'],['customizationText','Custom text']];
 return labels.filter(([key])=>options[key]).map(([key,label])=>`${label}: ${key==='tmobileRefillUsd'?`$${options[key]} USD`:String(options[key])}`);
}

export default async function OrderHistory(){
 let client;try{client=await supabaseServer()}catch{redirect('/account?redirect=%2Faccount%2Forders')}
 const {data:{user}}=await client.auth.getUser();if(!user)redirect('/account?redirect=%2Faccount%2Forders');
 let orderResult:any=await client.from('orders').select('id,status,fulfillment_status,total_amount,currency,created_at,delivery_details').eq('user_id',user.id).order('created_at',{ascending:false});
 if(orderResult.error&&missingOptionalColumn(orderResult.error))orderResult=await client.from('orders').select('id,status,total_amount,currency,created_at,delivery_details').eq('user_id',user.id).order('created_at',{ascending:false});
 const orders=orderResult.data;const orderIds=(orders||[]).map((order:any)=>order.id);
 let itemResult:any=orderIds.length?await client.from('order_items').select('id,order_id,quantity,unit_amount,fulfillment_options,delivery_number,delivery_pin,products(name,category,cover_image_url)').in('order_id',orderIds):{data:[],error:null};
 if(itemResult.error&&missingOptionalColumn(itemResult.error))itemResult=await client.from('order_items').select('id,order_id,quantity,unit_amount,fulfillment_options,products(name,category,cover_image_url)').in('order_id',orderIds);
 const items=itemResult.data;const error=orderResult.error;const itemError=itemResult.error;
 const itemsByOrder=new Map<string,any[]>();for(const item of items||[]){const list=itemsByOrder.get(item.order_id)||[];list.push(item);itemsByOrder.set(item.order_id,list)}
 const loadError=error||itemError;
 return <main className="container orders-page">
  <Link className="orders-back" href="/account/library"><ArrowLeft size={14}/> Back to your account</Link>
  <span className="eyebrow">Your StephGifts account</span><h1>Order history.</h1>
  <p className="orders-intro">Every order you’ve placed, all in one place.</p>
  {loadError?<section className="orders-empty"><Package size={22}/><h2>Order history couldn’t load.</h2><p>Please refresh the page to try again.</p></section>:!orders?.length?<section className="orders-empty"><Package size={22}/><h2>Your first order is waiting.</h2><p>Orders you place will appear here with their status and details.</p><Link href="/shop">Browse the shop <ArrowUpRight size={14}/></Link></section>:<div className="orders-list">{orders.map((order:any)=>{
   const orderItems=itemsByOrder.get(order.id)||[];const delivery=order.delivery_details as Record<string,string>|null;
   return <article className="order-card" key={order.id}>
    <header className="order-card-head"><div><span className="eyebrow">Order placed</span><time dateTime={order.created_at}>{orderDate(order.created_at)}</time></div><div className="customer-order-statuses"><span className={`order-pill ${String(order.fulfillment_status||'pending').toLowerCase()}`}>{order.fulfillment_status||'pending'}</span><span className={`order-payment-pill ${String(order.status).toLowerCase()}`}>Payment: {order.status}</span></div></header>
    <div className="order-card-meta"><span>Reference <b>{order.id}</b></span><strong>{order.currency} {formatNaira(Number(order.total_amount))}</strong></div>
    <div className="order-items">{orderItems.map((item:any)=><div className="order-item" key={item.id}><div className="order-item-image">{item.products?.cover_image_url?<img src={item.products.cover_image_url} alt=""/>:<Package size={17}/>}</div><div className="order-item-copy"><b>{item.products?.name||'Product'}</b><span>{item.products?.category||'StephGifts'} · Qty {item.quantity}</span>{optionSummary(item.fulfillment_options).map(option=><small key={option}>{option}</small>)}{item.delivery_number&&<small className="customer-esim-delivery">eSIM number: {item.delivery_number}</small>}{item.delivery_pin&&<small className="customer-esim-delivery">eSIM PIN: {item.delivery_pin}</small>}</div><span className="order-item-price">₦{formatNaira(Number(item.unit_amount)*Number(item.quantity))}</span></div>)}</div>
    {delivery&&<details className="order-delivery"><summary>Delivery details</summary><div><span>{delivery.receiverName}</span><span>{delivery.address}{delivery.apartment?`, ${delivery.apartment}`:''}</span><span>{[delivery.city,delivery.state,delivery.zipCode,delivery.country].filter(Boolean).join(', ')}</span>{delivery.receiverWhatsappNumber&&<span>Receiver’s number: {delivery.receiverWhatsappNumber}</span>}</div></details>}
   </article>})}</div>}
 </main>
}
