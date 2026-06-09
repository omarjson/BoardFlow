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
      showBootError(`BoardFlowAuth module is broken (missing methods: ${missingMethods.join(', ')}). Try DevTools → Application → Service Workers → Unregister, then Ctrl+Shift+R.`, diag);
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
    showBootError(`Boot error: ${err?.message || String(err)}`, null, err);
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
      <button onclick="location.reload(true)" style="background:var(--primary);color:var(--primary-on);border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:14px;">Reload</button>
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
    designSystem: document.getElementById('page-design-system'),
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
    .on('/', () => {
      if (BoardFlowAuth.isAuthenticated()) {
        AppRouter.navigate('/dashboard');
        return;
      }
      showPage('landing');
    })
    .on('/about', () => {
      showPage('about');
    })
    .on('/privacy', () => {
      showPage('privacy');
    })
    .on('/terms', () => {
      showPage('terms');
    })
    .on('/design-system', () => {
      showPage('designSystem');
      if (window.DesignSystem) DesignSystem.init();
    })
    .on('/contact', () => {
      showPage('contact');
    })
    .on('/login', () => {
      showPage('login');
      initLoginPage();
    })
    .on('/signup', () => {
      showPage('signup');
      initSignupPage();
    })
    .on('/dashboard', () => {
      if (!BoardFlowAuth.isAuthenticated()) {
        AppRouter.navigate('/');
        return;
      }
      showPage('dashboard');
      initDashboard();
    })
    .on('/settings', () => {
      if (!BoardFlowAuth.isAuthenticated()) {
        AppRouter.navigate('/');
        return;
      }
      showPage('dashboard');
      Sidebar.init();
      Settings.render();
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
      try {
        const board = await BoardManager.getByShareToken(ctx.params.token);
        if (board) {
          showPage('board');
          initBoard(board.id);
        } else {
          Toast.show('Share link not found', 'error');
          AppRouter.navigate('/');
        }
      } catch (err) {
        console.error('Failed to load shared board:', err);
        Toast.show('Failed to load shared board', 'error');
        AppRouter.navigate('/');
      }
    })
    .on('*', () => {
      showPage('landing');
    });
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
          <div class="dashboard-empty-templates">
            <button class="btn btn-primary" id="dashboard-new-board" style="display: flex; align-items: center; gap: var(--space-xs);">${Icons.plus} <span data-i18n="new_board">New Board</span></button>
            <button class="btn btn-glass" id="dashboard-template-board" data-i18n="browse_templates">Browse Templates</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('dashboard-new-board')?.addEventListener('click', () => {
      Modal.show({
        title: I18n.__('new_board'),
        content: '<div class="form-group"><label for="new-board-title">' + I18n.__('board_title') + '</label><input type="text" id="new-board-title" placeholder="' + I18n.__('board_title') + '" autofocus></div>',
        confirmText: I18n.__('create'),
        onConfirm: async () => {
          const title = document.getElementById('new-board-title').value.trim() || 'Untitled Board';
          const board = await BoardManager.create(title);
          Toast.show('Board created!', 'success');
          AppRouter.navigate('/board/' + board.id);
        }
      });
    });
    document.getElementById('dashboard-template-board')?.addEventListener('click', () => TemplateGallery.show());
    return;
  }

  // Apply saved sort
  const savedSort = localStorage.getItem('boardflow_sort_mode') || 'newest';
  sortBoards(savedSort);

  // Pre-read all item counts once (avoid N localStorage reads in render loop)
  try { window._dashboardItemCounts = JSON.parse(localStorage.getItem('boardflow_item_counts') || '{}'); } catch { window._dashboardItemCounts = {}; }

  // Restore search query
  const savedQuery = localStorage.getItem('boardflow_search_query') || '';

  const favorites = BoardManager.getFavorites();
  const recentIds = BoardManager.getRecentBoardIds();
  const currentView = localStorage.getItem('boardflow_view_mode') || 'grid';

  // Separate boards into groups
  const favoriteBoards = boards.filter(b => favorites.includes(b.id));
  const recentBoards = recentIds.map(id => boards.find(b => b.id === id)).filter(Boolean);
  const allBoards = boards;

  container.innerHTML = `
    <div class="dashboard-main">
      <div class="dashboard-header">
        <div class="dashboard-header-left">
          <h1 data-i18n="my_boards">My Boards</h1>
          <span class="dashboard-board-count" aria-live="polite">${boards.length} ${boards.length === 1 ? 'board' : 'boards'}</span>
        </div>
        <div class="dashboard-header-center">
          <div class="dashboard-search">
            <span class="dashboard-search-icon">${Icons.search}</span>
            <input type="text" id="dashboard-search-input" class="dashboard-search-input" placeholder="Search boards by name..." data-i18n-placeholder="search_boards" value="${Utils.escapeHtml(savedQuery)}">
          </div>
        </div>
        <div class="dashboard-header-right">
          <select id="dashboard-sort" class="dashboard-sort">
            <option value="newest" data-i18n="sort_newest">Newest</option>
            <option value="oldest" data-i18n="sort_oldest">Oldest</option>
            <option value="alpha" data-i18n="sort_az">A-Z</option>
            <option value="alpha-desc" data-i18n="sort_za">Z-A</option>
          </select>
          <div class="dashboard-view-toggle">
            <button class="dashboard-view-btn${currentView === 'grid' ? ' active' : ''}" data-view="grid" title="Grid view">${Icons.grid}</button>
            <button class="dashboard-view-btn${currentView === 'list' ? ' active' : ''}" data-view="list" title="List view">${Icons.menu}</button>
          </div>
          <button class="btn btn-primary" id="dashboard-new-board" style="display: flex; align-items: center; gap: var(--space-xs);">${Icons.plus} <span data-i18n="new_board">New Board</span></button>
        </div>
      </div>
      <div class="dashboard-sections" id="dashboard-sections" aria-live="polite" aria-label="Board sections">
        ${recentBoards.length > 0 ? renderSection('Recent', recentBoards, 'recent-boards', 'row') : ''}
        ${favoriteBoards.length > 0 ? renderSection('Favorites', favoriteBoards, 'favorite-boards', 'row') : ''}
        ${renderSection('All Boards', allBoards, 'all-boards', 'grid')}
      </div>
    </div>
  `;

  document.body.classList.toggle('dashboard-list-view', currentView === 'list');

  // -- Event Listeners --

  document.getElementById('dashboard-new-board')?.addEventListener('click', () => {
    Modal.show({
      title: I18n.__('new_board'),
      content: '<div class="form-group"><label for="new-board-title">' + I18n.__('board_title') + '</label><input type="text" id="new-board-title" placeholder="' + I18n.__('board_title') + '" autofocus></div>',
      confirmText: I18n.__('create'),
      onConfirm: async () => {
        const title = document.getElementById('new-board-title').value.trim() || 'Untitled Board';
        const board = await BoardManager.create(title);
        Toast.show('Board created!', 'success');
        AppRouter.navigate('/board/' + board.id);
      }
    });
  });

  // View toggle
  document.querySelectorAll('.dashboard-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dashboard-view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      document.body.classList.toggle('dashboard-list-view', view === 'list');
      localStorage.setItem('boardflow_view_mode', view);
    });
  });

  // Sort
  const sortSel = document.getElementById('dashboard-sort');
  if (sortSel) {
    sortSel.value = localStorage.getItem('boardflow_sort_mode') || 'newest';
    sortSel.addEventListener('change', (e) => {
      localStorage.setItem('boardflow_sort_mode', e.target.value);
      renderDashboardMain();
    });
  }

  // Search
  document.getElementById('dashboard-search-input')?.addEventListener('input', debounce(() => {
    const input = document.getElementById('dashboard-search-input');
    if (!input) return;
    const q = input.value;
    localStorage.setItem('boardflow_search_query', q);
    filterDashboardBoards(q);
  }, 200));

  // Board cards
  wireDashboardCards(container);

  // Re-apply active search filter after render
  if (savedQuery) filterDashboardBoards(savedQuery);

  // Context menu clicks (global)
  if (window._dashboardContextHandler) document.removeEventListener('click', window._dashboardContextHandler);
  window._dashboardContextHandler = (e) => {
    if (!e.target.closest('.board-card-context')) {
      document.querySelectorAll('.board-card-context.open').forEach(m => m.classList.remove('open'));
    }
  };
  document.addEventListener('click', window._dashboardContextHandler);
}

