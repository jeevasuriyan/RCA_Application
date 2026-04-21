import { rcaCache } from './state.js';
import { escHtml, getImgName, getImgSrc, getPriority, getRecordSnapshot } from './helpers.js';

export function viewReport(id) {
  const rca = rcaCache[id];
  if (!rca) return;

  const priority = getPriority(rca.priority);
  const {
    product,
    raisedBy,
    affectedModule,
    affectedFeature,
    vc,
    vs,
    va,
    emailNames,
    closureNames,
    ssNames,
  } = getRecordSnapshot(rca);
  const dateStr = rca.createdAt
    ? new Date(rca.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : '-';

  const correctiveActionItems = [
    rca.hotfix === 'yes' ? 'Hotfix Applied' : null,
    rca.rollback === 'yes' ? 'Rollback Performed' : null,
    rca.workaround === 'yes' ? 'Workaround Used' : null,
  ].filter(Boolean);

  const preventiveItems = [
    rca.pmCode ? { label: 'Code', val: rca.pmCode } : null,
    rca.pmTest ? { label: 'Testing', val: rca.pmTest } : null,
    rca.pmProcess ? { label: 'Process', val: rca.pmProcess } : null,
    rca.pmMonitoring ? { label: 'Monitoring', val: rca.pmMonitoring } : null,
  ].filter(Boolean);

  const modal = document.getElementById('report-modal');
  const body = document.getElementById('report-modal-body');
  const refId = `RCA-${id.slice(-6).toUpperCase()}`;
  const genDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  const titleEl = document.getElementById('rmt-doc-title');
  if (titleEl) titleEl.textContent = rca.title || rca.description || 'RCA Report';

  body.innerHTML = `
    <div class="rm-doc">
      <div class="rm-header" style="--priority-color:${priority.color}">
        <div class="rm-header-logo-row">
          <div class="rm-eyebrow">Root Cause Analysis Report</div>
          <span class="rm-ref">${refId}</span>
        </div>
        <h1 class="rm-title">${escHtml(rca.title || rca.description || 'Untitled Incident')}</h1>
        <div class="rm-meta-row">
          <span class="rm-badge ${priority.cls}">${priority.label}</span>
          <span class="rm-meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${dateStr}
          </span>
          <span class="rm-meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ${escHtml(rca.clientName || '-')}
          </span>
        </div>
      </div>

      <div class="rm-section">
        <div class="rm-section-num">01</div>
        <div class="rm-section-body">
          <h2 class="rm-section-title">Incident Overview</h2>
          <div class="rm-grid-4">
            <div class="rm-field"><span class="rm-label">Client</span><span class="rm-value">${escHtml(rca.clientName || '-')}</span></div>
            <div class="rm-field"><span class="rm-label">Product</span><span class="rm-value">${escHtml(product)}</span></div>
            <div class="rm-field"><span class="rm-label">Raised By</span><span class="rm-value">${escHtml(raisedBy)}</span></div>
            <div class="rm-field"><span class="rm-label">Priority</span><span class="rm-value rm-badge-inline ${priority.cls}">${priority.label}</span></div>
            <div class="rm-field"><span class="rm-label">Affected Module</span><span class="rm-value">${escHtml(affectedModule)}</span></div>
            <div class="rm-field"><span class="rm-label">Affected Feature</span><span class="rm-value">${escHtml(affectedFeature)}</span></div>
            ${rca.assignee?.name ? `<div class="rm-field"><span class="rm-label">Assigned To</span><span class="rm-value" style="color:#fbbf24;font-weight:600;">${escHtml(rca.assignee.name)}</span></div>` : ''}
          </div>
          ${rca.description ? `<div class="rm-desc-block">${escHtml(rca.description)}</div>` : ''}
        </div>
      </div>

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

      ${rca.detailedDescription ? `
      <div class="rm-section">
        <div class="rm-section-num">03</div>
        <div class="rm-section-body">
          <h2 class="rm-section-title">Detailed Analysis</h2>
          <div class="rm-rich-content ql-snow"><div class="ql-editor rm-quill-body">${rca.detailedDescription}</div></div>
        </div>
      </div>` : ''}

      ${(rca.correctiveAction || correctiveActionItems.length) ? `
      <div class="rm-section">
        <div class="rm-section-num">04</div>
        <div class="rm-section-body">
          <h2 class="rm-section-title">Corrective Actions</h2>
          ${correctiveActionItems.length ? `<div class="rm-ca-tags">${correctiveActionItems.map(item => `<span class="rm-ca-tag">${escHtml(item)}</span>`).join('')}</div>` : ''}
          ${rca.correctiveAction ? `<div class="rm-desc-block" style="margin-top:12px">${escHtml(rca.correctiveAction)}</div>` : ''}
        </div>
      </div>` : ''}

      ${preventiveItems.length ? `
      <div class="rm-section">
        <div class="rm-section-num">05</div>
        <div class="rm-section-body">
          <h2 class="rm-section-title">Preventive Measures</h2>
          <div class="rm-pm-list">
            ${preventiveItems.map(item => `
              <div class="rm-pm-item">
                <span class="rm-pm-label">${escHtml(item.label)}</span>
                <span class="rm-pm-val">${escHtml(item.val)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>` : ''}

      ${ssNames.length ? `
      <div class="rm-section">
        <div class="rm-section-num">06</div>
        <div class="rm-section-body">
          <h2 class="rm-section-title">Reference Screenshots</h2>
          <div class="rm-screenshots">
            ${ssNames.map((item, index) => {
              const src = getImgSrc(item);
              const name = escHtml(getImgName(item));
              return `
              <div class="rm-ss-item">
                <img src="${src}" alt="Screenshot ${index + 1}" onerror="this.closest('.rm-ss-item').style.display='none'" onclick="openLightbox(this.src,'Screenshot ${index + 1} - ${name}')">
                <span class="rm-ss-caption">Screenshot ${index + 1} - ${name}</span>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>` : ''}

      ${emailNames.length ? `
      <div class="rm-section">
        <div class="rm-section-num">07</div>
        <div class="rm-section-body">
          <h2 class="rm-section-title">Received Email</h2>
          <div class="rm-screenshots">
            ${emailNames.map((item, index) => {
              const src = getImgSrc(item);
              const name = escHtml(getImgName(item));
              return `
            <div class="rm-ss-item">
              <img src="${src}" alt="Received Email ${index + 1}" onerror="this.closest('.rm-ss-item').style.display='none'" onclick="openLightbox(this.src,'Received Email ${index + 1} - ${name}')">
              <span class="rm-ss-caption">Email ${index + 1} - ${name}</span>
            </div>`;
            }).join('')}
          </div>
        </div>
      </div>` : ''}

      ${closureNames.length ? `
      <div class="rm-section">
        <div class="rm-section-num">08</div>
        <div class="rm-section-body">
          <h2 class="rm-section-title">Response with Closure</h2>
          <div class="rm-screenshots">
            ${closureNames.map((item, index) => {
              const src = getImgSrc(item);
              const name = escHtml(getImgName(item));
              return `
            <div class="rm-ss-item">
              <img src="${src}" alt="Closure ${index + 1}" onerror="this.closest('.rm-ss-item').style.display='none'" onclick="openLightbox(this.src,'Closure ${index + 1} - ${name}')">
              <span class="rm-ss-caption">Closure ${index + 1} - ${name}</span>
            </div>`;
            }).join('')}
          </div>
        </div>
      </div>` : ''}

      <div class="rm-doc-footer">
        <div class="rm-doc-footer-left">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          <span>Confidential &mdash; Internal Use Only &mdash; ${refId}</span>
        </div>
        <div class="rm-doc-footer-right">Generated ${genDate}</div>
      </div>
    </div>
  `;

  modal.dataset.rcaId = id;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeReportModal() {
  document.getElementById('report-modal').classList.remove('open');
  document.body.style.overflow = '';
}

export function openLightbox(src, caption) {
  const overlay = document.getElementById('lightbox');
  const image = document.getElementById('lightbox-img');
  const captionEl = document.getElementById('lightbox-caption');
  image.src = src;
  captionEl.textContent = caption || '';
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  if (!document.getElementById('report-modal').classList.contains('open')) {
    document.body.style.overflow = '';
  }
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return div.innerText || div.textContent || '';
}

async function buildImageParagraphs(items, ImageRun, Paragraph, TextRun) {
  const paragraphs = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const name = getImgName(item);
    const dataUrl = typeof item === 'object' ? item.data : null;

    try {
      let buffer;
      let imgType;

      if (dataUrl) {
        const base64 = dataUrl.split(',')[1];
        if (!base64) throw new Error('invalid dataUrl');
        const mime = dataUrl.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
        const typeMap = { 'image/jpeg': 'jpeg', 'image/jpg': 'jpeg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' };
        imgType = typeMap[mime] || 'jpeg';
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        buffer = bytes.buffer;
      } else {
        const response = await fetch(`/uploads/${name}`);
        if (!response.ok) throw new Error('not found');
        buffer = await (await response.blob()).arrayBuffer();
        const ext = name.split('.').pop().toLowerCase();
        imgType = ({ jpg: 'jpeg', jpeg: 'jpeg', png: 'png', gif: 'gif', webp: 'webp' })[ext] || 'jpeg';
      }

      paragraphs.push(new Paragraph({
        children: [new ImageRun({ data: buffer, transformation: { width: 480, height: 280 }, type: imgType })],
        spacing: { after: 80 },
      }));
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: name, size: 18, color: '9CA3AF', italics: true })],
        spacing: { after: 200 },
      }));
    } catch {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: `[Image unavailable: ${name}]`, size: 22, color: '374151' })],
        spacing: { after: 160 },
      }));
    }
  }

  return paragraphs;
}

