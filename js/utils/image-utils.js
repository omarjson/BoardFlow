// ============================================
// Image Utilities — Compression, Processing
// ============================================

const ImageUtils = {
  async compress(file, maxWidth = 1920, maxHeight = 1920, quality = 0.8) {
    if (!file.type.startsWith('image/')) return file;

    const img = await this._loadImage(file);
    let { width, height } = img;

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) { resolve(file); return; }
        const compressed = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now()
        });
        resolve(compressed);
      }, file.type, quality);
    });
  },

  async toDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  },

  async toBlob(dataUrl) {
    const res = await fetch(dataUrl);
    return res.blob();
  },

  _loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
  },

  async uploadToImgBB(file) {
    if (!CONFIG.IMGBB_API_KEY || CONFIG.IMGBB_API_KEY.includes('your-')) {
      return null;
    }

    const compressed = await this.compress(file);
    const formData = new FormData();
    formData.append('key', CONFIG.IMGBB_API_KEY);
    formData.append('image', compressed);

    try {
      const res = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        return data.data.url;
      }
      console.error('ImgBB upload failed:', data.error?.message);
      return null;
    } catch (err) {
      console.error('ImgBB upload error:', err);
      return null;
    }
  },

  async uploadToSupabaseStorage(file) {
    if (!BoardFlowAuth.supabase || !BoardFlowAuth.getUserId()) return null;
    try {
      const ext = (file.name.split('.').pop() || 'bin').slice(0, 10);
      const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Utils.generateId('f');
      const path = `${BoardFlowAuth.getUserId()}/${uuid}.${ext}`;
      const { error } = await BoardFlowAuth.supabase.storage.from('boardflow').upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) {
        // bucket may not exist yet
        console.warn('Supabase Storage upload failed:', error.message);
        return null;
      }
      const { data } = BoardFlowAuth.supabase.storage.from('boardflow').getPublicUrl(path);
      return data?.publicUrl || null;
    } catch (err) {
      console.warn('Supabase Storage error:', err);
      return null;
    }
  },

  async uploadToPuter(file) {
    if (typeof puter === 'undefined') return null;
    try {
      const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Utils.generateId('p');
      const safeName = `${uuid}-${file.name}`.replace(/[^a-zA-Z0-9._-]/g, '_');
      const result = await puter.fs.write(`BoardFlow/${safeName}`, file);
      if (result?.url) return { url: result.url, id: result.path || safeName };
      if (result?.path) {
        try {
          const fileBlob = await puter.fs.read(result.path);
          if (fileBlob?.url) return { url: fileBlob.url, id: result.path };
        } catch {}
        return { url: null, id: result.path };
      }
      return null;
    } catch (err) {
      console.error('Puter upload error:', err);
      return null;
    }
  },

  async _uploadToIndexedDB(file) {
    const id = Utils.generateId('file');
    const dataUrl = await this.toDataURL(file);
    await Storage.saveFile(id, dataUrl, file.type);
    return { url: dataUrl, provider: 'local', id };
  },

  async uploadFile(file) {
    const isImage = file.type.startsWith('image/');

    // 1. Supabase Storage (free 1GB, RLS, no extra key) — best for all file types
    try {
      const url = await this.uploadToSupabaseStorage(file);
      if (url) return { url, provider: 'supabase', id: url };
    } catch (err) { console.warn('Supabase Storage failed, trying ImgBB:', err); }

    // 2. Images under 5MB → ImgBB (permanent, free 32MB) if key configured
    if (isImage && file.size <= 5 * 1024 * 1024) {
      try {
        const url = await this.uploadToImgBB(file);
        if (url) return { url, provider: 'imgbb', id: url };
      } catch (err) { console.warn('ImgBB upload failed, trying Puter:', err); }
    }

    // 3. Puter.js (user-pays, no setup)
    if (typeof puter !== 'undefined') {
      try {
        const res = await this.uploadToPuter(file);
        if (res && res.url) return { url: res.url, provider: 'puter', id: res.id };
        if (res && res.id) return { url: null, provider: 'puter', id: res.id };
      } catch (err) { console.warn('Puter upload failed, using local:', err); }
    }

    // 4. Fallback: IndexedDB (local only, not shared)
    try {
      return await this._uploadToIndexedDB(file);
    } catch (err) {
      console.error('Local upload failed:', err);
      return null;
    }
  },

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(1) + ' GB';
  },

  getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return Icons.camera;
    if (mimeType.startsWith('video/')) return Icons.video;
    if (mimeType.startsWith('audio/')) return Icons.mic;
    if (mimeType.startsWith('text/')) return Icons.richNote;
    if (mimeType.includes('pdf')) return Icons.file;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return Icons.file;
    if (mimeType.includes('json') || mimeType.includes('javascript')) return Icons.file;
    return Icons.file;
  }
};

window.ImageUtils = ImageUtils;
