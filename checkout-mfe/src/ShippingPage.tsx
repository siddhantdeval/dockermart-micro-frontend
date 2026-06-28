import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ShippingPage() {
  const navigate = useNavigate();
  const [street, setStreet] = useState('');

  const handleNext = () => {
    navigate('/checkout/payment');
  };

  const handleAbandon = () => {
    const event = new CustomEvent('mfe:checkout:abandoned', {
      detail: { cartId: 'cart_123' }
    });
    window.dispatchEvent(event);
    console.log('mfe:checkout:abandoned event fired with cartId:', 'cart_123');
    navigate('/catalog');
  };

  return (
    <div style={{ padding: '16px', background: '#fafafa', border: '1px solid #ddd', borderRadius: '4px' }}>
      <h3>Checkout Step: Shipping Details</h3>
      <p>Please enter your delivery street address, city, and zip code.</p>
      
      <div style={{ margin: '16px 0' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Street Address:</label>
        <input
          data-testid="street"
          type="text"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder="123 Main St"
          style={{ padding: '8px', width: '100%', maxWidth: '300px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          data-testid="next"
          onClick={handleNext}
          style={{ padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Next
        </button>
        <button
          data-testid="abandon"
          onClick={handleAbandon}
          style={{ padding: '8px 16px', background: '#e00', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Cancel Order
        </button>
      </div>
    </div>
  );
}
