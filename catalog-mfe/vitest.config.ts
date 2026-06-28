import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'designSystem/Button': path.resolve(__dirname, './src/__mocks__/ButtonMock.tsx'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
