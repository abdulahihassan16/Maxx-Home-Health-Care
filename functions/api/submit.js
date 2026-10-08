// POST /api/submit — every form on the site posts here.
//
// Order of checks: size -> honeypot -> rate limit -> Turnstile -> validation
// -> send to the office -> thank-you note to the visitor. A success response is
// only returned after Resend accepts the office email.
//
// Environment (Cloudflare Pages > Settings > Variables and Secrets):
//   RESEND_API_KEY        secret   Resend API key (required)
//   TURNSTILE_SECRET_KEY  secret   Turnstile widget secret (spam check is on once set)
//   MAIL_TO               plain    defaults to maxxhomehealthcare@gmail.com
//   MAIL_FROM             plain    defaults to Maxx Home Health Care Website <hello@maxxhomehealthcarellc.com>
//   SITE_URL              plain    defaults to the address the form was sent from (logo URL in emails)
// Bindings:
//   RATE_LIMIT            KV namespace for per-address submission counts (limit is on once bound)
// Optional, for local testing only:
//   RESEND_API_URL        defaults to https://api.resend.com/emails

import { formType, validate } from '../_shared/forms.js';
import { buildEmail, buildConfirmation } from '../_shared/email.js';

const PHONE = '507-884-8277';
const RATE_WINDOW_SECONDS = 600;
const RATE_MAX = 5;
const MAX_BODY_BYTES = 25 * 1024 * 1024;

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const sorry = (status, extra = {}) =>
  json(status, {
    ok: false,
    error: `We couldn't send your message just now. Please call us at ${PHONE} and we'll take care of you.`,
    ...extra,
  });

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

async function overLimit(kv, ip) {
  const key = 'submit:' + ip;
  const now = Math.floor(Date.now() / 1000);
  const entry = (await kv.get(key, 'json')) || { n: 0, since: now };
  if (now - entry.since >= RATE_WINDOW_SECONDS) { entry.n = 0; entry.since = now; }
  entry.n += 1;
  await kv.put(key, JSON.stringify(entry), { expirationTtl: RATE_WINDOW_SECONDS + 60 });
  return entry.n > RATE_MAX;
}

async function turnstileOk(secret, token, ip) {
  if (!token) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const out = await res.json().catch(() => ({}));
  return out.success === true;
}

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY) { console.error('submit: missing environment variable RESEND_API_KEY'); return sorry(500); }
  const mailTo = env.MAIL_TO || 'maxxhomehealthcare@gmail.com';
  const mailFrom = env.MAIL_FROM || 'Maxx Home Health Care Website <hello@maxxhomehealthcarellc.com>';
  const siteUrl = env.SITE_URL || new URL(request.url).origin;

  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_BODY_BYTES) {
    return json(413, { ok: false, error: `Your attachments are too large to send. Please keep them under 20 MB, or call us at ${PHONE}.` });
  }

  let data;
  try {
    data = await request.formData();
  } catch {
    return sorry(400);
  }

  // Honeypot: a field people never see. Anything typed into it is a bot.
  if (String(data.get('website') || '').trim()) return sorry(400);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (env.RATE_LIMIT && await overLimit(env.RATE_LIMIT, ip)) {
    return json(429, { ok: false, error: `You've sent several messages in a short time. Please wait a few minutes, or call us at ${PHONE}.` });
  }

  if (env.TURNSTILE_SECRET_KEY && !(await turnstileOk(env.TURNSTILE_SECRET_KEY, String(data.get('cf-turnstile-response') || ''), ip))) {
    return json(403, { ok: false, error: `We couldn't confirm you're not a robot. Please reload the page and try again, or call us at ${PHONE}.` });
  }

  const type = formType(data);
  if (!type) return sorry(400);

  const { values, errors, files } = validate(type, data);
  if (Object.keys(errors).length) {
    return json(422, { ok: false, error: 'Please check the highlighted fields.', fields: errors });
  }

  const email = buildEmail(type, values, { submittedAt: new Date(), siteUrl });

  const attachments = [];
  for (const { file } of files) {
    attachments.push({ filename: file.name, content: toBase64(await file.arrayBuffer()) });
  }

  let res;
  try {
    res = await fetch(env.RESEND_API_URL || 'https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: mailFrom,
        to: [mailTo],
        reply_to: values.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        attachments: attachments.length ? attachments : undefined,
      }),
    });
  } catch (err) {
    console.error('submit: Resend unreachable', err);
    return sorry(502);
  }

  if (!res.ok) {
    console.error('submit: Resend rejected the email', res.status, await res.text().catch(() => ''));
    return sorry(502);
  }

  // The office has the message, so the visitor's thank-you note is a bonus:
  // if it fails, the submission still counts as sent.
  try {
    const note = buildConfirmation(type, values, { siteUrl });
    const sent = await fetch(env.RESEND_API_URL || 'https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: mailFrom, to: [values.email], reply_to: mailTo, subject: note.subject, html: note.html, text: note.text }),
    });
    if (!sent.ok) console.error('submit: confirmation rejected', sent.status, await sent.text().catch(() => ''));
  } catch (err) {
    console.error('submit: confirmation failed', err);
  }

  return json(200, { ok: true });
}
