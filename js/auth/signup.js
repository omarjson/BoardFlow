// ============================================
// Signup Page
// ============================================

let signupInitialized = false;

function initSignupPage() {
  if (signupInitialized) return;
  signupInitialized = true;

  const form = document.getElementById('signup-form');
  const messageEl = document.getElementById('signup-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;

    if (!name || !email || !password) {
      showMessage(I18n.__('fill_fields'), 'error');
      return;
    }

    if (password.length < 8) {
      showMessage(I18n.__('password_min_length'), 'error');
      return;
    }

    if (password !== confirm) {
      showMessage(I18n.__('passwords_no_match'), 'error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
    submitBtn.textContent = I18n.__('creating_account');

    try {
      const data = await BoardFlowAuth.signUp(email, password, name);
      // If email confirmation required, session will be null
      if (data && !data.session) {
        showMessage(I18n.__('account_created'), 'success');
        // stay on page, offer resend
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');
        submitBtn.textContent = I18n.__('sign_up');
        return;
      }
      showMessage(I18n.__('account_created'), 'success');
      setTimeout(() => AppRouter.navigate('/dashboard'), 800);
    } catch (err) {
      showMessage(err.message || I18n.__('failed_create_account'), 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
      if (submitBtn.textContent === I18n.__('creating_account')) submitBtn.textContent = I18n.__('sign_up');
    }
  });

  // Google on signup
  document.getElementById('signup-google')?.addEventListener('click', async () => {
    const btn = document.getElementById('signup-google');
    btn.disabled = true;
    try { await BoardFlowAuth.signInWithGoogle(); } catch (err) { showMessage(err.message || I18n.__('google_failed'), 'error'); btn.disabled = false; }
  });

  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = 'auth-message visible ' + type;
    messageEl.setAttribute('role', 'alert');
    messageEl.setAttribute('aria-live', 'polite');
  }
}
