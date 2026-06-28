import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'catalogApp/CatalogRoot': path.resolve(__dirname, './src/__mocks__/CatalogRootMock.tsx'),
      'checkoutApp/CheckoutRoot': path.resolve(__dirname, './src/__mocks__/CheckoutRootMock.tsx'),
      'cartApp/CartWidget': path.resolve(__dirname, './src/__mocks__/CartWidgetMock.tsx'),
      'accountApp/AccountRoot': path.resolve(__dirname, './src/__mocks__/AccountRootMock.tsx'),
      'designSystem/GlobalStyles': path.resolve(__dirname, './src/__mocks__/GlobalStylesMock.tsx'),
      'designSystem/Button': path.resolve(__dirname, './src/__mocks__/ButtonMock.tsx'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
