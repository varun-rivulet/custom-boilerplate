# Phase 1 Audit — Luma Phase 2 → Custom Boilerplate

Status: **approved**. All decisions are recorded in `CLAUDE.md` (that file wins if anything here disagrees).
Source theme (read-only): `Luma-Phase2-2026` — 661 files, 109 modules, 30 templates + 11 system templates.

## 1. Module mapping (109 Luma modules → boilerplate modules)

| Boilerplate module | Luma modules it replaces | Build notes |
|---|---|---|
| Base Module | Base_Module_2026 | Rebuild to the CLAUDE.md spec (Luma's lacks heading tag, image, color scheme, hide/show). |
| Header (mega / simple dropdown) | Header 2026, Header - New, menu | Both Luma headers are mega menus (2026: HubSpot menu + HubDB/blog featured items; New: repeater-built). Simple dropdown is based on the boilerplate menu module. Featured stories/events in mega panel become optional. One DOM for desktop + mobile where possible. |
| Footer | Footer 2026, social-follow | Contains a form. |
| Hero (split / boxed) | Center text, full photo, gradient, Box Logo, Animated-Image, With Client carousel float-top | Media options: image / logo strip. No animation. Text over image moves below image on mobile. |
| Hero "page header" layout + blog/HubDB templates | Customer/Resource/Podcast/Video/Unjargoned Listing heroes; Hero Blog, Hero Blog Index, Customer Stories Post (+ typo duplicate), News Post, Resource Post, Podcast Post Video (+ Wistia Test) | Podcast- and Video-Listing heroes are identical files. |
| Media + Text | Text Image Right/Left/Vertical/Small image left/Background Box/Right Text Card/Cards Two Col, patient stories, Orchestration 3 rows, Media feature (video), contact two col | Image/video left/right/top; card and background-box styles. |
| Form Section | CTA form right, CTA form full width two col, Hero - Form | Global theme form styling only. |
| Cards Grid (icon/image/number) | card highlight 3col, Use cases, stats card highlight, Value prop, How it works, Features section, Integration info 3 up, Stat cards horiz/vertical, Operational AI, Proof Point, Service locations, Featured Guests, press kit, card | Stat cards = number variant. Proof Point hover-expand dropped. |
| Bento Grid | Featured Content - Bento (+ backup), Event preview mason grid | Luma's bento fetches via serverless API → rebuild with manual content + HubL blog/HubDB. |
| Comparison Table | Table horizontal row, Table vertical col | Equal-height row JS currently in Luma main.js (reusable idea). |
| Slider (testimonial/feature/logo) | Testimonial Three Up, slider photo left, slider text only, Case Study Testimonial, Featured Content slider ×2, Client carousel, Customer stories selector, Security & trust info | Client carousel is a CSS marquee → static logo mode. Popups → native `<dialog>`. Init code in main.js only. |
| Accordion (default/stat/image) | FAQ ×3, Audience selector stacked, Audience selector vertical image, Audience List selector | Audience modules = image variant. aria-expanded required. |
| Timeline | Company Timeline | Heavy Luma content to strip; no animation. |
| HubDB Listing | Customer Listing (+ copy), Customer/News/Resources Category Listing, News Listing, Featured news, Related content cards, Product Specs ×2 | Table ID + columns_to_fetch as fields. Server-side HubL. |
| Blog listing / related posts / post + TOC | Blog Listing (+ backup), Blog Category Listing, Blog Related cards, Podcast/Video/Unjargoned All Post Listing, Podcast/Video Featured Listing (identical), Podcast/Video Related, Long-form Sub nav | Luma TOC logic (main.js "BLOG TOC" block) is a good reference. |
| Utilities | Long-form single col → rich text; CTA Contained / contained photo / text gradient / text large → CTA banner; button → base buttons; + divider | No spacer module. |
| Not carried over | pricing-card, Team members, Resource Download, Transcript; all backups/copies/tests; `sections/*`; templates qa-test, test, extra-modules | |

## 2. Token defaults (taken from Luma, mapped to boilerplate tokens)

### Colors
| Token | Default (Luma source) | Luma values it absorbs |
|---|---|---|
| primary | #FF6600 | tints #FF8533 #FFA366 #FFC299 #FFD2B6 #FFE8D0 #FFF5EA #FF4800 (use color_variant(), not new tokens) |
| secondary | #2C665E | tints #5B9D97 #7BC5CF #8FC0C7 #B3DEE4 #CCEAEE |
| accent | #FFA800 | #FFCE71 #FFC24D |
| heading / text | #1C1C1C | most-used color (178 CSS, 692 field defaults, 124 SVG fills → use currentColor) |
| muted | #666666 | #555555 #888888 #8A8A8A |
| border | #DFDBDB | #ABC2BF #447B74 (form field) #D1D6DC #CED4DB #DEE2E6 |
| light bg | #FFFDF7 | #DEF2F4 #FFF5EA #FFF3DB |
| dark bg | #14322E | #1A4A45 #091521 |
| white | #FFFFFF | |
| (dropped) | | HubSpot boilerplate greys #33475B #494A52 #2D3648 #7C98B6 #EBEFF3 #F8FAFC; one-offs #313199 #25257A |

### Typography
- Fonts: replace Luma's Adobe Typekit fonts (halyard-display / freight-text-pro) with primary Google font + secondary uploaded woff2/woff font; font-display: swap; max 2 families; load only used weights.
- Weights used: 300, 400, 500 (600/700/800 are one-offs).
- Line heights: H1 1.011, H2 1.071, H3 1.119, H4 1.117, body 1.4.
- Eyebrow: 16px, uppercase, weight 500, letter-spacing 1.6px.
- Sizes per tier: see CLAUDE.md (5 tiers, Luma values).
- Extra Luma sizes (display 140/120/100/80/60, lead 32/30/28/26/24, small 16): decide in Phase 2 whether to keep as optional tokens.

### Buttons (4 variants)
Defaults from Luma: radius 24px, padding 12px 32px, border 2px, font 16px; hover = transparent background with border color text.
primary = #FF6600, secondary = #2C665E, primary outline, secondary outline. Text link is a link style.

### Layout
- Container 1320 default (baseline range 1170–1320; Luma used 1340), gutter min 20px every tier.
- Gaps: 16px and 24px dominate.
- Spacing tokens: eyebrow→heading 16px, heading→content 24px, content→buttons 24px, button gap 16px.
- Card radius 4px default (8px forms/cards secondary, 48px large panels, 50% circles).
- Shadow: 0 2px 9px rgba(0,0,0,.2).
- Transition: color/background/border .3s ease (hover only).
- Section padding S/M/L and breakpoints: see CLAUDE.md.

## 3. Luma problems the rebuild must not repeat
- AOS animations in ~80 modules; Magnific popup; datepicker CSS — none carried over (Swiper only).
- 706 references to the Luma portal file manager, Luma domains, Typekit kit, hard-coded HubDB table IDs and portal ID in JS, Luma paths in partials.
- Serverless function `podcast-api.functions` contains a hard-coded private-app token → never copy; Luma owner should rotate it.
- 186 `!important`; z-index up to 1000000; focus styles commented out and 30 × outline:none; 411 inline styles; camelCase classes; 88 modules with free rich-text headings + 11 hard-coded `<h1>`; no image resizing/srcset; 70 mobile-first queries mixed into desktop-first CSS; 59 different media query strings; 16px button gap duplicated in 96 modules; undefined `pt-35` class.
- Already fine in Luma (keep doing): skip link, alt text, no clickable divs, no `<br><br>` spacing.

## 4. Phase 2 starting checklist (Foundation)
1. Create `theme/` (theme files only) — theme.json (label "Custom Boilerplate", neutral author), fields.json with the tokens above.
2. Shared stylesheet with :root variables, section-wise layout + per-section media queries, HubL `{# #}` section labels.
3. Keep boilerplate `_reset` / `_normalize` split.
4. Base layout: skip link, Google font + @font-face for uploaded font, Swiper + main.js (slider init with data-* guards).
5. Templates: page, landing, blog listing, blog post, system pages; header/footer global partials using static named `{% module %}` tags.
6. Needs from user: dev/sandbox portal.
