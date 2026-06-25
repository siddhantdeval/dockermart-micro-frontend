import React from 'react';

export default function MiniCart() {
  return (
    <div style={{ 
      position: 'absolute', 
      right: '0', 
      top: '40px', 
      width: '250px', 
      background: '#fff', 
      border: '1px solid #ccc', 
      padding: '10px', 
      boxShadow: '0 4px 10px rgba(0,0,0,0.15)', 
      borderRadius: '4px', 
      zIndex: 100,
      color: '#333',
      textAlign: 'left'
    }}>
      <h5 style={{ margin: '0 0 5px 0' }}>Quick Cart View</h5>
      <p style={{ fontSize: '12px', margin: '0' }}>Your cart is currently empty.</p>
    </div>
  );
}
