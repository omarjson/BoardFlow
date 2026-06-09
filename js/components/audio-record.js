// ============================================
// Audio Recorder — Professional In-Browser Recording
// ============================================

class _AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.isPaused = false;
    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
    this.animationId = null;
    this.timerInterval = null;
    this.duration = 0;
    this._resolveStop = null;
    this._resolveCancel = null;

    this.ui = {
      panel: null,
      timer: null,
      visualizer: null,
      pauseBtn: null,
      resumeBtn: null,
      stopBtn: null,
      cancelBtn: null,
      status: null,
      ctx: null
    };
  }

  _getSupportedMime() {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg'];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  }

  async start() {
    if (this.isRecording) return false;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = this._getSupportedMime();
      this.mediaRecorder = new MediaRecorder(mime ? { mimeType: mime } : undefined);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };

      this.mediaRecorder.onerror = () => {
        this._cleanup();
        if (this._resolveStop) this._resolveStop(null);
      };

      this.mediaRecorder.start(250);
      this.isRecording = true;
      this.isPaused = false;

      this._setupAudioAnalysis();
      this._showRecorderUI();
      this._startTimer();

      return true;
    } catch (err) {
      console.error('Audio recording failed:', err);
      Toast.show('Microphone access denied', 'error');
      return false;
    }
  }

  pause() {
    if (this.mediaRecorder && this.isRecording && !this.isPaused && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.isPaused = true;
      this._updateUIState();
      if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
    }
  }

  resume() {
    if (this.mediaRecorder && this.isRecording && this.isPaused && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.isPaused = false;
      this._updateUIState();
      this._resumeTimer();
    }
  }

  stop() {
    if (!this.mediaRecorder || !this.isRecording) return Promise.resolve(null);

    return new Promise((resolve) => {
      this._resolveStop = resolve;
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType || 'audio/webm' });
        const ext = (this.mediaRecorder.mimeType || 'audio/webm').includes('mp4') ? 'm4a' :
                    (this.mediaRecorder.mimeType || 'audio/webm').includes('ogg') ? 'ogg' : 'webm';
        const file = new File([blob], `recording-${Date.now()}.${ext}`, { type: this.mediaRecorder.mimeType || 'audio/webm' });
        this._cleanup();
        this._removeRecorderUI();
        resolve(file);
      };
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.isPaused = false;
    });
  }

  cancel() {
    return new Promise((resolve) => {
      this._resolveCancel = resolve;
      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.onstop = () => {
          this._cleanup();
          this._removeRecorderUI();
          resolve(null);
        };
        this.mediaRecorder.stop();
        this.isRecording = false;
        this.isPaused = false;
      } else {
        this._cleanup();
        this._removeRecorderUI();
        resolve(null);
      }
    });
  }

  recordAndUpload(x, y) {
    return new Promise(async (resolve) => {
      const started = await this.start();
      if (!started) return resolve(null);

      this._onUpload = async (file) => {
        this._showUploadingState();
        try {
          const result = await ImageUtils.uploadFile(file);
          if (!result) throw new Error('Upload failed');

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
          resolve(item);
        } catch (err) {
          Toast.show('Upload failed: ' + err.message, 'error');
          resolve(null);
        } finally {
          this._removeRecorderUI();
        }
      };

      this._onCancel = () => {
        resolve(null);
      };
    });
  }

  _setupAudioAnalysis() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      this.analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);
      this.analyser.fftSize = 256;

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!this.ui.visualizer || !this.analyser) return;
        this.animationId = requestAnimationFrame(draw);
        this.analyser.getByteFrequencyData(dataArray);

        const { ctx, visualizer } = this.ui;
        const width = visualizer.width;
        const height = visualizer.height;

        ctx.clearRect(0, 0, width, height);

        const barWidth = Math.max((width / bufferLength) * 2.5, 2);
        let xPos = 0;

        for (let i = 0; i < bufferLength && xPos < width; i++) {
          const barHeight = Math.max((dataArray[i] / 255) * height, 1);
          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.9)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(xPos, height - barHeight, barWidth, barHeight, 1);
          ctx.fill();
          xPos += barWidth + 1;
        }
      };
      draw();
    } catch (err) {
      console.warn('Audio analysis setup failed:', err);
    }
  }

  _startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.isPaused) {
        this.duration++;
        this._updateTimerText();
      }
    }, 1000);
  }

  _resumeTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.isPaused) {
        this.duration++;
        this._updateTimerText();
      }
    }, 1000);
  }

  _updateTimerText() {
    if (!this.ui.timer) return;
    const mins = Math.floor(this.duration / 60).toString().padStart(2, '0');
    const secs = (this.duration % 60).toString().padStart(2, '0');
    this.ui.timer.innerText = `${mins}:${secs}`;
  }

  _showRecorderUI() {
    this._removeRecorderUI();
    this.duration = 0;

    const panel = document.createElement('div');
    panel.id = 'audio-recorder-panel';
    panel.className = 'audio-recorder-panel';

    const timer = document.createElement('div');
    timer.className = 'audio-recorder-timer';
    timer.innerText = '00:00';

    const canvas = document.createElement('canvas');
    canvas.width = 140;
    canvas.height = 36;
    canvas.className = 'audio-recorder-visualizer';

    const controls = document.createElement('div');
    controls.className = 'audio-recorder-controls';

    const pauseBtn = document.createElement('button');
    pauseBtn.className = 'audio-recorder-btn audio-recorder-pause';
    pauseBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`;
    pauseBtn.title = 'Pause';
    pauseBtn.onclick = () => this.pause();

    const resumeBtn = document.createElement('button');
    resumeBtn.className = 'audio-recorder-btn audio-recorder-resume';
    resumeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
    resumeBtn.title = 'Resume';
    resumeBtn.onclick = () => this.resume();
    resumeBtn.style.display = 'none';

    const stopBtn = document.createElement('button');
    stopBtn.className = 'audio-recorder-btn audio-recorder-stop';
    stopBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg> Stop`;
    stopBtn.onclick = async () => {
      const file = await this.stop();
      if (file && this._onUpload) this._onUpload(file);
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'audio-recorder-btn audio-recorder-cancel';
    cancelBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    cancelBtn.title = 'Cancel';
    cancelBtn.onclick = async () => {
      await this.cancel();
      if (this._onCancel) this._onCancel();
    };

    const status = document.createElement('div');
    status.className = 'audio-recorder-status';
    status.innerText = 'Recording...';

    const pulsingDot = document.createElement('span');
    pulsingDot.className = 'audio-recorder-pulse';

    status.prepend(pulsingDot);
    controls.append(pauseBtn, resumeBtn, stopBtn, cancelBtn);
    panel.append(timer, canvas, controls, status);
    document.body.appendChild(panel);

    this.ui = {
      panel, timer, visualizer: canvas,
      ctx: canvas.getContext('2d'),
      pauseBtn, resumeBtn, stopBtn, cancelBtn, status
    };

    this._updateUIState();
  }

  _updateUIState() {
    if (!this.ui.pauseBtn) return;
    this.ui.pauseBtn.style.display = this.isPaused ? 'none' : 'inline-flex';
    this.ui.resumeBtn.style.display = this.isPaused ? 'inline-flex' : 'none';
    this.ui.status.innerHTML = this.isPaused
      ? `<span class="audio-recorder-pulse paused"></span> Paused`
      : `<span class="audio-recorder-pulse"></span> Recording...`;
  }

  _showUploadingState() {
    if (!this.ui.panel) return;

    this.ui.timer.style.display = 'none';
    this.ui.visualizer.style.display = 'none';
    this.ui.pauseBtn?.remove();
    this.ui.resumeBtn?.remove();
    this.ui.stopBtn?.remove();
    this.ui.cancelBtn?.remove();

    this.ui.status.innerHTML = `
      <span class="audio-recorder-spinner"></span>
      Uploading...
    `;
    this.ui.status.style.color = 'var(--primary)';
    this.ui.status.style.fontWeight = '600';
  }

  _removeRecorderUI() {
    const panel = document.getElementById('audio-recorder-panel');
    if (panel) panel.remove();
    this.ui.panel = null;
    if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  _cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this._resolveStop = null;
    this._resolveCancel = null;
  }

  destroy() {
    this.cancel();
  }
}

try {
  Object.defineProperty(window, 'AudioRecorder', { value: new _AudioRecorder(), writable: false, configurable: true, enumerable: true });
} catch { window.AudioRecorder = new _AudioRecorder(); }
