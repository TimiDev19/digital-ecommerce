export async function loadAllOrders(db:any){
 const all:any[]=[];const batchSize=1000;
 for(let start=0;;start+=batchSize){const {data,error}=await db.from('orders').select('id,user_id,total_amount,status,fulfillment_status,currency,created_at,delivery_details').order('created_at',{ascending:false}).range(start,start+batchSize-1);if(error)throw error;const page=data||[];all.push(...page);if(page.length<batchSize)break;}
 return all;
}

export async function loadAdminOrderHistory(db:any){
 const orders=await loadAllOrders(db);const orderIds=orders.map(order=>order.id);const itemRows:any[]=[];
 for(let start=0;start<orderIds.length;start+=100){const {data,error}=await db.from('order_items').select('id,order_id,quantity,unit_amount,fulfillment_options,delivery_number,delivery_pin,products(name,category)').in('order_id',orderIds.slice(start,start+100));if(error)throw error;itemRows.push(...(data||[]));}
 const userIds=[...new Set(orders.map(order=>order.user_id))];const profiles=new Map<string,string>();const emails=new Map<string,string>();
 for(let start=0;start<userIds.length;start+=100){const {data}=await db.from('profiles').select('id,display_name').in('id',userIds.slice(start,start+100));for(const profile of data||[])if(profile.display_name)profiles.set(profile.id,profile.display_name);}
 for(let start=0;start<userIds.length;start+=10){const results=await Promise.all(userIds.slice(start,start+10).map(async(id:string)=>{const {data}=await db.auth.admin.getUserById(id);return[id,data.user?.email||''] as const}));for(const[id,email]of results)if(email)emails.set(id,email);}
 await Promise.all(itemRows.map(async(item:any)=>{const path=item.fulfillment_options?.customizationImagePath;if(!path)return;const {data,error}=await db.storage.from('customization-files').createSignedUrl(path,60*10);if(!error&&data?.signedUrl)item.customization_image_url=data.signedUrl;}));
 const itemsByOrder=new Map<string,any[]>();for(const item of itemRows){const list=itemsByOrder.get(item.order_id)||[];list.push(item);itemsByOrder.set(item.order_id,list)}
 return orders.map(order=>({...order,customer_email:emails.get(order.user_id),customer_name:profiles.get(order.user_id),items:itemsByOrder.get(order.id)||[]}));
}
