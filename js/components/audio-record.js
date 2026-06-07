// ============================================
// Audio Recorder — In-Browser Recording
// ============================================

class _AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.stream = null;
    this._resolveStop = null;
    this._stopBtn = null;
  }

  async start() {
    if (this.isRecording) return;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };

      this.mediaRecorder.onerror = () => {
        this._cleanup();
        if (this._resolveStop) this._resolveStop(null);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      return true;
    } catch (err) {
      console.error('Audio recording failed:', err);
      Toast.show('Microphone access denied', 'error');
      return false;
    }
  }

  async stop() {
    if (!this.mediaRecorder || !this.isRecording) return null;

    return new Promise((resolve) => {
      this._resolveStop = resolve;
      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        this._cleanup();
        this._removeStopButton();
        resolve(file);
      };
      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }

  cancel() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
    this._cleanup();
    this._removeStopButton();
  }

  async recordAndUpload(x, y) {
    const started = await this.start();
    if (!started) return null;

    this._showStopButton();

    const file = await this.stop();
    if (!file) return null;

    Toast.show('Uploading recording...', 'info');
    const result = await ImageUtils.uploadFile(file);
    if (!result) {
      Toast.show('Upload failed', 'error');
      return null;
    }

    const item = await ItemManager.createItem('audio', {
      x, y,
      width: 300,
      height: 80,
      title: `Recording ${new Date().toLocaleTimeString()}`,
      file_url: result.url,
      file_provider: result.provider,
      file_id: result.id
    });

    Toast.show('Recording saved', 'success');
    return item;
  }

  _showStopButton() {
    this._removeStopButton();
    this._stopBtn = document.createElement('div');
    this._stopBtn.id = 'audio-stop-btn';
    this._stopBtn.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      z-index: 10000;
      background: #e74c3c; color: #fff; padding: 12px 24px;
      border-radius: 30px; border: none; font-size: 16px;
      cursor: pointer; box-shadow: 0 4px 20px rgba(231,76,60,0.4);
      display: flex; align-items: center; gap: 8px;
    `;
    this._stopBtn.innerHTML = '🔴 Stop Recording';
    this._stopBtn.addEventListener('click', () => this.stop());
    document.body.appendChild(this._stopBtn);
  }

  _removeStopButton() {
    if (this._stopBtn) {
      this._stopBtn.remove();
      this._stopBtn = null;
    }
  }

  _cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this._resolveStop = null;
  }

  destroy() {
    this.cancel();
  }
}

try {
  Object.defineProperty(window, 'AudioRecorder', { value: new _AudioRecorder(), writable: false, configurable: true, enumerable: true });
} catch { window.AudioRecorder = new _AudioRecorder(); }
