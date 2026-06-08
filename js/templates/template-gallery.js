// ============================================
// Template Gallery UI
// ============================================

class _TemplateGallery {
  constructor() {
    this.selectedCategory = 'all';
  }

  show() {
    this._selectedTemplate = null;
    Modal.show({
      title: I18n.__('template_choose'),
      content: this._buildContent(),
      confirmText: I18n.__('create'),
      cancelText: I18n.__('untitled'),
      confirmStyle: 'primary',
      onConfirm: () => this._onConfirm(),
      onCancel: () => this._createBlankBoard()
    });

    requestAnimationFrame(() => this._bindEvents());
  }

  _buildContent() {
    const categories = TemplateEngine.getCategories();
    const templates = TemplateEngine.getTemplatesByCategory(this.selectedCategory);

    return `
      <div class="template-gallery">
        <div class="template-categories" style="
          display: flex;
          gap: var(--space-xs);
          flex-wrap: wrap;
          margin-bottom: var(--space-md);
          padding-bottom: var(--space-sm);
          border-bottom: 1px solid var(--hairline);
        ">
          ${categories.map(cat => `
            <button class="template-category-btn ${cat.id === this.selectedCategory ? 'active' : ''}"
              data-category="${cat.id}" style="
              padding: 6px 12px;
              border-radius: var(--radius-full);
              font-size: var(--text-xs);
              font-weight: var(--weight-medium);
              background: ${cat.id === this.selectedCategory ? 'var(--primary)' : 'var(--canvas-soft)'};
              color: ${cat.id === this.selectedCategory ? 'var(--ink-inverse)' : 'var(--ink-secondary)'};
              border: none;
              cursor: pointer;
              transition: var(--transition-fast);
              white-space: nowrap;
            ">${cat.icon} ${cat.name}</button>
          `).join('')}
        </div>

        <div class="template-grid" style="
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: var(--space-sm);
          max-height: 400px;
          overflow-y: auto;
          padding: var(--space-xs);
        ">
          ${templates.map(t => `
            <div class="template-card ${t.id === this._selectedTemplate ? 'selected' : ''}"
              data-template="${t.id}" style="
              padding: var(--space-md);
              border: 2px solid ${t.id === this._selectedTemplate ? 'var(--primary)' : 'var(--hairline)'};
              border-radius: var(--radius-md);
              cursor: pointer;
              transition: var(--transition-fast);
              background: ${t.id === this._selectedTemplate ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'var(--surface)'};
            ">
              <div style="font-size: var(--text-sm); font-weight: var(--weight-semibold); margin-bottom: var(--space-xs);">${t.name}</div>
              <div style="font-size: var(--text-xs); color: var(--ink-secondary); line-height: var(--leading-normal);">${t.description}</div>
              <div style="font-size: var(--text-xs); color: var(--ink-muted); margin-top: var(--space-xs);">${t.items.length} items</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  _bindEvents() {
    const modal = document.querySelector('.modal');
    if (!modal) return;

    modal.querySelectorAll('.template-category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedCategory = btn.dataset.category;
        this._refreshGallery();
      });
    });

    modal.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => {
        // Deselect previous
        modal.querySelectorAll('.template-card').forEach(c => {
          c.style.borderColor = 'var(--hairline)';
          c.style.background = 'var(--surface)';
          c.classList.remove('selected');
        });
        // Select this one
        card.style.borderColor = 'var(--primary)';
        card.style.background = 'color-mix(in srgb, var(--primary) 10%, transparent)';
        card.classList.add('selected');
        this._selectedTemplate = card.dataset.template;
      });
    });
  }

  _refreshGallery() {
    const modalBody = document.querySelector('.modal-body');
    if (!modalBody) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this._buildContent();
    const gallery = wrapper.querySelector('.template-gallery');
    if (gallery) {
      modalBody.innerHTML = '';
      modalBody.appendChild(gallery);
    }
    this._bindEvents();
  }

  async _onConfirm() {
    const title = this._selectedTemplate
      ? TemplateEngine.getTemplate(this._selectedTemplate)?.name || I18n.__('untitled')
      : I18n.__('untitled');

    const board = await BoardManager.create(title, this._selectedTemplate);

    if (this._selectedTemplate) {
      await TemplateEngine.applyTemplate(board.id, this._selectedTemplate);
    }

    Toast.show(I18n.__('board_created'), 'success');
    AppRouter.navigate(`/board/${board.id}`);
  }

  async _createBlankBoard() {
    const board = await BoardManager.create(I18n.__('untitled'));
    Toast.show(I18n.__('board_created'), 'success');
    AppRouter.navigate(`/board/${board.id}`);
  }
}

try {
  Object.defineProperty(window, 'TemplateGallery', { value: new _TemplateGallery(), writable: false, configurable: true, enumerable: true });
} catch { window.TemplateGallery = new _TemplateGallery(); }
