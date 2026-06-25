import React from 'react';

export default function ProductList() {
  return (
    <div style={{ marginTop: '10px', padding: '10px', background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '4px' }}>
      <h4>Product List (Lazy Chunk)</h4>
      <ul>
        <li>Docker Container Pro — $99</li>
        <li>Kubernetes Pod Master — $199</li>
        <li>Helm Chart Wizard — $49</li>
      </ul>
    </div>
  );
}
