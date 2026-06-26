import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { mfeOn } from '../../shell/src/mfe-event-bus';

const CartPage = React.lazy(() => import('./CartPage'));
const ShippingPage = React.lazy(() => import('./ShippingPage'));
const PaymentPage = React.lazy(() => import('./PaymentPage'));
const ConfirmPage = React.lazy(() => import('./ConfirmPage'));

export default function CheckoutRoot() {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Listen to namespaced event on mounting (hydrates instantly from last-state cache)
    return mfeOn<{ count: number }>('mfe:cart:updated', (detail) => {
      setCartCount(detail.count);
    });
  }, []);

  return (
    <div style={{ border: '2px solid red', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Checkout Remote Panel</h2>
        <span style={{ background: '#feb2b2', padding: '4px 10px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold' }}>
          Cart Items: {cartCount}
        </span>
      </div>
      <div style={{ margin: '15px 0' }}>
        <button onClick={() => navigate('/checkout/cart')} style={{ marginRight: '5px', cursor: 'pointer' }}>Cart</button>
        <button onClick={() => navigate('/checkout/shipping')} style={{ marginRight: '5px', cursor: 'pointer' }}>Shipping</button>
        <button onClick={() => navigate('/checkout/payment')} style={{ marginRight: '5px', cursor: 'pointer' }}>Payment</button>
        <button onClick={() => navigate('/checkout/confirm')} style={{ cursor: 'pointer' }}>Confirm</button>
      </div>
      <div style={{ padding: '10px', background: '#f5f5f5', minHeight: '120px' }}>
        <Suspense fallback={<div>Loading checkout step...</div>}>
          <Routes>
            <Route path="cart" element={<CartPage />} />
            <Route path="shipping" element={<ShippingPage />} />
            <Route path="payment" element={<PaymentPage />} />
            <Route path="confirm" element={<ConfirmPage />} />
            <Route path="*" element={<CartPage />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}
