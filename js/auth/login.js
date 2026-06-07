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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      showMessage(I18n.__('fill_fields'), 'error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = I18n.__('signing_in');

    try {
      await Auth.signIn(email, password);
      showMessage(I18n.__('signed_in'), 'success');
      setTimeout(() => AppRouter.navigate('/dashboard'), 500);
    } catch (err) {
      showMessage(err.message || I18n.__('invalid_credentials'), 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = I18n.__('sign_in');
    }
  });

  googleBtn?.addEventListener('click', async () => {
    try {
      await Auth.signInWithGoogle();
    } catch (err) {
      showMessage(err.message || I18n.__('google_failed'), 'error');
    }
  });

  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = 'auth-message visible ' + type;
  }
}
