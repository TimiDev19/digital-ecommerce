import {NextResponse} from 'next/server';
import {z} from 'zod';
import {adminDatabase} from '@/lib/admin-db';

const statusSchema=z.object({id:z.string().uuid(),status:z.enum(['requested','contacted','quoted','awaiting_payment','paid','booked','cancelled'])});
export async function GET(){
 const context=await adminDatabase();if('response'in context)return context.response;
 const {data,error}=await context.db.from('flight_ticket_requests').select('id,reference,customer_email,first_name,last_name,date_of_birth,flight_class,traveling_from,traveling_to,gender,flight_date,trip_type,requested_price_ngn,status,order_id,created_at,updated_at').order('created_at',{ascending:false}).limit(100);
 if(error)return NextResponse.json({error:error.message},{status:503});
 return NextResponse.json({requests:data||[]});
}
export async function PATCH(request:Request){
 const context=await adminDatabase();if('response'in context)return context.response;
 try{const input=statusSchema.parse(await request.json());const {data,error}=await context.db.from('flight_ticket_requests').update({status:input.status,updated_at:new Date().toISOString()}).eq('id',input.id).select('id,status').single();if(error)throw error;return NextResponse.json({request:data})}
 catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Could not update the flight request.'},{status:400})}
}
