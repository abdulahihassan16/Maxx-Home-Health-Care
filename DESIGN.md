# Design

## Visual Theme

**Lane: Minnesota state-park interpretive signage.**

Not a healthcare site, not a magazine, not a SaaS landing page. The reference is the physical object you stand in front of at a trailhead: warm paper stock, deep forest green for every action, a civic blue for every fact, amber for hours and status, a sturdy serif on the interpretive panel and a hyperlegible sans for the practical information underneath. Weathered, public, built to be read outdoors by anyone.

That reference does three things at once. It keeps the client's green and blue without going clinical — green on warm paper reads garden, green on cold grey reads hospital. It justifies a serif that is warm rather than literary. And it is nowhere near the modal home-care page, which is a stock photo of clasped hands over a blue gradient.

**The inverse test.** A competitor would describe theirs as "a warm, professional home care site with a clean modern design and clear calls to action." Ours: "a Minnesota home care agency built like a trailhead panel — warm paper, forest green for every action, civic blue for every fact, and a body face engineered for low-vision readers because that is who reads it." Those are not the same sentence.

**Texture.** Paper grain at 2.5% across the whole base so the surface reads as stock rather than screen. No watermarks: the placeholder mark rendered as grey text inside empty-looking bands, so both were removed. The arch (a doorway or window frame) is the one recurring shape: doorways on the homepage, portrait frames for people.

## Color

**Strategy: Full palette.** Four named roles, each with exactly one job. Not restrained — the brand has two committed colours and the page uses them as signal, not garnish.

| Token | Hex | Role | Measured on base |
|---|---|---|---|
| `--paper` | `#FAF8F2` | Page base | — |
| `--surface` | `#FFFFFF` | Cards, elevated panels | — |
| `--oat` | `#EDE7DA` | Section bands, subtle fills | — |
| `--leaf` | `#3F6410` | **Action.** Primary buttons, active nav, the word "home" in the H1 | 6.5:1 · 6.9:1 under white |
| `--leaf-deep` | `#2F5A12` | Button hover | 7.63:1 |
| `--maxx-green` | `#6FB107` | **Shape only.** Hero blob, the hand-drawn underline, quote marks, connector | 2.48:1 ⚠ |
| `--blue` | `#0063AE` | **Fact.** Links, trust marks, insurance band, focus ring | 5.82:1 · 6.18:1 under white |
| `--sky` | `#EAF2F9` | Insurance band background | — |
| `--amber` | `#A85E1A` | **Time.** Hours, open/closed, announcement dot | 4.62:1 |
| `--ink` | `#1F1D18` | Headings and body | 15.85:1 |
| `--stone` | `#5C5850` | Supporting copy, captions | 6.67:1 |

**The green rule, enforced.** `--maxx-green` never appears below roughly 80px, never carries meaning, and never sits under white text. Every functional icon uses `--leaf` instead, which is the same brand family and actually visible. Green is reserved for: the hero blob (12%), the hand-drawn underline (one word per page), oversized quote marks, and the dotted connector in the contact page steps. This is a departure from the brief's "large Maxx-green icon" in the trust strip and screening grid — at 32px on cream that green washes out badly, and the brief's own constraint says green is shape, not signal.

**Never** put leaf on blue or blue on leaf. They compete. Warm paper and oat carry roughly 80% of the surface.

## Typography

**Headings — Literata**, variable, self-hosted, latin + latin-ext. A slab-inflected serif drawn for long-form screen reading with a generous x-height. Holds at 64px and at 20px. 400 for display, 600 for section headings. Optical size axis driven by size.

**Body — Atkinson Hyperlegible Next**, variable, self-hosted. Engineered by the Braille Institute for low-vision readers: wide apertures, disambiguated `I/l/1` and `O/0`. This is a functional choice for this audience before it is a stylistic one, and it is a genuine thing to tell the client.

The pair contrasts on a real axis — slab serif against a humanist sans built for disambiguation — rather than being two similar sans faces.

