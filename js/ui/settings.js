class _Settings {
  constructor() {
    this.container = null;
  }

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

        <section class="settings-section">
          <h2>${I18n.__('display_name')}</h2>
          <div class="settings-field">
            <label for="settings-display-name">${I18n.__('display_name')}</label>
            <input type="text" id="settings-display-name" value="${this._escapeHtml(displayName)}">
          </div>
          <div class="settings-field">
            <label>${I18n.__('email')}</label>
            <div class="settings-field-readonly">${this._escapeHtml(email)}</div>
          </div>
          <div style="display: flex; gap: var(--space-sm); flex-wrap: wrap;">
            <button class="btn btn-secondary" id="settings-change-password">${I18n.__('change_password')}</button>
            <button class="btn btn-primary" id="settings-save-account" style="flex:1;">${I18n.__('save_changes')}</button>
          </div>
          <div style="margin-top: var(--space-md); padding-top: var(--space-md); border-top: 1px solid var(--hairline);">
            <button class="btn btn-danger" id="settings-delete-account">${I18n.__('delete_account')}</button>
          </div>
        </section>

        <section class="settings-section">
          <h2>${I18n.__('canvas')}</h2>
          <div class="settings-field">
            <label>${I18n.__('grid')}</label>
            <label class="toggle-row">
              <input type="checkbox" id="settings-grid-enabled"${gridDefault ? ' checked' : ''}>
              <span>${I18n.__('show_grid_by_default')}</span>
            </label>
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
            <div class="color-picker-row">
              <input type="color" id="settings-default-color" value="${defaultColor}">
              <input type="text" id="settings-default-color-text" value="${defaultColor}" maxlength="7">
            </div>
          </div>
        </section>

        <section class="settings-section">
          <h2>${I18n.__('export')}</h2>
          <div class="settings-field">
            <label for="settings-export-scale">${I18n.__('png_scale')}</label>
            <select id="settings-export-scale">
              <option value="1"${exportScale === '1' ? ' selected' : ''}>1x (${I18n.__('standard')})</option>
              <option value="2"${exportScale === '2' ? ' selected' : ''}>2x (${I18n.__('retina')})</option>
              <option value="3"${exportScale === '3' ? ' selected' : ''}>3x (${I18n.__('high_res')})</option>
              <option value="4"${exportScale === '4' ? ' selected' : ''}>4x (${I18n.__('ultra')})</option>
            </select>
          </div>
          <div class="settings-field">
            <label class="toggle-row">
              <input type="checkbox" id="settings-export-grid"${exportGrid ? ' checked' : ''}>
              <span>${I18n.__('include_grid')}</span>
            </label>
          </div>
        </section>

        <section class="settings-section">
          <h2>${I18n.__('notifications')}</h2>
          <div class="settings-field">
            <label class="toggle-row">
              <input type="checkbox" id="settings-chat-sound"${chatSound ? ' checked' : ''}>
              <span>${I18n.__('chat_sound')}</span>
            </label>
          </div>
        </section>
      </div>
    `;

    this._wireEvents();
  }

  _wireEvents() {
    document.getElementById('settings-save-account')?.addEventListener('click', () => this._saveAccount());
    document.getElementById('settings-change-password')?.addEventListener('click', () => this._changePassword());
    document.getElementById('settings-delete-account')?.addEventListener('click', () => this._deleteAccount());

    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.addEventListener('click', () => this._setTheme(btn.dataset.theme));
    });

    document.getElementById('settings-lang')?.addEventListener('change', (e) => {
      I18n.setLanguage(e.target.value);
    });

    document.getElementById('settings-grid-enabled')?.addEventListener('change', (e) => {
      localStorage.setItem('boardflow_grid_enabled', e.target.checked);
    });

    document.getElementById('settings-grid-size')?.addEventListener('change', (e) => {
      localStorage.setItem('boardflow_grid_size', e.target.value);
    });

    document.getElementById('settings-default-zoom')?.addEventListener('change', (e) => {
      localStorage.setItem('boardflow_default_zoom', e.target.value);
    });

    document.getElementById('settings-export-scale')?.addEventListener('change', (e) => {
      localStorage.setItem('boardflow_export_scale', e.target.value);
    });

    document.getElementById('settings-export-grid')?.addEventListener('change', (e) => {
      localStorage.setItem('boardflow_export_grid', e.target.checked);
    });

    document.getElementById('settings-chat-sound')?.addEventListener('change', (e) => {
      localStorage.setItem('boardflow_chat_sound', e.target.checked);
    });

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

    backdrop.querySelector('.modal-close')?.addEventListener('click', () => backdrop.remove());
    backdrop.querySelector('.modal-cancel')?.addEventListener('click', () => backdrop.remove());
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });

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
        backdrop.remove();
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

    backdrop.querySelector('.modal-close')?.addEventListener('click', () => backdrop.remove());
    backdrop.querySelector('.modal-cancel')?.addEventListener('click', () => backdrop.remove());
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });

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
      await BoardFlowAuth.signOut();
    });
  }

  _setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('boardflow_theme', theme);

    document.querySelectorAll('.theme-option').forEach(btn => {
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
