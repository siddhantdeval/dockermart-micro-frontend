import React from 'react';
import { render, screen } from '@testing-library/react';
import CartSummary from './CartSummary';
import { describe, test, expect } from 'vitest';

describe('CartSummary Component', () => {
  test('renders the correct item count from state', () => {
    render(<CartSummary initialCount={5} />);

    // Assert that the count is rendered correctly
    const countEl = screen.getByTestId('cart-count');
    expect(countEl).not.toBeNull();
    expect(countEl.textContent).toContain('Total Items: 5');
  });

  test('defaults to 0 items when no initialCount is supplied', () => {
    render(<CartSummary />);

    const countEl = screen.getByTestId('cart-count');
    expect(countEl).not.toBeNull();
    expect(countEl.textContent).toContain('Total Items: 0');
  });
});
