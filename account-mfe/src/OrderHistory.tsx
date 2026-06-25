import React from 'react';

export default function OrderHistory() {
  return (
    <div style={{ padding: '10px', background: '#fafafa', border: '1px solid #ddd', borderRadius: '4px' }}>
      <h3>Purchase Order History</h3>
      <ul>
        <li>Order #1002 — $99 — Delivered</li>
        <li>Order #1001 — $49 — Delivered</li>
      </ul>
    </div>
  );
}
