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

      const items = container.querySelectorAll('.board-item');
      if (items.length === 0) {
        Toast.show('Board is empty — nothing to export', 'error');
        return;
      }

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      items.forEach(el => {
        const x = parseFloat(el.style.transform?.match(/translate\(([^,]+)px/)?.[1] || 0);
        const y = parseFloat(el.style.transform?.match(/translate\([^,]+px,\s*([^)]+)px/)?.[1] || 0);
        const w = el.offsetWidth || 200;
        const h = el.offsetHeight || 200;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
      });

      const padding = 60;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;

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
        width: maxX - minX,
        height: maxY - minY,
        x: minX,
        y: minY,
        windowWidth: maxX - minX + 100,
        windowHeight: maxY - minY + 100,
        onclone: cloneDoc
      });

      const link = document.createElement('a');
      link.download = `boardflow-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      Toast.show('Board exported as PNG', 'success');
    } catch (err) {
      console.error('PNG export failed:', err);
      Toast.show('Export failed — try again', 'error');
    }
  },

  async exportPDF() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    if (typeof html2canvas === 'undefined') {
      Toast.show('Loading export library...', 'info');
      await this._loadHtml2Canvas();
    }

    try {
      Toast.show('Generating PDF...', 'info');

      const items = container.querySelectorAll('.board-item');
      if (items.length === 0) {
        Toast.show('Board is empty — nothing to export', 'error');
        return;
      }

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      items.forEach(el => {
        const x = parseFloat(el.style.transform?.match(/translate\(([^,]+)px/)?.[1] || 0);
        const y = parseFloat(el.style.transform?.match(/translate\([^,]+px,\s*([^)]+)px/)?.[1] || 0);
        const w = el.offsetWidth || 200;
        const h = el.offsetHeight || 200;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
      });

      const padding = 60;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;

      const cloneDoc = (doc) => {
        doc.querySelectorAll('.board-item').forEach(el => {
          el.style.transform = el.style.transform.replace(/translate\([^)]+\)/, '');
        });
      };

      const canvas = await html2canvas(container, {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim() || '#fafafa',
        useCORS: true,
        allowTaint: false,
        scale: 2,
        logging: false,
        width: maxX - minX,
        height: maxY - minY,
        x: minX,
        y: minY,
        windowWidth: maxX - minX + 100,
        windowHeight: maxY - minY + 100,
        onclone: cloneDoc
      });

      const imgData = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        Toast.show('Pop-up blocked — allow pop-ups for this site', 'error');
        return;
      }

      const title = document.title || 'BoardFlow Export';
      printWindow.document.write(`<!DOCTYPE html>
<html><head><title>${title}</title>
<style>
  @page { margin: 0.5in; size: landscape; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { display: flex; justify-content: center; align-items: flex-start; padding: 20px; background: #fff; }
  img { max-width: 100%; height: auto; }
  @media print {
    body { padding: 0; }
    img { max-width: 100%; page-break-inside: avoid; }
  }
</style></head>
<body>
  <img src="${imgData}" onload="setTimeout(()=>{window.print();window.close()},300)">
</body></html>`);
      printWindow.document.close();

      Toast.show('PDF export ready', 'success');
    } catch (err) {
      console.error('PDF export failed:', err);
      Toast.show('PDF export failed — try again', 'error');
    }
  },

  async _loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
      if (typeof html2canvas !== 'undefined') { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load html2canvas'));
      document.head.appendChild(script);
    });
  }
};

window.BoardExport = BoardExport;
