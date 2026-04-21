import nodemailer from 'nodemailer';

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'jeevasuriyan787@gmail.com';

function createTransport() {
  const port = parseInt(process.env.MAIL_PORT || '587');
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.zoho.com',
    port,
    secure: port === 465,
    auth: {
      type: 'LOGIN',
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

function priorityColor(priority) {
  const p = (priority || '').toLowerCase();
  if (p === 'critical') return '#dc2626';
  if (p === 'high')     return '#ea580c';
  if (p === 'medium')   return '#d97706';
  return '#16a34a';
}

function formatDate(date) {
  return new Date(date || Date.now()).toLocaleString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function baseTemplate({ title, preheader, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;font-size:1px;">${preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0f172a;border-radius:12px 12px 0 0;padding:24px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:20px;font-weight:700;color:#f8fafc;letter-spacing:-0.3px;">RCA Portal</div>
                    <div style="font-size:10px;color:#94a3b8;margin-top:3px;letter-spacing:1.2px;text-transform:uppercase;">Root Cause Analysis System</div>
                  </td>
                  <td align="right">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:38px;height:38px;background:#1e40af;border-radius:9px;text-align:center;vertical-align:middle;">
                          <span style="font-size:18px;color:#ffffff;font-weight:800;">R</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 36px 28px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-radius:0 0 12px 12px;padding:20px 36px;border-top:1px solid #e2e8f0;">
              <div style="font-size:11px;color:#94a3b8;text-align:center;line-height:1.6;">
                This is an automated notification from the RCA Portal. Please do not reply to this email.<br>
                &copy; ${new Date().getFullYear()} RCA Application &middot; Tristha Global
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function fieldRow(label, value) {
  if (!value) return '';
  return `
  <tr>
    <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:12px;color:#64748b;font-weight:600;width:150px;vertical-align:top;white-space:nowrap;">${label}</td>
    <td style="padding:9px 0 9px 16px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;vertical-align:top;">${value}</td>
  </tr>`;
}

function priorityBadge(priority) {
  const c = priorityColor(priority);
  return `<span style="display:inline-block;padding:2px 12px;background:${c}18;border:1px solid ${c}55;border-radius:20px;color:${c};font-weight:700;font-size:12px;letter-spacing:.4px;">${priority}</span>`;
}

export async function sendNewRCANotification(rca) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) return;

  const pColor = priorityColor(rca.priority);
  const dateStr = formatDate(rca.createdAt);

  const body = `
    <!-- Alert badge -->
    <div style="margin-bottom:20px;">
      <div style="display:inline-block;padding:4px 14px;background:#fef3c7;border:1px solid #fde68a;border-radius:20px;font-size:11px;font-weight:700;color:#92400e;letter-spacing:.8px;text-transform:uppercase;">
        &#x26A0; New Incident Reported
      </div>
    </div>

    <!-- Title -->
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">
      ${rca.title || (rca.clientName + ' — New RCA')}
    </h1>
    <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">
      A new Root Cause Analysis has been registered in the RCA Portal. Please review the details below.
    </p>

    <!-- Details card -->
    <div style="background:#f8fafc;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid ${pColor};">
      <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:14px;">Incident Summary</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${fieldRow('Priority', priorityBadge(rca.priority))}
        ${fieldRow('Client', rca.clientName || '—')}
        ${fieldRow('Product', rca.product || '—')}
        ${fieldRow('Affected Module', rca.affectedModule || '—')}
        ${fieldRow('Affected Feature', rca.affectedFeature || '—')}
        ${fieldRow('Raised By', rca.raisedBy || '—')}
        ${fieldRow('Registered On', dateStr)}
        ${rca.assignee?.name ? fieldRow('Assigned To', rca.assignee.name) : ''}
      </table>
    </div>

    ${rca.description ? `
    <!-- Description -->
    <div style="margin-bottom:24px;">
      <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:10px;">Short Description</div>
      <div style="font-size:14px;color:#334155;line-height:1.7;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
        ${rca.description}
      </div>
    </div>` : ''}

    <!-- CTA -->
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px 20px;">
      <div style="font-size:13px;color:#1e40af;font-weight:700;margin-bottom:4px;">&#x2139; Action Required</div>
      <div style="font-size:13px;color:#3b82f6;line-height:1.6;">
        Please log in to the RCA Portal to review this incident and ensure that it is acknowledged and properly assigned.
      </div>
    </div>
  `;

  const html = baseTemplate({
    title: `New RCA — ${rca.priority} Priority | ${rca.clientName}`,
    preheader: `A new ${rca.priority} priority RCA has been created for ${rca.clientName} by ${rca.raisedBy || 'a team member'}.`,
    body,
  });

  const transporter = createTransport();
  await transporter.sendMail({
    from: `"RCA Portal" <${process.env.MAIL_USER}>`,
    to: NOTIFY_EMAIL,
    subject: `[RCA Alert] New Issue Reported — ${rca.priority} Priority | ${rca.clientName}`,
    html,
  });
}

export async function sendAssignmentNotification(rca, assignee) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) return;
  if (!assignee?.email) return;

  const pColor = priorityColor(rca.priority);
  const dateStr = formatDate(rca.createdAt);

  const body = `
    <!-- Alert badge -->
    <div style="margin-bottom:20px;">
      <div style="display:inline-block;padding:4px 14px;background:#dbeafe;border:1px solid #bfdbfe;border-radius:20px;font-size:11px;font-weight:700;color:#1e40af;letter-spacing:.8px;text-transform:uppercase;">
        &#x1F4CB; RCA Assigned to You
      </div>
    </div>

    <!-- Greeting -->
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">
      Hi ${assignee.name},
    </h1>
    <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">
      You have been assigned to investigate and resolve the following Root Cause Analysis. Please review the details below and take prompt action in line with the priority level.
    </p>

    <!-- Details card -->
    <div style="background:#f8fafc;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid ${pColor};">
      <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:14px;">Incident Details</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${fieldRow('RCA Title', rca.title || rca.clientName || '—')}
        ${fieldRow('Priority', priorityBadge(rca.priority))}
        ${fieldRow('Client', rca.clientName || '—')}
        ${fieldRow('Product', rca.product || '—')}
        ${fieldRow('Affected Module', rca.affectedModule || '—')}
        ${fieldRow('Affected Feature', rca.affectedFeature || '—')}
        ${fieldRow('Raised By', rca.raisedBy || '—')}
        ${fieldRow('Created On', dateStr)}
      </table>
    </div>

    ${rca.description ? `
    <!-- Description -->
    <div style="margin-bottom:24px;">
      <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:10px;">Issue Summary</div>
      <div style="font-size:14px;color:#334155;line-height:1.7;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
        ${rca.description}
      </div>
    </div>` : ''}

    <!-- Next steps -->
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px 20px;margin-bottom:16px;">
      <div style="font-size:13px;color:#15803d;font-weight:700;margin-bottom:8px;">&#x2705; Next Steps</div>
      <ul style="margin:0;padding-left:20px;font-size:13px;color:#16a34a;line-height:2;">
        <li>Log in to the RCA Portal and open this incident</li>
        <li>Investigate the root cause and document your findings</li>
        <li>Apply the necessary corrective actions</li>
        <li>Update the RCA record with resolution details and close the incident</li>
      </ul>
    </div>

    <!-- Priority warning -->
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px 20px;">
      <div style="font-size:13px;color:#dc2626;font-weight:700;margin-bottom:4px;">&#x26A0; Priority Notice</div>
      <div style="font-size:13px;color:#ef4444;line-height:1.6;">
        This issue is marked as <strong>${rca.priority}</strong> priority. Please ensure timely resolution in accordance with your SLA commitments.
      </div>
    </div>
  `;

  const html = baseTemplate({
    title: `RCA Assigned — ${rca.priority} | ${rca.clientName}`,
    preheader: `You've been assigned a ${rca.priority} priority RCA for ${rca.clientName}. Please review and take action.`,
    body,
  });

  const transporter = createTransport();
  await transporter.sendMail({
    from: `"RCA Portal" <${process.env.MAIL_USER}>`,
    to: assignee.email,
    subject: `[RCA Assignment] You've been assigned an issue — ${rca.priority} Priority | ${rca.clientName}`,
    html,
  });
}
