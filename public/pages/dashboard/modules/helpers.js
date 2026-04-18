export const PRIORITY = {
  critical: { label: 'Critical', color: '#f87171', cls: 'critical' },
  high: { label: 'High', color: '#fb923c', cls: 'high' },
  medium: { label: 'Medium', color: '#fbbf24', cls: 'medium' },
  low: { label: 'Low', color: '#34d399', cls: 'low' },
};

export function getPriority(value = '') {
  return PRIORITY[value.toLowerCase()] || {
    label: value || 'Unknown',
    color: '#384060',
    cls: 'unknown',
  };
}

export function getImgSrc(item) {
  if (!item) return '';
  if (typeof item === 'object' && item.data) return item.data;
  return `/uploads/${typeof item === 'object' ? item.name : item}`;
}

export function getImgName(item) {
  if (!item) return '';
  return typeof item === 'object' ? (item.name || '') : item;
}

export function escHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function shake(element) {
  element.style.animation = 'shk .4s ease';
  element.addEventListener('animationend', () => {
    element.style.animation = '';
  }, { once: true });
}

export function addRuntimeStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes shk  { 0%,100%{transform:translateX(0)} 25%,75%{transform:translateX(-6px)} 50%{transform:translateX(6px)} }
    .hidden { display: none !important; }
  `;
  document.head.appendChild(style);
}

export function getRecordSnapshot(rca) {
  return {
    product: rca.event?.product || rca.product || '-',
    raisedBy: rca.event?.raisedBy || rca.raisedBy || '-',
    affectedModule: rca.event?.affectedModule || rca.affectedModule || '-',
    affectedFeature: rca.event?.affectedFeature || rca.affectedFeature || '-',
    vc: rca.versions?.client || rca.clientVersion || null,
    vs: rca.versions?.server || rca.serverVersion || null,
    va: rca.versions?.agent || rca.agentVersion || null,
    emailNames: rca.attachments?.receivedEmails
      || (rca.attachments?.receivedEmail ? [rca.attachments.receivedEmail] : rca.receivedEmail ? [rca.receivedEmail] : []),
    closureNames: rca.attachments?.responseClosures
      || (rca.attachments?.responseClosure ? [rca.attachments.responseClosure] : rca.responseClosure ? [rca.responseClosure] : []),
    ssNames: rca.attachments?.screenshots || rca.screenshots || [],
  };
}
