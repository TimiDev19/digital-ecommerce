export type Product = { id:string; name:string; category:string; description:string; price:number; image:string; label?:string; tone:string; rating:string; featured?:boolean; requires_clothing_size?:boolean; requires_ring_size?:boolean; allows_customization?:boolean; allows_tmobile_refill?:boolean };
export const products:Product[]=[];
export const tmobileRefillAmountsUsd=[10,15,20,25,30,40] as const;
const tmobileRefillPricesNgn:Record<number,number>={10:19800,15:30000,20:37000,25:45000,30:59000,40:78000};
export const tmobileRefillNgn=(amountUsd:number)=>tmobileRefillPricesNgn[amountUsd]??tmobileRefillPricesNgn[10];
export const tmobileRefillStartingPriceNgn=tmobileRefillNgn(tmobileRefillAmountsUsd[0]);
export const cartUnitPrice=(product:Pick<Product,'price'|'allows_tmobile_refill'>,options?:{tmobileRefillUsd?:string})=>product.allows_tmobile_refill?tmobileRefillNgn(Number(options?.tmobileRefillUsd)||10):product.price;
export const formatNaira=(amount:number)=>amount.toLocaleString('en-NG',{maximumFractionDigits:0});
export const productImageFallback='https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=1100&q=85';
// Remove these known development catalog entries from carts saved before the catalog was cleared.
export const legacyPlaceholderProductIds = new Set([
  'esim','gift','online-banking',
  'esim-europe-5gb','esim-uk-10gb','esim-global-3gb',
  'gift-apple','gift-amazon','gift-google-play',
  'banking-app-setup','banking-transfer-help','banking-account-guidance',
]);
export type ShopCategory={id?:string;name:string;slug:string;description:string;display_order?:number;is_active?:boolean};
export const hiddenCategoryNames=new Set(['online banking','flight tickets']);
export const isVisibleCategoryName=(name:string)=>!hiddenCategoryNames.has(name.trim().toLowerCase());
export const isVisibleCategory=(category:Pick<ShopCategory,'name'|'slug'>)=>category.slug!=='online-banking'&&category.slug!=='flight-tickets'&&isVisibleCategoryName(category.name);
export const isCatalogProductCategoryName=(name:string)=>isVisibleCategoryName(name);
export const sameCatalogCategory=(left:string|undefined,right:string|undefined)=>!!left&&!!right&&left.trim().toLocaleLowerCase()===right.trim().toLocaleLowerCase();
export function orderCategories<T extends Pick<ShopCategory,'name'|'slug'> & Partial<Pick<ShopCategory,'display_order'>>>(categories:T[]){return [...categories].sort((a,b)=>Number(!(a.slug==='gifts'||a.name.trim().toLowerCase()==='gifts'))-Number(!(b.slug==='gifts'||b.name.trim().toLowerCase()==='gifts'))||(a.display_order??0)-(b.display_order??0)||a.name.localeCompare(b.name));}
export const whatsappNumber='2348154788459';
export const whatsappUrl=(service?:string)=>`https://wa.me/${whatsappNumber}${service?`?text=${encodeURIComponent(`Hi StephGifts, I’d like to ask about ${service}.`)}`:''}`;
export const orderEmail='oduneyestephen04@gmail.com';
