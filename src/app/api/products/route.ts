import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {categoryFromSlug,products as fallbackProducts,legacyPlaceholderProductIds,productImageFallback} from '@/lib/products';
function shape(product:any){return {...product,price:Number(product.price_ngn),image:product.cover_image_url||productImageFallback,tone:'#d7d3c8',rating:'—',featured:true,available:product.is_active,createdAt:product.created_at,updatedAt:product.updated_at};}
export async function GET(request:Request){
 const categorySlug=new URL(request.url).searchParams.get('categorySlug');
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key){const category=categorySlug?categoryFromSlug(categorySlug):undefined;if(categorySlug&&!category)return NextResponse.json({error:'Category not found.'},{status:404});return NextResponse.json({products:fallbackProducts.filter(product=>!category||product.category===category.name)});}
 const db=createClient(url,key,{auth:{persistSession:false}});
 let categoryName:string|undefined;
 if(categorySlug){const {data:category}=await db.from('categories').select('name').eq('slug',categorySlug).eq('is_active',true).maybeSingle();if(!category)return NextResponse.json({error:'Category not found.'},{status:404});categoryName=category.name;}
 let query=db.from('products').select('id,name,category,description,price_ngn,cover_image_url,is_active,created_at,updated_at').eq('is_active',true).order('created_at',{ascending:false});
 if(categoryName)query=query.eq('category',categoryName);
 const {data,error}=await query;
 if(error)return NextResponse.json({error:'Catalog unavailable.'},{status:503});
 return NextResponse.json({products:(data||[]).filter(product=>!legacyPlaceholderProductIds.has(product.id)).map(shape)});
}
