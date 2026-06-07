import { defineConfig } from 'vite';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

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
        for (const d of ['js', 'assets', 'css']) {
          copyDir(d, join(out, d));
        }
        for (const f of ['sw.js', 'manifest.json', '_headers', '_redirects']) {
          if (existsSync(f)) copyFileSync(f, join(out, f));
        }
      },
    },
  ],
});
