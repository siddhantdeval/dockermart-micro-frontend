import React, { useState, Suspense } from 'react';
import { mfeEmit } from '../../shell/src/mfe-event-bus';
import './catalog.css';

const ProductList = React.lazy(() => import('./ProductList'));
const ProductDetails = React.lazy(() => import('./ProductDetails'));

export default function CatalogRoot() {
  const [showDetails, setShowDetails] = useState(false);
  const [localCartCount, setLocalCartCount] = useState(0);

  const handleAddToCart = () => {
    const nextCount = localCartCount + 1;
    setLocalCartCount(nextCount);
    // Emit namespaced event to notify other MFEs (like Cart MFE)
    mfeEmit<{ count: number }>('mfe:cart:updated', { count: nextCount });
  };

  return (
    <div className="catalog-app" style={{ border: '2px solid green', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
      <h2>Catalog Remote Content</h2>
      <p>Here you will browse and select products.</p>
      
      <div style={{ margin: '15px 0' }}>
        <button 
          onClick={handleAddToCart}
          className="btn-success"
          style={{ 
            padding: '8px 12px', 
            background: '#2f855a', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer', 
            marginRight: '10px',
            fontWeight: 500
          }}
        >
          ➕ Add to Cart
        </button>

        <button 
          onClick={() => setShowDetails(!showDetails)} 
          className="btn-info"
          style={{ padding: '8px 12px', cursor: 'pointer' }}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <Suspense fallback={<div>Loading Product List...</div>}>
        <ProductList />
      </Suspense>

      {showDetails && (
        <Suspense fallback={<div>Loading Details...</div>}>
          <ProductDetails />
        </Suspense>
      )}
    </div>
  );
}
