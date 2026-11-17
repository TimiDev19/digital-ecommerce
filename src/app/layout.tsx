import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/components/store-provider';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { FloatingWhatsApp } from '@/components/floating-whatsapp';
export const metadata: Metadata = { title: 'StephGifts — Digital Services & Gifts', description: 'eSIMs and thoughtful gifts from StephGifts.', icons: { icon: '/icon.jpg', apple: '/apple-icon.jpg' }, openGraph: { title: 'StephGifts — Digital Services & Gifts', description: 'Digital services and gifts from StephGifts.', type: 'website', images: ['/stephgifts-logo.jpg'] } };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><StoreProvider><SiteHeader/>{children}<SiteFooter/><FloatingWhatsApp/></StoreProvider></body></html>; }
