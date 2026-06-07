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
    submitBtn.textContent = I18n.__('creating_account');

    try {
      await BoardFlowAuth.signUp(email, password, name);
      showMessage(I18n.__('account_created'), 'success');
      setTimeout(() => AppRouter.navigate('/dashboard'), 1500);
    } catch (err) {
      showMessage(err.message || I18n.__('failed_create_account'), 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = I18n.__('sign_up');
    }
  });

  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = 'auth-message visible ' + type;
  }
}
