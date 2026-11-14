import {redirect} from 'next/navigation';
import {hasAdminSession} from '@/lib/admin-auth';
import {AdminLoginForm} from './login-form';
import '../admin.css';

export default function AdminLoginPage(){if(hasAdminSession())redirect('/admin');return <main className="admin-login-page"><section className="admin-login-card"><span className="eyebrow">StephGifts · administration</span><h1>Admin sign in.</h1><p>Sign in to manage the shop catalog.</p><AdminLoginForm/></section></main>}
