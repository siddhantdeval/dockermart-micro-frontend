import React, { useState, useEffect, Suspense } from 'react';
import { AuthEventBus, CartEventBus } from '../../shell/src/mfe-event-bus';
import { User } from '../../shell/src/auth';
import { Button } from 'designSystem/Button';
import './catalog.css';

const ProductList = React.lazy(() => import('./ProductList'));
const ProductDetails = React.lazy(() => import('./ProductDetails'));

export default function CatalogRoot() {
  const [showDetails, setShowDetails] = useState(false);
  const [localCartCount, setLocalCartCount] = useState(0);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return AuthEventBus.onReady((u) => setUser(u));
  }, []);

  const handleAddToCart = () => {
    const nextCount = localCartCount + 1;
    setLocalCartCount(nextCount);
    // Emit namespaced event using CartEventBus concern class
    CartEventBus.emitUpdated(nextCount);
  };

  return (
    <div className="catalog-app" style={{ border: '2px solid green', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Catalog Remote Content</h2>
        {user && (
          <span style={{ fontSize: '14px', background: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', fontWeight: 500 }}>
            👤 {user.name} ({user.roles.join(', ')})
          </span>
        )}
      </div>
      <p>Here you will browse and select products.</p>
      
      <div style={{ margin: '15px 0' }}>
        <Button 
          onClick={handleAddToCart}
          variant="primary"
          style={{ marginRight: '10px' }}
        >
          ➕ Add to Cart
        </Button>

        <Button 
          onClick={() => setShowDetails(!showDetails)} 
          variant="secondary"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
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