export async function downloadWordDoc() {
  const modal = document.getElementById('report-modal');
  const id = modal.dataset.rcaId;
  const rca = rcaCache[id];
  if (!rca) return;

  const wordBtn = document.getElementById('btn-word-dl');
  const originalHTML = wordBtn ? wordBtn.innerHTML : '';
  if (wordBtn) {
    wordBtn.disabled = true;
    wordBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 0.9s linear infinite"><circle cx="12" cy="12" r="10" stroke-dasharray="50" stroke-dashoffset="15"/></svg> Generating...`;
  }

  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
    ImageRun,
  } = window.docx;

  const priority = getPriority(rca.priority);
  const {
    product,
    raisedBy,
    affectedModule,
    affectedFeature,
    vc,
    vs,
    va,
    emailNames,
    closureNames,
    ssNames,
  } = getRecordSnapshot(rca);
  const dateStr = rca.createdAt
    ? new Date(rca.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : '-';

  const priorityHex = { critical: 'E05C6B', high: 'E89050', medium: 'D4A93A', low: '3DBFA0' };
  const prioColor = priorityHex[rca.priority?.toLowerCase()] || '404860';

  function makeField(label, value) {
    if (!value || value === '-') return null;
    return new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: true, size: 22, color: '374151' }),
        new TextRun({ text: value, size: 22, color: '111827' }),
      ],
      spacing: { after: 80 },
    });
  }

  function pushField(arr, label, value) {
    const field = makeField(label, value);
    if (field) arr.push(field);
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

  const children = [];

  children.push(new Paragraph({
    children: [new TextRun({
      text: 'ROOT CAUSE ANALYSIS REPORT',
      bold: true,
      allCaps: true,
      size: 28,
      color: prioColor,
    })],
    spacing: { after: 80 },
  }));

  children.push(new Paragraph({
    children: [new TextRun({
      text: rca.title || rca.description || 'Untitled Incident',
      bold: true,
      size: 36,
      color: '0F172A',
    })],
    spacing: { after: 160 },
  }));

  children.push(new Paragraph({
    children: [
      new TextRun({ text: 'Priority: ', bold: true, size: 22, color: '374151' }),
      new TextRun({ text: priority.label, size: 22, bold: true, color: prioColor }),
      new TextRun({ text: '   |   Date: ', bold: true, size: 22, color: '374151' }),
      new TextRun({ text: dateStr, size: 22, color: '374151' }),
      new TextRun({ text: '   |   Client: ', bold: true, size: 22, color: '374151' }),
      new TextRun({ text: rca.clientName || '-', size: 22, color: '374151' }),
    ],
    spacing: { after: 60 },
  }));

  children.push(makeDivider());

  children.push(makeLabel('01 - INCIDENT OVERVIEW'));
  pushField(children, 'Client', rca.clientName);
  pushField(children, 'Product', product !== '-' ? product : null);
  pushField(children, 'Raised By', raisedBy !== '-' ? raisedBy : null);
  pushField(children, 'Priority', priority.label);
  pushField(children, 'Affected Module', affectedModule !== '-' ? affectedModule : null);
  pushField(children, 'Affected Feature', affectedFeature !== '-' ? affectedFeature : null);
  if (rca.description) {
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Description:', bold: true, size: 22, color: '374151' })],
      spacing: { before: 120, after: 60 },
    }));
    children.push(makeParagraph(rca.description));
  }
  children.push(makeDivider());

  if (vc || vs || va) {
    children.push(makeLabel('02 - VERSION DETAILS'));
    if (vc) pushField(children, 'Client Version', `v${vc}`);
    if (vs) pushField(children, 'Server Version', `v${vs}`);
    if (va) pushField(children, 'Agent Version', `v${va}`);
    children.push(makeDivider());
  }

  if (rca.detailedDescription) {
    children.push(makeLabel('03 - DETAILED ANALYSIS'));
    stripHtml(rca.detailedDescription).split('\n').forEach(line => {
      if (line.trim()) children.push(makeParagraph(line.trim()));
    });
    children.push(makeDivider());
  }

  const correctiveActionItems = [
    rca.hotfix === 'yes' ? 'Hotfix Applied' : null,
    rca.rollback === 'yes' ? 'Rollback Performed' : null,
    rca.workaround === 'yes' ? 'Workaround Used' : null,
  ].filter(Boolean);

  if (rca.correctiveAction || correctiveActionItems.length) {
    children.push(makeLabel('04 - CORRECTIVE ACTIONS'));
    if (correctiveActionItems.length) {
      children.push(makeParagraph(`Actions taken: ${correctiveActionItems.join(', ')}`));
    }
    if (rca.correctiveAction) children.push(makeParagraph(rca.correctiveAction));
    children.push(makeDivider());
  }

  const preventiveItems = [
    rca.pmCode ? { label: 'Code', val: rca.pmCode } : null,
    rca.pmTest ? { label: 'Testing', val: rca.pmTest } : null,
    rca.pmProcess ? { label: 'Process', val: rca.pmProcess } : null,
    rca.pmMonitoring ? { label: 'Monitoring', val: rca.pmMonitoring } : null,
  ].filter(Boolean);

  if (preventiveItems.length) {
    children.push(makeLabel('05 - PREVENTIVE MEASURES'));
    preventiveItems.forEach(item => pushField(children, item.label, item.val));
    children.push(makeDivider());
  }

  const screenshotParagraphs = await buildImageParagraphs(ssNames, ImageRun, Paragraph, TextRun);
  if (screenshotParagraphs.length) {
    children.push(makeLabel('06 - REFERENCE SCREENSHOTS'));
    children.push(...screenshotParagraphs);
    children.push(makeDivider());
  }

  const emailParagraphs = await buildImageParagraphs(emailNames, ImageRun, Paragraph, TextRun);
  if (emailParagraphs.length) {
    children.push(makeLabel('07 - RECEIVED EMAIL'));
    children.push(...emailParagraphs);
    children.push(makeDivider());
  }

  const closureParagraphs = await buildImageParagraphs(closureNames, ImageRun, Paragraph, TextRun);
  if (closureParagraphs.length) {
    children.push(makeLabel('08 - RESPONSE WITH CLOSURE'));
    children.push(...closureParagraphs);
    children.push(makeDivider());
  }

  children.push(new Paragraph({
    children: [new TextRun({
      text: `Generated by RCA Manager  ·  ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      size: 18,
      color: '9CA3AF',
      italics: true,
    })],
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

  try {
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `RCA_${(rca.clientName || 'report').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.docx`;
    anchor.click();
    URL.revokeObjectURL(url);
  } finally {
    if (wordBtn) {
      wordBtn.disabled = false;
      wordBtn.innerHTML = originalHTML;
    }
  }
}

export async function downloadPDF() {
  const modal = document.getElementById('report-modal');
  const id = modal.dataset.rcaId;
  const rca = rcaCache[id];
  const body = document.getElementById('report-modal-body');
  const btn = document.getElementById('btn-pdf-dl');

  if (!body) return;

  const filename = `RCA_${(rca?.clientName || 'report').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin .7s linear infinite"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0"/></svg> Generating…`;
  }

  try {
    await window.html2pdf()
      .set({
        margin: [12, 12, 12, 12],
        filename,
        image: { type: 'jpeg', quality: 0.97 },
        html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(body)
      .save();
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> PDF`;
    }
  }
}

export function bindReportEvents() {
  document.getElementById('report-modal').addEventListener('click', function onModalClick(event) {
    if (event.target === this) closeReportModal();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (document.getElementById('lightbox').classList.contains('open')) {
        closeLightbox();
      } else {
        closeReportModal();
      }
    }
  });
}
