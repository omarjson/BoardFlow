// ============================================
// AI Assistant — Puter.js Integration
// ============================================

class _AIAssistant {
  constructor() {
    this.panel = null;
    this.isOpen = false;
    this.messages = [];
    this._mediaRecorder = null;
    this._mediaStream = null;
    this._isRecording = false;
  }

  isAvailable() {
    return typeof puter !== 'undefined' && puter.ai;
  }

  async chat(message, context, model) {
    if (!this.isAvailable()) {
      Toast.show('AI not available — Puter.js not loaded', 'error');
      return null;
    }

    try {
      const systemPrompt = context
        ? `You are a helpful board assistant. Context: ${context}`
        : 'You are a helpful board assistant. Keep responses concise.';

      const opts = {};
      if (model) opts.model = model;

      const response = await puter.ai.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ], opts);

      if (typeof response === 'string') return response;
      if (response?.message?.content) return response.message.content;
      if (response?.choices?.[0]?.message?.content) return response.choices[0].message.content;
      if (response?.text) return response.text;
      if (response?.data) return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      if (typeof response === 'object') return JSON.stringify(response);
      return 'No response';
    } catch (err) {
      console.error('AI chat failed:', err);
      Toast.show('AI chat failed', 'error');
      return null;
    }
  }

  async generateImage(prompt) {
    if (!this.isAvailable()) {
      Toast.show('AI not available', 'error');
      return null;
    }

    try {
      const result = await puter.ai.txt2img(prompt);
      return result;
    } catch (err) {
      console.error('Image generation failed:', err);
      Toast.show('Image generation failed', 'error');
      return null;
    }
  }

  async ocr(imageUrl) {
    if (!this.isAvailable()) {
      Toast.show('AI not available', 'error');
      return null;
    }

    try {
      const text = await puter.ai.img2txt(imageUrl);
      return text;
    } catch (err) {
      console.error('OCR failed:', err);
      Toast.show('OCR failed', 'error');
      return null;
    }
  }

  async textToSpeech(text) {
    if (!this.isAvailable()) {
      Toast.show('AI not available', 'error');
      return null;
    }

    try {
      const audio = await puter.ai.txt2speech(text, {
        voice: 'Joanna',
        engine: 'neural'
      });
      return audio;
    } catch (err) {
      console.error('TTS failed:', err);
      Toast.show('Text-to-speech failed', 'error');
      return null;
    }
  }

  async speechToText(audioBlob) {
    if (!this.isAvailable()) {
      Toast.show('AI not available', 'error');
      return null;
    }

    try {
      const text = await puter.ai.speech2txt(audioBlob);
      return text;
    } catch (err) {
      console.error('STT failed:', err);
      Toast.show('Speech-to-text failed', 'error');
      return null;
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.panel) {
      this.panel.style.display = 'flex';
      this.isOpen = true;
      // polling for puter availability
      const statusEl = document.getElementById('ai-status');
      if (statusEl) {
        let tries = 0;
        const iv = setInterval(()=> {
          if (this.isAvailable()) { statusEl.textContent = '🟢 Online'; clearInterval(iv); this._loadModels(); }
          else if (++tries > 10) clearInterval(iv);
        }, 800);
      }
      requestAnimationFrame(() => document.getElementById('ai-chat-input')?.focus());
      return;
    }

    this.panel = document.createElement('div');
    this.panel.id = 'ai-panel';
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-label', 'AI Assistant');
    this.panel.innerHTML = `
      <div class="ai-header">
        <span>AI Assistant</span>
        <div class="ai-header-actions">
          <span class="ai-status" id="ai-status">${this.isAvailable() ? '🟢 Online' : '🔴 Offline'}</span>
          <button class="ai-close btn btn-ghost" id="ai-close" aria-label="Close AI Assistant">&times;</button>
        </div>
      </div>
      <div class="ai-tabs">
        <button class="ai-tab active" data-tab="chat">Chat</button>
        <button class="ai-tab" data-tab="image">Image</button>
        <button class="ai-tab" data-tab="ocr">OCR</button>
        <button class="ai-tab" data-tab="voice">Voice</button>
      </div>
      <div class="ai-content">
        <div class="ai-tab-content active" id="ai-tab-chat">
          <div class="ai-messages" id="ai-messages">
            <div class="ai-message ai-system">Hello! I'm your AI assistant. Ask me anything about your board.</div>
          </div>
          <div class="ai-input-row">
            <textarea class="ai-input" id="ai-chat-input" placeholder="Ask anything..." rows="2"></textarea>
            <button class="btn btn-primary" id="ai-chat-send">Send</button>
          </div>
          <div class="ai-context">
            <label><input type="checkbox" id="ai-include-context"> Include board context</label>
            <div class="ai-model-select">
              <label for="ai-model">Model:</label>
              <select id="ai-model"><option value="">Loading models...</option></select>
            </div>
          </div>
        </div>
        <div class="ai-tab-content" id="ai-tab-image">
          <div style="padding: var(--space-md);">
            <label for="ai-image-prompt">Describe the image to generate</label>
            <textarea id="ai-image-prompt" class="ai-input" placeholder="A futuristic city at sunset..." rows="3" style="margin: var(--space-sm) 0;"></textarea>
            <button class="btn btn-primary btn-block" id="ai-image-generate">Generate</button>
            <div id="ai-image-result" style="margin-top: var(--space-md); text-align: center;"></div>
          </div>
        </div>
        <div class="ai-tab-content" id="ai-tab-ocr">
          <div style="padding: var(--space-md);">
            <p style="font-size: var(--text-sm); color: var(--ink-secondary); margin-bottom: var(--space-md);">Extract text from an image on the board.</p>
            <button class="btn btn-primary btn-block" id="ai-ocr-select">Select Image on Board</button>
            <div id="ai-ocr-result" style="margin-top: var(--space-md);"></div>
          </div>
        </div>
        <div class="ai-tab-content" id="ai-tab-voice">
          <div style="padding: var(--space-md);">
            <button class="btn btn-primary btn-block" id="ai-tts-btn" style="display: flex; align-items: center; justify-content: center; gap: var(--space-xs);">${Icons.info} Read Board Notes Aloud</button>
            <div id="ai-tts-player" style="margin-top: var(--space-sm);"></div>
            <div style="margin-top: var(--space-md);">
              <button class="btn btn-secondary btn-block" id="ai-stt-btn" style="display: flex; align-items: center; justify-content: center; gap: var(--space-xs);">${Icons.mic} Dictate Note</button>
              <div id="ai-stt-result" style="margin-top: var(--space-sm); font-size: var(--text-sm); color: var(--ink-secondary);"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.panel);
    this.isOpen = true;
    requestAnimationFrame(() => document.getElementById('ai-chat-input')?.focus());
    this._bindEvents();
  }

  close() {
    if (this.panel) {
      this.panel.style.display = 'none';
      this.isOpen = false;
    }
  }

  destroy() {
    if (this._isRecording) this._stopSTT();
    if (this._mediaStream) {
      this._mediaStream.getTracks().forEach(t => t.stop());
      this._mediaStream = null;
    }
    this._mediaRecorder = null;
    this.panel?.remove();
    this.panel = null;
    this.isOpen = false;
  }

  _bindEvents() {
    document.getElementById('ai-close')?.addEventListener('click', () => this.close());

    // Tab switching
    document.querySelectorAll('.ai-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.ai-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.ai-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`ai-tab-${tab.dataset.tab}`)?.classList.add('active');
      });
    });

    // Chat send
    const chatInput = document.getElementById('ai-chat-input');
    const chatSend = document.getElementById('ai-chat-send');

    const sendMessage = async () => {
      const text = chatInput?.value.trim();
      if (!text) return;

      this._addMessage('user', text);
      chatInput.value = '';
      chatSend.disabled = true;
      chatSend.textContent = '...';

      const includeContext = document.getElementById('ai-include-context')?.checked;
      let context = '';
      if (includeContext) {
        const items = ItemManager.items || [];
        context = items.map(i => `${i.type}: ${i.title || ''} — ${i.content || ''}`).join('\n').slice(0, 2000);
      }

      const reply = await this.chat(text, context, document.getElementById('ai-model')?.value);
      this._addMessage('assistant', reply || 'No response');
      chatSend.disabled = false;
      chatSend.textContent = 'Send';
    };

    chatSend?.addEventListener('click', sendMessage);
    chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Restore saved model & load available models
    this._loadModels();

    // Image generation
    document.getElementById('ai-image-generate')?.addEventListener('click', async () => {
      const prompt = document.getElementById('ai-image-prompt')?.value.trim();
      if (!prompt) return;

      const btn = document.getElementById('ai-image-generate');
      const resultEl = document.getElementById('ai-image-result');
      btn.disabled = true;
      btn.textContent = 'Generating...';
      resultEl.innerHTML = '<div class="ai-loading">Generating image...</div>';

      const image = await this.generateImage(prompt);
      btn.disabled = false;
      btn.textContent = 'Generate';

      if (image) {
        const url = image.url ?? image;
        const escapedUrl = Utils.escapeHtml(url);
        const escapedPrompt = Utils.escapeHtml(prompt);
        resultEl.innerHTML = `
          <img src="${escapedUrl}" alt="${escapedPrompt}" style="max-width: 100%; max-height: 300px; border-radius: var(--radius-md); cursor: pointer;">
          <button class="btn btn-secondary btn-sm add-ai-image" style="margin-top: var(--space-sm);">Add to Board</button>
        `;
        resultEl.querySelector('.add-ai-image')?.addEventListener('click', () => this._addGeneratedImage(url));
        resultEl.querySelector('img')?.addEventListener('click', () => this._addGeneratedImage(url));
      } else {
        resultEl.textContent = 'Generation failed';
      }
    });

    // OCR with picker
    document.getElementById('ai-ocr-select')?.addEventListener('click', async () => {
      const items = ItemManager.items.filter(i => (i.type === 'image' || i.type === 'screenshot') && i.file_url);
      if (items.length === 0) { Toast.show('No images on the board', 'info'); return; }
      if (items.length === 1) {
        const resultEl = document.getElementById('ai-ocr-result');
        resultEl.innerHTML = '<div class="ai-loading">Extracting text...</div>';
        const text = await this.ocr(items[0].file_url);
        if (text) {
          resultEl.innerHTML = `<div class="ai-message ai-system" style="white-space: pre-wrap;">${Utils.escapeHtml(text)}</div><button class="btn btn-secondary btn-sm copy-ocr-text" style="margin-top: var(--space-sm);">Copy Text</button>`;
          resultEl.querySelector('.copy-ocr-text')?.addEventListener('click', () => { navigator.clipboard.writeText(text); Toast.show('Text copied','success'); });
        } else resultEl.textContent = 'No text could be extracted';
        return;
      }
      // picker for multiple images
      Modal.show({
        title: 'Choose image for OCR',
        content: `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;max-height:300px;overflow:auto;">${items.map((it,idx)=>`<button class="ocr-pick-btn" data-idx="${idx}" style="border:1px solid var(--hairline);border-radius:8px;overflow:hidden;padding:0;background:var(--surface);"><img src="${Utils.escapeHtml(it.file_url)}" style="width:100%;height:100px;object-fit:cover;"><div style="padding:6px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${Utils.escapeHtml(it.title||'Image '+(idx+1))}</div></button>`).join('')}</div>`,
        confirmText: 'Cancel', hideCancel: true, onConfirm: ()=>{}
      });
      document.querySelectorAll('.ocr-pick-btn').forEach(btn=>{
        btn.addEventListener('click', async ()=>{
          const idx = parseInt(btn.dataset.idx); Modal.close();
          const resultEl = document.getElementById('ai-ocr-result');
          resultEl.innerHTML = '<div class="ai-loading">Extracting text...</div>';
          const text = await this.ocr(items[idx].file_url);
          if (text) {
            resultEl.innerHTML = `<div class="ai-message ai-system" style="white-space: pre-wrap;">${Utils.escapeHtml(text)}</div><button class="btn btn-secondary btn-sm copy-ocr-text" style="margin-top: var(--space-sm);">Copy Text</button><button class="btn btn-secondary btn-sm create-ocr-note" style="margin-top:var(--space-sm);margin-left:6px;">Create Note</button>`;
            resultEl.querySelector('.copy-ocr-text')?.addEventListener('click', ()=>{ navigator.clipboard.writeText(text); Toast.show('Text copied','success'); });
            resultEl.querySelector('.create-ocr-note')?.addEventListener('click', ()=> this._createNoteFromText(text));
          } else resultEl.textContent = 'No text could be extracted';
        });
      });
    });

    // TTS
    document.getElementById('ai-tts-btn')?.addEventListener('click', async () => {
      const items = ItemManager.items.filter(i => i.content || i.title);
      if (items.length === 0) {
        Toast.show('No content to read', 'info');
        return;
      }

      const text = items.map(i => `${i.title}: ${i.content}`).join('. ').slice(0, 2000);
      Toast.show('Generating speech...', 'info');

      const audio = await this.textToSpeech(text);
      if (audio) {
        const url = audio.url ?? audio;
        const playerEl = document.getElementById('ai-tts-player');
        const existing = playerEl?.querySelector('audio');
        if (existing) existing.remove();
        const player = document.createElement('audio');
        player.src = url;
        player.controls = true;
        player.style.cssText = 'width: 100%;';
        playerEl?.appendChild(player);
        player.play();
      }
    });

    // STT
    document.getElementById('ai-stt-btn')?.addEventListener('click', () => {
      if (this._isRecording) {
        this._stopSTT();
      } else {
        this._startSTT();
      }
    });
  }

  async _loadModels() {
    const select = document.getElementById('ai-model');
    if (!select || !this.isAvailable()) return;
    // cache with 1h TTL
    const cacheKey = 'boardflow_ai_models_cache';
    const cached = (() => { try { const c = JSON.parse(localStorage.getItem(cacheKey)||'null'); if (c && Date.now()-c.ts < 3600000) return c.data; } catch {} return null; })();
    if (cached) { this._renderModels(select, cached); return; }
    try {
      const models = await puter.ai.listModels();
      try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: models })); } catch {}
      if (!models?.length) return;

      this._renderModels(select, models);
    } catch (err) {
      console.warn('Failed to load AI models:', err);
      // try cached even if stale
      const stale = (() => { try { return JSON.parse(localStorage.getItem(cacheKey)||'null')?.data; } catch { return null; }})();
      if (stale) { this._renderModels(select, stale); return; }
      select.innerHTML = '<option value="openai/gpt-4o-mini">GPT-4o Mini</option>';
    }
  }

  _renderModels(select, models) {
      const saved = localStorage.getItem('boardflow_ai_model');
      const providers = {};
      models.forEach(m => {
        const provider = m.provider || 'other';
        if (!providers[provider]) providers[provider] = [];
        providers[provider].push(m);
      });
      const providerOrder = ['openai', 'claude', 'gemini', 'deepseek', 'grok', 'mistral', 'meta', 'z-ai'];
      const sorted = Object.entries(providers).sort((a, b) => {
        const ai = providerOrder.indexOf(a[0]); const bi = providerOrder.indexOf(b[0]);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
      select.innerHTML = '';
      let firstId = null;
      sorted.forEach(([provider, list]) => {
        const group = document.createElement('optgroup');
        group.label = provider.charAt(0).toUpperCase() + provider.slice(1);
        list.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
        list.forEach(m => {
          const opt = document.createElement('option');
          opt.value = m.id; opt.textContent = m.name || m.id;
          group.appendChild(opt);
          if (!firstId) firstId = m.id;
        });
        select.appendChild(group);
      });
      if (saved && select.querySelector(`option[value="${saved}"]`)) select.value = saved;
      else if (firstId) select.value = firstId;
      if (!select._bound) {
        select._bound = true;
        select.addEventListener('change', () => localStorage.setItem('boardflow_ai_model', select.value));
      }
  }

  async _startSTT() {
    try {
      this._mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this._mediaRecorder = new MediaRecorder(this._mediaStream);
      const chunks = [];

      this._mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      this._mediaRecorder.onstop = async () => {
        this._mediaStream?.getTracks().forEach(t => t.stop());
        this._mediaStream = null;
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const resultEl = document.getElementById('ai-stt-result');
        resultEl.textContent = 'Transcribing...';

        const text = await this.speechToText(blob);
        if (text) {
          const escapedText = Utils.escapeHtml(text);
          resultEl.innerHTML = `
            <div class="ai-message ai-system">${escapedText}</div>
            <button class="btn btn-secondary btn-sm create-stt-note" style="margin-top: var(--space-sm);">Create Note</button>
          `;
          resultEl.querySelector('.create-stt-note')?.addEventListener('click', () => this._createNoteFromText(text));
        } else {
          resultEl.textContent = 'Transcription failed';
        }
        this._isRecording = false;
      };

      this._isRecording = true;
      const btn = document.getElementById('ai-stt-btn');
      btn.textContent = 'Stop Recording';
      btn.classList.add('btn-danger');
      Toast.show('Recording... Click "Stop Recording" when done', 'info');
      this._mediaRecorder.start();
    } catch (err) {
      Toast.show('Microphone access denied', 'error');
    }
  }

  _stopSTT() {
    if (this._mediaRecorder && this._mediaRecorder.state !== 'inactive') {
      this._mediaRecorder.stop();
    }
    const btn = document.getElementById('ai-stt-btn');
    btn.innerHTML = `${Icons.mic} Dictate Note`;
    btn.classList.remove('btn-danger');
  }

  _addMessage(role, content) {
    const container = document.getElementById('ai-messages');
    if (!container) return;
    const msg = document.createElement('div');
    msg.className = `ai-message ai-${role}`;
    msg.textContent = content;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    // persist to local history (cap 100)
    try {
      this.messages.push({ role, content, at: Date.now() });
      if (this.messages.length > 100) this.messages = this.messages.slice(-100);
      localStorage.setItem('boardflow_ai_history', JSON.stringify(this.messages));
    } catch {}
  }

  _addGeneratedImage(url) {
    const canvasEl = document.getElementById('canvas');
    const rect = canvasEl.getBoundingClientRect();
    const x = (rect.width / 2 - Canvas.panX) / Canvas.zoom - 150;
    const y = (rect.height / 2 - Canvas.panY) / Canvas.zoom - 125;
    ItemManager.createItem('image', {
      x, y, width: 300, height: 250,
      title: 'AI Generated',
      file_url: url,
      file_provider: 'puter'
    });
    Toast.show('Image added to board', 'success');
  }

  _createNoteFromText(text) {
    const canvasEl = document.getElementById('canvas');
    const rect = canvasEl.getBoundingClientRect();
    const x = (rect.width / 2 - Canvas.panX) / Canvas.zoom - 150;
    const y = (rect.height / 2 - Canvas.panY) / Canvas.zoom - 125;
    ItemManager.createItem('sticky_note', {
      x, y,
      title: 'Dictated',
      content: text,
      color: localStorage.getItem('boardflow_default_note_color') || '#fffde7'
    });
    Toast.show('Note created from speech', 'success');
  }
}

try {
  Object.defineProperty(window, 'AIAssistant', { value: new _AIAssistant(), writable: false, configurable: true, enumerable: true });
} catch { window.AIAssistant = new _AIAssistant(); }
