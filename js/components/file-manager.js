// ============================================
// File Manager Component
// ============================================

class FileManager {
  constructor() {
    this.files = [];
  }

  async show() {
    await this._loadFiles();

    Modal.show({
      title: 'File Manager',
      content: this._buildContent(),
      confirmText: 'Done',
      cancelText: '',
      hideCancel: true,
      onConfirm: () => this.close()
    });

    requestAnimationFrame(() => this._bindEvents());
  }

  _buildContent() {
    const fileCards = this.files.map(f => `
      <div class="fm-file" data-id="${f.id}" style="
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-md);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: var(--transition-fast);
      ">
        <div style="font-size: 24px; flex-shrink: 0;">${ImageUtils.getFileIcon(f.mimeType || f.type)}</div>
        <div style="flex: 1; min-width: 0;">
          <div class="fm-file-name" style="font-size: var(--text-sm); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${Utils.escapeHtml(f.name)}</div>
          <div style="font-size: var(--text-xs); color: var(--ink-muted);">${ImageUtils.formatFileSize(f.size || 0)}</div>
        </div>
        <button class="btn btn-ghost fm-insert" data-id="${f.id}" style="padding: 4px 8px; font-size: var(--text-xs);">Add to Board</button>
        <button class="btn btn-ghost fm-download" data-id="${f.id}" title="Download" aria-label="Download ${Utils.escapeHtml(f.name)}" style="padding: 4px 8px;">⬇</button>
      </div>
    `).join('');

    return `
      <div class="file-manager" style="min-height: 300px;">
        <div class="fm-actions" style="
          display: flex;
          gap: var(--space-sm);
          margin-bottom: var(--space-md);
          padding-bottom: var(--space-sm);
          border-bottom: 1px solid var(--hairline);
        ">
          <button class="btn btn-primary btn-sm" id="fm-upload">Upload Files</button>
          <button class="btn btn-secondary btn-sm" id="fm-screenshot">Take Screenshot</button>
        </div>
        <input type="file" id="fm-file-input" multiple style="display: none;">

        <div class="fm-search" style="margin-bottom: var(--space-sm);">
          <input type="text" id="fm-search" placeholder="Search files..." style="
            width: 100%;
            padding: 8px var(--space-md);
            background: var(--canvas-soft);
            border: 1px solid var(--hairline);
            border-radius: var(--radius-md);
            font-size: var(--text-sm);
          ">
        </div>

        <div class="fm-list" style="max-height: 350px; overflow-y: auto;">
          ${fileCards || '<div style="text-align: center; padding: var(--space-xl); color: var(--ink-muted);">No files yet. Upload one!</div>'}
        </div>
      </div>
    `;
  }

  async _loadFiles() {
    this.files = [];

    if (typeof puter !== 'undefined') {
      try {
        const list = await puter.fs.read('BoardFlow/');
        if (list && Array.isArray(list)) {
          this.files = list.map(item => ({
            id: item.id || item.path,
            name: item.name || item.path?.split('/').pop(),
            path: item.path,
            size: item.size || 0,
            mimeType: item.mime_type || 'application/octet-stream',
            type: 'file',
            source: 'puter'
          }));
        }
      } catch (err) {
        console.log('Puter files not available, using local files');
      }
    }

    // Add local cached files
    const localFiles = localStorage.getItem('boardflow_uploaded_files');
    if (localFiles) {
      try {
        const parsed = JSON.parse(localFiles);
        this.files = [...parsed, ...this.files];
      } catch {}
    }
  }

  _bindEvents() {
    document.getElementById('fm-upload')?.addEventListener('click', () => {
      document.getElementById('fm-file-input')?.click();
    });

    document.getElementById('fm-file-input')?.addEventListener('change', async (e) => {
      const files = e.target.files;
      if (!files.length) return;

      for (const file of files) {
        await this._handleFileUpload(file);
      }

      Toast.show(`${files.length} file(s) uploaded`, 'success');
      this._refresh();
    });

    document.getElementById('fm-screenshot')?.addEventListener('click', async () => {
      Toast.show('Taking screenshot...', 'info');
      const result = await ScreenshotCapture.captureAndUpload();
      if (result) {
        this._saveLocalFile(result, 'screenshot.png');
        Toast.show('Screenshot captured', 'success');
        this._refresh();
      } else {
        Toast.show('Screenshot failed', 'error');
      }
    });

    document.getElementById('fm-search')?.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      document.querySelectorAll('.fm-file').forEach(el => {
        const name = el.querySelector('.fm-file-name')?.textContent?.toLowerCase() || '';
        el.style.display = name.includes(query) ? 'flex' : 'none';
      });
    });

    document.querySelectorAll('.fm-insert').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const file = this.files.find(f => f.id === btn.dataset.id);
        if (!file) return;
        this._addToBoard(file);
      });
    });

    document.querySelectorAll('.fm-download').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const file = this.files.find(f => f.id === btn.dataset.id);
        if (!file) return;
        this._downloadFile(file);
      });
    });

    document.querySelectorAll('.fm-file').forEach(el => {
      el.addEventListener('mouseenter', () => el.style.background = 'var(--canvas-soft)');
      el.addEventListener('mouseleave', () => el.style.background = '');
    });
  }

  async _handleFileUpload(file) {
    const result = await ImageUtils.uploadFile(file);
    if (result) {
      const entry = {
        id: result.id,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        url: result.url,
        provider: result.provider
      };
      this._saveLocalFile(entry);
    } else {
      Toast.show(`Upload failed for ${file.name}`, 'error');
    }
  }

  _saveLocalFile(entry) {
    const stored = localStorage.getItem('boardflow_uploaded_files');
    let files = stored ? JSON.parse(stored) : [];
    files.unshift(entry);
    localStorage.setItem('boardflow_uploaded_files', JSON.stringify(files));
  }

  _addToBoard(file) {
    const isImage = file.mimeType?.startsWith('image/');
    const isVideo = file.mimeType?.startsWith('video/');
    const isAudio = file.mimeType?.startsWith('audio/');

    const canvasEl = document.getElementById('canvas');
    const rect = canvasEl.getBoundingClientRect();
    const x = (rect.width / 2 - Canvas.panX) / Canvas.zoom - 150;
    const y = (rect.height / 2 - Canvas.panY) / Canvas.zoom - 100;

    let type = 'file';
    if (isImage) type = 'image';
    else if (isVideo) type = 'video';
    else if (isAudio) type = 'audio';

    ItemManager.createItem(type, {
      x, y,
      width: isImage ? 300 : 350,
      height: isImage ? 250 : 200,
      title: file.name,
      file_url: file.url || null,
      file_provider: file.provider || null,
      file_id: file.id || null
    });

    Toast.show('File added to board', 'success');
    Modal.close();
  }

  _downloadFile(file) {
    if (file.url) {
      window.open(file.url, '_blank');
    }
  }

  _refresh() {
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) {
      modalBody.innerHTML = this._buildContent();
      this._bindEvents();
    }
  }
}

window.FileManager = new FileManager();
