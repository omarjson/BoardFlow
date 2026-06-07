class _ScreenshotCapture {
  async captureAndUpload() {
    const file = await this.capture();
    if (!file) return null;
    return await ImageUtils.uploadFile(file);
  }

  async capture() {
    const boardEl = document.getElementById('canvas');
    if (!boardEl) return null;

    if (typeof html2canvas === 'undefined') {
      try {
        await this._loadHtml2Canvas();
      } catch {
        return this._captureFallback();
      }
    }

    try {
      const canvas = await html2canvas(boardEl, {
        backgroundColor: '#fafafa',
        useCORS: true,
        scale: 1,
        logging: false
      });
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob ? new File([blob], 'screenshot.png', { type: 'image/png' }) : null);
        }, 'image/png');
      });
    } catch {
      return this._captureFallback();
    }
  }

  async _captureFallback() {
    const boardEl = document.getElementById('canvas');
    if (!boardEl) return null;
    const rect = boardEl.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#6e6e73';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Screenshot (install html2canvas for full capture)', canvas.width / 2, canvas.height / 2);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob ? new File([blob], 'screenshot.png', { type: 'image/png' }) : null);
      }, 'image/png');
    });
  }

  async _loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      script.onload = resolve;
      script.onerror = reject;
      setTimeout(() => reject(new Error('timeout')), 10000);
      document.head.appendChild(script);
    });
  }

  destroy() {}
}

try {
  Object.defineProperty(window, 'ScreenshotCapture', { value: new _ScreenshotCapture(), writable: false, configurable: true, enumerable: true });
} catch { window.ScreenshotCapture = new _ScreenshotCapture(); }
