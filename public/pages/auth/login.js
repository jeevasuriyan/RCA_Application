AUTH.requireGuest();

document.getElementById('eye-toggle').addEventListener('click', function togglePassword() {
  const input = document.getElementById('password');
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  this.innerHTML = show ? AUTH.eyeOffIcon() : AUTH.eyeIcon();
});

document.getElementById('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  AUTH.hideAlert('alert');

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const button = document.getElementById('submit-btn');

  if (!email || !password) {
    AUTH.showAlert('alert', 'Please enter your email and password.');
    return;
  }

  AUTH.setLoading(button, true);
  try {
    const data = await AUTH.api('POST', '/auth/login', { email, password });
    AUTH.setToken(data.token);
    AUTH.setUser(data.user);
    AUTH.toast(`Welcome back, ${data.user.name}!`, 'success', 1500);
    setTimeout(() => window.location.replace('/'), 900);
  } catch (err) {
    AUTH.showAlert('alert', err.message);
    AUTH.setLoading(button, false);
  }
});
