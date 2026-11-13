'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {useParams} from 'next/navigation';
import {ArrowLeft,ArrowUpRight,Smartphone,Gift,CreditCard,Plane} from 'lucide-react';
import {categoryFromSlug,products,type Product} from '@/lib/products';
import {ProductCard} from '@/components/product-card';
import './category.css';
const categoryIcons={esim:Smartphone,gifts:Gift,'online-banking':CreditCard,'flight-tickets':Plane};
export default function CategoryPage(){
 const {slug}=useParams<{slug:string}>();
 const category=categoryFromSlug(slug);
 const [catalog,setCatalog]=useState(products);
 const [loaded,setLoaded]=useState(false);
 useEffect(()=>{let active=true;fetch('/api/products').then(r=>r.ok?r.json():null).then(data=>{if(active&&data?.products)setCatalog(data.products as Product[])}).catch(()=>{}).finally(()=>{if(active)setLoaded(true)});return()=>{active=false}},[]);
 const listings=useMemo(()=>catalog.filter(product=>product.category===category?.name),[catalog,category]);
 if(!category)return <main className="container category-page"><Link className="back-link" href="/shop"><ArrowLeft size={14}/> Back to shop</Link><h1>Category not found</h1><p>Choose one of Steph Hub’s product categories.</p><Link className="button dark" href="/shop">Browse all products</Link></main>;
 const Icon=categoryIcons[category.slug as keyof typeof categoryIcons];
 return <main className="container category-page"><Link className="back-link" href="/shop"><ArrowLeft size={14}/> All products</Link><header className="category-page-heading"><span className={`category-page-icon category-page-icon-${category.slug}`}><Icon size={28}/></span><span className="eyebrow">Steph Hub · Product category</span><h1>{category.name}</h1><p>{category.description}</p></header><div className="category-listing-bar"><span>{loaded?'':'Loading · '}{listings.length} product{listings.length===1?'':'s'}</span><Link href="/shop">View all products <ArrowUpRight size={14}/></Link></div>{listings.length?<div className="product-grid category-product-grid">{listings.map((product,index)=><ProductCard key={product.id} product={product} index={index}/>)}</div>:<div className="category-empty"><h2>Products coming soon</h2><p>Message Steph Hub to ask about this category or check back soon.</p><Link href="/shop">Browse all products</Link></div>}</main>;
}
