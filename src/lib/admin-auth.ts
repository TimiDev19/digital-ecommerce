import {createHmac, timingSafeEqual} from 'node:crypto';
import {cookies} from 'next/headers';

const COOKIE_NAME='steph-admin-session';
const SESSION_SECONDS=60*60*12;
const ADMIN_EMAIL='admin@steph.com';
const ADMIN_PASSWORD='Password123!';

function secret(){return process.env.ADMIN_SESSION_SECRET||'';}
function signature(payload:string){return createHmac('sha256',secret()).update(payload).digest('base64url');}
export function validAdminCredentials(email:string,password:string){return email===ADMIN_EMAIL&&password===ADMIN_PASSWORD;}
export function createAdminSession(){const payload=String(Math.floor(Date.now()/1000)+SESSION_SECONDS);return `${payload}.${signature(payload)}`;}
export function isAdminSessionValid(value?:string){if(!value||!secret())return false;const [payload,sig,...rest]=value.split('.');if(!payload||!sig||rest.length||!/^\d+$/.test(payload)||Number(payload)<=Math.floor(Date.now()/1000))return false;const expected=Buffer.from(signature(payload));const actual=Buffer.from(sig);return expected.length===actual.length&&timingSafeEqual(expected,actual);}
export function setAdminSession(value:string){cookies().set(COOKIE_NAME,value,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:SESSION_SECONDS});}
export function clearAdminSession(){cookies().set(COOKIE_NAME,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});}
export function hasAdminSession(){return isAdminSessionValid(cookies().get(COOKIE_NAME)?.value);}
export {COOKIE_NAME};
