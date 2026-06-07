// ============================================
// BoardFlow Main Entry
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const bfProto = window.BoardFlowAuth ? Object.getPrototypeOf(window.BoardFlowAuth) : null;
    const expectedMethods = ['init', 'signIn', 'signUp', 'signOut', 'isAuthenticated', 'getUser', 'getUserId', 'onAuthChange'];
    const missingMethods = bfProto ? expectedMethods.filter(m => typeof bfProto[m] !== 'function') : expectedMethods;
    const diag = {
      BoardFlowAuth: typeof window.BoardFlowAuth + (window.BoardFlowAuth ? ' ownKeys=' + Object.keys(window.BoardFlowAuth).join(',') + ' missingMethods=' + (missingMethods.length ? missingMethods.join(',') : 'none') : ''),
      I18n: typeof window.I18n,
      supabase: typeof window.supabase,
      CONFIG: typeof window.CONFIG + (window.CONFIG ? ' url=' + (window.CONFIG.SUPABASE_URL || 'missing') : ''),
      CONFIG_URL_OK: window.CONFIG?.SUPABASE_URL?.includes('bqbxigifkazkqehmdyhn'),
      authLoadedAt: window.__BoardFlowAuth_loadedAt,
      scripts: Array.from(document.scripts).map(s => s.src.replace(location.origin, '')).join('|')
    };
    console.log('[BoardFlow boot diag]', diag);

    if (typeof window.BoardFlowAuth !== 'object' || missingMethods.length > 0) {
      showBootError('BoardFlowAuth module is broken (missing methods: ' + missingMethods.join(', ') + '). Try DevTools → Application → Service Workers → Unregister, then Ctrl+Shift+R.', diag);
      return;
    }
    if (typeof window.I18n === 'undefined' || typeof window.I18n.init !== 'function') {
      showBootError('I18n module failed to load.', diag);
      return;
    }

    // Init i18n
    await I18n.init();

    // Apply saved theme
    const savedTheme = localStorage.getItem('boardflow_theme') ?? 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Init auth
    await BoardFlowAuth.init();

    setupRoutes();
    setupAuthListener();

    AppRouter.start();
  } catch (err) {
    showBootError('Boot error: ' + (err?.message || String(err)), null, err);
    console.error(err);
  }
});

