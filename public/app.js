import { API } from "./config.js";

// ── Corrective Action toggles ─────────────────────────────
const toggleState = { hotfix: 'yes', rollback: 'no', workaround: 'no' };

window.setToggle = function (key, val, btn) {
  toggleState[key] = val;
  const group = document.getElementById(`toggle-${key}`);
  group.querySelectorAll('.ca-toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
};

// ── Quill ─────────────────────────────────────────────────
const quill = new Quill('#details-editor', {
  theme: 'snow',
  modules: { toolbar: '#quill-toolbar' },
  placeholder: 'Root cause, impact, timeline, and resolution steps…',
});

// ── Priority map ──────────────────────────────────────────
const PRIORITY = {
  critical: { label: 'Critical', color: '#e05c6b', cls: 'critical' },
  high:     { label: 'High',     color: '#e89050', cls: 'high'     },
  medium:   { label: 'Medium',   color: '#d4a93a', cls: 'medium'   },
  low:      { label: 'Low',      color: '#3dbfa0', cls: 'low'      },
};
function getPriority(v = '') {
  return PRIORITY[v.toLowerCase()] || { label: v || 'Unknown', color: '#404860', cls: 'unknown' };
}

// ── RCA record cache (keyed by _id for safe edit lookups) ─
const rcaCache = {};

// ── File state ────────────────────────────────────────────
const emailImages   = [];  // { file, dataUrl } for new uploads  |  { name, data, isExisting:true } for DB images
const screenshots   = [];  // { file, dataUrl } for new uploads  |  { name, data, isExisting:true } for DB images
const closureImages = [];  // { file, dataUrl } for new uploads  |  { name, data, isExisting:true } for DB images

// ── Image helpers (handle both new {name,data} objects and legacy filename strings) ──
function getImgSrc(item) {
  if (!item) return '';
  if (typeof item === 'object' && item.data) return item.data;
  // Legacy: item is a filename string
  return `/uploads/${typeof item === 'object' ? item.name : item}`;
}
function getImgName(item) {
  if (!item) return '';
  return typeof item === 'object' ? (item.name || '') : item;
}


// ── Email image helpers ───────────────────────────────────
window.handleEmailImages = function (e) {
  const files = Array.from(e.target.files || []);
  files.forEach(addEmailImage);
  e.target.value = '';
};

window.handleEmailDrop = function (e) {
  e.preventDefault();
  document.getElementById('dz-email').classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
  files.forEach(addEmailImage);
};

function addEmailImage(file) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    emailImages.push({ file, dataUrl: ev.target.result });
    renderEmailImages();
  };
  reader.readAsDataURL(file);
}

function renderEmailImages() {
  const grid = document.getElementById('email-grid');
  const dz   = document.getElementById('dz-email');
  grid.innerHTML = '';

  if (emailImages.length > 0) {
    dz.classList.add('has-files');
  } else {
    dz.classList.remove('has-files');
  }

  emailImages.forEach((s, i) => {
    const imgSrc = s.isExisting ? getImgSrc(s) : s.dataUrl;
    const thumb = document.createElement('div');
    thumb.className = 'ss-thumb';
    thumb.innerHTML = `
      <img src="${imgSrc}" alt="email ${i+1}">
      <button class="ss-thumb-remove" onclick="removeEmailImage(${i})" title="Remove">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    grid.appendChild(thumb);
  });

  if (emailImages.length > 0) {
    const addBtn = document.createElement('div');
    addBtn.className = 'ss-add-more';
    addBtn.title = 'Add more';
    addBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    addBtn.onclick = (e) => { e.stopPropagation(); document.getElementById('file-email').click(); };
    grid.appendChild(addBtn);
  }
}

window.removeEmailImage = function (i) {
  emailImages.splice(i, 1);
  renderEmailImages();
};

// ── Screenshot helpers ────────────────────────────────────
window.handleScreenshots = function (e) {
  const files = Array.from(e.target.files || []);
  files.forEach(addScreenshot);
  e.target.value = '';
};

window.handleScreenshotDrop = function (e) {
  e.preventDefault();
  document.getElementById('dz-screenshots').classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
  files.forEach(addScreenshot);
};

function addScreenshot(file) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    const entry = { file, dataUrl: ev.target.result };
    screenshots.push(entry);
    renderScreenshots();
  };
  reader.readAsDataURL(file);
}

function renderScreenshots() {
  const grid = document.getElementById('screenshots-grid');
  const dz   = document.getElementById('dz-screenshots');
  grid.innerHTML = '';

  if (screenshots.length > 0) {
    dz.classList.add('has-files');
  } else {
    dz.classList.remove('has-files');
  }

  screenshots.forEach((s, i) => {
    const imgSrc = s.isExisting ? getImgSrc(s) : s.dataUrl;
    const thumb = document.createElement('div');
    thumb.className = 'ss-thumb';
    thumb.innerHTML = `
      <img src="${imgSrc}" alt="screenshot ${i+1}">
      <button class="ss-thumb-remove" onclick="removeScreenshot(${i})" title="Remove">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    grid.appendChild(thumb);
  });

  if (screenshots.length > 0) {
    const addBtn = document.createElement('div');
    addBtn.className = 'ss-add-more';
    addBtn.title = 'Add more';
    addBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    addBtn.onclick = (e) => { e.stopPropagation(); document.getElementById('file-screenshots').click(); };
    grid.appendChild(addBtn);
  }
}

window.removeScreenshot = function (i) {
  screenshots.splice(i, 1);
  renderScreenshots();
};

// ── Closure image helpers ─────────────────────────────────
window.handleClosureImages = function (e) {
  const files = Array.from(e.target.files || []);
  files.forEach(addClosureImage);
  e.target.value = '';
};

window.handleClosureDrop = function (e) {
  e.preventDefault();
  document.getElementById('dz-closure').classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
  files.forEach(addClosureImage);
};

function addClosureImage(file) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    closureImages.push({ file, dataUrl: ev.target.result });
    renderClosureImages();
  };
  reader.readAsDataURL(file);
}