**Scale**
- Body floor 18px. 20px in the section addressed to the care recipient.
- Line height 1.7 body, 1.1 display, 1.15 section headings.
- Measure capped at 68 characters.
- `clamp()` on headings, H1 topping at 64px desktop / 38px mobile.
- Letterspacing `-0.02em` display, `0` body, `0.12em` on the two surviving eyebrows.

**Eyebrow cadence.** One per page, never per section: `SERVING ROCHESTER & OLMSTED COUNTY, MN` in the homepage hero, and one in each inner page hero, where it carries place or program (`COMMUNITY FIRST SERVICES AND SUPPORTS (CFSS)`, `CAREERS · ROCHESTER, MN`). Section headings below carry no kicker; they describe themselves.

## Layout

- Container `min(100% - 2×gutter, 76rem)`. Gutter `clamp(1.25rem, 4vw, 3rem)`.
- Band rhythm alternates paper → oat → paper → sky → leaf so no two adjacent sections share a ground.
- **The homepage is a preview, seven blocks, under 5,000px at 1440px.** Hero, doorways, services, paying for care, who we are, one testimonial, final call to action. Everything else lives on the page that owns it.
- **Hero breaks the container.** 88vh target, roughly 52/48, right column bleeding to the viewport edge, radius on the left edge only. A testimonial card overlaps the seam between the columns — that overlap is what separates this from a template.
- **Doorways, not cards.** The three "how can we help" choices are arches: a door frame over a photograph, with a warm amber light that spreads from the threshold on hover or focus. The whole doorway is the link.
- **Services are an editorial list.** Six names set large in Literata, two columns, thin oat rules. The one-line description slides in on hover and focus into space that is always reserved, so nothing moves. On touch screens the descriptions are always shown.
- Cards are used only where a card is genuinely the affordance: the two testimonials on About, and form panels.
- **Phones are not one long column.** Short parallel items sit two across, and an odd one out centres beneath them (doorways, steps, team, screening, footer links). Long-form reading and the services list stay single-column.
- Semantic z-index scale, no arbitrary values.

## Motion

Slow and gentle. Nothing bouncy, nothing flashing.

- **The signature is a hand-drawn underline**, drawn like a pen stroke under one word per page (`drawUnderline()` in main.js). Slow start, quick middle, easing into a small upward flick. Home: "home" in the hero, "family" in the final band (on scroll). Inner pages: one word in the H1, on load.
- **The homepage lands once.** Eyebrow, then the headline rising line by line from behind masks, then "home" set down from above into its slot (800ms, no overshoot), the underline, the photo opening from the bottom like a window, then subhead, buttons, trust row and the two floating cards. Done by about 2.2s. Buttons are clickable from the first frame.
- **No scroll reveals.** Nothing is hidden waiting for a scroll trigger, so full-page captures, background tabs and slow phones always see every section.
- Pre-animation states exist only under `html.js-anim`, set in the head when motion is welcome. Without JavaScript, or with `prefers-reduced-motion`, everything renders in its final state with the underline already drawn.

## Components

- **Buttons** — 999px pill. Primary: leaf fill, white text, 18/34 padding in the hero so its mass balances the H1. Secondary: 1.5px ink outline. Minimum 3.25rem tall, 3.5rem on mobile.
- **Focus ring** — 3px `--blue`, 2px offset, inverted to paper on dark bands. Everywhere, no exceptions.
- **Arch frame** — `.arch-photo`: an exact semicircle over a 4:5 frame, reused for every portrait.
- **Photo slots** — labelled warm panels where the client's photographs will drop in. No stock, no generated imagery. Radius 20px, warm shadow `rgba(31,29,24,0.10)` only.
- **`[VERIFY]` flags** — dashed inline chips marking every unverified claim. `body.verify-off` hides them all for a clean preview.
- **Announcement bar, sticky header with condensing logo, right-slide mobile drawer with focus trap, fixed mobile action bar after 400px.**

## Constraints

- No emoji anywhere in the markup. All icons are inline SVG inheriting `currentColor`.
- No gradient text, no glassmorphism, no side-stripe borders, no hero-metric template.
- Every photograph position is a labelled slot until the client supplies real photographs. No stock.
- Logo file arrives from the client at `assets/img/logo.svg`; a marked placeholder holds the position until then.
