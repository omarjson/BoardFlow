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

  async uploadToPuter(file) {
    if (typeof puter === 'undefined') return null;

    try {
      const result = await puter.fs.write(`BoardFlow/${file.name}`, file);
      return result?.url || result?.path || null;
    } catch (err) {
      console.error('Puter upload error:', err);
      return null;
    }
  },

  async uploadFile(file) {
    const isImage = file.type.startsWith('image/');
    const isLarge = file.size > 5 * 1024 * 1024;

    // Images under 5MB → ImgBB
    if (isImage && !isLarge) {
      const url = await this.uploadToImgBB(file);
      if (url) return { url, provider: 'imgbb' };
    }

    // Videos, audio, large files → Puter.js
    if (typeof puter !== 'undefined') {
      const url = await this.uploadToPuter(file);
      if (url) return { url, provider: 'puter' };
    }

    // Fallback: cache in IndexedDB
    const id = Utils.generateId('file');
    const dataUrl = await this.toDataURL(file);
    await Storage.saveFile(id, dataUrl, file.type);
    return { url: dataUrl, provider: 'local', id };
  },

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(1) + ' GB';
  },

  getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return '🖼';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.startsWith('text/')) return '📄';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    if (mimeType.includes('json') || mimeType.includes('javascript')) return '📋';
    return '📎';
  }
};

window.ImageUtils = ImageUtils;
