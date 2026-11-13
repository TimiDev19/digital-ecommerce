import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/components/store-provider';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
export const metadata: Metadata = { title: 'Steph Hub — Digital & Travel Services', description: 'eSIM, gift cards, online banking and flight ticket services from Steph Hub.', openGraph: { title: 'Steph Hub — Digital & Travel Services', description: 'Digital services and travel support from Steph Hub.', type: 'website' } };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><StoreProvider><SiteHeader/>{children}<SiteFooter/></StoreProvider></body></html>; }
