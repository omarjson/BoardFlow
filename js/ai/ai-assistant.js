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

  async chat(message, context) {
    if (!this.isAvailable()) {
      Toast.show('AI not available — Puter.js not loaded', 'error');
      return null;
    }

    try {
      const systemPrompt = context
        ? `You are a helpful board assistant. Context: ${context}`
        : 'You are a helpful board assistant. Keep responses concise.';

      const response = await puter.ai.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]);

      return response?.message?.content || response?.toString() || 'No response';
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
    this.messages = [];
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

      const reply = await this.chat(text, context);
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

    // OCR
    document.getElementById('ai-ocr-select')?.addEventListener('click', async () => {
      const items = ItemManager.items.filter(i => i.type === 'image' || i.type === 'screenshot');
      if (items.length === 0) {
        Toast.show('No images on the board', 'info');
        return;
      }

      const resultEl = document.getElementById('ai-ocr-result');
      resultEl.innerHTML = '<div class="ai-loading">Extracting text...</div>';

      for (const item of items) {
        if (item.file_url) {
          const text = await this.ocr(item.file_url);
          if (text) {
            const escapedText = Utils.escapeHtml(text);
            resultEl.innerHTML = `
              <div class="ai-message ai-system" style="white-space: pre-wrap;">${escapedText}</div>
              <button class="btn btn-secondary btn-sm copy-ocr-text" style="margin-top: var(--space-sm);">Copy Text</button>
            `;
            resultEl.querySelector('.copy-ocr-text')?.addEventListener('click', () => {
              navigator.clipboard.writeText(text);
              Toast.show('Text copied', 'success');
            });
            return;
          }
        }
      }
      resultEl.textContent = 'No text could be extracted';
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
