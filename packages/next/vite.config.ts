import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({ 
      insertTypesEntry: true,
      include: ['src/**/*.ts', 'src/**/*.tsx']
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    lib: {
      entry: {
        'client/index': resolve(__dirname, 'src/client/index.ts'),
        'server/index': resolve(__dirname, 'src/server/index.ts')
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'next', '@use-africa-pay/core'],
      output: {
        preserveModules: false,
        // Ensure directives remain at the top of the output files
        banner: (chunk) => {
          if (chunk.facadeModuleId?.includes('src/client')) {
            return '"use client";\n';
          }
          if (chunk.facadeModuleId?.includes('src/server')) {
            return '"use server";\n';
          }
          return '';
        }
      }
    }
  }
});
