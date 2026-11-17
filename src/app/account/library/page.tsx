import Link from 'next/link';
import {redirect} from 'next/navigation';
import {supabaseServer} from '@/lib/supabase/server';
import {Download,ArrowUpRight} from 'lucide-react';
import './library.css';
import {formatNaira,isCatalogProductCategoryName} from '@/lib/products';

export default async function Library(){
 let client;try{client=await supabaseServer()}catch{redirect('/account')}
 const {data:{user}}=await client.auth.getUser();if(!user)redirect('/account');
 const {data:orders}=await client.from('orders').select('id,status,total_amount,currency,created_at').eq('user_id',user.id).order('created_at',{ascending:false});
 const {data:items}=await client.from('order_items').select('id,products(id,name,category,cover_image_url),orders!inner(status,user_id)').eq('orders.user_id',user.id).eq('orders.status','paid');
 const purchases=(items||[]).filter((item:any)=>item.products&&isCatalogProductCategoryName(item.products.category));
 return <main className="container library-page"><span className="eyebrow">Your StephGifts account</span><h1>Good things,<br/><em>kept close.</em></h1><p>Your purchased pieces live here, ready whenever you are.</p><div className="library-nav"><Link href="/account/wishlist">Your wishlist ↗</Link><Link href="/account">Account settings ↗</Link></div><div className="library-grid">{purchases.map((item:any)=><article key={item.id}><span className="eyebrow">{item.products?.category||'Digital piece'}</span><h2>{item.products?.name}</h2><a href={`/api/download/${item.products?.id}`}><Download size={15}/> Download your piece</a></article>)}</div><section className="order-history"><span className="eyebrow">Your history</span><h2>Things you’ve picked up.</h2>{orders?.length?orders.map((order:any)=><div className="history-row" key={order.id}><span>{new Date(order.created_at).toLocaleDateString()}</span><span className={`order-status ${order.status}`}>{order.status}</span><b>{order.currency} {formatNaira(Number(order.total_amount))}</b><span className="history-ref">{order.id.slice(0,8)}</span></div>):<p className="history-empty">Your order history is waiting for its first good thing.</p>}</section>{!purchases.length&&<div className="library-empty">Nothing in your library just yet. <Link href="/shop">Find your first good thing <ArrowUpRight size={14}/></Link></div>}</main>
}