function renderClosureImages() {
  const grid = document.getElementById('closure-grid');
  const dz   = document.getElementById('dz-closure');
  grid.innerHTML = '';

  if (closureImages.length > 0) {
    dz.classList.add('has-files');
  } else {
    dz.classList.remove('has-files');
  }

  closureImages.forEach((s, i) => {
    const imgSrc = s.isExisting ? getImgSrc(s) : s.dataUrl;
    const thumb = document.createElement('div');
    thumb.className = 'ss-thumb';
    thumb.innerHTML = `
      <img src="${imgSrc}" alt="closure ${i+1}">
      <button class="ss-thumb-remove" onclick="removeClosureImage(${i})" title="Remove">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    grid.appendChild(thumb);
  });

  if (closureImages.length > 0) {
    const addBtn = document.createElement('div');
    addBtn.className = 'ss-add-more';
    addBtn.title = 'Add more';
    addBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    addBtn.onclick = (e) => { e.stopPropagation(); document.getElementById('file-closure').click(); };
    grid.appendChild(addBtn);
  }
}

window.removeClosureImage = function (i) {
  closureImages.splice(i, 1);
  renderClosureImages();
};

// ── View switching ────────────────────────────────────────
window.switchView = function (view, fromEdit = false) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${view}`).classList.add('active');

  document.getElementById('pill-create') .classList.toggle('active', view === 'create');
  document.getElementById('pill-reports').classList.toggle('active', view === 'reports');

  // If user manually navigates to create (not from editRCA), reset edit state
  if (view === 'create' && !fromEdit && window._editingId) {
    window._editingId = null;
    const btn = document.getElementById('submitBtn');
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Create RCA Report`;
    btn.classList.remove('editing');
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';
  }
};

// ── Cancel Edit ───────────────────────────────────────────
window.cancelEdit = function () {
  window._editingId = null;
  const btn = document.getElementById('submitBtn');
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Create RCA Report`;
  btn.classList.remove('editing');
  const cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) cancelBtn.style.display = 'none';
  switchView('reports');
};

// ── Filter state ──────────────────────────────────────────
let currentFilter = 'all';
let allData       = [];

window.setFilter = function (filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.pf').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyFilters();
};

function applyFilters() {
  const q = (document.getElementById('searchBox')?.value || '').toLowerCase();
  let filtered = allData;
  if (currentFilter !== 'all') {
    filtered = filtered.filter(r => r.priority?.toLowerCase() === currentFilter);
  }
  if (q) {
    filtered = filtered.filter(r =>
      (r.clientName      || '').toLowerCase().includes(q) ||
      (r.description     || '').toLowerCase().includes(q) ||
      (r.priority        || '').toLowerCase().includes(q) ||
      (r.event?.product  || '').toLowerCase().includes(q) ||
      (r.event?.raisedBy || '').toLowerCase().includes(q)
    );
  }
  renderRCA(filtered);
}

window.filterRCA = applyFilters;

// ── Create ────────────────────────────────────────────────
window.createRCA = async function () {
  const btn = document.getElementById('submitBtn');
  const clientName = document.getElementById('clientName').value.trim();
  const priority   = document.getElementById('priority').value;

  if (!clientName || !priority) { shake(btn); return; }

  const isEditing = !!window._editingId;
  const editId    = window._editingId;

  btn.disabled = true;
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin .7s linear infinite"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0"/></svg> ${isEditing ? 'Updating…' : 'Creating…'}`;

  try {
    const formData = new FormData();

    // Scalar fields
    const fields = {
      clientName,
      priority,
      description:         document.getElementById('description').value.trim(),
      raisedBy:            document.getElementById('raisedBy').value.trim(),
      product:             document.getElementById('product').value.trim(),
      affectedModule:      document.getElementById('affectedModule').value.trim(),
      affectedFeature:     document.getElementById('affectedFeature').value.trim(),
      clientVersion:       document.getElementById('clientVersion').value.trim(),
      serverVersion:       document.getElementById('serverVersion').value.trim(),
      agentVersion:        document.getElementById('agentVersion').value.trim(),
      detailedDescription: quill.getText().trim() ? quill.root.innerHTML : '',
      correctiveAction:    document.getElementById('correctiveAction').value.trim(),
      hotfix:              toggleState.hotfix,
      rollback:            toggleState.rollback,
      workaround:          toggleState.workaround,
      pmCode:              document.getElementById('pm-code').value.trim(),
      pmTest:              document.getElementById('pm-test').value.trim(),
      pmProcess:           document.getElementById('pm-process').value.trim(),
      pmMonitoring:        document.getElementById('pm-monitoring').value.trim(),
    };
    // Existing image names to keep (only during edits; [] means "no existing to preserve")
    fields.existingEmailImages   = emailImages.filter(s => s.isExisting).map(s => s.name || s.filename);
    fields.existingClosureImages = closureImages.filter(s => s.isExisting).map(s => s.name || s.filename);
    fields.existingScreenshots   = screenshots.filter(s => s.isExisting).map(s => s.name || s.filename);

    formData.append('data', JSON.stringify(fields));

    // Attachments — only upload NEW files; send existing filenames via JSON so server preserves them
    const newEmailImages   = emailImages.filter(s => !s.isExisting);
    const newClosureImages = closureImages.filter(s => !s.isExisting);
    const newScreenshots   = screenshots.filter(s => !s.isExisting);
    newEmailImages.forEach((s, i) => formData.append(`emailImage_${i}`, s.file));
    newClosureImages.forEach((s, i) => formData.append(`closureImage_${i}`, s.file));
    newScreenshots.forEach((s, i) => formData.append(`screenshot_${i}`, s.file));

    const res = await fetch(isEditing ? `${API}/${editId}` : API, {
      method: isEditing ? 'PUT' : 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // Reset form
    ['clientName','priority','raisedBy','product','affectedModule','affectedFeature','description',
     'clientVersion','serverVersion','agentVersion'].forEach(id => {
      document.getElementById(id).value = '';
    });
    quill.setContents([]);

    // Reset attachments
    emailImages.length = 0;
    renderEmailImages();
    closureImages.length = 0;
    renderClosureImages();
    screenshots.length = 0;
    renderScreenshots();

    // Reset edit state
    window._editingId = null;
    btn.classList.remove('editing');

    await loadRCA();

    // Images are stored as base64 in DB; loadRCA() brings them back — no local cache needed.
    switchView('reports');

  } catch (err) {
    console.error('Failed to create/update RCA:', err);
    // Fallback: try JSON if server doesn't support multipart
    try {
      const data = {
        clientName,
        priority,
        description:         document.getElementById('description').value.trim(),
        event: {
          raisedBy:        document.getElementById('raisedBy').value.trim(),
          product:         document.getElementById('product').value.trim(),
          affectedModule:  document.getElementById('affectedModule').value.trim(),
          affectedFeature: document.getElementById('affectedFeature').value.trim(),
        },
        versions: {
          client: document.getElementById('clientVersion').value.trim(),
          server: document.getElementById('serverVersion').value.trim(),
          agent:  document.getElementById('agentVersion').value.trim(),
        },
        detailedDescription: quill.getText().trim() ? quill.root.innerHTML : '',
        attachments: {
          emailImages:   emailImages.map(s => s.file.name),
          closureImages: closureImages.map(s => s.file.name),
          screenshots:   screenshots.map(s => s.file.name),
        },
      };
      await fetch(isEditing ? `${API}/${editId}` : API, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      // Reset
      ['clientName','priority','raisedBy','product','affectedModule','affectedFeature','description',
       'clientVersion','serverVersion','agentVersion'].forEach(id => {
        document.getElementById(id).value = '';
      });
      quill.setContents([]);
      emailImages.length = 0;
      renderEmailImages();
      closureImages.length = 0;
      renderClosureImages();
      screenshots.length = 0;
      renderScreenshots();

      // Reset edit state
      window._editingId = null;
      btn.classList.remove('editing');

      await loadRCA();
      switchView('reports');
    } catch (e2) {
      console.error('JSON fallback also failed:', e2);
    }
  } finally {
    btn.disabled = false;
    if (window._editingId) {
      // Edit failed — keep the Update label so user can retry
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Update RCA Report`;
    } else {
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Create RCA Report`;
      btn.classList.remove('editing');
    }
  }
};

// ── Load ──────────────────────────────────────────────────
async function loadRCA() {
  try {
    const res = await fetch(API);
    allData   = await res.json();
    renderRCA(allData);
    updateStats(allData);
  } catch (e) {
    console.error('Failed to load RCA:', e);
  }
}

// ── Render ────────────────────────────────────────────────
function renderRCA(data) {
  const list  = document.getElementById('list');
  const empty = document.getElementById('empty-state');
  list.innerHTML = '';

  if (!data.length) { empty.classList.add('visible'); return; }
  empty.classList.remove('visible');

  data.forEach((rca, i) => {
    const p        = getPriority(rca.priority);
    const product  = rca.event?.product  || rca.product  || '—';
    const raisedBy = rca.event?.raisedBy || rca.raisedBy || '—';
    const affectedModule  = rca.event?.affectedModule  || rca.affectedModule  || null;
    const affectedFeature = rca.event?.affectedFeature || rca.affectedFeature || null;
    const vc = rca.versions?.client || rca.clientVersion || null;
    const vs = rca.versions?.server || rca.serverVersion || null;
    const va = rca.versions?.agent  || rca.agentVersion  || null;
    const hasVer = vc || vs || va;

    const emailNames   = rca.attachments?.receivedEmails   || (rca.attachments?.receivedEmail   ? [rca.attachments.receivedEmail]   : rca.receivedEmail   ? [rca.receivedEmail]   : []);
    const closureNames = rca.attachments?.responseClosures || (rca.attachments?.responseClosure ? [rca.attachments.responseClosure] : rca.responseClosure ? [rca.responseClosure] : []);
    const ssNames      = rca.attachments?.screenshots      || rca.screenshots     || [];

    const dateStr = rca.createdAt
      ? new Date(rca.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
      : '';

    const card = document.createElement('div');
    card.className = 'rca-card';
    card.style.animationDelay = `${i * 0.04}s`;
    card.style.setProperty('--priority-color', p.color);

    // Cache so editRCA can look up by ID instead of JSON-in-attribute
    if (rca._id) rcaCache[rca._id] = rca;

    card.innerHTML = `
      <div class="card-stripe"></div>
      <div class="card-body">
        <div class="card-head">
          <span class="card-title">${escHtml(rca.title || rca.description || 'Untitled Incident')}</span>
          <span class="pbadge ${p.cls}">${p.label}</span>
        </div>
        <div class="card-meta">
          <span class="cmeta">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ${escHtml(rca.clientName)}
          </span>
          <span class="cmeta">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            ${escHtml(product)}
          </span>
          ${affectedModule ? `<span class="cmeta">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            ${escHtml(affectedModule)}
          </span>` : ''}
          ${affectedFeature ? `<span class="cmeta">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            ${escHtml(affectedFeature)}
          </span>` : ''}
          <span class="cmeta">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            ${escHtml(raisedBy)}
          </span>
        </div>
        ${hasVer ? `
        <div class="vrow">
          ${vc ? `<span class="vchip"><span class="vchip-lbl">Client</span>v${escHtml(vc)}</span>` : ''}
          ${vs ? `<span class="vchip"><span class="vchip-lbl">Server</span>v${escHtml(vs)}</span>` : ''}
          ${va ? `<span class="vchip"><span class="vchip-lbl">Agent</span>v${escHtml(va)}</span>`  : ''}
        </div>` : ''}
        ${rca.description ? `<p class="card-desc">${escHtml(rca.description)}</p>` : ''}
        ${rca.detailedDescription ? `
        <div class="card-rich">
          <div class="ql-snow"><div class="ql-editor card-rich-content">${rca.detailedDescription}</div></div>
        </div>` : ''}
        ${(emailNames.length || closureNames.length || ssNames.length) ? `
        <div class="card-screenshots">
          ${[...emailNames, ...closureNames, ...ssNames].slice(0, 4).map(n => `<div class="cs-thumb"><img src="${getImgSrc(n)}" alt="${escHtml(getImgName(n))}" onerror="this.parentElement.style.display='none'"></div>`).join('')}
          ${(emailNames.length + closureNames.length + ssNames.length) > 4 ? `<div class="cs-more">+${emailNames.length + closureNames.length + ssNames.length - 4}</div>` : ''}
        </div>` : ''}
      </div>
      <div class="card-footer">
        <span class="card-date">${dateStr}</span>
        <div class="card-footer-actions">
          <button class="btn-view" onclick="viewReport('${rca._id}')">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            View
          </button>
          <button class="btn-edit" onclick="editRCA('${rca._id}')">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button class="btn-del" onclick="deleteRCA('${rca._id}')">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
            Delete
          </button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}

// ── Stats ─────────────────────────────────────────────────
function updateStats(data) {
  const c = data.filter(r => r.priority?.toLowerCase() === 'critical').length;
  const h = data.filter(r => r.priority?.toLowerCase() === 'high').length;
  document.getElementById('stat-critical').textContent = c;
  document.getElementById('stat-high').textContent     = h;
  document.getElementById('stat-total').textContent    = data.length;
  document.getElementById('tab-count').textContent     = data.length;
}


// ── Edit ──────────────────────────────────────────────────
window.editRCA = function (id) {
  const rca = rcaCache[id];
  if (!rca) { console.error('editRCA: record not found for id', id); return; }

  // Switch to create view (flag as edit so state isn't wiped)
  switchView('create', true);

  // Populate scalar fields
  document.getElementById('clientName').value     = rca.clientName     || '';
  document.getElementById('priority').value       = rca.priority       || '';
  document.getElementById('raisedBy').value       = rca.event?.raisedBy || rca.raisedBy || '';
  document.getElementById('product').value        = rca.event?.product  || rca.product  || '';
  document.getElementById('affectedModule').value = rca.event?.affectedModule  || rca.affectedModule  || '';
  document.getElementById('affectedFeature').value= rca.event?.affectedFeature || rca.affectedFeature || '';
  document.getElementById('description').value    = rca.description    || '';
  document.getElementById('clientVersion').value  = rca.versions?.client || rca.clientVersion || '';
  document.getElementById('serverVersion').value  = rca.versions?.server || rca.serverVersion || '';
  document.getElementById('agentVersion').value   = rca.versions?.agent  || rca.agentVersion  || '';

  // Corrective action fields
  if (document.getElementById('correctiveAction'))
    document.getElementById('correctiveAction').value = rca.correctiveAction || '';

  ['pm-code','pm-test','pm-process','pm-monitoring'].forEach(fieldId => {
    const fieldKey = fieldId.replace('pm-', 'pm');
    if (document.getElementById(fieldId)) {
      document.getElementById(fieldId).value = rca[fieldKey] || rca[fieldId] || '';
    }
  });

  // Quill rich text
  if (rca.detailedDescription) {
    quill.root.innerHTML = rca.detailedDescription;
  } else {
    quill.setContents([]);
  }

  // Toggle states for corrective actions
  ['hotfix','rollback','workaround'].forEach(key => {
    const val = rca[key] || toggleState[key];
    const group = document.getElementById(`toggle-${key}`);
    if (group) {
      group.querySelectorAll('.ca-toggle-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.val === val);
      });
      toggleState[key] = val;
    }
  });

  // Store the editing ID so submit can use PUT instead of POST
  window._editingId = rca._id || null;

  // Update submit button label to reflect edit mode
  const btn = document.getElementById('submitBtn');
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Update RCA Report`;
  btn.classList.add('editing');

  // Show cancel button
  const cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) cancelBtn.style.display = 'inline-flex';

  // Clear existing attachment state so stale files don't carry over
  emailImages.length = 0;
  renderEmailImages();
  closureImages.length = 0;
  renderClosureImages();
  screenshots.length = 0;
  renderScreenshots();

  // Pre-populate dropzones with existing attachments (base64 from DB — no re-upload needed)
  const editEmailNames   = rca.attachments?.receivedEmails   || (rca.attachments?.receivedEmail   ? [rca.attachments.receivedEmail]   : rca.receivedEmail   ? [rca.receivedEmail]   : []);
  const editClosureNames = rca.attachments?.responseClosures || (rca.attachments?.responseClosure ? [rca.attachments.responseClosure] : rca.responseClosure ? [rca.responseClosure] : []);
  const editSsNames      = rca.attachments?.screenshots      || rca.screenshots     || [];

  function toExistingEntry(item) {
    if (typeof item === 'object') return { name: item.name, data: item.data, isExisting: true };
    return { name: item, filename: item, isExisting: true }; // legacy string fallback
  }

  if (editEmailNames.length) {
    editEmailNames.forEach(item => emailImages.push(toExistingEntry(item)));
    renderEmailImages();
  }
  if (editClosureNames.length) {
    editClosureNames.forEach(item => closureImages.push(toExistingEntry(item)));
    renderClosureImages();
  }
  if (editSsNames.length) {
    editSsNames.forEach(item => screenshots.push(toExistingEntry(item)));
    renderScreenshots();
  }

  // Scroll to top of form
  document.getElementById('view-create').scrollIntoView({ behavior: 'smooth' });
};

// ── Delete ────────────────────────────────────────────────
window.deleteRCA = async function (id) {
  try {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    await loadRCA();
  } catch (e) { console.error('Delete failed:', e); }
};

// ── Utilities ─────────────────────────────────────────────
function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatBytes(b) {
  if (b < 1024)       return `${b} B`;
  if (b < 1048576)    return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
}

function shake(el) {
  el.style.animation = 'shk .4s ease';
  el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
}

const style = document.createElement('style');
style.textContent = `
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes shk  { 0%,100%{transform:translateX(0)} 25%,75%{transform:translateX(-6px)} 50%{transform:translateX(6px)} }
  .hidden { display: none !important; }
`;
document.head.appendChild(style);

// ── View Report Modal ─────────────────────────────────────
window.viewReport = function (id) {
  const rca = rcaCache[id];
  if (!rca) return;

  const p             = getPriority(rca.priority);
  const product       = rca.event?.product        || rca.product        || '—';
  const raisedBy      = rca.event?.raisedBy       || rca.raisedBy       || '—';
  const affectedModule  = rca.event?.affectedModule  || rca.affectedModule  || '—';
  const affectedFeature = rca.event?.affectedFeature || rca.affectedFeature || '—';
  const vc = rca.versions?.client || rca.clientVersion || null;
  const vs = rca.versions?.server || rca.serverVersion || null;
  const va = rca.versions?.agent  || rca.agentVersion  || null;
  const emailNames   = rca.attachments?.receivedEmails   || (rca.attachments?.receivedEmail   ? [rca.attachments.receivedEmail]   : rca.receivedEmail   ? [rca.receivedEmail]   : []);
  const closureNames = rca.attachments?.responseClosures || (rca.attachments?.responseClosure ? [rca.attachments.responseClosure] : rca.responseClosure ? [rca.responseClosure] : []);
  const ssNames      = rca.attachments?.screenshots      || rca.screenshots     || [];
  const dateStr     = rca.createdAt
    ? new Date(rca.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' })
    : '—';

  const caItems = [
    rca.hotfix     === 'yes' ? 'Hotfix Applied'    : null,
    rca.rollback   === 'yes' ? 'Rollback Performed' : null,
    rca.workaround === 'yes' ? 'Workaround Used'   : null,
  ].filter(Boolean);

  const pmItems = [
    rca.pmCode       ? { label: 'Code',       val: rca.pmCode       } : null,
    rca.pmTest       ? { label: 'Testing',     val: rca.pmTest       } : null,
    rca.pmProcess    ? { label: 'Process',     val: rca.pmProcess    } : null,
    rca.pmMonitoring ? { label: 'Monitoring',  val: rca.pmMonitoring } : null,
  ].filter(Boolean);

  const modal = document.getElementById('report-modal');
  const body  = document.getElementById('report-modal-body');

  body.innerHTML = `
    <div class="rm-doc">
      <!-- Header -->
      <div class="rm-header" style="--priority-color:${p.color}">
        <div class="rm-header-bar"></div>
        <div class="rm-header-content">
          <div class="rm-eyebrow">Root Cause Analysis Report</div>
          <h1 class="rm-title">${escHtml(rca.title || rca.description || 'Untitled Incident')}</h1>
          <div class="rm-meta-row">
            <span class="rm-badge ${p.cls}">${p.label}</span>
            <span class="rm-meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${dateStr}
            </span>
            <span class="rm-meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              ${escHtml(rca.clientName || '—')}
            </span>
          </div>
        </div>
      </div>

      <!-- §1 Incident Overview -->
      <div class="rm-section">
        <div class="rm-section-num">01</div>
        <div class="rm-section-body">
          <h2 class="rm-section-title">Incident Overview</h2>
          <div class="rm-grid-4">
            <div class="rm-field"><span class="rm-label">Client</span><span class="rm-value">${escHtml(rca.clientName || '—')}</span></div>
            <div class="rm-field"><span class="rm-label">Product</span><span class="rm-value">${escHtml(product)}</span></div>
            <div class="rm-field"><span class="rm-label">Raised By</span><span class="rm-value">${escHtml(raisedBy)}</span></div>
            <div class="rm-field"><span class="rm-label">Priority</span><span class="rm-value rm-badge-inline ${p.cls}">${p.label}</span></div>
            <div class="rm-field"><span class="rm-label">Affected Module</span><span class="rm-value">${escHtml(affectedModule)}</span></div>
            <div class="rm-field"><span class="rm-label">Affected Feature</span><span class="rm-value">${escHtml(affectedFeature)}</span></div>
          </div>
          ${rca.description ? `<div class="rm-desc-block">${escHtml(rca.description)}</div>` : ''}
        </div>
      </div>

      <!-- §2 Version Details -->
      ${(vc || vs || va) ? `
      <div class="rm-section">
        <div class="rm-section-num">02</div>
        <div class="rm-section-body">
          <h2 class="rm-section-title">Version Details</h2>
          <div class="rm-grid-3">
            ${vc ? `<div class="rm-field"><span class="rm-label">Client Version</span><span class="rm-value rm-mono">v${escHtml(vc)}</span></div>` : ''}
            ${vs ? `<div class="rm-field"><span class="rm-label">Server Version</span><span class="rm-value rm-mono">v${escHtml(vs)}</span></div>` : ''}
            ${va ? `<div class="rm-field"><span class="rm-label">Agent Version</span><span class="rm-value rm-mono">v${escHtml(va)}</span></div>` : ''}
          </div>
        </div>
      </div>` : ''}

      <!-- §3 Detailed Description -->
      ${rca.detailedDescription ? `
      <div class="rm-section">
        <div class="rm-section-num">03</div>
        <div class="rm-section-body">
          <h2 class="rm-section-title">Detailed Analysis</h2>
          <div class="rm-rich-content ql-snow"><div class="ql-editor rm-quill-body">${rca.detailedDescription}</div></div>
        </div>
      </div>` : ''}

      <!-- §4 Corrective Actions -->
      ${(rca.correctiveAction || caItems.length) ? `
      <div class="rm-section">
        <div class="rm-section-num">04</div>
        <div class="rm-section-body">
          <h2 class="rm-section-title">Corrective Actions</h2>
          ${caItems.length ? `<div class="rm-ca-tags">${caItems.map(c => `<span class="rm-ca-tag">${escHtml(c)}</span>`).join('')}</div>` : ''}
          ${rca.correctiveAction ? `<div class="rm-desc-block" style="margin-top:12px">${escHtml(rca.correctiveAction)}</div>` : ''}
        </div>
      </div>` : ''}

      <!-- §5 Preventive Measures -->
      ${pmItems.length ? `
      <div class="rm-section">
        <div class="rm-section-num">05</div>
        <div class="rm-section-body">
          <h2 class="rm-section-title">Preventive Measures</h2>
          <div class="rm-pm-list">
            ${pmItems.map(pm => `
              <div class="rm-pm-item">
                <span class="rm-pm-label">${escHtml(pm.label)}</span>
                <span class="rm-pm-val">${escHtml(pm.val)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>` : ''}

      <!-- §6 Reference Screenshots -->
      ${ssNames.length ? `
      <div class="rm-section">
        <div class="rm-section-num">06</div>
        <div class="rm-section-body">
          <h2 class="rm-section-title">Reference Screenshots</h2>
          <div class="rm-screenshots">
            ${ssNames.map((item, i) => {
              const src  = getImgSrc(item);
              const name = escHtml(getImgName(item));
              return `
              <div class="rm-ss-item">
                <img src="${src}" alt="Screenshot ${i+1}" onerror="this.closest('.rm-ss-item').style.display='none'" onclick="openLightbox(this.src,'Screenshot ${i+1} — ${name}')">
                <span class="rm-ss-caption">Screenshot ${i+1} — ${name}</span>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>` : ''}

      <!-- §7 Received Email -->
      ${emailNames.length ? `
      <div class="rm-section">
        <div class="rm-section-num">07</div>
        <div class="rm-section-body">
          <h2 class="rm-section-title">Received Email</h2>
          <div class="rm-screenshots">
            ${emailNames.map((item, i) => {
              const src  = getImgSrc(item);
              const name = escHtml(getImgName(item));
              return `
            <div class="rm-ss-item">
              <img src="${src}" alt="Received Email ${i+1}" onerror="this.closest('.rm-ss-item').style.display='none'" onclick="openLightbox(this.src,'Received Email ${i+1} — ${name}')">
              <span class="rm-ss-caption">Email ${i+1} — ${name}</span>
            </div>`;
            }).join('')}
          </div>
        </div>
      </div>` : ''}

      <!-- §8 Response with Closure -->
      ${closureNames.length ? `
      <div class="rm-section">
        <div class="rm-section-num">08</div>
        <div class="rm-section-body">
          <h2 class="rm-section-title">Response with Closure</h2>
          <div class="rm-screenshots">
            ${closureNames.map((item, i) => {
              const src  = getImgSrc(item);
              const name = escHtml(getImgName(item));
              return `
            <div class="rm-ss-item">
              <img src="${src}" alt="Closure ${i+1}" onerror="this.closest('.rm-ss-item').style.display='none'" onclick="openLightbox(this.src,'Closure ${i+1} — ${name}')">
              <span class="rm-ss-caption">Closure ${i+1} — ${name}</span>
            </div>`;
            }).join('')}
          </div>
        </div>
      </div>` : ''}

    </div>
  `;

  // Store current rca id for download
  modal.dataset.rcaId = id;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeReportModal = function () {
  document.getElementById('report-modal').classList.remove('open');
  document.body.style.overflow = '';
};

// Close on backdrop click
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('report-modal').addEventListener('click', function (e) {
    if (e.target === this) window.closeReportModal();
  });
});

// ── Download Word Document ────────────────────────────────
window.downloadWordDoc = async function () {
  const modal = document.getElementById('report-modal');
  const id    = modal.dataset.rcaId;
  const rca   = rcaCache[id];
  if (!rca) return;

  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
          Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun, ShadingType } = window.docx;

  const p             = getPriority(rca.priority);
  const product       = rca.event?.product        || rca.product        || '—';
  const raisedBy      = rca.event?.raisedBy       || rca.raisedBy       || '—';
  const affectedModule  = rca.event?.affectedModule  || rca.affectedModule  || '—';
  const affectedFeature = rca.event?.affectedFeature || rca.affectedFeature || '—';
  const vc = rca.versions?.client || rca.clientVersion || null;
  const vs = rca.versions?.server || rca.serverVersion || null;
  const va = rca.versions?.agent  || rca.agentVersion  || null;
  const emailNames   = rca.attachments?.receivedEmails   || (rca.attachments?.receivedEmail   ? [rca.attachments.receivedEmail]   : rca.receivedEmail   ? [rca.receivedEmail]   : []);
  const closureNames = rca.attachments?.responseClosures || (rca.attachments?.responseClosure ? [rca.attachments.responseClosure] : rca.responseClosure ? [rca.responseClosure] : []);
  const ssNames      = rca.attachments?.screenshots      || rca.screenshots     || [];
  const dateStr     = rca.createdAt
    ? new Date(rca.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' })
    : '—';

  // Color map for priority
  const priorityHex = { critical: 'E05C6B', high: 'E89050', medium: 'D4A93A', low: '3DBFA0' };
  const prioColor   = priorityHex[rca.priority?.toLowerCase()] || '404860';

  function makeHeading(text, level = 1) {
    return new Paragraph({
      text,
      heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
      spacing: { before: level === 1 ? 360 : 240, after: 120 },
    });
  }

  function makeField(label, value) {
    if (!value || value === '—') return null;
    return new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: true, size: 22, color: '374151' }),
        new TextRun({ text: value, size: 22, color: '111827' }),
      ],
      spacing: { after: 80 },
    });
  }

  function pushField(arr, label, value) {
    const f = makeField(label, value);
    if (f) arr.push(f);
  }

  function makeParagraph(text, opts = {}) {
    return new Paragraph({
      children: [new TextRun({ text: text || '', size: 22, color: '374151', ...opts })],
      spacing: { after: 160 },
    });
  }

  function makeDivider() {
    return new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' } },
      spacing: { after: 200 },
    });
  }

  function makeLabel(text) {
    return new Paragraph({
      children: [new TextRun({ text, bold: true, size: 24, color: prioColor })],
      spacing: { before: 200, after: 80 },
    });
  }

  // Helper to strip HTML tags for plain text
  function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return div.innerText || div.textContent || '';
  }

  const children = [];

  // ── Title Block ──
  children.push(new Paragraph({
    children: [
      new TextRun({
        text: 'ROOT CAUSE ANALYSIS REPORT',
        bold: true, allCaps: true, size: 28,
        color: prioColor,
      }),
    ],
    spacing: { after: 80 },
  }));

  children.push(new Paragraph({
    children: [
      new TextRun({
        text: rca.title || rca.description || 'Untitled Incident',
        bold: true, size: 36,
        color: '0F172A',
      }),
    ],
    spacing: { after: 160 },
  }));

  children.push(new Paragraph({
    children: [
      new TextRun({ text: `Priority: `, bold: true, size: 22, color: '374151' }),
      new TextRun({ text: p.label, size: 22, bold: true, color: prioColor }),
      new TextRun({ text: `   |   Date: `, bold: true, size: 22, color: '374151' }),
      new TextRun({ text: dateStr, size: 22, color: '374151' }),
      new TextRun({ text: `   |   Client: `, bold: true, size: 22, color: '374151' }),
      new TextRun({ text: rca.clientName || '—', size: 22, color: '374151' }),
    ],
    spacing: { after: 60 },
  }));

  children.push(makeDivider());

  // ── §1 Incident Overview ──
  children.push(makeLabel('01 — INCIDENT OVERVIEW'));
  pushField(children, 'Client',           rca.clientName);
  pushField(children, 'Product',          product !== '—' ? product : null);
  pushField(children, 'Raised By',        raisedBy !== '—' ? raisedBy : null);
  pushField(children, 'Priority',         p.label);
  pushField(children, 'Affected Module',  affectedModule !== '—' ? affectedModule : null);
  pushField(children, 'Affected Feature', affectedFeature !== '—' ? affectedFeature : null);
  if (rca.description) {
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Description:', bold: true, size: 22, color: '374151' })],
      spacing: { before: 120, after: 60 },
    }));
    children.push(makeParagraph(rca.description));
  }
  children.push(makeDivider());

  // ── §2 Versions ──
  if (vc || vs || va) {
    children.push(makeLabel('02 — VERSION DETAILS'));
    if (vc) pushField(children, 'Client Version', `v${vc}`);
    if (vs) pushField(children, 'Server Version', `v${vs}`);
    if (va) pushField(children, 'Agent Version',  `v${va}`);
    children.push(makeDivider());
  }

  // ── §3 Detailed Description ──
  if (rca.detailedDescription) {
    children.push(makeLabel('03 — DETAILED ANALYSIS'));
    const plainText = stripHtml(rca.detailedDescription);
    plainText.split('\n').forEach(line => {
      if (line.trim()) children.push(makeParagraph(line.trim()));
    });
    children.push(makeDivider());
  }

  // ── §4 Corrective Actions ──
  const caItems = [
    rca.hotfix     === 'yes' ? 'Hotfix Applied'     : null,
    rca.rollback   === 'yes' ? 'Rollback Performed'  : null,
    rca.workaround === 'yes' ? 'Workaround Used'    : null,
  ].filter(Boolean);

  if (rca.correctiveAction || caItems.length) {
    children.push(makeLabel('04 — CORRECTIVE ACTIONS'));
    if (caItems.length) {
      children.push(makeParagraph(`Actions taken: ${caItems.join(', ')}`));
    }
    if (rca.correctiveAction) children.push(makeParagraph(rca.correctiveAction));
    children.push(makeDivider());
  }

  // ── §5 Preventive Measures ──
  const pmItems = [
    rca.pmCode       ? { label: 'Code',      val: rca.pmCode       } : null,
    rca.pmTest       ? { label: 'Testing',   val: rca.pmTest       } : null,
    rca.pmProcess    ? { label: 'Process',   val: rca.pmProcess    } : null,
    rca.pmMonitoring ? { label: 'Monitoring',val: rca.pmMonitoring } : null,
  ].filter(Boolean);

  if (pmItems.length) {
    children.push(makeLabel('05 — PREVENTIVE MEASURES'));
    pmItems.forEach(pm => pushField(children, pm.label, pm.val));
    children.push(makeDivider());
  }

  // ── §6 Screenshots ──
  const imageChildren = [];
  for (let idx = 0; idx < ssNames.length; idx++) {
    const item   = ssNames[idx];
    const name   = getImgName(item);
    const dataUrl = typeof item === 'object' ? item.data : null;
    try {
      let buffer, imgType;
      if (dataUrl) {
        const base64 = dataUrl.split(',')[1];
        if (!base64) throw new Error('invalid dataUrl');
        const mime    = dataUrl.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
        const typeMap = { 'image/jpeg':'jpeg','image/jpg':'jpeg','image/png':'png','image/gif':'gif','image/webp':'webp' };
        imgType = typeMap[mime] || 'jpeg';
        const binary = atob(base64);
        const bytes  = new Uint8Array(binary.length);
        for (let b = 0; b < binary.length; b++) bytes[b] = binary.charCodeAt(b);
        buffer = bytes.buffer;
      } else {
        // Legacy: fetch from /uploads/
        const res = await fetch(`/uploads/${name}`);
        if (!res.ok) throw new Error('not found');
        const blob = await res.blob();
        buffer = await blob.arrayBuffer();
        const ext = name.split('.').pop().toLowerCase();
        const extMap = { jpg:'jpeg',jpeg:'jpeg',png:'png',gif:'gif',webp:'webp' };
        imgType = extMap[ext] || 'jpeg';
      }
      imageChildren.push(new Paragraph({
        children: [new ImageRun({ data: buffer, transformation: { width: 480, height: 280 }, type: imgType })],
        spacing: { after: 80 },
      }));
      imageChildren.push(new Paragraph({
        children: [new TextRun({ text: name, size: 18, color: '9CA3AF', italics: true })],
        spacing: { after: 200 },
      }));
    } catch (_) {
      imageChildren.push(makeParagraph(`[Image unavailable: ${name}]`));
    }
  }

  if (imageChildren.length) {
    children.push(makeLabel('06 — REFERENCE SCREENSHOTS'));
    children.push(...imageChildren);
    children.push(makeDivider());
  }

  // ── §7 Received Email ──
  const emailImageChildren = [];
  for (let idx = 0; idx < emailNames.length; idx++) {
    const item    = emailNames[idx];
    const name    = getImgName(item);
    const dataUrl = typeof item === 'object' ? item.data : null;
    try {
      let buffer, imgType;
      if (dataUrl) {
        const base64 = dataUrl.split(',')[1];
        const mime    = dataUrl.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
        const typeMap = { 'image/jpeg':'jpeg','image/jpg':'jpeg','image/png':'png','image/gif':'gif','image/webp':'webp' };
        imgType = typeMap[mime] || 'jpeg';
        const binary = atob(base64);
        const bytes  = new Uint8Array(binary.length);
        for (let b = 0; b < binary.length; b++) bytes[b] = binary.charCodeAt(b);
        buffer = bytes.buffer;
      } else {
        const res = await fetch(`/uploads/${name}`);
        if (!res.ok) throw new Error('not found');
        buffer  = await (await res.blob()).arrayBuffer();
        const ext = name.split('.').pop().toLowerCase();
        imgType = ({ jpg:'jpeg',jpeg:'jpeg',png:'png',gif:'gif',webp:'webp' })[ext] || 'jpeg';
      }
      emailImageChildren.push(new Paragraph({
        children: [new ImageRun({ data: buffer, transformation: { width: 480, height: 280 }, type: imgType })],
        spacing: { after: 80 },
      }));
      emailImageChildren.push(new Paragraph({
        children: [new TextRun({ text: name, size: 18, color: '9CA3AF', italics: true })],
        spacing: { after: 200 },
      }));
    } catch (_) {
      emailImageChildren.push(makeParagraph(`[Image unavailable: ${name}]`));
    }
  }
  if (emailImageChildren.length) {
    children.push(makeLabel('07 — RECEIVED EMAIL'));
    children.push(...emailImageChildren);
    children.push(makeDivider());
  }

  // ── §8 Response with Closure ──
  const closureImageChildren = [];
  for (let idx = 0; idx < closureNames.length; idx++) {
    const item    = closureNames[idx];
    const name    = getImgName(item);
    const dataUrl = typeof item === 'object' ? item.data : null;
    try {
      let buffer, imgType;
      if (dataUrl) {
        const base64 = dataUrl.split(',')[1];
        const mime    = dataUrl.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
        const typeMap = { 'image/jpeg':'jpeg','image/jpg':'jpeg','image/png':'png','image/gif':'gif','image/webp':'webp' };
        imgType = typeMap[mime] || 'jpeg';
        const binary = atob(base64);
        const bytes  = new Uint8Array(binary.length);
        for (let b = 0; b < binary.length; b++) bytes[b] = binary.charCodeAt(b);
        buffer = bytes.buffer;
      } else {
        const res = await fetch(`/uploads/${name}`);
        if (!res.ok) throw new Error('not found');
        buffer  = await (await res.blob()).arrayBuffer();
        const ext = name.split('.').pop().toLowerCase();
        imgType = ({ jpg:'jpeg',jpeg:'jpeg',png:'png',gif:'gif',webp:'webp' })[ext] || 'jpeg';
      }
      closureImageChildren.push(new Paragraph({
        children: [new ImageRun({ data: buffer, transformation: { width: 480, height: 280 }, type: imgType })],
        spacing: { after: 80 },
      }));
      closureImageChildren.push(new Paragraph({
        children: [new TextRun({ text: name, size: 18, color: '9CA3AF', italics: true })],
        spacing: { after: 200 },
      }));
    } catch (_) {
      closureImageChildren.push(makeParagraph(`[Image unavailable: ${name}]`));
    }
  }
  if (closureImageChildren.length) {
    children.push(makeLabel('08 — RESPONSE WITH CLOSURE'));
    children.push(...closureImageChildren);
    children.push(makeDivider());
  }

  // ── Footer ──
  children.push(new Paragraph({
    children: [
      new TextRun({ text: `Generated by RCA Manager  ·  ${new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' })}`, size: 18, color: '9CA3AF', italics: true }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200 },
  }));

  const doc = new Document({
    creator: 'RCA Manager',
    title: rca.title || rca.description || 'RCA Report',
    description: 'Root Cause Analysis Report',
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22, color: '111827' },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: [{
      properties: {
        page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `RCA_${(rca.clientName || 'report').replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.docx`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Download PDF ──────────────────────────────────────────
window.downloadPDF = function () {
  const modal = document.getElementById('report-modal');
  const id    = modal.dataset.rcaId;
  const rca   = rcaCache[id];
  const orig  = document.title;
  if (rca) {
    document.title = `RCA_${(rca.clientName || 'report').replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}`;
  }
  window.print();
  document.title = orig;
};

// ── Theme Toggle ──────────────────────────────────────────
(function initTheme() {
  const saved = localStorage.getItem('rca-theme');
  if (saved === 'light') document.body.classList.add('light');
})();

window.toggleTheme = function () {
  const isLight = document.body.classList.toggle('light');
  localStorage.setItem('rca-theme', isLight ? 'light' : 'dark');
};

// ── Lightbox ──────────────────────────────────────────────
window.openLightbox = function (src, caption) {
  const overlay = document.getElementById('lightbox');
  const img     = document.getElementById('lightbox-img');
  const cap     = document.getElementById('lightbox-caption');
  img.src       = src;
  cap.textContent = caption || '';
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeLightbox = function () {
  document.getElementById('lightbox').classList.remove('open');
  // Only restore scroll if report modal is also closed
  if (!document.getElementById('report-modal').classList.contains('open')) {
    document.body.style.overflow = '';
  }
};

// Close lightbox on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (document.getElementById('lightbox').classList.contains('open')) {
      window.closeLightbox();
    } else {
      window.closeReportModal();
    }
  }
});

// ── Init ──────────────────────────────────────────────────
loadRCA();