function renderSection(label, boards, id, layout) {
  const count = boards.length;
  const isRow = layout === 'row';
  return `
    <div class="dashboard-section" id="section-${id}">
      <div class="dashboard-section-header">
        <span class="dashboard-section-label">${label}</span>
        <span class="dashboard-section-count">${count}</span>
      </div>
      <${isRow ? 'div class="dashboard-section-row"' : 'div class="dashboard-grid"'} id="${id}">
        ${boards.map((board, i) => createBoardCardHTML(board, i)).join('')}
      </${isRow ? 'div' : 'div'}>
    </div>
  `;
}

function createBoardCardHTML(board, index) {
  const isFav = BoardManager.isFavorite(board.id);
  const itemCount = window._dashboardItemCounts?.[board.id] ?? null;
  const previewColor = getBoardPreviewColor(board);
  const firstLetter = (board.title || 'B').charAt(0).toUpperCase();

  return `
    <div class="board-card" data-id="${board.id}" style="--card-index: ${index};" role="button" tabindex="0" aria-label="${Utils.escapeHtml(board.title)}">
      <button class="board-card-star${isFav ? ' active' : ''}" data-id="${board.id}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}" aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}">${isFav ? '★' : '☆'}</button>
      <button class="board-card-menu" data-id="${board.id}" title="More actions" aria-label="More actions" aria-haspopup="true">⋯</button>
      <div class="board-card-preview">
        <div class="preview-placeholder" style="background: ${previewColor};">
          ${generateMiniPreviewSVG(board, previewColor, firstLetter)}
        </div>
      </div>
      <div class="board-card-body">
        <div class="board-card-title" title="${Utils.escapeHtml(board.title)}">${Utils.escapeHtml(board.title)}</div>
        <div class="board-card-meta">
          ${itemCount !== null ? `<span class="board-card-meta-item">${itemCount} ${itemCount === 1 ? 'item' : 'items'}</span><span class="board-card-meta-divider">·</span>` : ''}
          <span class="board-card-meta-date">${formatDate(board.updated_at)}</span>
        </div>
        ${board.template ? `<div class="board-card-badges"><span class="board-card-badge">${Utils.escapeHtml(board.template)}</span></div>` : ''}
      </div>
      <div class="board-card-context" data-id="${board.id}" role="menu" aria-label="Board actions">
        <button class="context-rename" data-id="${board.id}" role="menuitem">${Icons.edit} Rename</button>
        <button class="context-favorite" data-id="${board.id}" role="menuitem">${isFav ? Icons.starFill : Icons.star} ${isFav ? 'Remove Favorite' : 'Add to Favorites'}</button>
        <button class="context-share" data-id="${board.id}" role="menuitem">${Icons.share} Share</button>
        <hr>
        <button class="context-duplicate" data-id="${board.id}" role="menuitem">${Icons.board} Duplicate</button>
        <button class="context-delete danger" data-id="${board.id}" role="menuitem">${Icons.trash} Delete</button>
      </div>
    </div>
  `;
}