function showBootError(message, diag, err) {
  const pages = ['page-landing', 'page-about', 'page-privacy', 'page-terms', 'page-contact', 'page-login', 'page-signup', 'page-dashboard', 'page-board'];
  pages.forEach(id => document.getElementById(id)?.classList.remove('active'));
  let box = document.getElementById('boot-error');
  if (!box) {
    box = document.createElement('div');
    box.id = 'boot-error';
    box.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;background:#f6f5f4;z-index:9999;font-family:system-ui;overflow:auto;';
    document.body.appendChild(box);
  }
  const diagHtml = diag ? `<pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:11px;overflow:auto;margin:0 0 16px;line-height:1.5;max-height:320px;">${escapeHtml(JSON.stringify(diag, null, 2))}${err ? '\n\nSTACK:\n' + escapeHtml(err.stack || '') : ''}</pre>` : '';
  box.innerHTML = `
    <div style="max-width:640px;width:100%;background:#fff;border:1px solid #e6e6e6;border-radius:12px;padding:24px;box-shadow:0 4px 16px rgba(0,0,0,.08);">
      <h2 style="margin:0 0 8px;color:#d93025;font-size:18px;">BoardFlow failed to start</h2>
      <p style="margin:0 0 12px;color:#555;font-size:14px;line-height:1.5;">${escapeHtml(message)}</p>
      <p style="margin:0 0 16px;color:#888;font-size:13px;line-height:1.5;">Fix: open DevTools (F12) → Application → Service Workers → Unregister. Then hard-reload (Ctrl+Shift+R).</p>
      ${diagHtml}
      <button onclick="location.reload(true)" style="background:#0075de;color:#fff;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:14px;">Reload</button>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function setupRoutes() {
  const pages = {
    landing: document.getElementById('page-landing'),
    about: document.getElementById('page-about'),
    privacy: document.getElementById('page-privacy'),
    terms: document.getElementById('page-terms'),
    contact: document.getElementById('page-contact'),
    login: document.getElementById('page-login'),
    signup: document.getElementById('page-signup'),
    dashboard: document.getElementById('page-dashboard'),
    board: document.getElementById('page-board')
  };

  function showPage(name) {
    Object.values(pages).forEach(p => p?.classList.remove('active'));
    pages[name]?.classList.add('active');
  }

  AppRouter
    .on('/', (ctx) => {
      if (BoardFlowAuth.isAuthenticated()) {
        AppRouter.navigate('/dashboard');
        return;
      }
      showPage('landing');
    })
    .on('/about', (ctx) => {
      showPage('about');
    })
    .on('/privacy', (ctx) => {
      showPage('privacy');
    })
    .on('/terms', (ctx) => {
      showPage('terms');
    })
    .on('/contact', (ctx) => {
      showPage('contact');
    })
    .on('/login', (ctx) => {
      showPage('login');
      initLoginPage();
    })
    .on('/signup', (ctx) => {
      showPage('signup');
      initSignupPage();
    })
    .on('/dashboard', (ctx) => {
      if (!BoardFlowAuth.isAuthenticated()) {
        AppRouter.navigate('/');
        return;
      }
      showPage('dashboard');
      initDashboard();
    })
    .on('/board/:id', (ctx) => {
      if (!BoardFlowAuth.isAuthenticated()) {
        AppRouter.navigate('/');
        return;
      }
      showPage('board');
      initBoard(ctx.params.id);
    })
    .on('/board/shared/:token', async (ctx) => {
      if (!BoardFlowAuth.isAuthenticated()) {
        AppRouter.navigate('/');
        return;
      }
      const board = await BoardManager.getByShareToken(ctx.params.token);
      if (board) {
        AppRouter.navigate('/board/' + board.id);
      } else {
        Toast.show('Share link not found', 'error');
        AppRouter.navigate('/dashboard');
      }
    })
    .on('*', (ctx) => {
      showPage('landing');
    });

  AppRouter.beforeEach = (ctx) => {
    return true;
  };
}

function setupAuthListener() {
  BoardFlowAuth.onAuthChange((event, user) => {
    if (event === 'SIGNED_OUT') {
      AppRouter.navigate('/');
    }
  });

}

// ---- Dashboard ----

async function initDashboard() {
  Sidebar.init();
  await Sidebar.loadBoards();
  renderDashboardMain();
}

function renderDashboardMain() {
  const container = document.querySelector('#page-dashboard .main-content');
  if (!container) return;

  const boards = BoardManager.boards;

  if (boards.length === 0) {
    container.innerHTML = `
      <div class="dashboard-main">
        <div class="dashboard-empty">
          <div class="dashboard-empty-icon" style="color: var(--primary);">${Icons.board}</div>
          <h2 data-i18n="no_boards_yet">No boards yet</h2>
          <p data-i18n="no_boards_desc">Create your first board to get started. You can choose a template or start blank.</p>
          <button class="btn btn-primary" id="dashboard-new-board" style="display: flex; align-items: center; gap: var(--space-xs);">${Icons.plus} <span data-i18n="new_board">New Board</span></button>
        </div>
      </div>
    `;
    document.getElementById('dashboard-new-board')?.addEventListener('click', () => {
      TemplateGallery.show();
    });
  } else {
    container.innerHTML = `
      <div class="dashboard-main">
        <div class="dashboard-header">
          <h1 data-i18n="my_boards">My Boards</h1>
          <button class="btn btn-primary" id="dashboard-new-board" style="display: flex; align-items: center; gap: var(--space-xs);">${Icons.plus} <span data-i18n="new_board">New Board</span></button>
        </div>
        <div class="dashboard-grid" id="dashboard-grid">
          ${boards.map(board => `
            <div class="board-card" data-id="${board.id}">
              <div class="board-card-preview">
                <div class="board-icon" style="color: var(--primary);">${Icons.board}</div>
              </div>
              <div class="board-card-body">
                <div class="board-card-title">${Utils.escapeHtml(board.title)}</div>
                <div class="board-card-date">${formatDate(board.updated_at)}</div>
              </div>
              <div class="board-card-actions">
                <button class="btn board-rename" data-id="${board.id}" title="${I18n.__('rename')}">${Icons.edit}</button>
                <button class="btn board-delete" data-id="${board.id}" title="${I18n.__('delete')}">${Icons.trash}</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Event listeners
    document.getElementById('dashboard-new-board')?.addEventListener('click', () => {
      TemplateGallery.show();
    });

    container.querySelectorAll('.board-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.board-rename') || e.target.closest('.board-delete')) return;
        AppRouter.navigate('/board/' + card.dataset.id);
      });
    });

    container.querySelectorAll('.board-rename').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        renameBoard(btn.dataset.id);
      });
    });

    container.querySelectorAll('.board-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteBoard(btn.dataset.id);
      });
    });
  }
}

async function renameBoard(boardId) {
  const board = BoardManager.boards.find(b => b.id === boardId);
  if (!board) return;

  Modal.show({
    title: I18n.__('rename_title'),
    content: `
      <div class="form-group">
        <label for="rename-board-title">${I18n.__('board_title')}</label>
        <input type="text" id="rename-board-title" value="${Utils.escapeHtml(board.title)}">
      </div>
    `,
    confirmText: I18n.__('rename'),
    onConfirm: async () => {
      const title = document.getElementById('rename-board-title').value.trim();
      if (title) {
        await BoardManager.update(boardId, { title });
        Toast.show('Board renamed!', 'success');
        renderDashboardMain();
        Sidebar.loadBoards();
      }
    }
  });
}

async function deleteBoard(boardId) {
  const board = BoardManager.boards.find(b => b.id === boardId);
  if (!board) return;

  Modal.show({
    title: I18n.__('confirm_delete_title'),
    content: `<p>${I18n.__('confirm_delete', { title: Utils.escapeHtml(board.title) })}</p>`,
    confirmText: I18n.__('delete'),
    confirmStyle: 'danger',
    onConfirm: async () => {
      await BoardManager.delete(boardId);
      Toast.show('Board deleted', 'success');
      renderDashboardMain();
      Sidebar.loadBoards();
    }
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return I18n.__('just_now');
  if (diffMins < 60) return I18n.__('minutes_ago', { n: diffMins });
  if (diffHours < 24) return I18n.__('hours_ago', { n: diffHours });
  if (diffDays < 7) return I18n.__('days_ago', { n: diffDays });
  return d.toLocaleDateString();
}

async function initBoard(boardId) {
  // Clean up previous board state
  Canvas.destroy();
  Minimap.destroy();
  Connections.destroy();
  AIAssistant.destroy();
  BoardChat.destroy();
  BoardHistory.clear();
  AudioRecorder.destroy();
  VideoUpload.destroy();

  // Load items
  await ItemManager.loadItems(boardId);

  // Init canvas
  Canvas.init();

  // Init drag & drop (only once)
  if (!DragDrop._initialized) {
    DragDrop.init();
    DragDrop._initialized = true;
  }

  // Init selection (only once)
  if (!Selection._initialized) {
    Selection.init();
    Selection._initialized = true;
  }

  // Init minimap
  Minimap.init();

  // Init connections (SVG overlay)
  Connections.init();
  Connections.load(boardId);

  // Render items
  renderBoardItems();

  // Listen for item changes
  ItemManager.onItemsChange = () => {
    renderBoardItems();
    Connections.render();
    Minimap.render();
  };

  ItemManager.onSelectionChange = () => {
    if (Connections.isConnecting()) Connections._cleanupConnectMode();
    updateItemSelectionUI();
  };

  // Update zoom display
  Canvas.onZoomChange = (zoom) => {
    const zoomEl = document.getElementById('zoom-level');
    if (zoomEl) zoomEl.textContent = Math.round(zoom * 100) + '%';
    Minimap.render();
  };

  // Build toolbar
  renderBoardToolbar(boardId);

  // Minimap render on pan
  Canvas.onPanChange = () => Minimap.render();

  // Canvas right-click context menu
  const canvasEl = document.getElementById('canvas');
  if (canvasEl && !canvasEl._contextMenuBound) {
    canvasEl._contextMenuBound = true;
    canvasEl.addEventListener('contextmenu', (e) => {
      if (e.target.closest('.board-item')) return;
      e.preventDefault();
      const canvasPos = Canvas.screenToCanvas(e.clientX, e.clientY);
      ContextMenu.show(e.clientX, e.clientY, [
        { icon: Icons.note, label: I18n.__('add_note'), action: async () => {
          await ItemManager.createItem('sticky_note', {
            x: canvasPos.x, y: canvasPos.y,
            title: 'New Note', content: '', color: '#fffde7'
          });
        }},
        { icon: Icons.richNote, label: I18n.__('add_rich_note'), action: async () => {
          await ItemManager.createItem('rich_note', {
            x: canvasPos.x - 150, y: canvasPos.y - 125,
            title: 'New Note', content: '', width: 300, height: 250
          });
        }},
        { icon: Icons.sketch, label: I18n.__('add_sketch'), action: async () => {
          await ItemManager.createItem('sketch', {
            x: canvasPos.x - 200, y: canvasPos.y - 150,
            title: 'Sketch', width: 400, height: 300
          });
        }},
        { icon: Icons.upload, label: I18n.__('upload_file'), action: () => FileManager.show() },
        { icon: Icons.link, label: I18n.__('add_link'), action: () => {
          Modal.show({
            title: I18n.__('add_link'),
            content: `
              <div class="link-paste-area">
                <label for="link-url-ctx">${I18n.__('paste_url')}</label>
                <input type="url" id="link-url-ctx" class="link-paste-input" placeholder="https://example.com" autofocus>
              </div>
            `,
            confirmText: I18n.__('add'),
            onConfirm: async () => {
              const url = document.getElementById('link-url-ctx')?.value.trim();
              if (url) await LinkCard.createFromUrl(url, canvasPos.x - 160, canvasPos.y - 90);
            }
          });
        }},
        { icon: Icons.mic, label: I18n.__('record_audio'), action: () => AudioRecorder.recordAndUpload(canvasPos.x - 150, canvasPos.y - 40) },
        { icon: Icons.video, label: I18n.__('upload_video'), action: () => VideoUpload.uploadAndAdd(canvasPos.x - 200, canvasPos.y - 150) },
        { icon: Icons.camera, label: I18n.__('take_screenshot'), action: async () => {
          Toast.show(I18n.__('loading'), 'info');
          const result = await ScreenshotCapture.captureAndUpload();
          if (result) {
            await ItemManager.createItem('image', {
              x: canvasPos.x - 150, y: canvasPos.y - 125,
              width: 300, height: 250,
              title: 'Screenshot',
              file_url: result.url,
              file_provider: result.provider,
              file_id: result.id
            });
            Toast.show(I18n.__('done'), 'success');
          }
        }},
        { icon: Icons.roadmap, label: I18n.__('add_roadmap'), action: () => Roadmap.create(canvasPos.x - 160, canvasPos.y - 200) },
        { icon: Icons.brain, label: I18n.__('ai_assistant'), action: () => AIAssistant.toggle() },
        { icon: Icons.chat, label: I18n.__('board_chat'), action: () => BoardChat.open(ItemManager.boardId) },
        { icon: Icons.share, label: I18n.__('share_board'), action: () => ShareManager.showShareDialog(ItemManager.boardId) },
        { separator: true },
        { icon: Icons.grid, label: Canvas.gridEnabled ? I18n.__('hide_grid') : I18n.__('show_grid'), action: () => Canvas.toggleGrid() },
        { icon: Icons.resetView, label: I18n.__('reset_view'), action: () => Canvas.resetView() },
        { separator: true },
        { icon: Icons.check, label: I18n.__('select_all'), shortcut: 'Ctrl+A', action: () => {
          ItemManager.items.forEach(item => ItemManager.selectItem(item.id, true));
        }}
      ]);
    });
  }
}

function renderBoardToolbar(boardId) {
  const toolbar = document.getElementById('board-toolbar');
  if (!toolbar) return;

  toolbar.innerHTML = `
    <button class="toolbar-btn" id="tb-add-note" title="${I18n.__('add_note')}">${Icons.note}</button>
    <button class="toolbar-btn" id="tb-add-rich-note" title="${I18n.__('add_rich_note')}">${Icons.richNote}</button>
    <button class="toolbar-btn" id="tb-add-sketch" title="${I18n.__('add_sketch')}">${Icons.sketch}</button>
    <button class="toolbar-btn" id="tb-add-link" title="${I18n.__('add_link')}">${Icons.link}</button>
    <button class="toolbar-btn" id="tb-audio-record" title="${I18n.__('record_audio')}">${Icons.mic}</button>
    <button class="toolbar-btn" id="tb-video-upload" title="${I18n.__('upload_video')}">${Icons.video}</button>
    <button class="toolbar-btn" id="tb-roadmap" title="${I18n.__('add_roadmap')}">${Icons.roadmap}</button>
    <button class="toolbar-btn" id="tb-connect" title="${I18n.__('connect_items')}">${Icons.connect}</button>
    <button class="toolbar-btn" id="tb-upload" title="${I18n.__('upload_file')}">${Icons.upload}</button>
    <button class="toolbar-btn" id="tb-screenshot" title="${I18n.__('take_screenshot')}">${Icons.camera}</button>
    <div class="toolbar-divider"></div>
    <button class="toolbar-btn" id="tb-zoom-in" title="${I18n.__('zoom_in')}">${Icons.zoomIn}</button>
    <span class="toolbar-label" id="zoom-level">100%</span>
    <button class="toolbar-btn" id="tb-zoom-out" title="${I18n.__('zoom_out')}">${Icons.zoomOut}</button>
    <button class="toolbar-btn" id="tb-reset-view" title="${I18n.__('reset_view')}">${Icons.resetView}</button>
    <div class="toolbar-divider"></div>
    <button class="toolbar-btn" id="tb-toggle-grid" title="${I18n.__('toggle_grid')}">${Icons.grid}</button>
    <button class="toolbar-btn" id="tb-search" title="Search (Ctrl+F)">${Icons.search}</button>
    <button class="toolbar-btn" id="tb-undo" title="${I18n.__('undo')} (Ctrl+Z)" disabled>${Icons.undo}</button>
    <button class="toolbar-btn" id="tb-redo" title="${I18n.__('redo')} (Ctrl+Y)" disabled>${Icons.redo}</button>
    <div class="toolbar-divider"></div>
    <button class="toolbar-btn" id="tb-delete" title="${I18n.__('delete_selected')}">${Icons.trash}</button>
    <button class="toolbar-btn" id="tb-back" title="${I18n.__('back_to_dashboard')}">${Icons.arrowLeft}</button>
    <div class="toolbar-divider"></div>
    <button class="toolbar-btn" id="tb-export-png" title="Export PNG">${Icons.download}</button>
    <button class="toolbar-btn" id="tb-export-pdf" title="Export PDF">${Icons.exportFile}</button>
    <button class="toolbar-btn" id="tb-ai" title="${I18n.__('ai_assistant')}">${Icons.brain}</button>
    <button class="toolbar-btn" id="tb-chat" title="${I18n.__('board_chat')}">${Icons.chat}</button>
    <button class="toolbar-btn" id="tb-share" title="${I18n.__('share_board')}">${Icons.share}</button>
  `;

  document.getElementById('tb-add-note')?.addEventListener('click', async () => {
    const canvasEl = document.getElementById('canvas');
    const rect = canvasEl.getBoundingClientRect();
    await ItemManager.createItem('sticky_note', {
      x: (rect.width / 2 - Canvas.panX) / Canvas.zoom,
      y: (rect.height / 2 - Canvas.panY) / Canvas.zoom,
      title: 'New Note',
      content: '',
      color: '#fffde7'
    });
  });

  document.getElementById('tb-add-rich-note')?.addEventListener('click', async () => {
    const canvasEl = document.getElementById('canvas');
    const rect = canvasEl.getBoundingClientRect();
    await ItemManager.createItem('rich_note', {
      x: (rect.width / 2 - Canvas.panX) / Canvas.zoom - 150,
      y: (rect.height / 2 - Canvas.panY) / Canvas.zoom - 125,
      title: 'New Note',
      content: '',
      width: 300,
      height: 250
    });
  });

  document.getElementById('tb-add-sketch')?.addEventListener('click', async () => {
    const canvasEl = document.getElementById('canvas');
    const rect = canvasEl.getBoundingClientRect();
    await ItemManager.createItem('sketch', {
      x: (rect.width / 2 - Canvas.panX) / Canvas.zoom - 200,
      y: (rect.height / 2 - Canvas.panY) / Canvas.zoom - 150,
      title: 'Sketch',
      width: 400,
      height: 300
    });
  });

  document.getElementById('tb-add-link')?.addEventListener('click', () => {
    const canvasEl = document.getElementById('canvas');
    const rect = canvasEl.getBoundingClientRect();
    const x = (rect.width / 2 - Canvas.panX) / Canvas.zoom - 160;
    const y = (rect.height / 2 - Canvas.panY) / Canvas.zoom - 90;
    Modal.show({
      title: I18n.__('add_link'),
      content: `
        <div class="link-paste-area">
          <label for="link-url-input">${I18n.__('paste_url')}</label>
          <input type="url" id="link-url-input" class="link-paste-input" placeholder="https://example.com" autofocus>
        </div>
      `,
      confirmText: I18n.__('add'),
      onConfirm: async () => {
        const url = document.getElementById('link-url-input')?.value.trim();
        if (!url) return;
        await LinkCard.createFromUrl(url, x, y);
      }
    });
  });

  document.getElementById('tb-audio-record')?.addEventListener('click', async () => {
    const canvasEl = document.getElementById('canvas');
    const rect = canvasEl.getBoundingClientRect();
    const x = (rect.width / 2 - Canvas.panX) / Canvas.zoom - 150;
    const y = (rect.height / 2 - Canvas.panY) / Canvas.zoom - 40;
    await AudioRecorder.recordAndUpload(x, y);
  });

  document.getElementById('tb-video-upload')?.addEventListener('click', async () => {
    const canvasEl = document.getElementById('canvas');
    const rect = canvasEl.getBoundingClientRect();
    const x = (rect.width / 2 - Canvas.panX) / Canvas.zoom - 200;
    const y = (rect.height / 2 - Canvas.panY) / Canvas.zoom - 150;
    await VideoUpload.uploadAndAdd(x, y);
  });

  document.getElementById('tb-roadmap')?.addEventListener('click', async () => {
    const canvasEl = document.getElementById('canvas');
    const rect = canvasEl.getBoundingClientRect();
    const x = (rect.width / 2 - Canvas.panX) / Canvas.zoom - 160;
    const y = (rect.height / 2 - Canvas.panY) / Canvas.zoom - 200;
    await Roadmap.create(x, y);
  });

  document.getElementById('tb-connect')?.addEventListener('click', () => {
    const selected = ItemManager.getSelectedItems();
    if (selected.length === 0) {
      Toast.show(I18n.__('select_source_first'), 'info');
      return;
    }
    if (selected.length > 1) {
      const ids = [...ItemManager.selectedItems];
      Connections.addConnection(ids[0], ids[1]);
      if (ItemManager.boardId) Connections.save(ItemManager.boardId);
      Toast.show(I18n.__('connection_created'), 'success');
      return;
    }
    const sourceId = [...ItemManager.selectedItems][0];
    Connections.startConnectMode(sourceId);
    Toast.show(I18n.__('click_to_connect'), 'info');
  });

  document.getElementById('tb-upload')?.addEventListener('click', () => {
    FileManager.show();
  });

  document.getElementById('tb-screenshot')?.addEventListener('click', async () => {
    Toast.show(I18n.__('loading'), 'info');
    const result = await ScreenshotCapture.captureAndUpload();
    if (result) {
      const canvasEl = document.getElementById('canvas');
      const rect = canvasEl.getBoundingClientRect();
      const x = (rect.width / 2 - Canvas.panX) / Canvas.zoom - 150;
      const y = (rect.height / 2 - Canvas.panY) / Canvas.zoom - 100;
      await ItemManager.createItem('image', {
        x, y, width: 300, height: 250,
        title: 'Screenshot',
        file_url: result.url,
        file_provider: result.provider,
        file_id: result.id
      });
      Toast.show(I18n.__('done'), 'success');
    } else {
      Toast.show(I18n.__('error_occurred'), 'error');
    }
  });

  document.getElementById('tb-zoom-in')?.addEventListener('click', () => Canvas.zoomIn());
  document.getElementById('tb-zoom-out')?.addEventListener('click', () => Canvas.zoomOut());
  document.getElementById('tb-reset-view')?.addEventListener('click', () => Canvas.resetView());
  document.getElementById('tb-toggle-grid')?.addEventListener('click', () => Canvas.toggleGrid());
  document.getElementById('tb-search')?.addEventListener('click', () => BoardSearch.show());
  document.getElementById('tb-delete')?.addEventListener('click', () => ItemManager.deleteSelected());
  document.getElementById('tb-back')?.addEventListener('click', () => AppRouter.navigate('/dashboard'));

  document.getElementById('tb-export-png')?.addEventListener('click', () => BoardExport.exportPNG());
  document.getElementById('tb-export-pdf')?.addEventListener('click', () => BoardExport.exportPDF());
  document.getElementById('tb-ai')?.addEventListener('click', () => AIAssistant.toggle());

  document.getElementById('tb-chat')?.addEventListener('click', () => {
    if (BoardChat.isOpen) {
      BoardChat.close();
    } else {
      BoardChat.open(ItemManager.boardId);
    }
  });

  document.getElementById('tb-share')?.addEventListener('click', () => {
    ShareManager.showShareDialog(ItemManager.boardId);
  });

  // Undo/Redo
  document.getElementById('tb-undo')?.addEventListener('click', () => handleUndo());
  document.getElementById('tb-redo')?.addEventListener('click', () => handleRedo());

  BoardHistory.onUpdate = (canUndo, canRedo) => {
    const undoBtn = document.getElementById('tb-undo');
    const redoBtn = document.getElementById('tb-redo');
    if (undoBtn) undoBtn.disabled = !canUndo;
    if (redoBtn) redoBtn.disabled = !canRedo;
  };

  // Keyboard shortcuts (remove previous handler if any)
  if (window._boardKeyboardHandler) {
    window.removeEventListener('keydown', window._boardKeyboardHandler);
  }
  window._boardKeyboardHandler = handleBoardKeyboard;
  window.addEventListener('keydown', handleBoardKeyboard);
}

function renderBoardItems() {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  // Clean up sketch tools before removing elements
  container.querySelectorAll('.board-item').forEach(el => {
    if (el._sketchTool) {
      el._sketchTool.destroy();
      el._sketchTool = null;
    }
    el.remove();
  });

  ItemManager.items.forEach(item => {
    const el = createItemElement(item);
    container.appendChild(el);
  });
}

function createItemElement(item) {
  let el;

  if (item.type === 'sticky_note') {
    el = StickyNote.render(item);
  } else if (item.type === 'rich_note') {
    el = RichNote.render(item);
  } else if (item.type === 'sketch') {
    el = document.createElement('div');
    el.className = `board-item sketch-item ${ItemManager.selectedItems.has(item.id) ? 'selected' : ''}`;
    el.dataset.id = item.id;
    el.dataset.type = 'sketch';
    el.style.cssText = `
      position: absolute;
      left: 0; top: 0;
      width: ${item.width}px;
      height: ${item.height}px;
      transform: translate(${item.position_x}px, ${item.position_y}px) rotate(${item.rotation}deg);
      z-index: ${item.z_index};
    `;
    el.innerHTML = `<div class="sketch-container" style="width: 100%; height: 100%;"></div>`;

    // Init sketch tool after element is in DOM
    requestAnimationFrame(() => {
      const container = el.querySelector('.sketch-container');
      if (container) {
        const sketch = new SketchTool();
        sketch.init(container, item);
        sketch.onSave = (itemId, data) => {
          ItemManager.updateItem(itemId, { sketch_data: data });
        };
        el._sketchTool = sketch;
      }
    });
  } else if (item.type === 'link_card') {
    el = LinkCard.render(item);
  } else if (item.type === 'roadmap') {
    el = Roadmap.render(item);
  } else if (item.type === 'image') {
    el = document.createElement('div');
    el.className = `board-item file-item ${ItemManager.selectedItems.has(item.id) ? 'selected' : ''}`;
    el.dataset.id = item.id;
    el.dataset.type = 'image';
    el.style.cssText = `
      position: absolute;
      left: 0; top: 0;
      width: ${item.width}px;
      height: ${item.height}px;
      transform: translate(${item.position_x}px, ${item.position_y}px) rotate(${item.rotation}deg);
      z-index: ${item.z_index};
    `;
    const imgUrl = item.file_url || '';
    el.innerHTML = `
      <div class="file-item-preview">
        ${imgUrl ? `<img src="${Utils.escapeHtml(imgUrl)}" alt="${Utils.escapeHtml(item.title || '')}" loading="lazy">` : `<div class="file-icon" style="color: var(--ink-muted);">${Icons.camera}</div>`}
      </div>
      <div class="file-item-info">${Utils.escapeHtml(item.title || 'Image')}</div>
    `;
  } else if (item.type === 'video') {
    el = document.createElement('div');
    el.className = `board-item file-item media-player-item ${ItemManager.selectedItems.has(item.id) ? 'selected' : ''}`;
    el.dataset.id = item.id;
    el.dataset.type = 'video';
    el.style.cssText = `
      position: absolute;
      left: 0; top: 0;
      width: ${item.width}px;
      height: ${item.height}px;
      transform: translate(${item.position_x}px, ${item.position_y}px) rotate(${item.rotation}deg);
      z-index: ${item.z_index};
    `;
    el.innerHTML = `
      <div class="file-item-preview" style="background: #000; padding: 0; cursor: pointer;">
        ${item.file_url ? `<video src="${Utils.escapeHtml(item.file_url)}" style="width:100%;height:100%;object-fit:contain;"></video>` : `<div class="file-icon" style="color: var(--ink-muted);">${Icons.video}</div>`}
      </div>
      <div class="file-item-info">${Utils.escapeHtml(item.title || 'Video')}</div>
    `;
    if (item.file_url) {
      el.addEventListener('click', () => MediaPlayer.play(item.file_url, 'video', item.title));
    }
  } else if (item.type === 'audio') {
    el = document.createElement('div');
    el.className = `board-item file-item media-player-item ${ItemManager.selectedItems.has(item.id) ? 'selected' : ''}`;
    el.dataset.id = item.id;
    el.dataset.type = 'audio';
    el.style.cssText = `
      position: absolute;
      left: 0; top: 0;
      width: ${item.width}px;
      height: ${item.height}px;
      transform: translate(${item.position_x}px, ${item.position_y}px) rotate(${item.rotation}deg);
      z-index: ${item.z_index};
    `;
    el.innerHTML = `
      <div class="file-item-preview" style="background: var(--canvas-soft); cursor: pointer;">
        <div class="file-icon" style="color: var(--ink-muted);">${Icons.mic}</div>
      </div>
      <div class="file-item-info">${Utils.escapeHtml(item.title || 'Audio')}</div>
    `;
    if (item.file_url) {
      el.addEventListener('click', () => MediaPlayer.play(item.file_url, 'audio', item.title));
    }
  } else if (item.type === 'file') {
    el = document.createElement('div');
    el.className = `board-item file-item ${ItemManager.selectedItems.has(item.id) ? 'selected' : ''}`;
    el.dataset.id = item.id;
    el.dataset.type = 'file';
    el.style.cssText = `
      position: absolute;
      left: 0; top: 0;
      width: ${item.width}px;
      height: ${item.height}px;
      transform: translate(${item.position_x}px, ${item.position_y}px) rotate(${item.rotation}deg);
      z-index: ${item.z_index};
    `;
    el.innerHTML = `
      <div class="file-item-preview">
        <div class="file-icon" style="color: var(--ink-muted);">${Icons.file}</div>
      </div>
      <div class="file-item-info">${Utils.escapeHtml(item.title || 'File')}</div>
    `;
    if (item.file_url) {
      el.style.cursor = 'pointer';
      el.addEventListener('dblclick', () => window.open(item.file_url, '_blank'));
    }
  } else {
    el = document.createElement('div');
    el.className = `board-item ${ItemManager.selectedItems.has(item.id) ? 'selected' : ''}`;
    el.dataset.id = item.id;
    el.dataset.type = item.type;
    el.style.cssText = `
      position: absolute;
      left: 0; top: 0;
      width: ${item.width}px;
      height: ${item.height}px;
      transform: translate(${item.position_x}px, ${item.position_y}px) rotate(${item.rotation}deg);
      z-index: ${item.z_index};
    `;
    el.innerHTML = `
      <div style="padding: 16px; color: var(--ink-secondary); font-size: var(--text-sm); background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--radius-md); height: 100%;">
        ${item.type}: ${Utils.escapeHtml(item.title || '')}
      </div>
    `;
  }

  // Add selected class
  if (ItemManager.selectedItems.has(item.id)) {
    el.classList.add('selected');
  }

  // Resize handles
  ['nw', 'ne', 'sw', 'se'].forEach(dir => {
    const handle = document.createElement('div');
    handle.className = `item-resize-handle ${dir}`;
    handle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      startResize(item, dir, e);
    });
    el.appendChild(handle);
  });

  // Rotate handle
  const rotateHandle = document.createElement('div');
  rotateHandle.className = 'item-rotate-handle';
  rotateHandle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    startRotate(item, e);
  });
  el.appendChild(rotateHandle);

  return el;
}

function updateItemSelectionUI() {
  document.querySelectorAll('.board-item').forEach(el => {
    el.classList.toggle('selected', ItemManager.selectedItems.has(el.dataset.id));
  });
}

function startResize(item, dir, e) {
  pushHistoryState();
  const startX = e.clientX;
  const startY = e.clientY;
  const startW = item.width;
  const startH = item.height;
  const startPosX = item.position_x;
  const startPosY = item.position_y;

  function onMove(e) {
    const dx = (e.clientX - startX) / Canvas.zoom;
    const dy = (e.clientY - startY) / Canvas.zoom;

    let newW = startW, newH = startH, newX = startPosX, newY = startPosY;

    if (dir.includes('e')) newW = Math.max(50, startW + dx);
    if (dir.includes('w')) { newW = Math.max(50, startW - dx); newX = startPosX + (startW - newW); }
    if (dir.includes('s')) newH = Math.max(50, startH + dy);
    if (dir.includes('n')) { newH = Math.max(50, startH - dy); newY = startPosY + (startH - newH); }

    item.width = newW;
    item.height = newH;
    item.position_x = newX;
    item.position_y = newY;

    const el = document.querySelector(`[data-id="${item.id}"]`);
    if (el) {
      el.style.width = newW + 'px';
      el.style.height = newH + 'px';
      el.style.transform = `translate(${newX}px, ${newY}px) rotate(${item.rotation}deg)`;
    }
  }

  function onUp() {
    ItemManager.updateItem(item.id, { width: item.width, height: item.height, position_x: item.position_x, position_y: item.position_y });
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  }

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

function startRotate(item, e) {
  pushHistoryState();
  const el = document.querySelector(`[data-id="${item.id}"]`);
  if (!el) return;

  // Compute center from item position and dimensions, not bounding rect
  const canvasEl = document.getElementById('canvas');
  const canvasRect = canvasEl.getBoundingClientRect();
  const centerX = canvasRect.left + Canvas.panX + item.position_x * Canvas.zoom + (item.width * Canvas.zoom) / 2;
  const centerY = canvasRect.top + Canvas.panY + item.position_y * Canvas.zoom + (item.height * Canvas.zoom) / 2;

  function onMove(e) {
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI) + 90;
    item.rotation = Math.round(angle);
    el.style.transform = `translate(${item.position_x}px, ${item.position_y}px) rotate(${item.rotation}deg)`;
  }

  function onUp() {
    ItemManager.updateItem(item.id, { rotation: item.rotation });
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  }

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

// ---- Undo/Redo ----

function handleUndo() {
  const state = {
    items: ItemManager.items.map(i => ({ ...i })),
    selectedIds: [...ItemManager.selectedItems]
  };
  const prev = BoardHistory.undo(state);
  if (prev) {
    ItemManager.items = prev.items;
    ItemManager.selectedItems = new Set(prev.selectedIds);
    ItemManager._saveLocal();
    renderBoardItems();
    updateItemSelectionUI();
    Minimap?.render();
  }
}

function handleRedo() {
  const state = {
    items: ItemManager.items.map(i => ({ ...i })),
    selectedIds: [...ItemManager.selectedItems]
  };
  const next = BoardHistory.redo(state);
  if (next) {
    ItemManager.items = next.items;
    ItemManager.selectedItems = new Set(next.selectedIds);
    ItemManager._saveLocal();
    renderBoardItems();
    updateItemSelectionUI();
    Minimap?.render();
  }
}

function pushHistoryState() {
  BoardHistory.push({
    items: ItemManager.items.map(i => ({ ...i })),
    selectedIds: [...ItemManager.selectedItems]
  });
}

// ---- Keyboard Shortcuts ----

function handleBoardKeyboard(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

    if ((e.key === 'f' || e.key === 'F') && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      BoardSearch.show();
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
    if (ItemManager.selectedItems.size > 0) {
      pushHistoryState();
      ItemManager.deleteSelected();
    }
  } else if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
    e.preventDefault();
    handleUndo();
  } else if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
    e.preventDefault();
    handleRedo();
  } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    ItemManager.items.forEach(item => ItemManager.selectItem(item.id, true));
  } else if (e.key === 'Escape') {
    ItemManager.deselectAll();
  }
}
