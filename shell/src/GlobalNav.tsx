import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type CartWidgetModule = { default: React.ComponentType };

export function GlobalNav() {
  const [CartWidget, setCartWidget] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Eager dynamic import immediately on global nav mount
    import('cartApp/CartWidget')
      .then((mod: CartWidgetModule) => setCartWidget(() => mod.default))
      .catch(() => {
        // Degraded fallback: Static cart status if Cart MFE dev server is down
        setCartWidget(() => () => (
          <span style={{ 
            border: '1px dashed #e53e3e', 
            padding: '6px 12px', 
            borderRadius: '4px', 
            background: '#fff5f5', 
            color: '#e53e3e',
            fontSize: '14px'
          }}>
            🛒 Offline
          </span>
        ));
      });
  }, []);

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
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/catalog" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Catalog</Link>
        <Link to="/checkout" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Checkout</Link>
        <Link to="/account" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Account</Link>
        <div style={{ marginLeft: '10px' }}>
          {CartWidget ? <CartWidget /> : <span style={{ color: '#a0aec0', fontSize: '14px' }}>🛒 Loading...</span>}
        </div>
      </div>
    </nav>
  );
}
