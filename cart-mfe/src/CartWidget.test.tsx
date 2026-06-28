import React, { act } from 'react';
import { render, screen } from '@testing-library/react';
import CartWidget from './CartWidget';
import { describe, test, expect, vi } from 'vitest';

// Store subscription callback locally in the mock scope
let cartUpdateHandler: ((detail: { count: number }) => void) | null = null;

// Mock the relative import path to enforce isolated boundaries
vi.mock('../../shell/src/mfe-event-bus', () => {
  return {
    CartEventBus: {
      onUpdated: (handler: (detail: { count: number }) => void) => {
        cartUpdateHandler = handler;
        return () => {
          cartUpdateHandler = null;
        };
      },
    },
  };
});

describe('CartWidget Component', () => {
  test('renders count 0 initially, and updates to 3 when count event fires', () => {
    render(<CartWidget />);

    // Verify initial state renders 0
    expect(screen.getByText('🛒 Items: 0')).toBeDefined();

    // Verify handler is bound, then invoke with detail payload
    expect(cartUpdateHandler).toBeDefined();
    act(() => {
      if (cartUpdateHandler) {
        cartUpdateHandler({ count: 3 });
      }
    });

    // Assert cart count updates to 3 in DOM
    expect(screen.getByText('🛒 Items: 3')).toBeDefined();
  });
});
