/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: '@collage/core',
      fileName: (format) => `collage.${format}.js`,
    },
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@collage/core': '/src/index.ts',
    },
  },
  server: {
    host: true,
  },
  plugins: [dts()],
});
