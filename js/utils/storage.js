// ============================================
// IndexedDB Local Cache
// ============================================

const DB_NAME = 'boardflow';
const DB_VERSION = 1;

class _Storage {
  constructor() {
    this.db = null;
  }

  async _open() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async get(key) {
    const db = await this._open();
    return new Promise((resolve) => {
      const tx = db.transaction('cache', 'readonly');
      const req = tx.objectStore('cache').get(key);
      req.onsuccess = () => resolve(req.result?.value ?? null);
      req.onerror = () => resolve(null);
    });
  }

  async set(key, value, ttl) {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cache', 'readwrite');
      const entry = { key, value, expires: ttl ? Date.now() + ttl : null };
      tx.objectStore('cache').put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async delete(key) {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cache', 'readwrite');
      tx.objectStore('cache').delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getFile(id) {
    const db = await this._open();
    return new Promise((resolve) => {
      const tx = db.transaction('files', 'readonly');
      const req = tx.objectStore('files').get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  }

  async saveFile(id, data, mimeType) {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').put({ id, data, mimeType, savedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clearCache() {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cache', 'readwrite');
      tx.objectStore('cache').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clearExpired() {
    const db = await this._open();
    const now = Date.now();
    return new Promise((resolve) => {
      const tx = db.transaction('cache', 'readwrite');
      const store = tx.objectStore('cache');
      const req = store.openCursor();
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (!cursor) return;
        if (cursor.value.expires && cursor.value.expires < now) {
          store.delete(cursor.key);
        }
        cursor.continue();
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
}

try {
  Object.defineProperty(window, 'Storage', { value: new _Storage(), writable: false, configurable: true, enumerable: true });
} catch {
  window.Storage = new _Storage();
}
