import Link from 'next/link';
import {ArrowRight,Check,PackageCheck,ReceiptText} from 'lucide-react';
import '../payment-status.css';

export default function PaymentSuccessPage({searchParams}:{searchParams:{reference?:string}}){
 const reference=searchParams.reference;
 return <main className="payment-status-page">
  <section className="payment-status-card payment-success-card">
   <span className="payment-status-mark"><Check size={30} strokeWidth={1.8}/></span>
   <span className="eyebrow">StephGifts · Payment confirmed</span>
   <h1>Thank you.<br/><em>Your order is paid.</em></h1>
   <p className="payment-status-copy">Your payment was verified successfully. We’re preparing the next steps for your order.</p>
   {reference&&<div className="payment-reference"><ReceiptText size={17}/><span>Payment reference<strong>{reference}</strong></span></div>}
   <div className="payment-status-note"><PackageCheck size={18}/><p>Your order confirmation will be sent to the email linked to your account.</p></div>
   <div className="payment-status-actions"><Link className="button dark" href="/account/orders">View order history <ArrowRight size={16}/></Link><Link className="payment-secondary-link" href="/shop">Continue shopping</Link></div>
  </section>
 </main>;
}
