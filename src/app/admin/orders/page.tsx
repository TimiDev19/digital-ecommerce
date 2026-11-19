import Link from 'next/link';
import {redirect} from 'next/navigation';
import {createClient} from '@supabase/supabase-js';
import {ArrowLeft} from 'lucide-react';
import {hasAdminSession} from '@/lib/admin-auth';
import {AdminLogout} from '../logout-button';
import {AdminOrderHistory} from '../order-history';
import {loadAdminOrderHistory} from '../order-data';
import '../admin.css';

export const dynamic='force-dynamic';

export default async function AdminOrders(){
 if(!hasAdminSession())redirect('/admin/login');
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return <main className="container admin-page"><h1>Admin setup needed</h1><p>Set server database credentials to load orders.</p></main>;
 const db=createClient(url,key,{auth:{persistSession:false}});const orders=await loadAdminOrderHistory(db);
 return <main className="container admin-page admin-orders-page"><div className="admin-topline"><Link className="admin-orders-back" href="/admin"><ArrowLeft size={14}/> Dashboard</Link><AdminLogout/></div><h1>All orders.</h1><AdminOrderHistory orders={orders}/></main>
}
