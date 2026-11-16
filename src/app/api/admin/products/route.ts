import {NextResponse} from 'next/server';
import {z} from 'zod';
import {adminDatabase} from '@/lib/admin-db';
import {isCatalogProductCategoryName} from '@/lib/products';

const fields={
 name:z.string().trim().min(2).max(120),
 category:z.string().trim().min(2).max(80),
 description:z.string().max(2000).optional().default(''),
 price_ngn:z.number().int().positive().max(100000000),
 cover_image_url:z.string().url().optional().or(z.literal('')),
 requires_clothing_size:z.boolean().optional().default(false),
 requires_ring_size:z.boolean().optional().default(false),
 allows_customization:z.boolean().optional().default(false),
 allows_tmobile_refill:z.boolean().optional().default(false),
};
const createSchema=z.object(fields);
const updateSchema=createSchema.partial().extend({id:z.string().min(1).max(100),is_active:z.boolean().optional()}).refine(input=>Object.keys(input).some(key=>key!=='id'),{message:'Include at least one product field to update.'});
function errorMessage(error:unknown,fallback:string){if(error&&typeof error==='object'&&'message'in error&&typeof error.message==='string')return error.message;if(error instanceof Error)return error.message;return fallback;}
async function categoryIsActive(db:any,name:string){if(!isCatalogProductCategoryName(name))return false;const {data,error}=await db.from('categories').select('id').eq('name',name).eq('is_active',true).maybeSingle();return !error&&!!data;}

export async function POST(request:Request){const context=await adminDatabase();if('response'in context)return context.response;try{const input=createSchema.parse(await request.json());if(!await categoryIsActive(context.db,input.category))return NextResponse.json({error:'Choose an active category. If this category should be available, confirm the categories migration has been applied.'},{status:400});const {data,error}=await context.db.from('products').insert({...input,is_featured:true,is_active:true}).select().single();if(error)throw error;return NextResponse.json({product:data},{status:201});}catch(error){return NextResponse.json({error:errorMessage(error,'Invalid product.')},{status:400});}}

export async function PATCH(request:Request){const context=await adminDatabase();if('response'in context)return context.response;try{const input=updateSchema.parse(await request.json());const {id,...values}=input;if(values.category&&!await categoryIsActive(context.db,values.category))return NextResponse.json({error:'Choose an active category. If this category should be available, confirm the categories migration has been applied.'},{status:400});const {data,error}=await context.db.from('products').update({...values,is_featured:true,updated_at:new Date().toISOString()}).eq('id',id).select().single();if(error)throw error;return NextResponse.json({product:data});}catch(error){return NextResponse.json({error:errorMessage(error,'Invalid product.')},{status:400});}}

export async function DELETE(request:Request){const context=await adminDatabase();if('response'in context)return context.response;try{const {id}=z.object({id:z.string().min(1).max(100)}).parse(await request.json());const {data:product,error:productError}=await context.db.from('products').select('id,storage_path').eq('id',id).single();if(productError||!product)return NextResponse.json({error:'Product not found.'},{status:404});const [orders,downloads]=await Promise.all([context.db.from('order_items').select('id',{count:'exact',head:true}).eq('product_id',id),context.db.from('downloads').select('id',{count:'exact',head:true}).eq('product_id',id)]);if(orders.error)throw orders.error;if(downloads.error)throw downloads.error;if((orders.count||0)>0||(downloads.count||0)>0)return NextResponse.json({error:'This product has order or download history. Archive it instead of deleting it.'},{status:409});const {error}=await context.db.from('products').delete().eq('id',id);if(error)throw error;if(product.storage_path){const {error:storageError}=await context.db.storage.from('digital-products').remove([product.storage_path]);if(storageError)return NextResponse.json({ok:true,warning:'Product deleted, but its private file could not be removed.'});}return NextResponse.json({ok:true});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Could not delete product.'},{status:400});}}
