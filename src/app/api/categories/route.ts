import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {storeCategories,isVisibleCategory} from '@/lib/products';
export const dynamic='force-dynamic';
export async function GET(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({categories:storeCategories.map((category,index)=>({...category,display_order:index+1,is_active:true}))});
 const db=createClient(url,key,{auth:{persistSession:false}});
 const {data,error}=await db.from('categories').select('id,name,slug,description,display_order,is_active').eq('is_active',true).order('display_order').order('name');
 if(error)return NextResponse.json({error:'Categories unavailable.'},{status:503});
 return NextResponse.json({categories:(data||[]).filter(isVisibleCategory)});
}
