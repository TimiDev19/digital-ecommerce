import {NextResponse} from 'next/server';
import {createAdminSession,setAdminSession,validAdminCredentials} from '@/lib/admin-auth';

export async function POST(request:Request){if(!process.env.ADMIN_SESSION_SECRET)return NextResponse.json({error:'Admin sign-in is not configured. Set ADMIN_SESSION_SECRET on the server.'},{status:503});try{const {email,password}=await request.json();if(typeof email!=='string'||typeof password!=='string'||!validAdminCredentials(email,password))return NextResponse.json({error:'Email or password is incorrect.'},{status:401});setAdminSession(createAdminSession());return NextResponse.json({ok:true})}catch{return NextResponse.json({error:'Could not sign in.'},{status:400})}}
