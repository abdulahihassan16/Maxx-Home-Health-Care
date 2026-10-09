# Maxx Home Health Care LLC — website

Hand-coded, no framework, no build step. Serve the folder and it runs.

Built by Rocks Media.

Strategy lives in [PRODUCT.md](PRODUCT.md). The visual system lives in
[DESIGN.md](DESIGN.md). This file is the build and handoff notes.

---

## Run it

```bash
python -m http.server 4173
```

That server sends no cache headers and no compression. After editing, reload
with a changed query string (`index.html?x=1`) if the browser shows an old
copy. Every CSS, JS and intro file is already versioned with `?v=`.

---

## Files

```
index.html              Homepage: seven blocks, a preview that routes people.
about.html              Story, how we work with you, team, screening, trust, reviews.
services.html           One section per service (#home-care-nursing and so on).
cfss.html               CFSS explained, eligibility checklist, how to start.
insurance.html          Every accepted program in plain language.
careers.html            Benefits, open roles, how hiring works, application form.
contact.html            Phone, contact form, next steps, service area and map.
privacy.html            Site privacy policy (noindex until legal review).
hipaa.html              How to get the HIPAA notice (noindex until supplied).
accessibility.html      Accessibility statement.
assets/css/style.css    One stylesheet, sectioned and commented.
assets/js/main.js       One script, no dependencies.
assets/intro/           First-visit logo intro: video, frames, intro.css, intro.js.
assets/fonts/           Literata + Atkinson Hyperlegible Next, self-hosted.
assets/img/             Logo placeholders. Photographs go here.
sitemap.xml, robots.txt
_v1-backup/             The first build, kept for comparison.
```

The header, footer, mobile call bar and cookie notice are repeated in every
page (there is no build step to share them). A change to one of them has to
be made in all ten files.

---

## The homepage

Seven blocks, in this order: hero, "How can we help you today?" doorways,
services, paying for care, who we are, one testimonial, final call to action.
4,941px tall at 1440px wide. Every block is shorter than one screen.

Everything that used to live further down the homepage moved to the page that
owns it. Nothing was deleted: every item from the original site is on exactly
one page (footer details and the announcement bar are on every page).

### How it lands

The headline rises line by line from behind masks, then the word "home" is
set down from above into its place, then its underline draws itself like a
pen stroke. The photo opens from the bottom like a window, and the rest
follows. Done by about 2.2 seconds. Buttons work from the first frame.

On a first visit the logo intro plays first and the landing starts 150ms
before it lifts away. Without the intro it starts when the fonts are ready,
never more than 300ms after load.

With reduced motion switched on, or without JavaScript, the page simply shows
in its final state, underline already drawn.

### The underline

The one recurring motion on the site: a hand-drawn green stroke under one
word per page. Home: "home" (on load) and "family" (when the final band
scrolls into view). About "Maxx", Services "you", CFSS "choose", Insurance
"afford", Careers "respects", Contact "talk". To add it to a word:

```html
<span class="uword" data-draw="load">word<svg class="scribble" …></svg></span>
```

`data-draw="load"` draws on page load, `"view"` when scrolled into view.
Copy the `<svg class="scribble">` from any page. Once per page, never more.

---

## The intro

`assets/intro/` holds the silent video encodes (MP4 and WebM, 1920 and 1280
wide, 48 to 151KB), the first and last frames, `intro.css` and `intro.js`.
Every duration and the playback rate are constants at the top of `intro.js`.

**`INTRO_EVERY_LOAD` is currently `true`** in the head of `index.html`, so the
intro plays on every reload for review. **Set it to `false` before launch** so
visitors see it once per session.

Keyboard focus is left at the top of the page, so the first Tab reaches the
skip link. The first version moved focus there with a script, which painted
the skip link over the logo for every visitor; that was removed.

---

## Before launch

**Must do**

- [x] `INTRO_EVERY_LOAD` is `false`: the intro plays once per visit.
- [ ] **Switch on form emails**: follow "Form emails → One-time setup" below.
- [ ] **Turn on compression at the host** (gzip or Brotli for HTML, CSS, JS,
      SVG). Every normal host does this by default. It is what keeps mobile
      LCP under 2.5s; see the results below.
- [x] Logo, favicon, app icons, and the link-preview image (`og-image.jpg`) are in.
- [x] No photo placeholders remain on any page.
- [ ] **Clear the `[VERIFY]` flags** (list below), then add
      `class="verify-off"` to `<body>` to hide any that remain.
- [ ] **Confirm the domain and URL style.** Canonicals and the sitemap use
      `https://www.maxxhomehealthcarellc.com/about.html`. If the host serves
      clean URLs (`/about`), change both to match.

**Should do**

- [ ] Move off the gmail address to `info@` on the real domain (every page's
      footer, the contact page, the structured data, the legal pages).
- [ ] Test with a real screen reader (VoiceOver, NVDA).
- [ ] Run Lighthouse again on the live host with the real hero photograph.

---

## The logo

Built from the client's artwork as a horizontal lockup (mark left, the name
on two lines beside it), background removed, exported at 3× for sharp screens.

