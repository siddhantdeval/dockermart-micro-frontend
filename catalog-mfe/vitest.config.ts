import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    alias: {
      'designSystem/Button': path.resolve(__dirname, './src/__mocks__/ButtonMock.tsx'),
    },
  },
});
