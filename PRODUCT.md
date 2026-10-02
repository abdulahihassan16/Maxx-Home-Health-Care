# Product

## Register

brand

## Users

Four readers arrive on the same page and must all be served without digging.

**The family decision-maker** — an adult child, 40 to 65, researching care for a parent. Anxious, comparing three or four agencies in one sitting, scanning for credentials and for an answer to "can I trust these people in my mother's house." Often will not phone a stranger, so a form path has to exist alongside the phone number.

**The care recipient** — an aging adult, or an adult with a disability or chronic condition, frequently reading the site themselves. May have reduced vision, unsteady hands, or a screen reader running. Almost every home care site talks *about* this person and never *to* them.

**The prospective caregiver** — a PCA, CNA, home health aide, or nurse looking for work. For an agency this size, recruitment matters as much as client acquisition, so they need a visible door from the homepage rather than a buried footer link.

**Case managers, discharge planners, and social workers** — lower volume, high value. They send referrals and want a fast, no-nonsense path with a file upload, because they send paperwork.

## Product Purpose

Replace a GoDaddy template that has one long scroll, generic stock photography, no displayed credentials, no careers path, and no differentiation between visitor types.

The content is not the problem — every fact on the current site is correct and must survive. The problem is that the content is not believable, not scannable, and not actionable. Success is a family that finds proof of trustworthiness above the fold, a care recipient who finds a paragraph addressed to them, and a caregiver who finds the job door without scrolling to the footer.

## Brand Personality

**Held, plain-spoken, rooted.**

The logo already carries the whole concept: a home, cradled in two hands. Held. The page should feel like that — steady, warm, not fussing over you.

Voice is plain, warm, direct. Sixth-grade reading level, short sentences, second person. "We'll help with bathing, dressing, and meals," never "comprehensive assistance with activities of daily living." Banned words: leverage, solutions, holistic care continuum, best-in-class, journey as a noun, state-of-the-art.

The emotional target is **relief**, not excitement. A visitor should feel their shoulders drop.

## Anti-references

- **The GoDaddy template this replaces.** One undifferentiated scroll, no credentials, no paths.
- **Hospital and clinic aesthetics.** Cold blue gradients, stethoscopes, sterile white, scrubs. This is a home, not a facility. Green on cold grey reads clinical; green on warm paper reads garden.
- **The modal home-care landing page.** Rounded-corner icon chips above every heading, a grid of six identical cards, a stock photograph of a smiling model holding an elderly hand, "Compassionate Care You Can Trust" set in Poppins.
- **Corporate healthcare SaaS.** Navy and teal, hero-metric templates, gradient text, glassmorphism.
- **Editorial-magazine affectation.** Display serif italic, drop caps, mono metadata labels, broadsheet grid. This brief is not magazine-shaped, and that lane is saturated.
- **Banned imagery specifically:** clinical settings, stethoscopes, blue-tinted anything, staged handshakes, obviously-modeled smiles.
- **Banned typefaces:** Inter, Poppins, Montserrat, Playfair Display, Lato, Open Sans, Raleway, Roboto, Nunito, DM Sans, Space Grotesk, Bricolage Grotesque, Fraunces, Newsreader.

## Design Principles

**1. Proof before persuasion.** A family comparing four agencies is scanning for evidence, not adjectives. Credentials, licensing, and background checks appear in the fold, not three screens down. Never publish an unverified trust claim — flag it and wait.

**2. Legibility is the product, not a constraint.** A meaningful share of readers have reduced vision. The body face is chosen for disambiguated letterforms, not for style. 18px floor, 1.7 line height, 200% zoom without breakage. This is a functional decision that happens to also be a real story to tell.

**3. Speak to the person, not only about them.** At least one section is addressed directly to the care recipient. This is the single thing that separates this site from its competitors, and it costs nothing.

**4. Three doors, not one hallway.** Family, referrer, and caregiver each get an explicit path from the fold. Making all three dig through the same funnel loses two of them.

**5. Colour is a job, not a decoration.** Every colour on this page has exactly one meaning: deep leaf means act, blue means fact, amber means time, brand green means shape. Nothing is tinted because it looked nice.

## Accessibility & Inclusion

WCAG 2.2 AA minimum, AAA on body text contrast where achievable. This is not a compliance checkbox — reduced vision, limited dexterity, and screen readers are the primary audience, not an edge case.

- 18px body floor, 20px in the section addressed to the care recipient
- Layout must hold at 200% browser zoom, tested explicitly
- 44×44px minimum tap targets, 56px on mobile
- Visible focus on everything focusable: 3px Maxx blue, 2px offset. Never `outline: none` without a replacement.
- Full keyboard operation including the services dropdown and mobile drawer
- Skip-to-content as the first focusable element
- Form errors announced through `aria-live` and tied to their inputs
- Colour never the sole carrier of meaning — always paired with an icon or a word
- **Brand green `#6FB107` measures 2.48:1 on the page base. It is a shape colour only** — never text, never a small meaningful icon, never a fill under white text.
- `prefers-reduced-motion` disables every transform
- VoiceOver and NVDA pass required before handoff