| File | Used for | Size on screen |
|---|---|---|
| `assets/img/logo.webp` | Header, mobile menu | 56px tall desktop, 46px ≤640px, 40px ≤400px; condenses to ~46px on scroll |
| `assets/img/logo-cream.webp` | Dark footer: light text, cream fill in the window and hand gaps | 56px tall |

Both are raster, traced from a flattened image. If the client has the
original vector files (SVG, AI or EPS), swap them in for crisper edges. The
old `logo.svg`, `logo-cream.svg` and `logo-mark.svg` placeholders are no
longer used. The favicon set still needs generating from the mark.

---

## Photographs

**The hero photograph is in** (`assets/img/hero-800.webp`, `hero-1200.webp`,
supplied by the client). It reads as a stock image: confirm the licence
covers use on this site, and swap in real Maxx staff when possible.

Still labelled slots:

- Home: hero testimonial thumbnail, the three doorway arches, the
  "Who we are" arch portrait.
- About: founder arch portrait, three team portraits.
- CFSS: a support worker with a client at home.
- Social image `assets/img/og-image.jpg`, 1200×630.

To go live, replace the slot's label with an `<img>` and drop `photo--slot`.
Always set `width` and `height`. Use `loading="lazy"` below the fold and
`fetchpriority="high"` on the hero photo only. Real alt text: who is in it
and what they are doing.

---

## Content source of truth

All business information comes from the current site, maxxhomehealthcarellc.com
(Home, About, CFSS, Home Care Services, Insurance). It was first carried over
sentence by sentence and checked with a script; the long paragraphs were then
shortened on purpose so they read easily on a phone. The facts are unchanged
(services, insurance plans, contact details, hours, CFSS details, testimonials),
but the wording is no longer word for word with the old site.

- **Insurance:** UCare, Blue Cross Blue Shield of Minnesota, Medica, South
  Country Health Alliance. (The current site shows these as logos only.)
- **Name:** "Maxx Home Healthcare LLC" for the business, as in the current
  site's footer, copyright and About. Paragraphs quoted from the current site
  keep their own "Maxx Home Health Care LLC" wording, and the logo artwork
  reads "Health Care". **Ask the client which spelling is legal.**
- **Service name:** the current site says "24-Hour Emergency Support" on its
  homepage and "24-Hour Emergency Services" on its services page. This build
  uses "Support" throughout.
- Content that is **not** on the current site (careers page, FAQs, CFSS
  eligibility and how-to-start, screening and trust claims, team) still needs
  the client's sign-off. The on-page `[VERIFY]` flags were removed for the
  client preview; the table below is now the only list of what to confirm.

## The `[VERIFY]` list

Every one is flagged on the page in amber. Do not publish an unverified claim.

| Where | Item |
|---|---|
| Home hero, About | Minnesota home care licence number |
| About | Founder and team photos, first names, one sentence each |
| About | The four screening claims, especially **employed, not contracted** |
| About | Link to the Google Business Profile for reviews |
| Services | "Who it's for" line for each of the six services |
| CFSS | "How to get started" routes (county/tribal nation vs. health plan) |
| Insurance FAQ | Private-pay hourly range or starting rate |
| Contact FAQ | Typical start window; which communities are served |
| Careers | The four benefits, current open roles, the five hiring steps |
| Footer | Fax `1-213-867-5203` is a Los Angeles area code; social profiles; "Website by Rocks Media" approval |
| Privacy, HIPAA, Accessibility | Legal review; the full HIPAA notice text; date of last accessibility review |

---

## Form emails

Every form posts to a Cloudflare Pages Function (`functions/api/submit.js`).
It checks the submission, then emails it to the office through **Resend**:

- **From** `Maxx Home Health Care Website <hello@maxxhomehealthcarellc.com>`
- **To** `maxxhomehealthcare@gmail.com`
- **Reply-To** the person who filled in the form, so hitting Reply in Gmail answers them.

Order of checks: request size, hidden honeypot field, rate limit (5 per
address per 10 minutes), Cloudflare Turnstile, then every field validated
again on the server. The visitor sees "Thank you" only after Resend accepts
the email; otherwise they get a friendly error with 507-884-8277.

| Form | Subject line | Heading |
|---|---|---|
| Care request | New care request: [Name] ([Service]) | Someone is requesting care |
| Referral | New referral from [Name, Organization] | New client referral |
| Job application | New job application: [Name] for [Position] | New job application |
| General question | New message from [Name] | New message from your website |

Templates: `functions/_shared/email.js`. Field rules: `functions/_shared/forms.js`.

### One-time setup (in this order)

**1. Resend.** Create an account, add the domain `maxxhomehealthcarellc.com`
(US region), and create an API key with "Sending access".

**2. DNS at Cloudflare** (the domain moved from GoDaddy to Cloudflare nameservers in October 2026; Resend records added there).
Add exactly what Resend's domain page shows. For the US region that is:

