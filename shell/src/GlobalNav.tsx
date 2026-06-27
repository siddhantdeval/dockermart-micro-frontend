import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthEventBus } from './mfe-event-bus';
import { User, broadcastLogout, login } from './auth';
import { Button } from 'designSystem/Button';

type CartWidgetModule = { default: React.ComponentType };

export function GlobalNav() {
  const [CartWidget, setCartWidget] = useState<React.ComponentType | null>(null);
  const [user, setUser] = useState<User | null>(null);

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

    // Subscribe to auth state
    return AuthEventBus.onReady((u) => setUser(u));
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
        
        {user ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '10px', borderLeft: '1px solid #4a5568', paddingLeft: '10px' }}>
            <span style={{ fontSize: '14px', color: '#cbd5e0' }}>👤 {user.name}</span>
            <Button 
              onClick={broadcastLogout}
              variant="danger"
              style={{
                padding: '4px 8px',
                fontSize: '12px',
              }}
            >
              Logout
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '10px', borderLeft: '1px solid #4a5568', paddingLeft: '10px' }}>
            <Button 
              onClick={login}
              variant="primary"
              style={{
                padding: '4px 8px',
                fontSize: '12px',
              }}
            >
              Login
            </Button>
          </div>
        )}

        <div style={{ marginLeft: '10px' }}>
          {CartWidget ? <CartWidget /> : <span style={{ color: '#a0aec0', fontSize: '14px' }}>🛒 Loading...</span>}
        </div>
      </div>
    </nav>
  );
}
