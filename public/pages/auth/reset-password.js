AUTH.requireGuest();
AUTH.initEyeToggles();
AUTH.initStrength('password', 'pwd-meter');

const params = new URLSearchParams(window.location.search);
const token = params.get('token');

if (!token) {
  document.getElementById('reset-view').style.display = 'none';
  document.getElementById('no-token-view').style.display = 'block';
}

document.getElementById('reset-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  AUTH.hideAlert('alert');

  const password = document.getElementById('password').value;
  const confirm = document.getElementById('confirm').value;
  const button = document.getElementById('submit-btn');

  if (!password || !confirm) {
    AUTH.showAlert('alert', 'Both password fields are required.');
    return;
  }
  if (password.length < 8) {
    AUTH.showAlert('alert', 'Password must be at least 8 characters.');
    return;
  }
  if (password !== confirm) {
    AUTH.showAlert('alert', 'Passwords do not match.');
    return;
  }

  AUTH.setLoading(button, true);
  try {
    const data = await AUTH.api('POST', '/auth/reset-password', { token, password });
    AUTH.showAlert('alert', `${data.message} Redirecting to sign in...`, 'success');
    setTimeout(() => window.location.replace('/auth/login.html'), 2200);
  } catch (err) {
    AUTH.showAlert('alert', err.message);
    AUTH.setLoading(button, false);
  }
});
