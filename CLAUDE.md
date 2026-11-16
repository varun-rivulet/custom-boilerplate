PROJECT: "Custom Boilerplate" — reusable HubSpot CMS theme

GOAL
Build one reusable HubSpot theme our team can clone for any new HubSpot client project. Re-skinning a new client should take hours, not days, by changing theme settings only (colors, fonts, spacing), with no code edits.

SOURCE & SAFETY RULES (strict)
- Luma reference path (read-only): C:\Varun\Practice-Work\Hubspot-practice\Theme Development\Luma-Phase2-2026
- Source reference: our existing Luma Phase 2 HubSpot theme. Treat it as READ-ONLY.
- Never modify, upload to, or touch the Luma project, its files, or its portal in any way.
- Work only on a separate copy in a new folder: custom-boilerplate/
- Remove all Luma content, text, images, HubDB IDs, URLs and brand references while generalizing.
- The boilerplate will be uploaded only to a separate dev/sandbox portal (I will provide it).

LOCKED DECISIONS
- Theme name: Custom Boilerplate
- No child themes. For each new client we clone the boilerplate and update it.
- Every module gets generalized. Nothing stays client-specific.
- No animations in any module (for now). Hover/focus color transitions (color, background, border) are allowed and do not count as animations.
- Never mention any agency or company identity anywhere: no "WLIQ", "Rivulet" etc. in class names, labels, comments, file names or meta.json.
- Fonts: primary = Google font; secondary = custom uploaded font (global "Site fonts" module: family name + woff2/woff file fields for 400/500, output as @font-face; see PHASE 2 DECISIONS). Loading the primary Google font via HubSpot's font field is an approved exception to baseline §7 self-hosting; still load only used weights with font-display: swap.

