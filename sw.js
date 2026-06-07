const CACHE = 'boardflow-v8';
const CRITICAL = [
  '/js/config.js',
  '/js/auth/auth.js',
  '/js/app.js',
  '/js/router.js',
  '/js/i18n/i18n.js',
  '/sw.js',
  '/js/utils/helpers.js',
  '/js/utils/dom.js',
  '/js/ui/sidebar.js',
  '/js/board/board-manager.js',
  '/js/templates/template-engine.js',
  '/js/templates/template-gallery.js',
  '/js/ui/modal.js',
  '/js/ui/toast.js',
  '/js/ui/context-menu.js',
  '/js/components/chat.js',
  '/js/ai/ai-assistant.js',
  '/js/sharing/share-manager.js',
  '/js/sharing/permissions.js',
  '/js/components/file-manager.js',
  '/js/components/link-card.js',
  '/js/components/roadmap.js',
  '/js/components/sketch.js',
  '/js/components/sticky-note.js',
  '/js/components/rich-note.js',
  '/js/components/screenshot.js',
  '/js/components/media-player.js',
  '/js/components/audio-record.js',
  '/js/components/video-upload.js',
  '/js/board/canvas.js',
  '/js/board/item-manager.js',
  '/js/board/drag-drop.js',
  '/js/board/selection.js',
  '/js/board/history.js',
  '/js/board/connections.js',
  '/js/board/export.js',
  '/js/ui/minimap.js',
  '/js/utils/storage.js',
  '/js/utils/image-utils.js',
  '/js/pwa.js'
];
const CRITICAL_SET = new Set(CRITICAL);

const STATIC = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/icons/favicon.svg',
  '/assets/icons/icon-192.svg',
  '/assets/icons/icon-512.svg',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/apple-touch-icon.png',
  '/js/config.js',
  '/js/i18n/i18n.js',
  '/js/router.js',
  '/js/auth/auth.js',
  '/js/auth/login.js',
  '/js/auth/signup.js',
  '/js/ui/search.js',
  '/js/ui/modal.js',
  '/js/ui/toast.js',
  '/js/board/board-manager.js',
  '/js/ui/sidebar.js',
  '/js/templates/template-engine.js',
  '/js/templates/template-gallery.js',
  '/js/utils/helpers.js',
  '/js/utils/dom.js',
  '/js/ui/context-menu.js',
  '/js/components/sticky-note.js',
  '/js/components/rich-note.js',
  '/js/board/history.js',
  '/js/components/sketch.js',
  '/js/board/export.js',
  '/js/board/canvas.js',
  '/js/board/item-manager.js',
  '/js/board/drag-drop.js',
  '/js/board/selection.js',
  '/js/ui/minimap.js',
  '/js/utils/storage.js',
  '/js/utils/image-utils.js',
  '/js/components/screenshot.js',
  '/js/components/file-manager.js',
  '/js/components/link-card.js',
  '/js/components/audio-record.js',
  '/js/components/video-upload.js',
  '/js/components/media-player.js',
  '/js/components/roadmap.js',
  '/js/board/connections.js',
  '/js/ai/ai-assistant.js',
  '/js/sharing/permissions.js',
  '/js/sharing/share-manager.js',
  '/js/components/chat.js',
  '/js/pwa.js',
  '/js/app.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  if (url.origin !== self.location.origin) return;

  const path = url.pathname;

  // Network-first for locales
  if (path.startsWith('/js/i18n/locales/')) {
    e.respondWith(networkFirst(e.request));
    return;
  }

  // Network-only-no-store for critical files
  if (CRITICAL_SET.has(path)) {
    e.respondWith(networkOnlyNoStore(e.request));
    return;
  }

  // Cache-first for other same-origin assets
  e.respondWith(cacheFirst(e.request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const resp = await fetch(request);
    if (resp.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, resp.clone());
    }
    return resp;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const resp = await fetch(request);
    if (resp.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE);
      cache.put(request, resp.clone());
    }
    return resp;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function networkOnlyNoStore(request) {
  try {
    const resp = await fetch(request, { cache: 'no-store' });
    if (resp.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE);
      cache.put(request, resp.clone());
    }
    return resp;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}
