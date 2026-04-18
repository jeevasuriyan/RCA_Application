AUTH.requireGuest();

let resetUrl = '';

window.copyLink = function copyLink() {
  if (!resetUrl) return;
  const fullUrl = window.location.origin + resetUrl;
  navigator.clipboard.writeText(fullUrl).then(() => {
    AUTH.toast('Link copied to clipboard!', 'success');
  });
};

document.getElementById('forgot-form').addEventListener('submit', async event => {
  event.preventDefault();
  AUTH.hideAlert('alert');

  const email = document.getElementById('email').value.trim();
  const button = document.getElementById('submit-btn');

  if (!email) {
    AUTH.showAlert('alert', 'Please enter your email address.');
    return;
  }

  AUTH.setLoading(button, true);
  try {
    const data = await AUTH.api('POST', '/auth/forgot-password', { email });
    AUTH.showAlert('alert', data.message, 'success');

    if (data.resetUrl) {
      resetUrl = data.resetUrl;
      const box = document.getElementById('info-box');
      const linkBox = document.getElementById('reset-link-box');
      linkBox.textContent = window.location.origin + data.resetUrl;
      box.style.display = 'block';
    }
  } catch (err) {
    AUTH.showAlert('alert', err.message);
  } finally {
    AUTH.setLoading(button, false);
  }
});
