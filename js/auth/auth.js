// ============================================
// BoardFlow Auth State Management
// Self-recovering: redefines BoardFlowAuth if
// the loaded instance is missing methods.
// ============================================

(() => {
  const METHODS = ['init', 'signIn', 'signUp', 'signOut', 'isAuthenticated', 'getUser', 'getUserId', 'onAuthChange'];
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
    }

    async init() {
      if (typeof supabase === 'undefined' || !CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL.includes('your-project')) {
        console.warn('Supabase not configured. Running in demo mode.');
        this._loadDemoUser();
        return;
      }

      this.supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_PUBLISHABLE_KEY);

      const { data: { session } } = await this.supabase.auth.getSession();
      this.session = session;
      this.user = session?.user || null;

      this.supabase.auth.onAuthStateChange((event, session) => {
        this.session = session;
        this.user = session?.user || null;
        this._notifyListeners(event);
      });
    }

    async signUp(email, password, displayName) {
      if (!this.supabase) return this._demoSignUp(email, displayName);

      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } }
      });

      if (error) throw error;
      return data;
    }

    async signIn(email, password) {
      if (!this.supabase) return this._demoSignIn(email);

      const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    }

    async signInWithGoogle() {
      if (!this.supabase) throw new Error('Supabase not configured');

      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname }
      });

      if (error) throw error;
      return data;
    }

    async signOut() {
      if (this.supabase) {
        await this.supabase.auth.signOut();
      }
      this.user = null;
      this.session = null;
      this._notifyListeners('SIGNED_OUT');
      if (typeof AppRouter !== 'undefined') AppRouter.navigate('/');
    }

    getUser() { return this.user; }
    getUserId() { return this.user?.id || null; }
    isAuthenticated() { return !!this.user; }

    onAuthChange(callback) {
      this.listeners.push(callback);
      return () => { this.listeners = this.listeners.filter(l => l !== callback); };
    }

    _notifyListeners(event) {
      this.listeners.forEach(cb => cb(event, this.user));
    }

    _loadDemoUser() {
      const stored = localStorage.getItem('boardflow_demo_user');
      if (stored) {
        try { this.user = JSON.parse(stored); } catch {}
      }
    }

    _demoSignUp(email, displayName) {
      this.user = {
        id: 'demo-' + Date.now(),
        email,
        user_metadata: { display_name: displayName || email.split('@')[0] }
      };
      localStorage.setItem('boardflow_demo_user', JSON.stringify(this.user));
      this._notifyListeners('SIGNED_IN');
      return { user: this.user };
    }

    _demoSignIn(email) {
      this.user = {
        id: 'demo-' + Date.now(),
        email,
        user_metadata: { display_name: email.split('@')[0] }
      };
      localStorage.setItem('boardflow_demo_user', JSON.stringify(this.user));
      this._notifyListeners('SIGNED_IN');
      return { user: this.user };
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
