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
- No animations in any module (for now).
- Never mention any agency or company identity anywhere: no "WLIQ", "Rivulet" etc. in class names, labels, comments, file names or meta.json.
- Fonts: primary = Google font; secondary = custom uploaded font (theme fields: family name + woff2/woff file fields for regular/bold, output as @font-face).

CSS RULES
- module.css stays EMPTY in every module.
- Field-driven CSS (values editors can change) goes in module.html inside {% scope_css %} / {% require_css %}.
- All static CSS goes into ONE shared theme stylesheet, so no CSS is duplicated across modules.
- Files the HubSpot boilerplate itself keeps split stay split; everything we write goes into the one shared file. (Assumption, please confirm.)
- Selector naming: each module has one main section class; everything is scoped under it, e.g. .hero-banner .hero-title. No identity prefixes.
- CSS written as single-line rules per selector block; no CSS comments.
- All colors/fonts/spacing use CSS variables from theme settings, never hard-coded values.

DESIGN TOKENS (theme fields.json → CSS variables in :root)
- Colors: primary, secondary, accent, heading, text, muted, border, light bg, dark bg, white
- Typography: heading + body font, H1–H6 and body sizes (desktop + mobile), line heights, weights
- Buttons: primary / secondary / outline — bg, text, border, hover, radius, padding
- Layout: container width, gutter, section padding S/M/L, card radius, shadow
- Breakpoints: match the Luma theme's current breakpoints

BASE MODULE (clone-ready template for every new module)
Content tab: eyebrow, heading + heading tag selector (H1–H6/p), rich text description, image (alt + lazy/eager), buttons repeater (primary/secondary/outline/text link, link, new tab, aria-label)
Style tab: color scheme (Light/Dark/Brand), background (none/color/image + overlay opacity), padding top/bottom (S/M/L/custom per breakpoint), content width (container/narrow/full), content alignment, text alignment desktop/mobile
Advanced tab: section ID (anchor), custom class, hide on desktop/tablet/mobile, show/hide toggle
Files: module.html (main section class + scope_css for field values), module.css (empty), module.js (stub with instance-scoped data-* init guard, no IIFE, no DOMContentLoaded), meta.json (neutral label), fields.json (max 5 nesting levels; use advanced_visibility)
README clone checklist: rename folder + label, rename main section class, remove unused fields, add CSS to shared stylesheet, test all 3 color schemes.

PLANNED MODULES (generalized from Luma)
- Header: option for Mega menu OR Simple hover dropdown (keep both until requirements confirm)
- Hero: layouts split / boxed (no animation)
- Cards Grid: 2/3/4 columns, icon / image / number variants
- Bento Grid
- Comparison Table: vertical / horizontal orientation
- Slider: testimonial / feature / logo modes
- Accordion: default / stat / image
- Timeline
- HubDB Listing: table ID + columns_to_fetch as module fields (no hard-coded IDs)
- Blog post template + TOC
- Utilities: rich text, CTA banner, spacer, divider
Plus templates (page, landing, blog listing/post, system pages) and header/footer partials.

CODING CONVENTIONS & HUBSPOT GOTCHAS
- Ask clarifying questions before writing code on complex tasks.
- Targeted, additive changes only; nothing outside the explicit scope changes.
- I edit files on disk between turns: always re-read the current files (and the wider theme) before editing, and build on my changes.
- Module JS scoped per instance with data-* init guards.
- Swiper.js is loaded globally (no CDN import); use watchOverflow: true and set loop per breakpoint based on slide count vs slidesPerView.
- fields.json groups nest max 5 levels; use advanced_visibility with boolean_operator AND to avoid extra depth.
- HubDB: list every needed column in columns_to_fetch; row identity is hs_id (not .id); multiselect values need .label.
- HubL {% set %} inside {% for %} doesn't persist outside; use selectattr pre-filtering or namespace().
- dnd_module IDs are unpredictable; use static named {% module %} tags for template-scope field access.
- outline on full-bleed buttons needs outline-offset: -2px or inset box-shadow.

WORKFLOW
- Tool: VS Code + Claude Code (terminal), working directly in the theme folder.
- Git repo for custom-boilerplate/; deploy with hs cms upload to the dev/sandbox portal only.

PHASES
1. Audit: inventory every Luma module (keep & generalize / merge / HubDB-template) + extract every hard-coded color, font and spacing value into a token list. I approve before development.
2. Foundation: theme settings, shared CSS, templates, partials.
3. Base Module.
4. Core modules.
5. Advanced modules (bento, table, timeline, HubDB listing, blog + TOC, header).
6. Re-skin test: change settings to a different brand; the whole site must re-skin with zero code edits.
7. README + Claude skill for the team.

PENDING FROM ME
- Local folder structure of the copied Luma theme
- Dev/sandbox HubSpot portal

START: Confirm you understand the plan, flag anything unclear, then wait for my folder structure before starting Phase 1.