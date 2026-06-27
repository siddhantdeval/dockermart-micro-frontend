import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { mfeOn } from '../../shell/src/mfe-event-bus';
import styles from './CheckoutPanel.module.css';

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
    <div className={styles.root}>
      <div className={styles.header}>
        <h2>Checkout Remote Panel</h2>
        <span className={styles.badge}>
          Cart Items: {cartCount}
        </span>
      </div>
      <div className={styles.buttonContainer}>
        <button onClick={() => navigate('/checkout/cart')} className={styles.button}>Cart</button>
        <button onClick={() => navigate('/checkout/shipping')} className={styles.button}>Shipping</button>
        <button onClick={() => navigate('/checkout/payment')} className={styles.button}>Payment</button>
        <button onClick={() => navigate('/checkout/confirm')} className={styles.button} style={{ marginRight: 0 }}>Confirm</button>
      </div>
      <div className={styles.stepContainer}>
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
