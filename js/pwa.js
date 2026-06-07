(() => {
  let deferredPrompt = null;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
  });

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
