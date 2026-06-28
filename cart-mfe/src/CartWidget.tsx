import React, { useState, useEffect, Suspense } from 'react';
import { CartEventBus } from '../../shell/src/mfe-event-bus';

// CONTRACT SPECIFICATION:
// Provider for: mfe:cart:updated event
// Fired event details: count, items
const MiniCart = React.lazy(() => import('./MiniCart'));

export default function CartWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Listen to Namespaced cart update event via event bus and return cleanup
    return CartEventBus.onUpdated((detail) => {
      setCount(detail.count);
    });
  }, []);

  return (
    <div style={{ display: 'inline-block', position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'inline-block', 
          border: '1px dashed gold', 
          padding: '8px 15px', 
          borderRadius: '4px', 
          background: '#fff', 
          cursor: 'pointer',
          color: '#333'
        }}
      >
        <span>🛒 Items: {count}</span>
      </button>

      {isOpen && (
        <Suspense fallback={
          <div style={{ position: 'absolute', right: '0', top: '40px', background: '#fff', padding: '10px', border: '1px solid #ccc', zIndex: 100 }}>
            Loading...
          </div>
        }>
          <MiniCart />
        </Suspense>
      )}
    </div>
  );
}
