// ============================================
// Link Card — URL Preview with OG Metadata
// ============================================

class _LinkCard {
  async fetchMetadata(url) {
    try {
      const normalized = url.startsWith('http') ? url : 'https://' + url;
      const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(normalized)}`);
      if (!res.ok) return null;
      const html = await res.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const getMeta = (prop) => {
        const el = doc.querySelector(`meta[property="${prop}"]`) || doc.querySelector(`meta[name="${prop}"]`);
        return el?.getAttribute('content') || '';
      };

      return {
        title: getMeta('og:title') || doc.querySelector('title')?.textContent || url,
        description: getMeta('og:description') || getMeta('description') || '',
        image: getMeta('og:image') || '',
        url: normalized,
        siteName: getMeta('og:site_name') || new URL(normalized).hostname
      };
    } catch (err) {
      console.error('Link preview fetch failed:', err);
      return null;
    }
  }

  render(item) {
    const el = document.createElement('div');
    el.className = `board-item link-card ${ItemManager.selectedItems.has(item.id) ? 'selected' : ''}`;
    el.dataset.id = item.id;
    el.dataset.type = 'link_card';
    el.tabIndex = 0;
    el.role = 'button';

    const meta = item.metadata?.link_preview || {};
    const hasImage = meta.image && !meta.image.includes('placeholder') && !meta.image.includes('default');

    el.style.cssText = `
      position: absolute;
      left: 0; top: 0;
      width: ${item.width}px;
      height: ${item.height}px;
      transform: translate(${item.position_x}px, ${item.position_y}px) rotate(${item.rotation}deg);
      z-index: ${item.z_index};
    `;

    el.innerHTML = `
      <div class="link-card-inner" style="
        background: var(--surface);
        border: 1px solid var(--hairline);
        border-radius: var(--radius-md);
        overflow: hidden;
        height: 100%;
        display: flex;
        flex-direction: column;
      ">
        ${hasImage ? `<div class="link-card-image" style="
          height: 140px;
          background: var(--canvas-soft);
          overflow: hidden;
        "><img src="${Utils.escapeHtml(meta.image)}" alt="${Utils.escapeHtml(meta.title || '')}" style="width:100%;height:100%;object-fit:cover;" loading="lazy"></div>` : ''}
        <div class="link-card-body" style="
          padding: var(--space-md);
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        ">
          <div class="link-card-site" style="font-size: var(--text-xs); color: var(--ink-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${Utils.escapeHtml(meta.siteName || '')}
          </div>
          <div class="link-card-title" style="font-size: var(--text-sm); font-weight: 600; color: var(--ink); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${Utils.escapeHtml(meta.title || item.title || '')}
          </div>
          ${meta.description ? `<div class="link-card-desc" style="font-size: var(--text-xs); color: var(--ink-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${Utils.escapeHtml(meta.description)}
          </div>` : ''}
        </div>
      </div>
    `;

    const openLink = () => {
      window.open(meta.url || item.url || '#', '_blank');
    };

    el.addEventListener('click', openLink);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') openLink();
    });

    return el;
  }

  async createFromUrl(url, x, y) {
    const meta = await this.fetchMetadata(url);
    const item = await ItemManager.createItem('link_card', {
      x, y,
      width: 320,
      height: meta?.image && !meta.image.includes('placeholder') && !meta.image.includes('default') ? 280 : 180,
      title: meta?.title || url,
      content: meta?.description || '',
      url: url,
      metadata: meta ? { link_preview: meta } : null
    });
    return item;
  }
}

try {
  Object.defineProperty(window, 'LinkCard', { value: new _LinkCard(), writable: false, configurable: true, enumerable: true });
} catch { window.LinkCard = new _LinkCard(); }
