(() => {
  let deferredPrompt = null;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // show banner if exists or create one
    let banner = document.getElementById('pwa-install-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'pwa-install-banner';
      banner.className = 'pwa-install-banner';
      banner.innerHTML = `<span>Install BoardFlow for offline access</span> <button id="pwa-install-btn" class="btn btn-primary btn-sm">Install</button> <button id="pwa-dismiss-btn" class="btn btn-ghost btn-sm">×</button>`;
      document.body.appendChild(banner);
      document.getElementById('pwa-install-btn')?.addEventListener('click', () => showInstallPrompt());
      document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => banner.remove());
    }
    banner.style.display = 'flex';
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    document.getElementById('pwa-install-banner')?.remove();
  });

  // update service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
  }

  function canInstall() {
    return deferredPrompt !== null;
  }

  async function showInstallPrompt() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    deferredPrompt = null;
  }

  window.PWA = { canInstall, showInstallPrompt };
})();
