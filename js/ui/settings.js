class _Settings {
  constructor() {
    this.container = null;
    this.activeTab = 'account';
  }

  _icons = {
    account: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    canvas: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,
    export: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
    appearance: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    notifications: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  };

  render() {
    const user = BoardFlowAuth.getUser();
    const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
    const email = user?.email || '';
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const currentLang = I18n.currentLang || 'en';

    this.container = document.getElementById('dashboard-main');
    if (!this.container) return;

    const gridDefault = localStorage.getItem('boardflow_grid_enabled') !== 'false';
    const gridSize = localStorage.getItem('boardflow_grid_size') || '20';
    const defaultColor = localStorage.getItem('boardflow_default_note_color') || '#fffde7';
    const defaultZoom = localStorage.getItem('boardflow_default_zoom') || '100';
    const exportScale = localStorage.getItem('boardflow_export_scale') || '2';
    const exportGrid = localStorage.getItem('boardflow_export_grid') !== 'false';
    const chatSound = localStorage.getItem('boardflow_chat_sound') !== 'false';

    this.container.innerHTML = `
      <div class="settings-page">
        <div class="settings-header">
          <h1>${I18n.__('settings')}</h1>
        </div>
        <div class="settings-body">
          <nav class="settings-tabs" role="tablist" aria-label="Settings navigation">
            <button class="settings-tab active" role="tab" aria-selected="true" data-tab="account" id="tab-account">
              ${this._icons.account}
              <span>Account</span>
            </button>
            <button class="settings-tab" role="tab" aria-selected="false" data-tab="canvas" id="tab-canvas">
              ${this._icons.canvas}
              <span>Canvas</span>
            </button>
            <button class="settings-tab" role="tab" aria-selected="false" data-tab="export" id="tab-export">
              ${this._icons.export}
              <span>Export</span>
            </button>
            <button class="settings-tab" role="tab" aria-selected="false" data-tab="appearance" id="tab-appearance">
              ${this._icons.appearance}
              <span>Appearance</span>
            </button>
            <button class="settings-tab" role="tab" aria-selected="false" data-tab="notifications" id="tab-notifications">
              ${this._icons.notifications}
              <span>${I18n.__('notifications')}</span>
            </button>
          </nav>

          <div class="settings-content">

            <!-- Account Tab -->
            <section class="settings-section active" data-section="account" role="tabpanel" aria-labelledby="tab-account">
              <div>
                <h2 class="settings-section-title">Account</h2>
                <p class="settings-section-desc">Manage your profile, email, and password.</p>
              </div>

              <div class="settings-field">
                <label for="settings-display-name">${I18n.__('display_name')}</label>
                <input type="text" id="settings-display-name" value="${this._escapeHtml(displayName)}">
              </div>

              <div class="settings-field">
                <label for="settings-email">${I18n.__('email')}</label>
                <input type="email" id="settings-email" value="${this._escapeHtml(email)}" disabled>
              </div>

              <div class="settings-actions">
                <button class="btn btn-secondary" id="settings-change-password">${I18n.__('change_password')}</button>
                <button class="btn btn-primary" id="settings-save-account">${I18n.__('save_changes')}</button>
              </div>

              <div class="settings-danger-zone">
                <h3>${I18n.__('delete_account')}</h3>
                <p>Permanently delete your account and all data. This action cannot be undone.</p>
                <button class="btn btn-danger" id="settings-delete-account">${I18n.__('delete_account')}</button>
              </div>
            </section>

            <!-- Canvas Tab -->
            <section class="settings-section" data-section="canvas" role="tabpanel" aria-labelledby="tab-canvas">
              <div>
                <h2 class="settings-section-title">Canvas</h2>
                <p class="settings-section-desc">Configure grid, zoom, and default note color.</p>
              </div>

              <div class="settings-toggle-row" id="settings-grid-toggle-row">
                <div class="toggle-info">
                  <span class="toggle-label">${I18n.__('grid')}</span>
                  <span class="toggle-desc">Show dot grid on the canvas</span>
                </div>
                <input type="checkbox" id="settings-grid-enabled"${gridDefault ? ' checked' : ''}>
              </div>

              <div class="settings-field">
                <label for="settings-grid-size">${I18n.__('grid_size')}</label>
                <select id="settings-grid-size">
                  <option value="10"${gridSize === '10' ? ' selected' : ''}>${I18n.__('small')} (10px)</option>
                  <option value="20"${gridSize === '20' ? ' selected' : ''}>${I18n.__('medium')} (20px)</option>
                  <option value="30"${gridSize === '30' ? ' selected' : ''}>${I18n.__('large')} (30px)</option>
                </select>
              </div>

              <div class="settings-field">
                <label for="settings-default-zoom">${I18n.__('default_zoom')}</label>
                <select id="settings-default-zoom">
                  <option value="50"${defaultZoom === '50' ? ' selected' : ''}>50%</option>
                  <option value="75"${defaultZoom === '75' ? ' selected' : ''}>75%</option>
                  <option value="100"${defaultZoom === '100' ? ' selected' : ''}>100%</option>
                  <option value="150"${defaultZoom === '150' ? ' selected' : ''}>150%</option>
                  <option value="200"${defaultZoom === '200' ? ' selected' : ''}>200%</option>
                </select>
              </div>

              <div class="settings-field">
                <label for="settings-default-color">${I18n.__('default_note_color')}</label>
                <div class="settings-color-row">
                  <input type="color" id="settings-default-color" value="${defaultColor}">
                  <input type="text" id="settings-default-color-text" value="${defaultColor}" maxlength="7">
                </div>
              </div>
            </section>

            <!-- Export Tab -->
            <section class="settings-section" data-section="export" role="tabpanel" aria-labelledby="tab-export">
              <div>
                <h2 class="settings-section-title">Export</h2>
                <p class="settings-section-desc">Control export quality and format.</p>
              </div>

              <div class="settings-field">
                <label for="settings-export-scale">${I18n.__('png_scale')}</label>
                <select id="settings-export-scale">
                  <option value="1"${exportScale === '1' ? ' selected' : ''}>1x (${I18n.__('standard')})</option>
                  <option value="2"${exportScale === '2' ? ' selected' : ''}>2x (${I18n.__('retina')})</option>
                  <option value="3"${exportScale === '3' ? ' selected' : ''}>3x (${I18n.__('high_res')})</option>
                  <option value="4"${exportScale === '4' ? ' selected' : ''}>4x (${I18n.__('ultra')})</option>
                </select>
              </div>

              <div class="settings-toggle-row" id="settings-export-grid-toggle-row">
                <div class="toggle-info">
                  <span class="toggle-label">${I18n.__('include_grid')}</span>
                  <span class="toggle-desc">Include grid dots in exported PNG</span>
                </div>
                <input type="checkbox" id="settings-export-grid"${exportGrid ? ' checked' : ''}>
              </div>
            </section>

            <!-- Appearance Tab -->
            <section class="settings-section" data-section="appearance" role="tabpanel" aria-labelledby="tab-appearance">
              <div>
                <h2 class="settings-section-title">Appearance</h2>
                <p class="settings-section-desc">Switch between light and dark themes.</p>
              </div>

              <div class="settings-theme-row">
                <button class="settings-theme-option${currentTheme === 'light' ? ' active' : ''}" data-theme="light">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                  <span>Light</span>
                </button>
                <button class="settings-theme-option${currentTheme === 'dark' ? ' active' : ''}" data-theme="dark">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                  <span>Dark</span>
                </button>
              </div>

              <div class="settings-field">
                <label for="settings-lang">${I18n.__('language')}</label>
                <select id="settings-lang">
                  <option value="en"${currentLang === 'en' ? ' selected' : ''}>English</option>
                  <option value="ar"${currentLang === 'ar' ? ' selected' : ''}>العربية</option>
                  <option value="fr"${currentLang === 'fr' ? ' selected' : ''}>Français</option>
                  <option value="es"${currentLang === 'es' ? ' selected' : ''}>Español</option>
                  <option value="pt"${currentLang === 'pt' ? ' selected' : ''}>Português</option>
                  <option value="de"${currentLang === 'de' ? ' selected' : ''}>Deutsch</option>
                  <option value="ru"${currentLang === 'ru' ? ' selected' : ''}>Русский</option>
                  <option value="tr"${currentLang === 'tr' ? ' selected' : ''}>Türkçe</option>
                  <option value="hi"${currentLang === 'hi' ? ' selected' : ''}>हिन्दी</option>
                  <option value="zh-CN"${currentLang === 'zh-CN' ? ' selected' : ''}>简体中文</option>
                  <option value="ja"${currentLang === 'ja' ? ' selected' : ''}>日本語</option>
                  <option value="ko"${currentLang === 'ko' ? ' selected' : ''}>한국어</option>
                  <option value="it"${currentLang === 'it' ? ' selected' : ''}>Italiano</option>
                  <option value="nl"${currentLang === 'nl' ? ' selected' : ''}>Nederlands</option>
                  <option value="id"${currentLang === 'id' ? ' selected' : ''}>Bahasa Indonesia</option>
                </select>
              </div>
            </section>

            <!-- Notifications Tab -->
            <section class="settings-section" data-section="notifications" role="tabpanel" aria-labelledby="tab-notifications">
              <div>
                <h2 class="settings-section-title">${I18n.__('notifications')}</h2>
                <p class="settings-section-desc">Control sounds and alerts.</p>
              </div>

              <div class="settings-toggle-row" id="settings-chat-sound-toggle-row">
                <div class="toggle-info">
                  <span class="toggle-label">${I18n.__('chat_sound')}</span>
                  <span class="toggle-desc">Play a sound when new chat messages arrive</span>
                </div>
                <input type="checkbox" id="settings-chat-sound"${chatSound ? ' checked' : ''}>
              </div>
            </section>

          </div>
        </div>
      </div>
    `;

    this._wireEvents();
  }

  _wireEvents() {
    // Tab switching
    document.querySelectorAll('.settings-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.activeTab = tab.dataset.tab;
        document.querySelectorAll('.settings-tab').forEach(t => {
          t.classList.toggle('active', t === tab);
          t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
        });
        document.querySelectorAll('.settings-section').forEach(s => {
          s.classList.toggle('active', s.dataset.section === this.activeTab);
        });
      });
    });

    // Account
    document.getElementById('settings-save-account')?.addEventListener('click', () => this._saveAccount());
    document.getElementById('settings-change-password')?.addEventListener('click', () => this._changePassword());
    document.getElementById('settings-delete-account')?.addEventListener('click', () => this._deleteAccount());

    // Theme
    document.querySelectorAll('.settings-theme-option').forEach(btn => {
      btn.addEventListener('click', () => this._setTheme(btn.dataset.theme));
    });

    // Language
    document.getElementById('settings-lang')?.addEventListener('change', (e) => {
      I18n.setLanguage(e.target.value);
    });

    // Canvas
    document.getElementById('settings-grid-enabled')?.addEventListener('change', (e) => {
      localStorage.setItem('boardflow_grid_enabled', e.target.checked);
    });

    document.getElementById('settings-grid-size')?.addEventListener('change', (e) => {
      localStorage.setItem('boardflow_grid_size', e.target.value);
    });

    document.getElementById('settings-default-zoom')?.addEventListener('change', (e) => {
      localStorage.setItem('boardflow_default_zoom', e.target.value);
    });

    // Export
    document.getElementById('settings-export-scale')?.addEventListener('change', (e) => {
      localStorage.setItem('boardflow_export_scale', e.target.value);
    });

    document.getElementById('settings-export-grid')?.addEventListener('change', (e) => {
      localStorage.setItem('boardflow_export_grid', e.target.checked);
    });

    // Notifications
    document.getElementById('settings-chat-sound')?.addEventListener('change', (e) => {
      localStorage.setItem('boardflow_chat_sound', e.target.checked);
    });

    // Color picker
    const colorInput = document.getElementById('settings-default-color');
    const colorText = document.getElementById('settings-default-color-text');
    if (colorInput && colorText) {
      colorInput.addEventListener('input', () => {
        colorText.value = colorInput.value;
        localStorage.setItem('boardflow_default_note_color', colorInput.value);
      });
      colorText.addEventListener('input', () => {
        if (/^#[0-9a-f]{6}$/i.test(colorText.value)) {
          colorInput.value = colorText.value;
          localStorage.setItem('boardflow_default_note_color', colorText.value);
        }
      });
    }
  }

  _saveAccount() {
    const nameInput = document.getElementById('settings-display-name');
    if (!nameInput) return;
    const newName = nameInput.value.trim();
    if (!newName) { Toast.show(I18n.__('name_required'), 'error'); return; }

    if (BoardFlowAuth.user) {
      BoardFlowAuth.user.user_metadata = BoardFlowAuth.user.user_metadata || {};
      BoardFlowAuth.user.user_metadata.display_name = newName;
    }

    const stored = localStorage.getItem('boardflow_demo_user');
    if (stored) {
      try {
        const demo = JSON.parse(stored);
        demo.user_metadata = demo.user_metadata || {};
        demo.user_metadata.display_name = newName;
        localStorage.setItem('boardflow_demo_user', JSON.stringify(demo));
      } catch {}
    }

    if (BoardFlowAuth.supabase) {
      BoardFlowAuth.supabase.auth.updateUser({
        data: { display_name: newName }
      }).catch(() => {});
    }

    Toast.show(I18n.__('profile_updated'), 'success');
    Sidebar.render();
  }

  _changePassword() {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';
    backdrop.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h3 class="modal-title">${I18n.__('change_password')}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="settings-field">
            <label for="pw-current">${I18n.__('current_password')}</label>
            <input type="password" id="pw-current" autocomplete="current-password">
          </div>
          <div class="settings-field">
            <label for="pw-new">${I18n.__('new_password')}</label>
            <input type="password" id="pw-new" autocomplete="new-password">
          </div>
          <div class="settings-field">
            <label for="pw-confirm">${I18n.__('confirm_password')}</label>
            <input type="password" id="pw-confirm" autocomplete="new-password">
          </div>
        </div>
        <div class="modal-footer" style="display: flex; gap: var(--space-sm); justify-content: flex-end;">
          <button class="btn btn-secondary modal-cancel">${I18n.__('cancel')}</button>
          <button class="btn btn-primary" id="pw-submit">${I18n.__('update_password')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    const pwCleanup = () => {
      document.removeEventListener('keydown', pwEscHandler);
      backdrop.remove();
    };
    const pwEscHandler = (e) => {
      if (e.key === 'Escape') pwCleanup();
    };
    document.addEventListener('keydown', pwEscHandler);

    backdrop.querySelector('.modal-close')?.addEventListener('click', pwCleanup);
    backdrop.querySelector('.modal-cancel')?.addEventListener('click', pwCleanup);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) pwCleanup(); });

    document.getElementById('pw-submit')?.addEventListener('click', async () => {
      const current = document.getElementById('pw-current').value;
      const newPw = document.getElementById('pw-new').value;
      const confirm = document.getElementById('pw-confirm').value;

      if (!current || !newPw) { Toast.show(I18n.__('fill_all_fields'), 'error'); return; }
      if (newPw.length < 6) { Toast.show(I18n.__('password_min_chars'), 'error'); return; }
      if (newPw !== confirm) { Toast.show(I18n.__('passwords_no_match'), 'error'); return; }

      if (!BoardFlowAuth.supabase) {
        Toast.show('Password change requires Supabase connection', 'error'); return;
      }

      try {
        const { error: signInError } = await BoardFlowAuth.supabase.auth.signInWithPassword({
          email: BoardFlowAuth.user.email,
          password: current
        });
        if (signInError) { Toast.show(I18n.__('current_password_incorrect'), 'error'); return; }

        const { error } = await BoardFlowAuth.supabase.auth.updateUser({ password: newPw });
        if (error) throw error;
        Toast.show(I18n.__('password_updated'), 'success');
        pwCleanup();
      } catch (err) {
        Toast.show(err.message || 'Failed to update password', 'error');
      }
    });
  }

  _deleteAccount() {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';
    backdrop.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h3 class="modal-title" style="color: var(--danger);">${I18n.__('delete_account')}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <p style="margin: 0 0 var(--space-sm); color: var(--ink-secondary); font-size: var(--text-sm);">
            ${I18n.__('delete_account_warning')}
          </p>
          <div class="settings-field">
            <label for="delete-confirm">${I18n.__('type_delete_confirm')}</label>
            <input type="text" id="delete-confirm" placeholder="DELETE">
          </div>
        </div>
        <div class="modal-footer" style="display: flex; gap: var(--space-sm); justify-content: flex-end;">
          <button class="btn btn-secondary modal-cancel">${I18n.__('cancel')}</button>
          <button class="btn btn-danger" id="delete-submit">${I18n.__('delete_my_account')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    const deleteCleanup = () => {
      document.removeEventListener('keydown', deleteEscHandler);
      backdrop.remove();
    };
    const deleteEscHandler = (e) => {
      if (e.key === 'Escape') deleteCleanup();
    };
    document.addEventListener('keydown', deleteEscHandler);

    backdrop.querySelector('.modal-close')?.addEventListener('click', deleteCleanup);
    backdrop.querySelector('.modal-cancel')?.addEventListener('click', deleteCleanup);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) deleteCleanup(); });

    document.getElementById('delete-submit')?.addEventListener('click', async () => {
      if (document.getElementById('delete-confirm').value !== 'DELETE') {
        Toast.show(I18n.__('type_delete_confirm'), 'error'); return;
      }

      if (BoardFlowAuth.supabase) {
        try {
          const { error } = await BoardFlowAuth.supabase.rpc('delete_user');
          if (error) throw error;
        } catch (err) {
          Toast.show('Could not delete account. Contact support.', 'error');
          return;
        }
      }

      localStorage.clear();
      deleteCleanup();
      await BoardFlowAuth.signOut();
    });
  }

  _setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('boardflow_theme', theme);

    document.querySelectorAll('.settings-theme-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

try {
  Object.defineProperty(window, 'Settings', { value: new _Settings(), writable: false, configurable: true, enumerable: true });
} catch { window.Settings = new _Settings(); }
