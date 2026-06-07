// ============================================
// Video Upload Component
// ============================================

class VideoUpload {
  async uploadAndAdd(x, y) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.style.display = 'none';
      document.body.appendChild(input);

      input.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        input.remove();
        if (!file) { resolve(null); return; }

        Toast.show('Uploading video...', 'info');
        const result = await ImageUtils.uploadFile(file);
        if (!result) {
          Toast.show('Video upload failed', 'error');
          resolve(null);
          return;
        }

        const item = await ItemManager.createItem('video', {
          x, y,
          width: 400,
          height: 300,
          title: file.name,
          file_url: result.url,
          file_provider: result.provider,
          file_id: result.id
        });

        Toast.show('Video added to board', 'success');
        resolve(item);
      });

      input.click();
    });
  }

  destroy() {
    // Cleanup handled per-call
  }
}

window.VideoUpload = new VideoUpload();
