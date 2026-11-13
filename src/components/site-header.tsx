'use client';
import Link from 'next/link';
import {useState} from 'react';
import {useDispatch,useSelector} from 'react-redux';
import {Menu,MessageCircle,X,ArrowUpRight,ShoppingBag} from 'lucide-react';
import {openCart} from '@/lib/cart';
import {whatsappUrl} from '@/lib/products';
import type {RootState} from '@/lib/store-types';
import {CartDrawer} from '@/components/cart-drawer';
export function SiteHeader(){
 const [open,setOpen]=useState(false);
 const dispatch=useDispatch();
 const count=useSelector((state:RootState)=>state.cart.items.reduce((total,item)=>total+item.quantity,0));
 function showCart(){setOpen(false);dispatch(openCart())}
 return <><header className="site-header"><div className="container nav-row"><Link href="/" className="wordmark"><span className="mark">S</span><span>Steph Hub<span className="word-dot">.</span></span></Link><nav className="desktop-nav"><Link href="/">Home</Link><Link href="/shop">Shop</Link><a href="/#categories">What we offer</a><a href="/#about">About Steph Hub</a><a href="/#newsletter">Contact</a></nav><div className="nav-actions"><Link href="/account" className="account-link">Account <ArrowUpRight size={13} strokeWidth={1.4}/></Link><button type="button" className="bag-link" onClick={showCart} aria-label={`Open shopping bag, ${count} items`}><span className="bag-icon-wrap"><ShoppingBag size={19} strokeWidth={1.45}/><b>{count}</b></span></button><a className="contact-nav" href={whatsappUrl()} target="_blank" rel="noreferrer"><MessageCircle size={16} strokeWidth={1.45}/><span>Contact Support</span></a><button className="mobile-menu" onClick={()=>setOpen(!open)} aria-label="Toggle navigation">{open?<X strokeWidth={1.4}/>:<Menu strokeWidth={1.4}/>}</button></div></div></header>{open&&<div className="mobile-nav"><Link onClick={()=>setOpen(false)} href="/">Home</Link><Link onClick={()=>setOpen(false)} href="/shop">Shop</Link><a onClick={()=>setOpen(false)} href="/#categories">What we offer</a><a onClick={()=>setOpen(false)} href="/#about">About Steph Hub</a><a onClick={()=>setOpen(false)} href="/#newsletter">Contact</a><Link onClick={()=>setOpen(false)} href="/account">Account</Link><button onClick={showCart}>Your bag ({count})</button><a href={whatsappUrl()} target="_blank" rel="noreferrer">Contact Support</a></div>}<CartDrawer/></>
}
