import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {products as fallbackProducts,legacyPlaceholderProductIds,productImageFallback,isVisibleCategory,isCatalogProductCategoryName} from '@/lib/products';
function shape(product:any){const description=product.allows_tmobile_refill?String(product.description||'').replace(/\s*Converted at ₦1,400 per \$1\.?/i,''):product.description;return {...product,description,price:Number(product.price_ngn),image:product.cover_image_url||productImageFallback,tone:'#d7d3c8',rating:'—',featured:true,available:product.is_active,createdAt:product.created_at,updatedAt:product.updated_at};}
export async function GET(request:Request){
 const categorySlug=new URL(request.url).searchParams.get('categorySlug');
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key){if(categorySlug)return NextResponse.json({error:'Category not found.'},{status:404});return NextResponse.json({products:fallbackProducts.filter(product=>isCatalogProductCategoryName(product.category))});}
 const db=createClient(url,key,{auth:{persistSession:false}});
 const {data:categoryRows,error:categoryError}=await db.from('categories').select('name,slug').eq('is_active',true);
 if(categoryError)return NextResponse.json({error:'Categories unavailable.'},{status:503});
 const visibleCategories=(categoryRows||[]).filter(isVisibleCategory);const visibleNames=new Map(visibleCategories.map(category=>[category.name.trim().toLocaleLowerCase(),category.name]));
 let categoryName:string|undefined;
 if(categorySlug){const category=visibleCategories.find(item=>item.slug===categorySlug);if(!category)return NextResponse.json({error:'Category not found.'},{status:404});categoryName=category.name;}
 const loadProducts=(includeSortOrder:boolean):any=>{
  let query:any=db.from('products').select(`id,name,category,description,price_ngn,cover_image_url,is_active,requires_clothing_size,requires_shoe_size,requires_ring_size,allows_customization,allows_tmobile_refill,${includeSortOrder?'sort_order,':''}created_at,updated_at`).eq('is_active',true).order('created_at',{ascending:false});
  if(categoryName)query=query.ilike('category',categoryName);
  return query;
 };
 let {data,error}:any=await loadProducts(true);
 if(error&&(error.code==='42703'||error.code==='PGRST204'||error.message?.includes('sort_order'))){const fallback=await loadProducts(false);data=fallback.data as typeof data;error=fallback.error;}
 if(error)return NextResponse.json({error:'Catalog unavailable.'},{status:503});
 const visible=(data||[]).filter((product:any)=>!legacyPlaceholderProductIds.has(product.id)&&isCatalogProductCategoryName(product.category)&&visibleNames.has(String(product.category).trim().toLocaleLowerCase())).map((product:any)=>({...product,category:visibleNames.get(String(product.category).trim().toLocaleLowerCase())||product.category,sort_order:product.sort_order??0}));
 const orderedGifts=visible.filter((product:any)=>product.category.toLowerCase()==='gifts').sort((a:any,b:any)=>a.sort_order-b.sort_order);
 let giftIndex=0;
 const ordered=visible.map((product:any)=>product.category.toLowerCase()==='gifts'?orderedGifts[giftIndex++]:product);
 return NextResponse.json({products:ordered.map((product:any)=>shape(product))});
}
