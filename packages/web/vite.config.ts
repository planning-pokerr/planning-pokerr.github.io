import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/planningpoker.github.io/',
  optimizeDeps: {
    include: ['yjs', 'trystero/nostr'],
  },
  build: {
    target: 'es2022',
  },
});
