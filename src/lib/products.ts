export type Product = { id:string; name:string; category:string; description:string; price:number; image:string; label?:string; tone:string; rating:string; featured?:boolean; requires_clothing_size?:boolean; requires_ring_size?:boolean; allows_customization?:boolean };
export const products:Product[]=[];
export const formatNaira=(amount:number)=>amount.toLocaleString('en-NG',{maximumFractionDigits:0});
export const productImageFallback='https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=1100&q=85';
// Remove these known development catalog entries from carts saved before the catalog was cleared.
export const legacyPlaceholderProductIds = new Set([
  'esim','gift','online-banking','flight-ticket',
  'esim-europe-5gb','esim-uk-10gb','esim-global-3gb',
  'gift-apple','gift-amazon','gift-google-play',
  'banking-app-setup','banking-transfer-help','banking-account-guidance',
  'flight-lagos-london','flight-lagos-dubai','flight-lagos-accra',
]);
export type ShopCategory={id?:string;name:string;slug:string;description:string;display_order?:number;is_active?:boolean};
export const hiddenCategoryNames=new Set(['online banking']);
export const isVisibleCategoryName=(name:string)=>!hiddenCategoryNames.has(name.trim().toLowerCase());
export const isVisibleCategory=(category:Pick<ShopCategory,'name'|'slug'>)=>category.slug!=='online-banking'&&isVisibleCategoryName(category.name);
export const storeCategories:ShopCategory[]=[{name:'eSIM',slug:'esim',description:'Browse regional and global mobile data plans.'},{name:'Gifts',slug:'gifts',description:'Find digital gift cards for popular brands.'},{name:'Flight Tickets',slug:'flight-tickets',description:'Browse routes and request a flight quote.'}] as const;
export const categories=['All products',...storeCategories.map(category=>category.name)];
export const categoryFromSlug=(slug:string)=>storeCategories.find(category=>category.slug===slug);
export const whatsappNumber='2348154788459';
export const whatsappUrl=(service?:string)=>`https://wa.me/${whatsappNumber}${service?`?text=${encodeURIComponent(`Hi StephGifts, I’d like to ask about ${service}.`)}`:''}`;
export const orderEmail='oduneyestephen04@gmail.com';
