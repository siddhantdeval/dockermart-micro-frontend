import React, { useState } from 'react';

interface CartSummaryProps {
  initialCount?: number;
}

export default function CartSummary({ initialCount = 0 }: CartSummaryProps) {
  const [itemCount] = useState(initialCount);

  return (
    <div style={{
      border: '1px solid var(--color-border)',
      padding: '16px',
      borderRadius: '8px',
      background: 'var(--color-white)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h3 style={{ margin: '0 0 12px 0' }}>Order Summary</h3>
      <p data-testid="cart-count" style={{ margin: 0, fontWeight: 600 }}>
        Total Items: {itemCount}
      </p>
    </div>
  );
}
