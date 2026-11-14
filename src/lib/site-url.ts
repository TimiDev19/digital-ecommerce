export function siteUrl(path:string){
 const configured=process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/,'');
 const origin=configured||(typeof window!=='undefined'?window.location.origin:'');
 return new URL(path.startsWith('/')?path:`/${path}`,`${origin}/`).toString();
}
