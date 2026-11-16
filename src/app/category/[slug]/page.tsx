'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {useParams} from 'next/navigation';
import {ArrowLeft,ArrowUpRight,Search,Smartphone,Gift,Plane} from 'lucide-react';
import {categoryFromSlug,products,type Product,type ShopCategory,isVisibleCategory,isVisibleCategoryName} from '@/lib/products';
import {ProductCard} from '@/components/product-card';
import {ProductGridSkeleton} from '@/components/loading-skeletons';
import './category.css';
const categoryIcons={esim:Smartphone,gifts:Gift,'flight-tickets':Plane};
export default function CategoryPage(){
 const {slug}=useParams<{slug:string}>();
 const [category,setCategory]=useState<ShopCategory|undefined>(()=>categoryFromSlug(slug));
 const [catalog,setCatalog]=useState(products);
 const [query,setQuery]=useState('');
 const [loaded,setLoaded]=useState(false);const [categoryLoaded,setCategoryLoaded]=useState(false);
 useEffect(()=>{let active=true;fetch('/api/categories').then(r=>r.ok?r.json():null).then(data=>{if(active&&data?.categories){const found=(data.categories as ShopCategory[]).find(item=>item.slug===slug&&isVisibleCategory(item));setCategory(found)}}).catch(()=>{}).finally(()=>{if(active)setCategoryLoaded(true)});fetch(`/api/products?categorySlug=${encodeURIComponent(slug)}`).then(r=>r.ok?r.json():null).then(data=>{if(active&&data?.products)setCatalog((data.products as Product[]).filter(product=>isVisibleCategoryName(product.category)))}).catch(()=>{}).finally(()=>{if(active)setLoaded(true)});return()=>{active=false}},[]);
 const listings=useMemo(()=>catalog.filter(product=>product.category===category?.name&&`${product.name} ${product.description} ${product.category}`.toLowerCase().includes(query.trim().toLowerCase())),[catalog,category,query]);
 if(!category&&!categoryLoaded)return <main className="container category-page category-loading" aria-busy="true"><div className="loading-shimmer loading-category-icon"/><div className="loading-shimmer loading-line loading-line-short"/><div className="loading-shimmer loading-category-title"/><div className="loading-shimmer loading-category-description"/></main>;
 if(!category)return <main className="container category-page"><Link className="back-link" href="/shop"><ArrowLeft size={14}/> Back to shop</Link><h1>Category not found</h1><p>Choose one of StephGifts’s product categories.</p><Link className="button dark" href="/shop">Browse all products</Link></main>;
 const Icon=categoryIcons[category.slug as keyof typeof categoryIcons]||Plane;
 return <main className="container category-page"><Link className="back-link" href="/shop"><ArrowLeft size={14}/> All products</Link><header className="category-page-heading"><span className={`category-page-icon category-page-icon-${category.slug}`}><Icon size={28}/></span><span className="eyebrow">StephGifts · Product category</span><h1>{category.name}</h1><p>{category.description}</p></header><div className="category-listing-bar"><span>{loaded?'':'Loading · '}{listings.length} product{listings.length===1?'':'s'}</span><Link href="/shop">View all products <ArrowUpRight size={14}/></Link></div><label className="category-search"><Search size={17}/><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder={`Search ${category.name.toLowerCase()} products`} aria-label={`Search ${category.name} products`}/>{query&&<button type="button" onClick={()=>setQuery('')} aria-label="Clear search">Clear</button>}</label>{!loaded?<ProductGridSkeleton count={6} className="category-product-grid"/>:listings.length?<div className="product-grid category-product-grid">{listings.map((product,index)=><ProductCard key={product.id} product={product} index={index}/>)}</div>:<div className="category-empty"><h2>{query?'No matching products':'Products coming soon'}</h2><p>{query?'Try a different name or clear your search.':`Message StephGifts to ask about this category or check back soon.`}</p>{query?<button type="button" onClick={()=>setQuery('')}>Clear search</button>:<Link href="/shop">Browse all products</Link>}</div>}</main>;
}
