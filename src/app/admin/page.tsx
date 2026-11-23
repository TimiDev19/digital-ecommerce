import Link from 'next/link';
import {redirect} from 'next/navigation';
import {createClient} from '@supabase/supabase-js';
import {Users,Receipt,ArrowUpRight} from 'lucide-react';
import {hasAdminSession} from '@/lib/admin-auth';
import './admin.css';
import {ProductManager} from './product-manager';
import {CategoryManager} from './category-manager';
import {AdminLogout} from './logout-button';
import {loadAllOrders} from './order-data';
import {formatNaira,legacyPlaceholderProductIds,isVisibleCategory,isCatalogProductCategoryName,orderCategories} from '@/lib/products';

export const dynamic='force-dynamic';

async function countAuthCustomers(db:any){let count=0;for(let page=1;;page++){const {data,error}=await db.auth.admin.listUsers({page,perPage:1000});if(error)throw error;const users=data?.users||[];count+=users.length;if(users.length<1000)break;}return count;}

export default async function Admin(){
 if(!hasAdminSession())redirect('/admin/login');
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return <main className="container admin-page"><h1>Admin setup needed</h1><p>Set server database credentials to load analytics.</p></main>;
 const db=createClient(url,key,{auth:{persistSession:false}});
 const [orders,customerCount,products,categories]=await Promise.all([
  loadAllOrders(db),
  countAuthCustomers(db),
  db.from('products').select('id,name,category,price_ngn,is_featured,cover_image_url,is_active,requires_clothing_size,requires_shoe_size,requires_ring_size,allows_customization,allows_tmobile_refill,sort_order').order('created_at',{ascending:false}),
  db.from('categories').select('id,name,slug,description,display_order,is_active').order('display_order').order('name')
 ]);
 const visibleCategories=orderCategories((categories.data||[]).filter(isVisibleCategory));
 const hiddenCategoryNames=new Set((categories.data||[]).filter(category=>!isVisibleCategory(category)||!isCatalogProductCategoryName(category.name)).map(category=>category.name));
 const visibleProducts=(products.data||[]).filter(product=>!legacyPlaceholderProductIds.has(product.id)&&isCatalogProductCategoryName(product.category)&&!hiddenCategoryNames.has(product.category));
 const paid=orders.filter(x=>x.status==='paid');const revenue=paid.reduce((n,x)=>n+x.total_amount,0);
 return <main className="container admin-page"><div className="admin-topline"><span className="eyebrow">StephGifts · back office</span><AdminLogout/></div><h1>Your dashboard.</h1><div className="admin-stats"><div><Receipt/><span>Paid orders</span><b>{paid.length}</b></div><div><span className="naira">₦</span><span>Revenue</span><b>₦{formatNaira(revenue)}</b></div><div><Users/><span>Customers</span><b>{customerCount}</b></div></div><Link className="admin-orders-link" href="/admin/orders"><span><Receipt size={18}/><b>View all order history</b></span><ArrowUpRight size={16}/></Link><CategoryManager key={visibleCategories.map(category=>category.id+category.name).join(':')} initial={visibleCategories.map(category=>({...category,product_count:visibleProducts.filter(product=>product.category===category.name).length})) as any} setupError={categories.error?.message}/><ProductManager key={visibleCategories.map(category=>category.id+category.name).join(':')} categories={visibleCategories.filter(category=>isCatalogProductCategoryName(category.name)) as any} initial={visibleProducts as any}/><p className="admin-note">Catalog edits and archival are protected by the admin session.</p></main>
}
