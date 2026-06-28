import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { describe, test, expect, vi } from 'vitest';

// Configure Checkout MFE to throw an error when rendered to trigger Error Boundary
vi.mock('checkoutApp/CheckoutRoot', () => {
  return {
    default: () => {
      throw new Error('Remote module not found');
    },
  };
});

describe('Shell Host Integration Tests (Task 9.2)', () => {
  test('navigating to /catalog renders the Catalog mount point', async () => {
    render(<App />);

    // Wait for authentication loading screen to resolve
    await waitFor(() => {
      expect(screen.queryByText(/Authenticating/i)).toBeNull();
    });

    // Assert Nav is present
    expect(screen.getByText('DockerMart')).toBeDefined();

    // Click on Catalog link in nav
    const catalogLink = screen.getByRole('link', { name: /catalog/i });
    await userEvent.click(catalogLink);

    // Wait for mock Catalog component to mount and display
    await waitFor(() => {
      const catalogEl = screen.getByTestId('catalog-root');
      expect(catalogEl).not.toBeNull();
      expect(catalogEl.textContent).toContain('Mock Catalog');
    });
  });

  test('error boundary shows MFE name when remote module throws on import/render', async () => {
    render(<App />);

    // Wait for authentication loading screen to resolve
    await waitFor(() => {
      expect(screen.queryByText(/Authenticating/i)).toBeNull();
    });

    // Click on Checkout link
    const checkoutLink = screen.getByRole('link', { name: /checkout/i });
    await userEvent.click(checkoutLink);

    // Wait for the Error Boundary to catch the render failure and display fallback
    await waitFor(() => {
      // Fallback renders: ⚠️ Checkout App Error
      const fallbackHeader = screen.queryByText(/Checkout App Error/i);
      expect(fallbackHeader).not.toBeNull();
    });

    // Verify that the navigation and other routes still render correctly (resilience check)
    const catalogLink = screen.getByRole('link', { name: /catalog/i });
    await userEvent.click(catalogLink);

    await waitFor(() => {
      const catalogEl = screen.getByTestId('catalog-root');
      expect(catalogEl).not.toBeNull();
      expect(catalogEl.textContent).toContain('Mock Catalog');
    });
  });
});