function generateMiniPreviewSVG(board, color, letter) {
  const isDark = isColorDark(color);
  const textColor = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.6)';
  const dotColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  return `
    <svg class="preview-placeholder-svg" viewBox="0 0 200 80" preserveAspectRatio="none">
      <rect width="200" height="80" fill="${color}"/>
      <circle cx="30" cy="25" r="4" fill="${dotColor}"/>
      <circle cx="50" cy="35" r="6" fill="${dotColor}"/>
      <circle cx="80" cy="20" r="3" fill="${dotColor}"/>
      <circle cx="110" cy="40" r="5" fill="${dotColor}"/>
      <circle cx="145" cy="28" r="4" fill="${dotColor}"/>
      <circle cx="170" cy="50" r="3" fill="${dotColor}"/>
      <circle cx="60" cy="55" r="4" fill="${dotColor}"/>
      <circle cx="130" cy="15" r="3" fill="${dotColor}"/>
      <rect x="25" y="50" width="40" height="4" rx="2" fill="${dotColor}"/>
      <rect x="75" y="55" width="60" height="3" rx="1.5" fill="${dotColor}"/>
      <rect x="100" y="45" width="30" height="3" rx="1.5" fill="${dotColor}"/>
      <text x="50%" y="55%" text-anchor="middle" dominant-baseline="central" class="preview-placeholder-letter" style="font-size: 32px; font-weight: 700; fill: ${textColor};">${letter}</text>
    </svg>
  `;
}

