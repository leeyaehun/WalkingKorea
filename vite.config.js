import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        character: resolve(import.meta.dirname, 'character.html'),
        girl: resolve(import.meta.dirname, 'girl.html'),
        sprite: resolve(import.meta.dirname, 'sprite.html')
      }
    }
  }
});