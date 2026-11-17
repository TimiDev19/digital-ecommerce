'use client';
import {useDispatch,useSelector} from 'react-redux';
import {addItem,toggleWishlist} from '@/lib/cart';
import type {Product} from '@/lib/products';
import {ArrowUpRight,Heart,MessageCircle,Plus,Check} from 'lucide-react';
import {motion} from 'framer-motion';
import Link from 'next/link';
import type {RootState} from '@/lib/store-types';
import {whatsappUrl,formatNaira,tmobileRefillStartingPriceNgn} from '@/lib/products';

export function ProductCard({product,index=0}:{product:Product;index?:number}){
 const dispatch=useDispatch();
 const saved=useSelector((s:RootState)=>s.cart.wishlist.includes(product.id));
 const inBag=useSelector((s:RootState)=>s.cart.items.some(item=>item.product.id===product.id));
 return <motion.article className="product-card" initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.16}} transition={{duration:.35,delay:(index%4)*.05}}>
  <div className="product-art service-art">
   <Link href={`/product/${product.id}`} className="art-main-link" aria-label={`View ${product.name}`}>
    <img className="art-cover-image" src={product.image} alt={product.name}/>
    <span className="art-image-shade" aria-hidden="true"/>
    <span className="art-label">{product.category}</span>
    {product.label&&<span className="pill">{product.label}</span>}
    <span className="art-arrow"><ArrowUpRight size={16}/></span>
   </Link>
   <button className={`wishlist-button ${saved?'saved':''}`} onClick={()=>dispatch(toggleWishlist(product.id))} aria-label={saved?'Remove from wishlist':'Add to wishlist'} aria-pressed={saved}><Heart size={16} fill={saved?'currentColor':'none'}/></button>
  </div>
  <div className="product-info"><div><Link href={`/product/${product.id}`} className="product-name">{product.name}</Link><p className="product-description-preview">{product.description}</p></div><div className="product-buy"><span>{product.allows_tmobile_refill?`From ₦${formatNaira(tmobileRefillStartingPriceNgn)}`:`₦${formatNaira(product.price)}`}</span><button className={inBag?'is-in-bag':''} onClick={()=>dispatch(addItem(product))} aria-label={inBag?`${product.name} is in your cart`:`Add ${product.name} to your cart`} title={inBag?'Already in your cart':'Add to cart'}>{inBag?<Check size={16}/>:<Plus size={16}/>}</button><a href={whatsappUrl(product.name)} target="_blank" rel="noreferrer" aria-label={`Ask StephGifts about ${product.name}`}><MessageCircle size={15}/></a></div></div>
  <div className="bag-feedback" aria-live="polite">{inBag?<button type="button" onClick={()=>{window.location.href='/cart'}}>In your cart · View cart</button>:null}</div>
 </motion.article>
}