function getBoardPreviewColor(board) {
  const colors = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #3b82f6, #06b6d4)',
    'linear-gradient(135deg, #10b981, #34d399)',
    'linear-gradient(135deg, #f59e0b, #f97316)',
    'linear-gradient(135deg, #ef4444, #f43f5e)',
    'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    'linear-gradient(135deg, #06b6d4, #22d3ee)',
    'linear-gradient(135deg, #f43f5e, #fb7185)',
    'linear-gradient(135deg, #84cc16, #a3e635)',
    'linear-gradient(135deg, #64748b, #94a3b8)'
  ];
  let hash = 0;
  for (let i = 0; i < (board.id || board.title).length; i++) {
    hash = (board.id || board.title).charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function isColorDark(color) {
  const m = color.match(/#([0-9a-f]{6})/i);
  if (!m) return false;
  const r = parseInt(m[1].slice(0, 2), 16), g = parseInt(m[1].slice(2, 4), 16), b = parseInt(m[1].slice(4, 6), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 < 140;
}

function wireDashboardCards(container) {
  container.querySelectorAll('.board-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.board-card-star') || e.target.closest('.board-card-menu') || e.target.closest('.board-card-context')) return;
      AppRouter.navigate('/board/' + card.dataset.id);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        AppRouter.navigate('/board/' + card.dataset.id);
      }
    });
  });

  container.querySelectorAll('.board-card-star').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const isFav = BoardManager.toggleFavorite(id);
      btn.classList.toggle('active', isFav);
      btn.textContent = isFav ? '★' : '☆';
      btn.title = isFav ? 'Remove from favorites' : 'Add to favorites';
      btn.setAttribute('aria-label', isFav ? 'Remove from favorites' : 'Add to favorites');
    });
  });

  container.querySelectorAll('.board-card-menu').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const context = btn.parentElement.querySelector('.board-card-context');
      document.querySelectorAll('.board-card-context.open').forEach(m => {
        if (m !== context) m.classList.remove('open');
      });
      context.classList.toggle('open');
      if (context.classList.contains('open')) {
        const firstItem = context.querySelector('[role="menuitem"]');
        if (firstItem) firstItem.focus();
      }
    });
  });

  container.querySelectorAll('.board-card-context').forEach(ctx => {
    ctx.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { ctx.classList.remove('open'); ctx.previousElementSibling?.focus(); return; }
      const items = [...ctx.querySelectorAll('[role="menuitem"]')];
      const idx = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(idx + 1) % items.length]?.focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus(); }
    });
  });

  // Context menu actions
  container.querySelectorAll('.context-rename').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.closest('.board-card-context')?.classList.remove('open');
      renameBoard(btn.dataset.id);
    });
  });

  container.querySelectorAll('.context-favorite').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.closest('.board-card-context')?.classList.remove('open');
      const id = btn.dataset.id;
      BoardManager.toggleFavorite(id);
      renderDashboardMain();
    });
  });

  container.querySelectorAll('.context-share').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.closest('.board-card-context')?.classList.remove('open');
      ShareManager.showShareDialog(btn.dataset.id);
    });
  });

  container.querySelectorAll('.context-duplicate').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      btn.closest('.board-card-context')?.classList.remove('open');
      const original = BoardManager.boards.find(b => b.id === btn.dataset.id);
      if (original) {
        try {
          const dup = await BoardManager.create(original.title + ' (copy)', original.template);
          Toast.show('Board duplicated!', 'success');
          renderDashboardMain();
          Sidebar.loadBoards().catch(() => {});
        } catch (err) {
          Toast.show('Failed to duplicate board', 'error');
        }
      }
    });
  });

  container.querySelectorAll('.context-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.closest('.board-card-context')?.classList.remove('open');
      deleteBoard(btn.dataset.id);
    });
  });
}

function sortBoards(sortBy) {
  const sorted = [...BoardManager.boards];
  switch (sortBy) {
    case 'oldest':
      sorted.sort((a, b) => new Date(a.created_at || a.updated_at) - new Date(b.created_at || b.updated_at));
      break;
    case 'alpha':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'alpha-desc':
      sorted.sort((a, b) => b.title.localeCompare(a.title));
      break;
    default:
      sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }
  BoardManager.boards = sorted;
}

function filterDashboardBoards(query) {
  const q = query.toLowerCase().trim();
  const grid = document.getElementById('all-boards');
  if (!grid) return;
  const allCards = grid.querySelectorAll('.board-card');
  const sections = document.querySelectorAll('#section-recent-boards, #section-favorite-boards');
  let noResultsEl = document.getElementById('dashboard-no-results');

  let visibleCount = 0;
  for (const card of allCards) {
    const title = card.querySelector('.board-card-title')?.textContent?.toLowerCase() || '';
    const match = !q || title.includes(q);
    card.style.display = match ? '' : 'none';
    if (match) visibleCount++;
  }

  for (const section of sections) {
    let hasVisible = false;
    for (const c of section.querySelectorAll('.board-card')) {
      if (c.style.display !== 'none') { hasVisible = true; break; }
    }
    section.style.display = hasVisible ? '' : 'none';
  }

  if (!q) {
    if (noResultsEl) noResultsEl.style.display = 'none';
    return;
  }

  if (!noResultsEl) {
    noResultsEl = document.createElement('div');
    noResultsEl.id = 'dashboard-no-results';
    noResultsEl.className = 'dashboard-no-results';
    grid.appendChild(noResultsEl);
  }

  noResultsEl.style.display = visibleCount === 0 ? '' : 'none';
  if (visibleCount === 0) noResultsEl.textContent = `No boards match "${q}"`;
}

function debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
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
        try {
          await BoardManager.update(boardId, { title });
          Toast.show('Board renamed!', 'success');
          renderDashboardMain();
          Sidebar.loadBoards().catch(() => {});
        } catch (err) {
          Toast.show('Failed to rename board', 'error');
        }
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
      try {
        await BoardManager.delete(boardId);
        Toast.show('Board deleted', 'success');
        renderDashboardMain();
        Sidebar.loadBoards().catch(() => {});
      } catch (err) {
        Toast.show('Failed to delete board', 'error');
      }
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
  BoardManager.markBoardVisited(boardId);
  // Clean up previous board state
  Canvas.destroy();
  Minimap.destroy();
  Connections.destroy();
  AIAssistant.destroy();
  BoardChat.destroy();
  BoardHistory.clear();
  AudioRecorder.destroy();
  VideoUpload.destroy();
  if (window._syncTickInterval) {
    clearInterval(window._syncTickInterval);
    window._syncTickInterval = null;
  }

  // Load items
  await ItemManager.loadItems(boardId);

  // Cache item count for dashboard
  BoardManager.setItemCount(boardId, ItemManager.items.length);

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
    if (zoomEl) zoomEl.textContent = `${Math.round(zoom * 100)}%`;
    Minimap.render();
  };

  // Build toolbar
  renderBoardToolbar(boardId);

  // Last synced indicator
  function updateSyncIndicator() {
    const el = document.getElementById('sync-indicator');
    if (!el) return;
    const lastSync = ItemManager.lastSyncedAt;
    if (!lastSync) { el.textContent = ''; return; }
    const seconds = Math.floor((Date.now() - lastSync) / 1000);
    if (seconds < 5) {
      el.textContent = I18n.__('synced_just_now');
    } else if (seconds < 60) {
      el.textContent = I18n.__('synced_ago', { n: seconds + 's' });
    } else {
      el.textContent = I18n.__('synced_ago', { n: Math.floor(seconds / 60) + 'm' });
    }
  }
  ItemManager.onSync = updateSyncIndicator;
  updateSyncIndicator();
  window._syncTickInterval = setInterval(updateSyncIndicator, 15000);

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
            title: 'New Note', content: '', color: localStorage.getItem('boardflow_default_note_color') || '#fffde7'
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
    <button class="toolbar-btn" id="tb-export-png" title="Export PNG">${Icons.exportPng}</button>
    <button class="toolbar-btn" id="tb-export-pdf" title="Export PDF">${Icons.exportPdf}</button>
    <button class="toolbar-btn" id="tb-ai" title="${I18n.__('ai_assistant')}">${Icons.brain}</button>
    <button class="toolbar-btn" id="tb-chat" title="${I18n.__('board_chat')}">${Icons.chat}</button>
    <button class="toolbar-btn" id="tb-share" title="${I18n.__('share_board')}">${Icons.share}</button>
    <button class="toolbar-btn" id="tb-sync" title="${I18n.__('sync_now')}">${Icons.sync}</button>
    <span class="sync-indicator" id="sync-indicator">Synced just now</span>
  `;

  document.getElementById('tb-add-note')?.addEventListener('click', async () => {
    const canvasEl = document.getElementById('canvas');
    const rect = canvasEl.getBoundingClientRect();
    await ItemManager.createItem('sticky_note', {
      x: (rect.width / 2 - Canvas.panX) / Canvas.zoom,
      y: (rect.height / 2 - Canvas.panY) / Canvas.zoom,
      title: 'New Note',
      content: '',
      color: localStorage.getItem('boardflow_default_note_color') || '#fffde7'
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

  document.getElementById('tb-sync')?.addEventListener('click', async () => {
    const btn = document.getElementById('tb-sync');
    if (btn) btn.style.pointerEvents = 'none';
    try {
      if (BoardFlowAuth.supabase) {
        await BoardManager.update(ItemManager.boardId, {});
      }
      ItemManager._markSynced();
      Toast.show(I18n.__('synced_just_now'), 'success');
    } catch (err) {
      console.error('Sync failed:', err);
      Toast.show(I18n.__('error_occurred'), 'error');
    } finally {
      if (btn) {
        setTimeout(() => { btn.style.pointerEvents = ''; }, 1500);
      }
    }
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
      <div class="file-item-preview" style="background: var(--canvas-soft); cursor: pointer; position: relative;">
        <div class="file-icon" style="color: var(--ink-muted);">${Icons.mic}</div>
        <a href="${Utils.escapeHtml(item.file_url || '#')}" download="${Utils.escapeHtml(item.title || 'audio')}.webm" 
           style="position: absolute; top: 4px; right: 4px; background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--radius-xs); width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: var(--ink-muted); text-decoration: none; opacity: 0.6; transition: opacity 0.2s;"
           onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">
           ↓
        </a>
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
      el.addEventListener('dblclick', () => {
        const url = item.file_url;
        if (url && /^https?:\/\//i.test(url)) window.open(url, '_blank');
      });
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
      if (item.metadata?.is_locked) return;
      startResize(item, dir, e);
    });
    el.appendChild(handle);
  });

  // Rotate handle
  const rotateHandle = document.createElement('div');
  rotateHandle.className = 'item-rotate-handle';
  rotateHandle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    if (item.metadata?.is_locked) return;
    startRotate(item, e);
  });
  el.appendChild(rotateHandle);

  // Apply locked state
  if (item.metadata?.is_locked) {
    el.classList.add('is-locked');
  }

  // Right-click context menu
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isLocked = item.metadata?.is_locked;
    const lockLabel = I18n.__('lock_item');
    const unlockLabel = I18n.__('unlock_item');
    const frontLabel = I18n.__('bring_to_front');
    const backLabel = I18n.__('send_to_back');
    const deleteLabel = I18n.__('delete');
    ContextMenu.show(e.clientX, e.clientY, [
      { icon: isLocked ? Icons.unlock : Icons.lock, label: isLocked ? (unlockLabel !== 'unlock_item' ? unlockLabel : 'Unlock') : (lockLabel !== 'lock_item' ? lockLabel : 'Lock in Place'), action: async () => {
        const locked = !isLocked;
        await ItemManager.updateItem(item.id, { metadata: { ...item.metadata, is_locked: locked } });
        const el = document.querySelector(`[data-id="${item.id}"]`);
        if (el) el.classList.toggle('is-locked', locked);
        Toast.show(locked ? 'Item locked' : 'Item unlocked', 'success');
      }},
      { separator: true },
      { icon: Icons.bringToFront, label: frontLabel !== 'bring_to_front' ? frontLabel : 'Bring to Front', action: () => ItemManager.bringToFront(item.id) },
      { icon: Icons.sendToBack, label: backLabel !== 'send_to_back' ? backLabel : 'Send to Back', action: () => ItemManager.sendToBack(item.id) },
      { separator: true },
      { icon: Icons.trash, label: deleteLabel !== 'delete' ? deleteLabel : 'Delete', action: () => ItemManager.deleteItem(item.id), danger: true }
    ]);
  });

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
  let rafId = null;

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

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const el = document.querySelector(`[data-id="${item.id}"]`);
      if (el) {
        el.style.width = `${newW}px`;
        el.style.height = `${newH}px`;
        el.style.transform = `translate(${newX}px, ${newY}px) rotate(${item.rotation}deg)`;
      }
    });
  }

  function onUp() {
    if (rafId) cancelAnimationFrame(rafId);
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

  const canvasEl = document.getElementById('canvas');
  const canvasRect = canvasEl.getBoundingClientRect();
  const centerX = canvasRect.left + Canvas.panX + item.position_x * Canvas.zoom + (item.width * Canvas.zoom) / 2;
  const centerY = canvasRect.top + Canvas.panY + item.position_y * Canvas.zoom + (item.height * Canvas.zoom) / 2;
  let rafId = null;

  function onMove(e) {
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI) + 90;
    item.rotation = Math.round(angle);

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      el.style.transform = `translate(${item.position_x}px, ${item.position_y}px) rotate(${item.rotation}deg)`;
    });
  }

  function onUp() {
    if (rafId) cancelAnimationFrame(rafId);
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
    ItemManager._markSynced();
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
    ItemManager._markSynced();
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
