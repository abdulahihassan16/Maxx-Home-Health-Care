// Notification emails: one layout, four headings. Table-based HTML with inline
// styles so Gmail (web and app) renders it faithfully, plus a plain-text part.
// Every visitor-supplied value passes through esc() before it reaches the HTML.

const PAPER = '#FAF8F2';
const LEAF = '#3F6410';
const INK = '#1F1D18';
const STONE = '#6B665D';
const RULE = '#E6E0D3';
const BOX = '#F3EFE6';

const LABELS = {
  name: 'Name',
  organization: 'Organization',
  role: 'Role',
  phone: 'Phone',
  email: 'Email',
  contact_method: 'Preferred contact',
  service: 'Service requested',
  position: 'Position',
  availability: 'Availability',
  experience: 'Experience',
  certifications: 'Certifications',
  transport: "Driver's license & transportation",
  consent: 'Background check consent',
  heard: 'How they heard about us',
  files: 'Attachments',
  resume: 'Resume',
};

const TYPES = {
  care: {
    heading: 'Someone is requesting care',
    subject: (v) => `New care request: ${v.name} (${v.service})`,
  },
  referral: {
    heading: 'New client referral',
    subject: (v) => `New referral from ${v.name}, ${v.organization}`,
    nameLabel: 'Referred by',
  },
  job: {
    heading: 'New job application',
    subject: (v) => `New job application: ${v.name} for ${v.position}`,
  },
  general: {
    heading: 'New message from your website',
    subject: (v) => `New message from ${v.name}`,
  },
};

export function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const oneLine = (s) => String(s).replace(/[\r\n]+/g, ' ').trim();

function centralTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(date);
}

// Rows in form order; only fields the person actually filled in.
function rows(type, v) {
  const order = {
    care: ['name', 'phone', 'email', 'contact_method', 'service'],
    referral: ['name', 'organization', 'role', 'phone', 'email', 'files'],
    general: ['name', 'phone', 'email'],
    job: ['name', 'phone', 'email', 'position', 'availability', 'experience', 'certifications', 'transport', 'consent', 'heard', 'resume'],
  }[type];

  const values = { ...v };
  if (type === 'job') {
    const parts = [];
    if (v.days) parts.push(v.days.join(', '));
    if (v.shifts) parts.push(v.shifts.join(', '));
    if (parts.length) values.availability = parts.join(' · ');
    if (v.consent) values.consent = 'Yes, consents to a background check';
  }

  return order
    .filter((k) => values[k] && (!Array.isArray(values[k]) || values[k].length))
    .map((k) => ({
      key: k,
      label: k === 'name' && TYPES[type].nameLabel ? TYPES[type].nameLabel : LABELS[k],
      value: Array.isArray(values[k]) ? values[k].join(', ') : values[k],
    }));
}

export function buildEmail(type, v, { submittedAt, siteUrl }) {
  const t = TYPES[type];
  const subject = oneLine(t.subject(v));
  const when = centralTime(submittedAt);
  const digits = v.phone.replace(/\D/g, '');
  const tel = 'tel:+' + (digits.length === 10 ? '1' + digits : digits);
  const mailto = 'mailto:' + encodeURIComponent(v.email) + '?subject=' + encodeURIComponent('Re: ' + subject);
  const firstName = oneLine(v.name).split(' ')[0];
  const table = rows(type, v);
  const logo = siteUrl.replace(/\/$/, '') + '/assets/img/logo.png';

  const valueCell = (r) => {
    if (r.key === 'phone') return `<a href="${esc(tel)}" style="color:${LEAF};font-weight:700;text-decoration:none;">${esc(r.value)}</a>`;
    if (r.key === 'email') return `<a href="${esc(mailto)}" style="color:${LEAF};font-weight:700;text-decoration:none;word-break:break-all;">${esc(r.value)}</a>`;
    return esc(r.value);
  };

  const tableRows = table.map((r, i) => `
          <tr>
            <td class="lbl" valign="top" style="padding:14px 16px 14px 0;width:38%;border-top:${i ? `1px solid ${RULE}` : '0'};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${STONE};">${esc(r.label)}</td>
            <td class="val" valign="top" style="padding:14px 0;border-top:${i ? `1px solid ${RULE}` : '0'};font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:${INK};">${valueCell(r)}</td>
          </tr>`).join('');

  const messageBlock = v.message ? `
      <tr>
        <td style="padding:8px 32px 8px;" class="pad">
          <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${STONE};">Their message</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding:18px 20px;background:${BOX};border:1px solid ${RULE};border-radius:10px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;color:${INK};">${esc(v.message).replace(/\n/g, '<br>')}</td>
            </tr>
          </table>
        </td>
      </tr>` : '';

  const button = (href, label, solid) => `
                <td style="padding:0 10px 10px 0;" class="btn">
                  <a href="${esc(href)}" style="display:inline-block;padding:13px 22px;border-radius:999px;border:2px solid ${LEAF};background:${solid ? LEAF : '#FFFFFF'};color:${solid ? '#FFFFFF' : LEAF};font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:20px;font-weight:700;text-decoration:none;">${esc(label)}</a>
                </td>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(subject)}</title>
<style>
  @media only screen and (max-width: 520px) {
    .pad { padding-left: 20px !important; padding-right: 20px !important; }
    .lbl, .val { display: block !important; width: 100% !important; }
    .lbl { padding: 14px 0 2px !important; }
    .val { padding: 0 0 14px !important; border-top: 0 !important; }
    .head { font-size: 26px !important; line-height: 32px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${PAPER};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(t.heading)}: ${esc(oneLine(v.name))}, ${esc(v.phone)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAPER};">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#FFFFFF;border:1px solid ${RULE};border-radius:14px;overflow:hidden;">
        <tr>
          <td style="padding:22px 32px 18px;background:${PAPER};" class="pad">
            <img src="${esc(logo)}" width="150" alt="Maxx Home Health Care" style="display:block;width:150px;height:auto;border:0;">
          </td>
        </tr>
        <tr>
          <td style="padding:26px 32px 24px;background:${LEAF};" class="pad">
            <h1 class="head" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:36px;font-weight:700;color:#FFFFFF;">${esc(t.heading)}</h1>
            <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#E4EDD8;">${esc(when)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 14px;" class="pad">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>${button(tel, 'Call ' + firstName, true)}${button(mailto, 'Reply by email', false)}
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 32px 16px;" class="pad">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${tableRows}
            </table>
          </td>
        </tr>${messageBlock}
        <tr>
          <td style="padding:24px 32px 28px;border-top:1px solid ${RULE};" class="pad">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:${STONE};">Sent from the contact form on maxxhomehealthcarellc.com</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const textLines = [
    t.heading.toUpperCase(),
    when,
    '',
    `Call ${firstName}: ${v.phone}`,
    `Reply by email: ${v.email}`,
    '',
    ...table.map((r) => `${r.label}: ${r.value}`),
  ];
  if (v.message) textLines.push('', 'Their message:', v.message);
  textLines.push('', '--', 'Sent from the contact form on maxxhomehealthcarellc.com');

  return { subject, html, text: textLines.join('\n') };
}
