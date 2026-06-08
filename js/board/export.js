const BoardExport = {
  async exportPNG() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    if (typeof html2canvas === 'undefined') {
      Toast.show('Loading export library...', 'info');
      await this._loadHtml2Canvas();
    }

    try {
      Toast.show('Rendering board...', 'info');
      const scale = parseInt(localStorage.getItem('boardflow_export_scale') || '2', 10);
      const includeGrid = localStorage.getItem('boardflow_export_grid') !== 'false';
      const cloneDoc = (doc) => {
        doc.querySelectorAll('.board-item').forEach(el => {
          el.style.transform = el.style.transform.replace(/translate\([^)]+\)/, '');
        });
        if (!includeGrid) {
          doc.querySelector('.canvas-grid')?.remove();
        }
      };
      const canvas = await html2canvas(container, {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim() || '#fafafa',
        useCORS: true,
        allowTaint: false,
        scale,
        logging: false,
        onclone: cloneDoc
      });
      const link = document.createElement('a');
      link.download = `boardflow-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      Toast.show('Board exported as PNG', 'success');
    } catch {
      Toast.show('Export failed', 'error');
    }
  },

  exportPDF() {
    window.print();
  },

  async _loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
};

window.BoardExport = BoardExport;
