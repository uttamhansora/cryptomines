import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { rgsMockPlugin } from './vite-rgs-plugin';

export default defineConfig({
  plugins: [svelte(), rgsMockPlugin()],
  base: './',
  server: { port: 5173 },
});