CSS RULES
- module.css stays EMPTY in every module.
- Field-driven CSS (values editors can change) goes in module.html inside {% scope_css %} / {% require_css %}.
- All static CSS goes into ONE shared theme stylesheet, so no CSS is duplicated across modules.
- Files the HubSpot boilerplate itself keeps split (_reset, _normalize) stay split; everything we write goes into the one shared file. (Confirmed.)
- Shared stylesheet is organized section-wise (one section per module/partial, in page display order), each section immediately followed by its own media queries, desktop-first, large → small.
- Selector naming: kebab-case; each module has one main section class and everything is scoped under it using the section name as prefix, e.g. .hero-banner .hero-banner-title, .hero-banner-item; state classes .is-active / .has-bg. No identity prefixes (no wl- prefix either).
- CSS written as single-line rules per selector block; no CSS comments in output. Use HubL comments {# Section name #} to label sections in the shared stylesheet (stripped from output). Same for module.html: {# #}, never <!-- -->.
- No !important; selector nesting max 3 levels; z-index in steps of 10, max 100.
- All colors/fonts/spacing use CSS variables from theme settings, never hard-coded values.

DESIGN TOKENS (theme fields.json → CSS variables in :root)
- Colors: primary, secondary, accent, heading, text, muted, border, light bg, dark bg, white
- Typography: heading + body font, line heights, weights; H1–H6 and body sizes as one theme field per breakpoint tier (no calculated sizes). Defaults = Luma values:
  Desktop / ≤1366.98 / ≤1200.98 / ≤991.98 / ≤767.98
  H1 85/72/64/56/48 · H2 56/52/48/44/40 · H3 42/40/38/36/36 · H4 34/32/30/28/26 · H5 24/22/22/20/20 · H6 20/20/18/18/18 · Body 18/18/18/16/16
- Buttons: 4 variants — primary, secondary, primary outline, secondary outline — bg, text, border, hover, radius, padding. Text link is a link style, not a button variant.
- Layout: container width, gutter (min 20px at every tier), section padding S/M/L, card radius, card shadow (none/small/medium/large), heading-to-content spacing, content-to-button spacing
  Section padding (Desktop & ≤1366.98 / ≤1200.98 / ≤991.98 / ≤767.98): S 72/65/58/52 · M (default) 100/80/60/50 · L 144/130/116/104
- Breakpoints (desktop-first, max-width): ≤1366.98 large laptop, ≤1200.98 laptop, ≤991.98 tablet, ≤767.98 mobile, plus ≤575.98 small-mobile fine-tune only (no own token values). Approved deviation from baseline §6 (which has 4 tiers). Minimum supported width 360px. Use no other breakpoints.

BASE MODULE (clone-ready template for every new module)
Content tab: eyebrow, heading + heading tag selector (H1–H6/p), rich text description, image (alt + lazy/eager), buttons repeater (primary/secondary/primary outline/secondary outline/text link, link, new tab, aria-label), then a collapsed "Advanced" group last: section ID (anchor), custom class, hide on desktop/tablet/mobile, show/hide toggle (it lives in the Content tab because HubSpot rejects text fields in the Style tab)
Style tab: color scheme (Light/Dark/Brand), background (none/color/image + overlay opacity; a background color is mandatory whenever an image is used), padding top/bottom (S/M/L/custom per breakpoint), content width (container/narrow/full), content alignment, text alignment desktop/mobile
Files: module.html (main section class + scope_css for field values), module.css (empty), module.js (stub with instance-scoped data-* init guard, no IIFE, no DOMContentLoaded), meta.json (neutral label), fields.json (max 5 nesting levels; use advanced_visibility)
README clone checklist: rename folder + label, rename main section class, remove unused fields, add CSS to shared stylesheet, test all 3 color schemes.

PLANNED MODULES (generalized from Luma)
- Header: option for Mega menu OR Simple hover dropdown (keep both until requirements confirm)
- Hero: layouts split / boxed (no animation); text placed over an image on desktop moves below the image on mobile
- Media + Text: image/video left / right / top, card and background-box styles (replaces Luma's text-image modules)
- Cards Grid: 2/3/4 columns, icon / image / number variants
- Bento Grid
- Comparison Table: vertical / horizontal orientation
- Slider: testimonial / feature / logo modes
- Accordion: default / stat / image
- Timeline
- HubDB Listing: table ID + columns_to_fetch as module fields (no hard-coded IDs)
- Blog post template + TOC
- Listings (HubDB and blog) render server-side with HubL (hubdb_table_rows, blog_recent_posts etc.); optional JS filtering only. No serverless functions and no API tokens in the theme.
- Form Section: HubSpot form with text content, layouts form right / form full-width two-column (replaces Luma's CTA form and Hero form modules); styled by the global theme form settings only.
- Utilities: rich text, CTA banner, divider (no spacer module: spacing comes from padding fields, never empty elements)
- Not carried over from Luma: pricing card, team members, resource download, transcript.
Plus templates (page, landing, blog listing/post, system pages) and header/footer partials.

CODING CONVENTIONS & HUBSPOT GOTCHAS
- Ask clarifying questions before writing code on complex tasks.
- Targeted, additive changes only; nothing outside the explicit scope changes.
- I edit files on disk between turns: always re-read the current files (and the wider theme) before editing, and build on my changes.
- Module JS scoped per instance with data-* init guards.
- Swiper.js is the only slider library; the theme's own swiper.js file is loaded globally (no CDN import). All slider init code lives in js/main.js only (slider modules have no module.js code): main.js finds sliders by data-* attributes and initializes each instance once with an init guard. Use watchOverflow: true and set loop per breakpoint based on slide count vs slidesPerView.
- fields.json groups nest max 5 levels; use advanced_visibility with boolean_operator AND to avoid extra depth.
- HubDB: list every needed column in columns_to_fetch; row identity is hs_id (not .id); multiselect values need .label.
- HubL {% set %} inside {% for %} doesn't persist outside; use selectattr pre-filtering or namespace().
- dnd_module IDs are unpredictable; use static named {% module %} tags for template-scope field access.
- outline on full-bleed buttons needs outline-offset: -2px or inset box-shadow.
- HubSpot field limits (upload validation): no text/file fields in a module's Style tab (put them in the Content tab); no field may be named "body" (use body_text); theme fields.json rejects text and file fields (use choice/number/color/font fields, or a global module for free text and files).

WORKFLOW
- Tool: VS Code + Claude Code (terminal), working directly in the theme folder.
- Git repo for custom-boilerplate/; deploy with hs cms upload to the dev/sandbox portal only.
- Test portal: HubSpot CLI account WLIQ (portal 51597413). Pass --account=WLIQ on every hs command; never rely on the CLI default account. Upload: hs cms upload theme custom-boilerplate --account=WLIQ

PHASES
1. Audit: inventory every Luma module (keep & generalize / merge / HubDB-template) + extract every hard-coded color, font and spacing value into a token list. I approve before development.
2. Foundation: theme settings, shared CSS, templates, partials.
3. Base Module.
4. Core modules.
5. Advanced modules (bento, table, timeline, HubDB listing, blog + TOC, header).
6. Re-skin test: change settings to a different brand; the whole site must re-skin with zero code edits.
7. README + Claude skill for the team.

PENDING FROM ME
- Nothing (test portal provided: see WORKFLOW)

REFERENCE DOCUMENTS
- docs/html-dev-baseline.docx — our HTML team development baseline (coding standards, CSS rules, checklists). Follow it for all code. Markdown copy with all comments: docs/html-dev-baseline.md.
- The doc has comments with suggested changes. Comments that are approved override the original text. Ask me before applying any comment you're unsure about.
- Comments C1–C7 are all approved. C3: CSS organized section-wise with each section's media queries right after it. C4: add heading-to-content and content-to-button spacing tokens. C7: pixel-perfect tolerance is 4–5px (overrides ±2–3px and the comment's own "5–8px"). Ignore the loose notes at the end of the baseline doc ("Outline svg", "Svg box shadow/gradient", "Email template content").
- Theme files live only in theme/. Never place docs or internal references inside theme/.

STATUS (resume here in a new session)
- Phase 1 (Audit): DONE and approved, on main. Full audit (module mapping, token defaults, Luma issues): docs/phase-1-audit.md.
- All decisions are recorded in this file; this file wins if docs/phase-1-audit.md disagrees.
- Phase 2 (Foundation): BUILT, committed on branch phase-2-foundation.
- Phase 3 (Base Module): BUILT, committed on branch phase-3-base-module (branched from phase-2-foundation). Clone checklist is in README.md ("Base Module clone checklist").
- HubSpot validation fixes (Advanced group moved to Content tab, body → body_text, Site fonts global module, card shadow choice) are on phase-3-base-module, and the theme uploads cleanly to the WLIQ test portal. Manual testing in the portal is NOT done yet.
- Do not merge any phase branch into main until the README "Sandbox test checklist" passes.
- Next: Phase 4 (core modules), each cloned from the Base Module by following the README clone checklist.

PHASE 2 DECISIONS (approved)
- Color defaults are a neutral palette, never a client's brand: primary #3B82F6, secondary #334155, accent #F59E0B, heading #0F172A, text #1F2937, muted #64748B, border #CBD5E1, light bg #F8FAFC, dark bg #0B1F3A, white #FFFFFF. (Replaces the Luma hex values in docs/phase-1-audit.md.) All default scheme text pairs pass 4.5:1 and outline borders 3:1; tightest pair heading-on-primary 4.85.
- Color schemes (Light/Dark/Brand) are choice fields that pick one of the 10 tokens (+ transparent for buttons), incl. per-variant button default/hover colors; max 4 group levels. Button radius/padding/font live in the global Buttons group.
- Form labels, help and error text use the scheme text color; error text gets an icon + wording. Input boxes keep one global style; input borders use muted (border token is decorative only).
- Fonts: primary Google = Inter (400/500). Secondary default = Source Serif 4 (OFL) built as static secondary-400/500 woff2+woff in theme/fonts/ with OFL.txt, internal name "Secondary". A client font is set in the global "Site fonts" module (theme/modules/site-fonts.module, hidden from drag-and-drop, placed in layouts/base.html so it applies to every template incl. blog and system pages): family name + Regular (400) / Medium (500) woff2/woff file fields. Output via require_css in <head>. If no file is set, it loads the bundled defaults via get_asset_url. If any file is set, the custom family replaces the default completely (approved: never mix families per weight; elements set to the secondary font get font-synthesis: none, so no faked weights; always request both 400 and 500 files from the client): @font-face only for weights that have files, empty src entries skipped, woff2 first then woff, font-display: swap, true weights 400/500. It overrides --font-secondary with html:root. An empty name or "Secondary" becomes "Secondary Custom". The fallback (serif/sans-serif) stays in theme settings (Typography → Secondary font). Tobi Pro is commercial: kept outside the repo in ../font-sources/, never committed.
- Card shadow is a theme choice field (Layout → Card shadow): none / small / medium / large, default small. main.css defines --shadow-sm/md/lg with the color from the heading token via color-mix(); --card-shadow points to the chosen one.
- Display/lead/small are optional type tokens with utility classes .text-display / .text-lead / .text-small.
- No membership templates for now.
- Swiper pinned to 14.3.0 (bundle build). Vendor files keep their MIT banners; the no-comments rule applies to our own code.