// ============================================
// Board Chat — Real-time Messaging
// ============================================

class _BoardChat {
  constructor() {
    this.panel = null;
    this.isOpen = false;
    this.messages = [];
    this.boardId = null;
    this._subscription = null;
    this._bound = false;
    this._audioCtx = null;
  }

  async open(boardId) {
    this.boardId = boardId;

    if (this.panel) {
      this.panel.style.display = 'flex';
      this.isOpen = true;
      await this._loadMessages();
      this._subscribeRealtime();
      return;
    }

    this.panel = document.createElement('div');
    this.panel.id = 'chat-panel';
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-label', I18n.__('board_chat'));
    this.panel.innerHTML = `
      <div class="chat-header">
        <span>${I18n.__('board_chat')}</span>
        <button class="chat-close btn btn-ghost" id="chat-close" aria-label="${I18n.__('close')}">&times;</button>
      </div>
      <div class="chat-messages" id="chat-messages">
        <div class="chat-message chat-system">${I18n.__('welcome_chat')}</div>
      </div>
      <div class="chat-input-row">
        <input type="text" id="chat-input" class="chat-input" placeholder="${I18n.__('type_message')}" autofocus>
        <button class="btn btn-primary" id="chat-send">${I18n.__('send')}</button>
      </div>
    `;

    document.body.appendChild(this.panel);
    this.isOpen = true;
    this._bindEvents();
    await this._loadMessages();
    this._subscribeRealtime();

    requestAnimationFrame(() => document.getElementById('chat-input')?.focus());
  }

  close() {
    if (this.panel) {
      this.panel.style.display = 'none';
      this.isOpen = false;
    }
  }

  destroy() {
    if (this._subscription) {
      this._subscription.unsubscribe();
      this._subscription = null;
    }
    if (this._audioCtx) {
      this._audioCtx.close().catch(() => {});
      this._audioCtx = null;
    }
    this._bound = false;
    this.panel?.remove();
    this.panel = null;
    this.isOpen = false;
    this.boardId = null;
  }

  _bindEvents() {
    if (this._bound) return;
    this._bound = true;

    document.getElementById('chat-close')?.addEventListener('click', () => this.close());

    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');

    const sendMessage = async () => {
      const text = input?.value.trim();
      if (!text || !this.boardId) return;

      input.value = '';
      await this._sendMessage(text);
    };

    sendBtn?.addEventListener('click', sendMessage);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  async _sendMessage(content) {
    if (!BoardFlowAuth.supabase || !this.boardId) return;
    const uid = BoardFlowAuth.getUserId();
    if (!uid) { Toast.show('Please sign in to chat', 'error'); return; }
    // optimistic render without id (will be replaced by realtime)
    const optimistic = { board_id: this.boardId, user_id: uid, content, message_type: 'text', created_at: new Date().toISOString(), _optimistic: true };
    this.messages.push(optimistic);
    this._renderMessage(optimistic);
    try {
      const { data, error } = await BoardFlowAuth.supabase
        .from('chat_messages')
        .insert({ board_id: this.boardId, user_id: uid, content, message_type: 'text' })
        .select()
        .single();
      if (error) throw error;
      // replace optimistic with real
      const idx = this.messages.indexOf(optimistic);
      if (idx !== -1) { this.messages[idx] = data; }
    } catch (err) {
      console.error('Failed to save message:', err);
      Toast.show('Failed to send', 'error');
      this.messages = this.messages.filter(m => m !== optimistic);
      // re-render to remove ghost
      this._renderMessages();
    }
  }

  async _loadMessages() {
    this.messages = [];
    if (!BoardFlowAuth.supabase || !this.boardId) { this._renderMessages(); return; }
    try {
      const { data, error } = await BoardFlowAuth.supabase
        .from('chat_messages')
        .select('*, profiles(display_name)')
        .eq('board_id', this.boardId)
        .order('created_at', { ascending: true })
        .limit(80);
      if (error) throw error;
      if (data) this.messages = data;
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
    this._renderMessages();
  }

  _subscribeRealtime() {
    if (!BoardFlowAuth.supabase || !this.boardId) return;
    if (this._subscription) {
      try { BoardFlowAuth.supabase.removeChannel(this._subscription); } catch {}
      this._subscription = null;
    }
    this._subscription = BoardFlowAuth.supabase
      .channel(`chat-${this.boardId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `board_id=eq.${this.boardId}` },
        async (payload) => {
          let msg = payload.new;
          // fetch profile for display name
          try {
            const { data } = await BoardFlowAuth.supabase.from('profiles').select('display_name').eq('id', msg.user_id).single();
            if (data) msg.profiles = data;
          } catch {}
          if (!this.messages.find(m => m.id === msg.id)) {
            // remove optimistic duplicate
            this.messages = this.messages.filter(m => !m._optimistic || m.content !== msg.content);
            this.messages.push(msg);
            this._renderMessage(msg);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') console.error('Chat realtime connection error');
      });
  }

  _renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    container.innerHTML = `<div class="chat-message chat-system">${Utils.escapeHtml(I18n.__('welcome_chat'))}</div>`;
    this.messages.forEach(msg => this._renderMessage(msg));
  }

  _renderMessage(msg) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const isOwn = msg.user_id === BoardFlowAuth.getUserId();
    if (!isOwn && !msg._optimistic && localStorage.getItem('boardflow_chat_sound') !== 'false') {
      try {
        if (!this._audioCtx) this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = this._audioCtx;
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 660; osc.type = 'sine';
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
      } catch {}
    }
    // unread badge when panel closed
    if (!this.isOpen && !isOwn) {
      const btn = document.getElementById('tb-chat');
      if (btn && !btn.querySelector('.chat-badge')) {
        const b = document.createElement('span'); b.className = 'chat-badge'; b.textContent = '•'; b.style.cssText = 'position:absolute;top:2px;right:2px;background:var(--danger);color:#fff;border-radius:50%;width:8px;height:8px;font-size:0;';
        btn.style.position = 'relative'; btn.appendChild(b);
      }
    }
    if (this.isOpen) {
      const b = document.querySelector('#tb-chat .chat-badge'); if (b) b.remove();
    }
    const el = document.createElement('div');
    el.className = `chat-message ${isOwn ? 'chat-own' : 'chat-other'}`;
    const displayName = msg.profiles?.display_name || (isOwn ? 'You' : String(msg.user_id || '').slice(0, 8) || 'User');
    el.innerHTML = `
      <div class="chat-msg-user" style="font-size: var(--text-xs); color: var(--ink-muted); margin-bottom: 2px;">${Utils.escapeHtml(displayName)}</div>
      <div class="chat-msg-content">${Utils.escapeHtml(msg.content)}</div>
      <div class="chat-msg-time" style="font-size: var(--text-xs); color: var(--ink-muted); margin-top: 2px;">${this._formatTime(msg.created_at)}</div>
    `;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }

  _formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return I18n.__('just_now');
    if (diff < 60) return I18n.__('minutes_ago', { n: diff });
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

try {
  Object.defineProperty(window, 'BoardChat', { value: new _BoardChat(), writable: false, configurable: true, enumerable: true });
} catch { window.BoardChat = new _BoardChat(); }
