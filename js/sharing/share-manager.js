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
              <input type="text" id="share-link" value="${Utils.escapeHtml(shareUrl)}" readonly style="flex: 1; padding: var(--space-sm); background: var(--canvas-soft); border: 1px solid var(--hairline); border-radius: var(--radius-sm); font-size: var(--text-sm);">
              <button class="btn btn-secondary" id="share-copy-btn">${I18n.__('copy')}</button>
              ${!board.share_token ? `<button class="btn btn-primary" id="share-generate-btn">${I18n.__('generate')}</button>` : ''}
            </div>
          </div>
          <div>
            <label>${I18n.__('invite_by_email')}</label>
            <div style="display: flex; gap: var(--space-sm); margin-top: var(--space-xs);">
              <input type="email" id="share-email" placeholder="${I18n.__('email')}" style="flex: 1; padding: var(--space-sm); background: var(--canvas-soft); border: 1px solid var(--hairline); border-radius: var(--radius-sm); font-size: var(--text-sm);">
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
          document.querySelector('.modal-content > div')?.prepend(shareBtn);
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
      const token = Utils.generateId('share');
      await BoardManager.update(board.id, { share_token: token });
      const input = document.getElementById('share-link');
      if (input) {
        input.value = `${window.location.origin}/#/board/shared/${token}`;
      }
      document.getElementById('share-generate-btn')?.remove();
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

    try {
      const { data } = await BoardFlowAuth.supabase
        .from('board_members')
        .select('*, profiles(email, display_name)')
        .eq('board_id', board.id);

      const membersList = document.getElementById('share-members-list');
      if (membersList) {
        if (data && data.length > 0) {
          membersList.innerHTML = data.map(m => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-xs) 0; font-size: var(--text-sm);">
              <span>${Utils.escapeHtml(m.profiles?.email || 'Unknown')}</span>
              <span style="color: var(--ink-muted); font-size: var(--text-xs);">${Utils.escapeHtml(m.role)}</span>
            </div>
          `).join('');
        } else {
          membersList.innerHTML = `<div style="font-size: var(--text-sm); color: var(--ink-muted);">${I18n.__('no_members')}</div>`;
        }
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  }
}

try {
  Object.defineProperty(window, 'ShareManager', { value: new _ShareManager(), writable: false, configurable: true, enumerable: true });
} catch { window.ShareManager = new _ShareManager(); }