| Type | Name (host) | Value | Priority |
|---|---|---|---|
| TXT | `resend._domainkey` | the DKIM key Resend shows (`p=MIGf...`) | |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` | 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | |

Do **not** change anything else:

- **MX on the root** points to Microsoft 365 (`...mail.protection.outlook.com`). Leave it.
- **SPF on the root** (`v=spf1 include:secureserver.net -all`) stays as is.
  Resend sends with its own `send.` return path, so the root SPF doesn't need it.
- **DMARC already exists** (`_dmarc`: `p=reject; adkim=r; aspf=r`). Do not add
  a second one. Resend's mail passes it through DKIM. Because the policy is
  `reject`, inboxes refuse website emails until Resend shows the domain as
  **Verified**, so verify before switching the forms on.

**3. Turnstile.** Cloudflare dashboard → Turnstile → Add widget. Hostnames:
`maxxhomehealthcarellc.com` and the `*.pages.dev` preview address. Mode: Managed.
Put the **site key** in `assets/js/main.js` (`TURNSTILE_SITE_KEY`); the **secret**
goes in step 5.

**4. Rate-limit storage.** Cloudflare → Storage & Databases → KV → Create
namespace (`maxx-forms-rate-limit`). Then Pages project → Settings → Bindings →
KV namespace, variable name `RATE_LIMIT`.

**5. Variables.** Pages project → Settings → Variables and Secrets (Production):

| Name | Type | Value |
|---|---|---|
| `RESEND_API_KEY` | Secret | the Resend API key |
| `TURNSTILE_SECRET_KEY` | Secret | the Turnstile secret |
| `MAIL_TO` | Text | `maxxhomehealthcare@gmail.com` |
| `MAIL_FROM` | Text | `Maxx Home Health Care Website <hello@maxxhomehealthcarellc.com>` |
| `SITE_URL` | Text | the live address, e.g. `https://maxxhomehealthcarellc.com` (the email logo loads from here) |

**6. Redeploy** (any push to `main`), then send one test of each form.

### Testing locally

`.dev.vars` (git-ignored) holds local values, using Cloudflare's always-pass
Turnstile test secret and `RESEND_API_URL` pointed at a local stand-in:

```bash
npx wrangler pages dev . --port 8788 --kv RATE_LIMIT
```

### Health information

Care requests and referrals can contain health details and medical paperwork.
Resend and a personal Gmail inbox are not covered by a HIPAA Business
Associate Agreement. Moving the inbox to Google Workspace (with Google's BAA)
or a HIPAA-covered form service is worth raising with the client.

---

## What was verified

Measured, not assumed.

**Lighthouse, mobile, homepage**, served with gzip as a real host would:

| | LCP | CLS | Accessibility |
|---|---|---|---|
| With the intro | 2.16 – 2.28s | 0 | 100 |
| Without the intro | 1.96 – 1.98s | 0 | 100 |

Through the local `python -m http.server` (no compression) the same page
measures 2.7s with the intro and 2.4s without; that gap is what compression
is for.

**Landing sequence**, sampled frame by frame: eyebrow in by 300ms, lines up by
~800ms, "home" settled by ~1.35s, underline drawn 1.1–2.0s, photo open by
1.8s, cards in by 2.2s. Buttons have pointer events from frame one.

**Every page**: no console errors, no horizontal overflow at 375 or 1440px,
exactly one H1, `aria-current="page"` on the current nav item, and all 609
internal links resolve to a real page and anchor.

**Reduced motion and no JavaScript**: the homepage renders identically in its
final state (same height, underline drawn).

**Navigation**: clicking "Services" opens the services page; hovering or
tabbing onto it shows the list of services, Tab moves into it, and Escape
closes it.

**Attachments**: chosen files are listed with name, size and a Remove button
("Attachments (2)"). A second pick adds rather than replaces, duplicates are
ignored, files over 10 MB are refused with a message, and removed files are
not sent. The résumé field holds one file.

**Forms**: the job application flags name, email, phone, position and the
background-check consent on submit, focuses the first problem, and refuses
to fake success while the endpoint is unset. Inputs and selects are 56px.
`contact.html?type=referral&service=respite-care` preselects "Referring a
client" and fills the message with the service name.

### Fixed along the way

1. **The "dead space" bands.** Sections were hidden until scrolled into view,
   so full-page screenshots showed blank bands, with the placeholder logo
   watermark ("HOUSE + HANDS" as grey text) as the only thing visible. That is
   also why only two of four screening items and three of four careers pills
   appeared. Scroll reveals were removed entirely and both watermarks deleted.
2. **Button arrows** had no stroke and filled into solid triangles.
3. **`[VERIFY]` chips** were below contrast on the footer and the sky band.
4. **The sitemap** listed clean URLs the pages don't use, and included the
   two `noindex` legal pages.

---

## Notes on the build

**Privacy by default.** Nothing third-party loads before consent: the map
sits behind a click-to-load facade, and reCAPTCHA only loads after cookies
are accepted.

**Open/closed status** is calculated live in `America/Chicago`.

**Everything degrades.** With JavaScript off every page reads in full, every
phone link dials, FAQs open (native `<details>`), and nothing is hidden.

**Structured data.** The homepage carries the organization and local business.
Each inner page carries its own breadcrumb and an `FAQPage` containing only
the questions shown on that page.
