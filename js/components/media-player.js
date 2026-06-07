class _MediaPlayer {
  play(url, type, title) {
    Modal.show({
      title: Utils.escapeHtml(title || 'Media Player'),
      content: `
        <div style="text-align: center; min-height: 100px; display: flex; align-items: center; justify-content: center;">
          ${type === 'video'
            ? `<video id="mp-video" src="${Utils.escapeHtml(url)}" controls style="max-width: 100%; max-height: 70vh; border-radius: var(--radius-md);"></video>`
            : `<audio id="mp-audio" src="${Utils.escapeHtml(url)}" controls style="width: 100%;"></audio>`
          }
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

  async openFile(url, type, title) {
    this.play(url, type, title);
  }
}

try {
  Object.defineProperty(window, 'MediaPlayer', { value: new _MediaPlayer(), writable: false, configurable: true, enumerable: true });
} catch { window.MediaPlayer = new _MediaPlayer(); }
