'use client';

import {usePathname} from 'next/navigation';
import {MessageCircle} from 'lucide-react';
import {whatsappUrl} from '@/lib/products';

export function FloatingWhatsApp(){
 const pathname=usePathname();
 if(pathname.startsWith('/admin'))return null;
 return <a className="floating-whatsapp" href={whatsappUrl()} target="_blank" rel="noreferrer" aria-label="Chat with StephGifts on WhatsApp">
  <MessageCircle size={20} strokeWidth={2}/>
  <span>WhatsApp</span>
 </a>;
}
