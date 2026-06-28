import React from 'react';
import { Button } from 'designSystem/Button';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
}

export default function ProductCard({ id, name, price }: ProductCardProps) {
  const handleAdd = () => {
    // Dispatch standard browser CustomEvent for event bus interception
    window.dispatchEvent(
      new CustomEvent('mfe:catalog:item-added', {
        detail: { productId: id },
      })
    );
  };

  return (
    <div style={{
      border: '1px solid var(--color-border)',
      padding: '16px',
      borderRadius: '8px',
      margin: '8px 0',
      background: 'var(--color-white)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h4 style={{ margin: '0 0 8px 0' }}>{name}</h4>
      <p style={{ margin: '0 0 12px 0', color: 'var(--color-text-light)' }}>Price: ${price}</p>
      <Button variant="primary" onClick={handleAdd}>
        Add to Cart
      </Button>
    </div>
  );
}
