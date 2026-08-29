// ============================================
// BoardFlow Auth State Management — Full Cloud Mode
// No demo fallback: Supabase required.
// Self-recovering: redefines BoardFlowAuth if missing methods.
// ============================================

(() => {
  const METHODS = ['init', 'signIn', 'signUp', 'signOut', 'isAuthenticated', 'getUser', 'getUserId', 'onAuthChange', 'signInWithGoogle', 'resetPassword', 'updatePassword', 'resendConfirmation'];
  function isValidInstance(obj) {
    if (!obj || typeof obj !== 'object') return false;
    const proto = Object.getPrototypeOf(obj);
    if (!proto) return false;
    return METHODS.every(m => typeof proto[m] === 'function');
  }

  if (isValidInstance(window.BoardFlowAuth)) {
    return;
  }

  class BoardFlowAuth {
    constructor() {
      this.user = null;
      this.session = null;
      this.listeners = [];
      this.supabase = null;
      this._initialized = false;
    }

    async init() {
      if (typeof supabase === 'undefined' || !window.CONFIG || !CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL.includes('your-project')) {
        throw new Error('Supabase not configured. Set js/config.js from config.example.js');
      }

      this.supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_PUBLISHABLE_KEY);

      try {
        const { data: { session }, error } = await this.supabase.auth.getSession();
        if (error) throw error;
        this.session = session;
        this.user = session?.user || null;
      } catch (err) {
        console.error('Failed to get session:', err);
        this.session = null;
        this.user = null;
      }

      this.supabase.auth.onAuthStateChange((event, session) => {
        this.session = session;
        this.user = session?.user || null;
        this._notifyListeners(event);
        // Handle OAuth redirect: if SIGNED_IN after redirect, go to dashboard
        if (event === 'SIGNED_IN' && this.user) {
          const hash = window.location.hash || '#/';
          if (hash === '#/login' || hash === '#/signup' || hash === '#/') {
            setTimeout(() => { if (window.AppRouter) AppRouter.navigate('/dashboard'); }, 100);
          }
        }
        if (event === 'PASSWORD_RECOVERY') {
          if (window.AppRouter) AppRouter.navigate('/settings');
        }
      });
      this._initialized = true;
    }

    async signUp(email, password, displayName) {
      if (!this.supabase) throw new Error('Supabase not configured');
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName, full_name: displayName } }
      });
      if (error) throw error;
      return data;
    }

    async signIn(email, password) {
      if (!this.supabase) throw new Error('Supabase not configured');
      const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    }

    async signInWithGoogle() {
      if (!this.supabase) throw new Error('Supabase not configured');
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname + '#/dashboard' }
      });
      if (error) throw error;
      return data;
    }

    async resetPassword(email) {
      if (!this.supabase) throw new Error('Supabase not configured');
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname + '#/settings'
      });
      if (error) throw error;
    }

    async resendConfirmation(email) {
      if (!this.supabase) throw new Error('Supabase not configured');
      const { error } = await this.supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
    }

    async updatePassword(newPassword) {
      if (!this.supabase) throw new Error('Supabase not configured');
      const { error } = await this.supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    }

    async signOut() {
      if (this.supabase) {
        try { await this.supabase.auth.signOut(); } catch (e) { console.warn('signOut failed', e); }
      }
      this.user = null;
      this.session = null;
      // Clear user prefs that are privacy-sensitive but keep theme/lang
      try {
        const keep = {};
        ['boardflow_theme', 'boardflow_lang'].forEach(k => { const v = localStorage.getItem(k); if (v) keep[k] = v; });
        localStorage.clear();
        Object.entries(keep).forEach(([k, v]) => localStorage.setItem(k, v));
      } catch {}
      this._notifyListeners('SIGNED_OUT');
      if (typeof AppRouter !== 'undefined') AppRouter.navigate('/');
    }

    getUser() { return this.user; }
    getUserId() { return this.user?.id || null; }
    isAuthenticated() { return !!this.user && !!this.session; }
    isInitialized() { return this._initialized; }

    onAuthChange(callback) {
      this.listeners.push(callback);
      return () => { this.listeners = this.listeners.filter(l => l !== callback); };
    }

    _notifyListeners(event) {
      this.listeners.forEach(cb => cb(event, this.user));
    }
  }

  const instance = new BoardFlowAuth();
  try {
    Object.defineProperty(window, 'BoardFlowAuth', {
      value: instance,
      writable: false,
      configurable: true,
      enumerable: true
    });
  } catch {
    window.BoardFlowAuth = instance;
  }
  window.__BoardFlowAuth_methods = METHODS;
  window.__BoardFlowAuth_loadedAt = Date.now();
})();
