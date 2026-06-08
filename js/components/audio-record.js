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

    this.ui = {
      panel: null,
      timer: null,
      visualizer: null,
      pauseBtn: null,
      resumeBtn: null,
      stopBtn: null,
      status: null,
      ctx: null
    };
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
    if (this.mediaRecorder && this.isRecording && !this.isPaused) {
      this.mediaRecorder.pause();
      this.isPaused = true;
      this._updateUIState();
      clearInterval(this.timerInterval);
    }
  }

  resume() {
    if (this.mediaRecorder && this.isRecording && this.isPaused) {
      this.mediaRecorder.resume();
      this.isPaused = false;
      this._updateUIState();
      this._startTimer();
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
        this._removeRecorderUI();
        resolve(file);
      };
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.isPaused = false;
    });
  }

  cancel() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
    this._cleanup();
    this._removeRecorderUI();
  }

  async recordAndUpload(x, y) {
    const started = await this.start();
    if (!started) return null;

    const file = await this.stop();
    if (!file) return null;

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
      return item;
    } catch (err) {
      Toast.show('Upload failed: ' + err.message, 'error');
      return null;
    } finally {
      this._removeRecorderUI();
    }
  }

  _setupAudioAnalysis() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    const source = this.audioContext.createMediaStreamSource(this.stream);
    source.connect(this.analyser);
    this.analyser.fftSize = 256;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!this.ui.visualizer) return;
      this.animationId = requestAnimationFrame(draw);
      this.analyser.getByteFrequencyData(dataArray);

      const { ctx, visualizer } = this.ui;
      const width = visualizer.width;
      const height = visualizer.height;
      
      ctx.clearRect(0, 0, width, height);
      
      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        ctx.fillStyle = `rgb(99, 102, 241)`; // Premium Indigo
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  }

  _startTimer() {
    this.duration = 0;
    this.timerInterval = setInterval(() => {
      this.duration++;
      this._updateTimerText();
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

    const panel = document.createElement('div');
    panel.id = 'audio-recorder-panel';
    panel.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      z-index: 10000; background: var(--surface); 
      border: 1px solid var(--hairline); border-radius: var(--radius-lg);
      padding: var(--space-md); box-shadow: var(--shadow-elevated);
      display: flex; align-items: center; gap: var(--space-md);
      min-width: 300px; font-family: var(--font-sans);
      animation: modalPop var(--duration-base) var(--ease-spring);
    `;

    const timer = document.createElement('div');
    timer.style.cssText = `font-family: var(--font-mono); font-size: 18px; font-weight: 600; color: var(--ink); min-width: 60px;`;
    timer.innerText = '00:00';

    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 30;
    canvas.style.cssText = `background: var(--canvas-soft); border-radius: var(--radius-xs);`;

    const controls = document.createElement('div');
    controls.style.cssText = `display: flex; gap: var(--space-xs);`;

    const pauseBtn = document.createElement('button');
    pauseBtn.className = 'btn btn-ghost btn-sm';
    pauseBtn.innerHTML = '⏸️';
    pauseBtn.title = 'Pause';
    pauseBtn.onclick = () => this.pause();

    const resumeBtn = document.createElement('button');
    resumeBtn.className = 'btn btn-ghost btn-sm';
    resumeBtn.innerHTML = '▶️';
    resumeBtn.title = 'Resume';
    resumeBtn.onclick = () => this.resume();
    resumeBtn.style.display = 'none';

    const stopBtn = document.createElement('button');
    stopBtn.className = 'btn btn-danger btn-sm';
    stopBtn.innerHTML = '⏹️ Stop';
    stopBtn.onclick = () => this.stop();

    const status = document.createElement('div');
    status.style.cssText = `font-size: var(--text-xs); color: var(--ink-muted); margin-left: auto;`;
    status.innerText = 'Recording...';

    controls.append(pauseBtn, resumeBtn, stopBtn);
    panel.append(timer, canvas, controls, status);
    document.body.appendChild(panel);

    this.ui = {
      panel, timer, visualizer: canvas, 
      ctx: canvas.getContext('2d'), 
      pauseBtn, resumeBtn, stopBtn, status
    };

    this._updateUIState();
  }

  _updateUIState() {
    if (!this.ui.pauseBtn) return;
    this.ui.pauseBtn.style.display = this.isPaused ? 'none' : 'inline-flex';
    this.ui.resumeBtn.style.display = this.isPaused ? 'inline-flex' : 'none';
    this.ui.status.innerText = this.isPaused ? 'Paused' : 'Recording...';
  }

  _showUploadingState() {
    if (!this.ui.panel) return;
    
    this.ui.timer.style.display = 'none';
    this.ui.visualizer.style.display = 'none';
    this.ui.pauseBtn.remove();
    this.ui.resumeBtn.remove();
    this.ui.stopBtn.remove();
    
    this.ui.status.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div class="spinner-sm" style="border-color: var(--primary); border-top-color: transparent; animation: spin 0.6s linear infinite;"></div>
        Uploading...
      </div>
    `;
    this.ui.status.style.color = 'var(--primary)';
    this.ui.status.style.fontWeight = '600';
  }

  _removeRecorderUI() {
    if (this.ui.panel) {
      this.ui.panel.remove();
      this.ui.panel = null;
    }
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  _cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
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
