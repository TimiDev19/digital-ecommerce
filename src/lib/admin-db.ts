import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {hasAdminSession} from '@/lib/admin-auth';

export async function adminDatabase(){
 if(!hasAdminSession())return {response:NextResponse.json({error:'Admin sign in required.'},{status:401})};
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return {response:NextResponse.json({error:'Server database credentials are missing.'},{status:503})};
 return {db:createClient(url,key,{auth:{persistSession:false}})};
}
