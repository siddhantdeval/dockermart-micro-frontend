import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductCard from './ProductCard';
import { describe, test, expect, vi } from 'vitest';

describe('ProductCard Component', () => {
  test('fires mfe:catalog:item-added event with correct product ID in detail when clicked', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(<ProductCard id="prod_99" name="Docker Master Class" price={199} />);

    // Assert render details
    expect(screen.getByText('Docker Master Class')).toBeDefined();
    expect(screen.getByText('Price: $199')).toBeDefined();

    // Click Add to Cart button
    const button = screen.getByRole('button', { name: /add to cart/i });
    await userEvent.click(button);

    // Verify CustomEvent dispatch
    expect(dispatchSpy).toHaveBeenCalled();
    const dispatchedEvent = dispatchSpy.mock.calls.find(
      (call) => call[0] instanceof CustomEvent && call[0].type === 'mfe:catalog:item-added'
    )?.[0] as CustomEvent;

    expect(dispatchedEvent).toBeDefined();
    expect(dispatchedEvent.detail).toEqual({ productId: 'prod_99' });

    dispatchSpy.mockRestore();
  });
});
