class _MediaPlayer {
  _safeUrl(url) {
    try { const u = new URL(url); return ['http:', 'https:', 'blob:', 'data:'].includes(u.protocol); } catch { return false; }
  }
  play(url, type, title) {
    if (!this._safeUrl(url)) { Toast.show('Invalid media URL', 'error'); return; }
    const safeTitle = Utils.escapeHtml(title || 'Media Player');
    const safeUrl = url.startsWith('data:') ? url : Utils.escapeHtml(url);
    const ext = (title?.split('.').pop() || (type === 'video' ? 'mp4' : 'mp3')).replace(/[^a-z0-9]/gi, '').slice(0,5) || (type === 'video' ? 'mp4' : 'mp3');
    Modal.show({
      title: safeTitle,
      content: `
        <div style="text-align: center; min-height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-md);">
          ${type === 'video'
            ? `<video id="mp-video" src="${safeUrl}" controls playsinline style="max-width: 100%; max-height: 70vh; border-radius: var(--radius-md);"></video>`
            : `<audio id="mp-audio" src="${safeUrl}" controls style="width: 100%;"></audio>`
          }
          <a href="${safeUrl}" download="${safeTitle}.${ext}" class="btn btn-secondary btn-sm" style="text-decoration: none; color: var(--ink);">
            📥 Download File
          </a>
        </div>
      `,

      confirmText: 'Close',
      cancelText: '',
      hideCancel: true,
      onOpen: () => {
        const el = document.getElementById('mp-video') || document.getElementById('mp-audio');
        if (el) {
          el.addEventListener('error', () => Toast.show('Failed to load media', 'error'));
        }
      }
    });
  }

  openFile(url, type, title) {
    this.play(url, type, title);
  }
}

try {
  Object.defineProperty(window, 'MediaPlayer', { value: new _MediaPlayer(), writable: false, configurable: true, enumerable: true });
} catch { window.MediaPlayer = new _MediaPlayer(); }
