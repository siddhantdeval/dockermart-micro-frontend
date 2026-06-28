import React, { useState } from 'react';

export default function ConfirmPage() {
  const [complete, setComplete] = useState(false);

  const handlePlaceOrder = () => {
    const event = new CustomEvent('mfe:checkout:complete', {
      detail: { orderId: 'ord_123', total: 199 }
    });
    window.dispatchEvent(event);
    console.log('mfe:checkout:complete event fired with detail:', { orderId: 'ord_123', total: 199 });
    setComplete(true);
  };

  if (complete) {
    return (
      <div style={{ padding: '16px', background: '#e6fffa', border: '1px solid #319795', borderRadius: '4px', color: '#234e52' }}>
        <h3>Order Placed Successfully!</h3>
        <p>Thank you for your purchase. Your order ID is <strong>ord_123</strong>.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', background: '#fafafa', border: '1px solid #ddd', borderRadius: '4px' }}>
      <h3>Checkout Step: Confirmation</h3>
      <p>Your order has been compiled. Place order to confirm purchase.</p>
      
      <button
        data-testid="place-order"
        onClick={handlePlaceOrder}
        style={{ marginTop: '16px', padding: '8px 16px', background: '#319795', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
      >
        Place Order
      </button>
    </div>
  );
}
