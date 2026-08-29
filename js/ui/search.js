class _BoardSearch {
  constructor() {
    this.overlay = null;
    this.input = null;
    this.results = null;
    this.countEl = null;
    this.activeIndex = -1;
  }

  show() {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.className = 'board-search-overlay';
    this.overlay.innerHTML = `
      <div class="board-search-bar">
         <span class="board-search-icon" style="display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; color: var(--ink-muted);">${Icons.search}</span>
        <input type="text" class="board-search-input" placeholder="${I18n.__('search')}" autocomplete="off" autofocus>
        <span class="board-search-count"></span>
        <button class="board-search-close">✕</button>
      </div>
      <div class="board-search-results"></div>
    `;

    document.getElementById('page-board')?.appendChild(this.overlay);

    this.input = this.overlay.querySelector('.board-search-input');
    this.results = this.overlay.querySelector('.board-search-results');
    this.countEl = this.overlay.querySelector('.board-search-count');
    const closeBtn = this.overlay.querySelector('.board-search-close');

    this.input.addEventListener('input', Utils.debounce(() => this._search(), 150));
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
      if (e.key === 'Enter') this._goToResult(this.activeIndex);
      if (e.key === 'ArrowDown') { e.preventDefault(); this._navigate(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); this._navigate(-1); }
    });
    closeBtn.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    requestAnimationFrame(() => this.input?.focus());
  }

  close() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.input = null;
      this.results = null;
      this.activeIndex = -1;
    }
  }

  _search() {
    const q = this.input?.value?.toLowerCase().trim() || '';
    const countEl = this.countEl;
    this.results.innerHTML = '';

    if (!q) {
      if (countEl) countEl.textContent = '';
      this._matches = [];
      return;
    }

    const matches = ItemManager.items.filter(item => {
      const hay = [item.title, item.content, item.url, item.file_url, JSON.stringify(item.metadata||''), (item.sketch_data?JSON.stringify(item.sketch_data):'')].join(' ').toLowerCase();
      return hay.includes(q);
    });
    this._matches = matches;

    if (countEl) countEl.textContent = matches.length ? `${matches.length} found` : '';

    if (matches.length === 0) {
      this.results.innerHTML = `<div class="board-search-empty">${I18n.__('no_results')}</div>`;
      return;
    }

    matches.forEach((item, i) => {
      const el = document.createElement('div');
      el.className = 'board-search-result';
      el.dataset.index = i;
      el.innerHTML = `
        <span class="board-search-result-icon">${this._iconForType(item.type)}</span>
        <span class="board-search-result-title">${Utils.escapeHtml(item.title || item.type)}</span>
      `;
      el.addEventListener('click', () => this._goToResult(i));
      el.addEventListener('mouseenter', () => { this.activeIndex = i; this._highlight(); });
      this.results.appendChild(el);
    });

    this.activeIndex = 0;
    this._highlight();
    this._ensureVisible();
  }

  _navigate(dir) {
    const items = this.results?.querySelectorAll('.board-search-result');
    if (!items || items.length === 0) return;
    this.activeIndex = (this.activeIndex + dir + items.length) % items.length;
    this._highlight();
    this._ensureVisible();
  }

  _highlight() {
    this.results?.querySelectorAll('.board-search-result').forEach((el, i) => {
      el.classList.toggle('active', i === this.activeIndex);
    });
  }

  _ensureVisible() {
    const el = this.results?.querySelector(`[data-index="${this.activeIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  _goToResult(index) {
    const item = (this._matches && this._matches[index]) || ItemManager.items[index];
    if (!item) return;
    ItemManager.deselectAll();
    ItemManager.selectItem(item.id);
    Canvas.panTo(item.position_x + item.width / 2, item.position_y + item.height / 2);
    this.close();
  }

  _iconForType(type) {
    const icons = {
      sticky_note: Icons.note, rich_note: Icons.richNote, sketch: Icons.sketch,
      link_card: Icons.link, roadmap: Icons.roadmap, image: Icons.camera,
      video: Icons.video, audio: Icons.mic, file: Icons.file
    };
    return icons[type] || Icons.board;
  }
}

try {
  Object.defineProperty(window, 'BoardSearch', { value: new _BoardSearch(), writable: false, configurable: true, enumerable: true });
} catch { window.BoardSearch = new _BoardSearch(); }
