import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentPage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '16px', background: '#fafafa', border: '1px solid #ddd', borderRadius: '4px' }}>
      <h3>Checkout Step: Payment Details</h3>
      <p>Credit card or SaaS billing details entry form.</p>
      
      <button
        data-testid="next-payment"
        onClick={() => navigate('/checkout/confirm')}
        style={{ marginTop: '16px', padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Next to Confirmation
      </button>
    </div>
  );
}
