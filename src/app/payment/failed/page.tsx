import Link from 'next/link';
import {AlertCircle,ArrowLeft,MessageCircle,RefreshCw} from 'lucide-react';
import {whatsappUrl} from '@/lib/products';
import '../payment-status.css';

export default function PaymentFailedPage({searchParams}:{searchParams:{reason?:string}}){
 const unconfirmed=searchParams.reason==='unconfirmed'||searchParams.reason==='missing';
 return <main className="payment-status-page">
  <section className="payment-status-card payment-failed-card">
   <span className="payment-status-mark"><AlertCircle size={29} strokeWidth={1.7}/></span>
   <span className="eyebrow">StephGifts · Payment status</span>
   <h1>{unconfirmed?<>We couldn’t confirm<br/><em>your payment.</em></>:<>Payment wasn’t<br/><em>completed.</em></>}</h1>
   <p className="payment-status-copy">{unconfirmed?'We couldn’t verify the final payment status. If your account was charged, please contact support before trying again.':'Your payment was cancelled or declined. Your order hasn’t been confirmed, and you can return to checkout to try again.'}</p>
   <div className="payment-status-note"><MessageCircle size={18}/><p>{unconfirmed?'Our team can help confirm the transaction before you retry.':'Need help completing your order? Contact StephGifts support.'}</p></div>
   <div className="payment-status-actions"><Link className="button dark" href="/cart">{unconfirmed?<><RefreshCw size={15}/> Return to cart</>:<><RefreshCw size={15}/> Try checkout again</>}</Link><a className="payment-secondary-link" href={whatsappUrl()} target="_blank" rel="noreferrer">Message support <ArrowLeft className="payment-support-arrow" size={14}/></a></div>
  </section>
 </main>;
}
