// ============================================
// Login Page
// ============================================

let loginInitialized = false;

function initLoginPage() {
  if (loginInitialized) return;
  loginInitialized = true;

  const form = document.getElementById('login-form');
  const messageEl = document.getElementById('login-message');
  const googleBtn = document.getElementById('login-google');

  // clear stale message on revisit
  function clearMessage() { messageEl.textContent = ''; messageEl.className = 'auth-message'; messageEl.removeAttribute('role'); }
  clearMessage();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    if (!email || !password) {
      showMessage(I18n.__('fill_fields'), 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage(I18n.__('invalid_credentials'), 'error');
      return;
    }
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
    const origText = submitBtn.textContent;
    submitBtn.textContent = I18n.__('signing_in');
    try {
      await BoardFlowAuth.signIn(email, password);
      showMessage(I18n.__('signed_in'), 'success');
      const next = new URLSearchParams(window.location.hash.split('?')[1] || '').get('next');
      setTimeout(() => AppRouter.navigate(next ? decodeURIComponent(next) : '/dashboard'), 500);
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('confirm')) {
        showMessage(I18n.__('account_created'), 'error');
      } else if (msg.toLowerCase().includes('too many')) {
        showMessage(msg, 'error');
      } else {
        showMessage(msg || I18n.__('invalid_credentials'), 'error');
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
      submitBtn.textContent = I18n.__('sign_in');
    }
  });

  // forgot password
  const forgotLink = document.getElementById('login-forgot');
  forgotLink?.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage(I18n.__('fill_fields'), 'error');
      return;
    }
    try {
      await BoardFlowAuth.resetPassword(email);
      showMessage(I18n.__('password_reset_sent') || 'Check your email for reset link', 'success');
    } catch (err) { showMessage(err.message, 'error'); }
  });

  // resend confirmation
  const resendLink = document.getElementById('login-resend');
  resendLink?.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    if (!email) { showMessage(I18n.__('fill_fields'), 'error'); return; }
    try { await BoardFlowAuth.resendConfirmation(email); showMessage(I18n.__('account_created'), 'success'); }
    catch (err) { showMessage(err.message, 'error'); }
  });

  googleBtn?.addEventListener('click', async () => {
    googleBtn.disabled = true;
    try {
      await BoardFlowAuth.signInWithGoogle();
    } catch (err) {
      showMessage(err.message || I18n.__('google_failed'), 'error');
      googleBtn.disabled = false;
    }
  });

  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = 'auth-message visible ' + type;
    messageEl.setAttribute('role', 'alert');
    messageEl.setAttribute('aria-live', 'polite');
  }
}
