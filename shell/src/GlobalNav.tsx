import React from 'react';
import { Link } from 'react-router-dom';

export function GlobalNav() {
  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 24px',
      background: '#1a202c',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <span style={{ fontWeight: 'bold', fontSize: '20px', letterSpacing: '0.5px' }}>DockerMart</span>
      <div style={{ display: 'flex', gap: '20px' }}>
        <Link to="/catalog" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Catalog</Link>
        <Link to="/checkout" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Checkout</Link>
        <Link to="/account" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Account</Link>
      </div>
    </nav>
  );
}
