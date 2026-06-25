import React, { useState, Suspense } from 'react';

const CartPage = React.lazy(() => import('./CartPage'));
const ShippingPage = React.lazy(() => import('./ShippingPage'));
const PaymentPage = React.lazy(() => import('./PaymentPage'));
const ConfirmPage = React.lazy(() => import('./ConfirmPage'));

type Step = 'cart' | 'shipping' | 'payment' | 'confirm';

export default function CheckoutRoot() {
  const [step, setStep] = useState<Step>('cart');

  const renderStep = () => {
    switch (step) {
      case 'cart':
        return <CartPage />;
      case 'shipping':
        return <ShippingPage />;
      case 'payment':
        return <PaymentPage />;
      case 'confirm':
        return <ConfirmPage />;
    }
  };

  return (
    <div style={{ border: '2px solid red', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
      <h2>Checkout Remote Panel</h2>
      <div style={{ margin: '15px 0' }}>
        <button disabled={step === 'cart'} onClick={() => setStep('cart')} style={{ marginRight: '5px' }}>Cart</button>
        <button disabled={step === 'shipping'} onClick={() => setStep('shipping')} style={{ marginRight: '5px' }}>Shipping</button>
        <button disabled={step === 'payment'} onClick={() => setStep('payment')} style={{ marginRight: '5px' }}>Payment</button>
        <button disabled={step === 'confirm'} onClick={() => setStep('confirm')}>Confirm</button>
      </div>
      <div style={{ padding: '10px', background: '#f5f5f5', minHeight: '120px' }}>
        <Suspense fallback={<div>Loading step...</div>}>
          {renderStep()}
        </Suspense>
      </div>
    </div>
  );
}
