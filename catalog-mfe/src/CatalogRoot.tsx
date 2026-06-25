import React, { useState, Suspense } from 'react';

const ProductList = React.lazy(() => import('./ProductList'));
const ProductDetails = React.lazy(() => import('./ProductDetails'));

export default function CatalogRoot() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div style={{ border: '2px solid green', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
      <h2>Catalog Remote Content</h2>
      <p>Here you will browse and select products.</p>
      
      {/* Dynamic chunk 1 */}
      <Suspense fallback={<div>Loading Product List...</div>}>
        <ProductList />
      </Suspense>

      <button 
        onClick={() => setShowDetails(!showDetails)} 
        style={{ marginTop: '15px', padding: '8px 12px', cursor: 'pointer' }}
      >
        {showDetails ? 'Hide Details' : 'Show Details'}
      </button>

      {/* Dynamic chunk 2 */}
      {showDetails && (
        <Suspense fallback={<div>Loading Details...</div>}>
          <ProductDetails />
        </Suspense>
      )}
    </div>
  );
}
