// Server-side schema for every form on the site. The browser validates too,
// but nothing here trusts it: every field is re-checked before an email goes out.

export const SERVICES = [
  'Home Care Nursing',
  'Private Duty Nursing',
  'Homemaking',
  'Respite Care',
  'Companionship',
  '24-Hour Emergency Support',
  'Community First Services and Supports (CFSS)',
  'Not sure yet',
];

export const POSITIONS = [
  'Personal Care Assistant (PCA)',
  'Certified Nursing Assistant (CNA)',
  'Home Health Aide (HHA)',
  'Registered Nurse (RN)',
  'Licensed Practical Nurse (LPN)',
  'Not sure yet',
];

const CONTACT_METHODS = ['Call', 'Text', 'Email'];
const EXPERIENCE = ['None yet', 'Less than 1 year', '1 to 2 years', '3 to 5 years', 'More than 5 years'];
const HEARD = ['Indeed or another job site', 'Facebook', 'Google', 'A friend or family member', 'Someone who works here', 'Other'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SHIFTS = ['Mornings', 'Afternoons', 'Evenings', 'Overnights'];
const CERTS = ['CNA', 'HHA', 'RN', 'LPN', 'CPR', 'Other'];

export const FILE_RULES = {
  maxFiles: 5,
  maxBytesEach: 10 * 1024 * 1024,
  maxBytesTotal: 20 * 1024 * 1024,
  extensions: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'heic'],
};

const text = (max) => ({ kind: 'text', max });
const choice = (options) => ({ kind: 'choice', options });
const many = (options) => ({ kind: 'many', options });

const NAME = { name: 'name', ...text(120), required: 'Please tell us your name.' };
const PHONE = { name: 'phone', kind: 'phone', required: 'Please add a phone number.' };
const EMAIL = { name: 'email', kind: 'email', required: 'Please add an email address so we can reply.' };
const MESSAGE = { name: 'message', ...text(5000) };

// Fields in the order they appear on the form and in the email.
export const FORMS = {
  care: [
    NAME, PHONE, EMAIL,
    { name: 'contact_method', ...choice(CONTACT_METHODS) },
    { name: 'service', ...choice(SERVICES), required: 'Please choose the service you need.' },
    MESSAGE,
  ],
  referral: [
    NAME,
    { name: 'organization', ...text(160), required: 'Please add your organization.' },
    { name: 'role', ...text(120) },
    PHONE, EMAIL, MESSAGE,
    { name: 'files', kind: 'files' },
  ],
  general: [
    NAME, PHONE, EMAIL,
    { ...MESSAGE, required: 'Please write your message.' },
  ],
  job: [
    NAME, PHONE, EMAIL,
    { name: 'position', ...choice(POSITIONS), required: 'Please choose a position.' },
    { name: 'days', ...many(DAYS) },
    { name: 'shifts', ...many(SHIFTS) },
    { name: 'experience', ...choice(EXPERIENCE) },
    { name: 'certifications', ...many(CERTS) },
    { name: 'transport', ...choice(['Yes', 'No']) },
    { name: 'consent', ...choice(['Yes']), required: 'Please confirm you consent to a background check.' },
    { name: 'heard', ...choice(HEARD) },
    { name: 'resume', kind: 'files', maxFiles: 1 },
  ],
};

// contact form topic -> form type; the careers form is always "job"
export function formType(data) {
  if (data.get('form_name') === 'careers') return 'job';
  const topic = String(data.get('topic') || '');
  return ['care', 'referral', 'general'].includes(topic) ? topic : null;
}

const clean = (v) => String(v ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();

export function validate(type, data) {
  const values = {};
  const errors = {};
  const files = [];

  for (const field of FORMS[type]) {
    const { name } = field;

    if (field.kind === 'files') {
      const picked = data.getAll(name).filter((f) => f && typeof f === 'object' && f.size > 0);
      const limit = field.maxFiles || FILE_RULES.maxFiles;
      if (picked.length > limit) { errors[name] = `Please attach no more than ${limit} file${limit > 1 ? 's' : ''}.`; continue; }
      let total = 0;
      for (const f of picked) {
        const ext = (f.name.split('.').pop() || '').toLowerCase();
        if (!FILE_RULES.extensions.includes(ext)) { errors[name] = `${f.name} is not a supported file type.`; break; }
        if (f.size > FILE_RULES.maxBytesEach) { errors[name] = `${f.name} is over 10 MB.`; break; }
        total += f.size;
      }
      if (!errors[name] && total > FILE_RULES.maxBytesTotal) errors[name] = 'Attachments add up to more than 20 MB.';
      if (!errors[name]) files.push(...picked.map((f) => ({ field: name, file: f })));
      if (picked.length) values[name] = picked.map((f) => f.name);
      continue;
    }

    if (field.kind === 'many') {
      const picked = data.getAll(name).map(clean).filter(Boolean);
      const bad = picked.find((v) => !field.options.includes(v));
      if (bad) errors[name] = 'Please choose from the list.';
      else if (picked.length) values[name] = picked;
      continue;
    }

    const value = clean(data.get(name));
    if (!value) {
      if (field.required) errors[name] = field.required;
      continue;
    }

    if (field.kind === 'text' && value.length > field.max) errors[name] = `Please keep this under ${field.max} characters.`;
    else if (field.kind === 'choice' && !field.options.includes(value)) errors[name] = 'Please choose from the list.';
    else if (field.kind === 'email' && !/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/.test(value)) errors[name] = 'That email address does not look complete.';
    else if (field.kind === 'phone') {
      const digits = value.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15 || value.length > 30) errors[name] = 'Please include the area code.';
    }
    if (!errors[name]) values[name] = value;
  }

  return { values, errors, files };
}
