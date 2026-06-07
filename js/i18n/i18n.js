// ============================================
// i18n — Translation Engine (15 languages)
// ============================================

const I18n = {
  currentLang: 'en',
  locales: {},
  rtlLangs: ['ar'],
  supportedLangs: ['en','ar','fr','es','pt','de','ru','tr','hi','zh-CN','ja','ko','it','nl','id'],

  async init() {
    // Load all locale files in parallel
    await Promise.all(this.supportedLangs.map(async (lang) => {
      try {
        const resp = await fetch(`/js/i18n/locales/${lang}.json`);
        if (resp.ok) {
          this.locales[lang] = await resp.json();
        }
      } catch (err) {
        console.warn('i18n: failed to load locale', lang, err);
      }
    }));

    // Detect browser language after locales are loaded
    this.currentLang = localStorage.getItem('boardflow_lang') || this._detectBrowserLang();

    // Fallback to embedded English
    if (!this.locales.en) {
      this.locales.en = this._getFallbackEnglish();
    }

    this._applyDirection();
    this._translatePage();
  },

  setLanguage(lang) {
    if (!this.locales[lang]) {
      Toast.show('Language not available', 'error');
      return;
    }
    this.currentLang = lang;
    localStorage.setItem('boardflow_lang', lang);
    this._applyDirection();
    this._translatePage();
    Toast.show(this.__('language_changed'), 'success');
  },

  getDirection() {
    return this.rtlLangs.includes(this.currentLang) ? 'rtl' : 'ltr';
  },

  isRTL() {
    return this.getDirection() === 'rtl';
  },

  __(key, params = {}) {
    const fallback = this._getFallbackEnglish();
    const locale = this.locales[this.currentLang] || fallback;
    let text = locale[key] || (this.locales.en ? this.locales.en[key] : null) || fallback[key] || key;

    for (const [k, v] of Object.entries(params)) {
      if (typeof text === 'string') {
        text = text.replaceAll(`{${k}}`, v);
      }
    }

    return text || key;
  },

  _detectBrowserLang() {
    const lang = navigator.language || navigator.userLanguage || 'en';
    const short = lang.split('-')[0];
    if (this.supportedLangs.includes(lang)) return lang;
    if (this.supportedLangs.includes(short)) return short;
    return 'en';
  },

  _applyDirection() {
    const dir = this.getDirection();
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', this.currentLang);

    if (dir === 'rtl') {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  },

  _translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = this.__(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      el.placeholder = this.__(key);
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.dataset.i18nTitle;
      el.title = this.__(key);
    });
  },

  _getFallbackEnglish() {
    return {
      app_name: 'BoardFlow',
      app_desc: 'Your personal board and whiteboard',
      continue_google: 'Continue with Google',
      no_account: "Don't have an account?",
      create_account: 'Create your account',
      display_name: 'Display Name',
      has_account: 'Already have an account?',
      sign_in: 'Sign In',
      sign_up: 'Sign Up',
      sign_out: 'Sign Out',
      email: 'Email',
      password: 'Password',
      confirm_password: 'Confirm Password',
      my_boards: 'My Boards',
      new_board: 'New Board',
      board_title: 'Board Title',
      delete: 'Delete',
      rename: 'Rename',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      close: 'Close',
      search: 'Search Files',
      add_note: 'Add Sticky Note',
      add_rich_note: 'Add Rich Note',
      add_sketch: 'Add Sketch',
      add_link: 'Add Link Card',
      record_audio: 'Record Audio',
      upload_video: 'Upload Video',
      upload_file: 'Upload File',
      take_screenshot: 'Take Screenshot',
      add_roadmap: 'Add Roadmap',
      ai_assistant: 'AI Assistant',
      board_chat: 'Board Chat',
      share_board: 'Share Board',
      undo: 'Undo',
      redo: 'Redo',
      zoom_in: 'Zoom In',
      zoom_out: 'Zoom Out',
      reset_view: 'Reset View',
      toggle_grid: 'Toggle Grid',
      delete_selected: 'Delete Selected',
      back_to_dashboard: 'Back to Dashboard',
      language: 'Language',
      language_changed: 'Language changed',
      no_boards_yet: 'No boards yet',
      no_boards_desc: 'Create your first board to get started. You can choose a template or start blank.',
      settings: 'Settings',
      templates: 'Templates',
      loading: 'Loading...',
      error_occurred: 'An error occurred',
      retry: 'Retry',
      confirm_delete: 'Are you sure you want to delete "{title}"? This cannot be undone.',
      confirm_delete_title: 'Delete Board',
      rename_title: 'Rename Board',
      paste_url: 'Paste a URL',
      type_message: 'Type a message...',
      send: 'Send',
      members: 'Members',
      invite: 'Invite',
      share_link: 'Share Link',
      generate: 'Generate',
      copy: 'Copy',
      edit: 'Edit',
      done: 'Done',
      no_files: 'No files yet',
      upload: 'Upload',
      screenshot: 'Screenshot',
      recording: 'Recording...',
      stop_recording: 'Stop Recording',
      add_to_board: 'Add to Board',
      download: 'Download',
      link_preview: 'Link Preview',
      milestones: 'Milestones',
      progress: 'Progress',
      todo: 'Todo',
      in_progress: 'In Progress',
      done_status: 'Done',
      connect_items: 'Connect Items',
      dictation: 'Dictation',
      speak_now: 'Speak now',
      transcribing: 'Transcribing...',
      ai_online: 'AI Online',
      ai_offline: 'AI Offline',
      ask_anything: 'Ask anything...',
      generate_image: 'Generate Image',
      extract_text: 'Extract Text',
      read_aloud: 'Read Aloud',
      no_images: 'No images on the board',
      no_content: 'No content to read',
      chat_title: 'Board Chat',
      welcome_chat: 'Welcome to board chat!',
      share_title: 'Share Board',
      share_description: 'Share this board with others',
      invite_by_email: 'Invite by Email',
      select_role: 'Select Role',
      editor: 'Editor',
      viewer: 'Viewer',
      rtl_toggle: 'RTL Mode',
      just_now: 'Just now',
      minutes_ago: '{n}m ago',
      hours_ago: '{n}h ago',
      days_ago: '{n}d ago',
      search_files: 'Search files',
      confirm_delete_short: 'Are you sure?',
      no_results: 'No results',
      create: 'Create',
      add: 'Add',
      untitled: 'Untitled Board',
      hide_grid: 'Hide Grid',
      show_grid: 'Show Grid',
      select_all: 'Select All',
      select_source_first: 'Select a source item first',
      connection_created: 'Connection created',
      click_to_connect: 'Click another item to connect',
      fill_fields: 'Please fill in all fields.',
      signing_in: 'Signing in...',
      signed_in: 'Signed in successfully!',
      invalid_credentials: 'Invalid email or password.',
      google_failed: 'Google sign-in failed.',
      password_min_length: 'Password must be at least 8 characters.',
      passwords_no_match: 'Passwords do not match.',
      creating_account: 'Creating account...',
      account_created: 'Account created! Check your email for verification.',
      failed_create_account: 'Failed to create account.',
      generate_link_first: 'Generate a share link to get started.',
      share_via: 'Share via...',
      share_board_text: 'Check out my board on BoardFlow',
      select_copy: 'Select all & copy',
      link_copied: 'Link copied!',
      link_generated: 'Share link generated!',
      connect_supabase_members: 'Connect Supabase to manage members',
      no_members: 'No members yet'
    };
  }
};

window.I18n = I18n;
