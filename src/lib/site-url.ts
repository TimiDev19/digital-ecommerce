export function siteUrl(path:string){
 const configured=process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/,'');
 const browserOrigin=typeof window!=='undefined'?window.location.origin:'';
 const isLocalhost=(value:string)=>{try{return ['localhost','127.0.0.1','::1'].includes(new URL(value).hostname)}catch{return false}};
 const origin=browserOrigin&&configured&&isLocalhost(configured)&&!isLocalhost(browserOrigin)?browserOrigin:configured||browserOrigin;
 return new URL(path.startsWith('/')?path:`/${path}`,`${origin}/`).toString();
}
