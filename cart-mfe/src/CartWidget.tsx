import React, { useState, Suspense } from 'react';

const MiniCart = React.lazy(() => import('./MiniCart'));

export default function CartWidget() {
  const [isOpen, setIsOpen] = useState(false);

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
          cursor: 'pointer' 
        }}
      >
        <span>🛒 Items: 0</span>
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
