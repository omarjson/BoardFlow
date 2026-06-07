import { defineConfig } from 'vite';
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

function copyDir(src, dest) {
  if (!existsSync(src)) return;
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export default defineConfig({
  root: '.',
  base: '/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
    rollupOptions: {
      input: '/index.html',
    },
  },
  css: {
    devSourcemap: true,
  },
  server: {
    port: 3000,
    open: false,
  },
  plugins: [
    {
      name: 'copy-static-assets',
      closeBundle() {
        const out = 'dist';
        const dirs = ['js', 'assets', 'css'];
        for (const d of dirs) {
          copyDir(d, join(out, d));
        }
        const files = ['sw.js', 'manifest.json', '_headers', '_redirects'];
        for (const f of files) {
          if (existsSync(f)) copyFileSync(f, join(out, f));
        }
      },
    },
  ],
});
