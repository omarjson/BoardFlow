class _ShareManager {
  async showShareDialog(boardId) {
    const board = BoardManager.boards.find(b => b.id === boardId);
    if (!board) return;

    const shareUrl = board.share_token
      ? `${window.location.origin}/#/board/shared/${board.share_token}`
      : I18n.__('generate_link_first');

    Modal.show({
      title: I18n.__('share_title'),
      content: `
        <div style="display: flex; flex-direction: column; gap: var(--space-md);">
          <div>
            <label for="share-link">${I18n.__('share_link')}</label>
            <div style="display: flex; gap: var(--space-sm); margin-top: var(--space-xs);">
              <input type="text" id="share-link" value="${Utils.escapeHtml(shareUrl)}" readonly title="${Utils.escapeHtml(shareUrl)}" style="flex: 1; min-width: 0; padding: var(--space-sm); background: var(--canvas-soft); border: 1px solid var(--hairline); border-radius: var(--radius-sm); font-size: var(--text-sm); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
              <button class="btn btn-secondary" id="share-copy-btn">${I18n.__('copy')}</button>
              ${!board.share_token ? `<button class="btn btn-primary" id="share-generate-btn">${I18n.__('generate')}</button>` : ''}
            </div>
          </div>
          <div>
            <label>${I18n.__('invite_by_email')}</label>
            <div style="display: flex; gap: var(--space-sm); margin-top: var(--space-xs);">
              <input type="email" id="share-email" placeholder="${I18n.__('email')}" style="flex: 1; min-width: 140px; padding: var(--space-sm); background: var(--canvas-soft); border: 1px solid var(--hairline); border-radius: var(--radius-sm); font-size: var(--text-sm);">
              <select id="share-role" style="padding: var(--space-sm); background: var(--canvas-soft); border: 1px solid var(--hairline); border-radius: var(--radius-sm); font-size: var(--text-sm);">
                <option value="editor">${I18n.__('editor')}</option>
                <option value="viewer">${I18n.__('viewer')}</option>
              </select>
              <button class="btn btn-primary" id="share-invite-btn">${I18n.__('invite')}</button>
            </div>
          </div>
          <div id="share-members">
            <label>${I18n.__('members')}</label>
            <div id="share-members-list" style="margin-top: var(--space-xs); min-height: 40px;"></div>
          </div>
        </div>
      `,
      confirmText: I18n.__('done'),
      cancelText: '',
      hideCancel: true,
      onConfirm: () => Modal.close(),
      onOpen: () => {
        if (navigator.share && board.share_token) {
          const shareBtn = document.createElement('button');
          shareBtn.className = 'btn btn-primary';
          shareBtn.textContent = I18n.__('share_via');
          shareBtn.style.cssText = 'width: 100%; margin-bottom: var(--space-md);';
          shareBtn.addEventListener('click', () => {
            navigator.share({
              title: board.title,
              text: I18n.__('share_board_text'),
              url: shareUrl
            }).catch(() => {});
          });
          document.querySelector('.modal .modal-body')?.prepend(shareBtn);
        }
      }
    });

    this._bindEvents(board);
    this._loadMembers(board);
  }

  _bindEvents(board) {
    document.getElementById('share-copy-btn')?.addEventListener('click', async () => {
      const input = document.getElementById('share-link');
      if (input) {
        input.select();
        try {
          await navigator.clipboard.writeText(input.value);
        } catch {
          try {
            document.querySelector('#share-copy-btn').textContent = I18n.__('select_copy');
          } catch {}
        }
        Toast.show(I18n.__('link_copied'), 'success');
      }
    });

    document.getElementById('share-generate-btn')?.addEventListener('click', async () => {
      const token = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Utils.generateId('share');
      await BoardManager.update(board.id, { share_token: token });
      board.share_token = token;
      const input = document.getElementById('share-link');
      if (input) {
        input.value = `${window.location.origin}/#/board/shared/${token}`;
      }
      document.getElementById('share-generate-btn')?.remove();
      // add revoke button
      const copyBtn = document.getElementById('share-copy-btn');
      if (copyBtn && !document.getElementById('share-revoke-btn')) {
        const revoke = document.createElement('button');
        revoke.id = 'share-revoke-btn';
        revoke.className = 'btn btn-ghost';
        revoke.textContent = 'Revoke';
        revoke.addEventListener('click', async () => {
          await BoardManager.update(board.id, { share_token: null });
          board.share_token = null;
          if (input) input.value = I18n.__('generate_link_first');
          revoke.remove();
          const gen = document.createElement('button');
          gen.id = 'share-generate-btn';
          gen.className = 'btn btn-primary';
          gen.textContent = I18n.__('generate');
          copyBtn.after(gen);
          Toast.show('Link revoked', 'success');
        });
        copyBtn.after(revoke);
      }
      Toast.show(I18n.__('link_generated'), 'success');
    });

    document.getElementById('share-invite-btn')?.addEventListener('click', async () => {
      const email = document.getElementById('share-email')?.value.trim();
      const role = document.getElementById('share-role')?.value || 'viewer';
      if (!email) return;

      const success = await Permissions.addMember(board.id, email, role);
      if (success) {
        document.getElementById('share-email').value = '';
        this._loadMembers(board);
      }
    });
  }

  async _loadMembers(board) {
    if (!BoardFlowAuth.supabase) {
      const membersList = document.getElementById('share-members-list');
      if (membersList) {
        membersList.innerHTML = `<div style="font-size: var(--text-sm); color: var(--ink-muted);">${I18n.__('connect_supabase_members')}</div>`;
      }
      return;
    }
    // enter key to invite
    const emailInput = document.getElementById('share-email');
    if (emailInput && !emailInput._bindEnter) {
      emailInput._bindEnter = true;
      emailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('share-invite-btn')?.click(); }});
    }

    try {
      const { data } = await BoardFlowAuth.supabase
        .from('board_members')
        .select('*, profiles(email, display_name)')
        .eq('board_id', board.id);

      const membersList = document.getElementById('share-members-list');
      if (membersList) {
        if (data && data.length > 0) {
          membersList.innerHTML = data.map(m => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-xs) 0; font-size: var(--text-sm); gap:8px;">
              <span style="flex:1; overflow:hidden; text-overflow:ellipsis;">${Utils.escapeHtml(m.profiles?.email || m.profiles?.display_name || 'Unknown')}</span>
              <select data-user-id="${m.user_id}" class="share-role-select" style="padding:4px 6px; border:1px solid var(--hairline); border-radius:6px; font-size:12px;">
                <option value="viewer" ${m.role==='viewer'?'selected':''}>${I18n.__('viewer')}</option>
                <option value="editor" ${m.role==='editor'?'selected':''}>${I18n.__('editor')}</option>
                <option value="owner" ${m.role==='owner'?'selected':''}>owner</option>
              </select>
              <button data-remove-id="${m.user_id}" class="btn btn-ghost" style="padding:4px 8px; font-size:12px;" title="Remove">×</button>
            </div>
          `).join('');
          membersList.querySelectorAll('.share-role-select').forEach(sel => {
            sel.addEventListener('change', async (e) => {
              const uid = e.target.dataset.userId;
              const role = e.target.value;
              const ok = await Permissions.changeRole(board.id, uid, role);
              if (ok) this._loadMembers(board);
            });
          });
          membersList.querySelectorAll('[data-remove-id]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              const uid = e.target.dataset.removeId;
              const ok = await Permissions.removeMember(board.id, uid);
              if (ok) this._loadMembers(board);
            });
          });
        } else {
          membersList.innerHTML = `<div style="font-size: var(--text-sm); color: var(--ink-muted);">${I18n.__('no_members')}</div>`;
        }
      }
    } catch {
      const membersList = document.getElementById('share-members-list');
      if (membersList) {
        membersList.innerHTML = `<div style="font-size: var(--text-sm); color: var(--ink-muted);">${I18n.__('error_occurred')}</div>`;
      }
    }
  }
}

try {
  Object.defineProperty(window, 'ShareManager', { value: new _ShareManager(), writable: false, configurable: true, enumerable: true });
} catch { window.ShareManager = new _ShareManager(); }
