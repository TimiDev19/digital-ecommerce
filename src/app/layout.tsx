import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/components/store-provider';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
export const metadata: Metadata = { title: 'Forma — Objects for your next idea', description: 'A considered collection of digital tools, templates and resources for people who make things.', openGraph: { title: 'Forma — Objects for your next idea', description: 'A considered collection of digital tools for people who make things.', type: 'website' } };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><StoreProvider><SiteHeader/>{children}<SiteFooter/></StoreProvider></body></html>; }
