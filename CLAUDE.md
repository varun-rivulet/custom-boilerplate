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
- No animations in any module (for now). Hover/focus color transitions (color, background, border) are allowed and do not count as animations. Exception (approved, header only): the Header and Header – Simple modules animate (see HEADER ANIMATIONS).
- Never mention any agency or company identity anywhere: no "WLIQ", "Rivulet" etc. in class names, labels, comments, file names or meta.json.
- Fonts: primary = Google font; secondary = Peridot PE Variable from Adobe Fonts (kit link hard-coded in layouts/base.html; see PHASE 2 DECISIONS). Loading it from Adobe Fonts is an approved exception to baseline §7 self-hosting, like the Google font. Loading the primary Google font via HubSpot's font field is an approved exception to baseline §7 self-hosting; still load only used weights with font-display: swap.

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

DESIGN TOKENS (theme fields.json → CSS variables in :root). Theme settings follow Luma's settings STRUCTURE (groups, order, labels, field types) with our values and neutral names: Global colors, Global fonts, Spacing, Text, Text on dark backgrounds, Buttons Group, Forms, Website header, Website footer. Every color setting outside Global colors is a color picker that inherits a palette color (inherited_value property_value_paths) until changed.
- Colors (Global colors, 16, in this order): primary #3B82F6, text #1F2937, secondary #334155, white #FFFFFF, page_bg #F8FAFC (body background), heading #0F172A, dark #0B1F3A, secondary_tint_light #F1F5F9, secondary_tint #E2E8F0, accent_tint #FDE68A, primary_tint #DBEAFE, muted #64748B, accent #F59E0B, primary_dark #1D4ED8 (fixed, no inheritance; README: "When you change Primary, update Primary dark too"), highlight #D97706, border #CBD5E1 (decorative only). CSS: --color-<name with hyphens>.
- Fonts: Global fonts → primary (Google, Inter) and secondary (font_set ADOBE, peridot-pe-variable). Text group: H1–H6, Body, Links, Eyebrow each have a font field (family/weight/color; size and styles hidden) that inherits primary or secondary, plus transform (headings), per-tier sizes and a line height. No Display, Lead or Small styles (removed; small text such as form help text, blog meta and the footer bottom bar uses the eyebrow size). Defaults: headings Primary 500; body, links, eyebrow, buttons Secondary. CSS: --<style>-font/-weight/-synth (synth = style for non-Google fonts), --<h>-transform, --<h>-color, --lh-<style>.
- Typography sizes: H2–H6 and body sizes as one theme field per breakpoint tier (no calculated sizes). H1 is the one exception (approved): a single theme field "Size (largest)" (text.h1.size, default 85) output as --fs-h1: clamp(min, max/14.4 vw, max), where min = 55% of the value rounded (never below 40px, never above the value). It is full size at 1440px and wider and 47px at ≤767.98 with the default 85; no H1 media queries. Defaults for the other sizes = Luma values:
  Desktop / ≤1366.98 / ≤1200.98 / ≤991.98 / ≤767.98
  H1 85 (fluid, see above) · H2 56/52/48/44/40 · H3 42/40/38/36/36 · H4 34/32/30/28/26 · H5 24/22/22/20/20 · H6 20/20/18/18/18 · Body 18/18/18/16/16
- Buttons (Buttons Group): 9 variants in Luma's per-variant shape: primary, secondary, dark, white, accent, primary_outline, secondary_outline, white_outline, dark_outline → classes .btn-<name with hyphens>. Each variant: text (font, transform, line height, letter spacing), background color, border field, corner radius, spacing (desktop padding + mobile padding ≤767.98); hover text/background/border color/radius. No shared button group; the gap between buttons is Spacing → Button gap. Defaults: font Secondary 500 16px, line height 1.25, letter spacing 0, border 2, radius 24, padding 12/32, mobile 10/24, gap 16. Text link is a link style (Text → Links), not a button variant. All 9 + text link are offered in the Base Module button style; all 9 in the header button style.
- Spacing group: vertical spacing (dnd-section padding, default 0), maximum content width (default 1320), gutter (min 20px at every tier), section padding S/M/L, element spacing (eyebrow-heading, heading-content, content-button, paragraph, grid gap), button gap (default 16), card radius, image radius (--image-radius, default 4 = card radius default; applied through the utility class .img-radius on the image wrapper (.img-radius img); used by the Base Module image and the blog featured image; logos, icons, header/footer and rich-text images don't get the class). No narrow width setting: .container-narrow = 65% of the content width. No card shadow setting: --shadow-md is a static derived value (header dropdown).
- Text colors: light backgrounds use the Text style colors; "Text on dark backgrounds" group (heading, text, eyebrow, link, link hover) is used by Text color Light (class .text-color-light). Text color (Auto / Dark / Light) only affects text (heading, text, eyebrow, links), never buttons: every button, including the form submit, keeps the variant the editor selected on any background (no button swap, no "Buttons on dark backgrounds" setting). The button style help text (Base Module, header button, Forms → Submit button) and the README say: "On dark backgrounds, choose a suitable variant (e.g. White or White outline)." Forms: title (font, follows H5), labels (color, weight, gap), help text (color), fields (text, placeholder, background, border, radius, padding, gap), submit button style. Website header: menu text, drop-down text/background/border, background. Website footer: text, background (dividers = text at 25%).
  Section padding (Desktop & ≤1366.98 / ≤1200.98 / ≤991.98 / ≤767.98): S 72/65/58/40 · M (default) 100/80/60/40 · L 144/130/116/40 (mobile is 40px for all three presets)
- Breakpoints (desktop-first, max-width): ≤1366.98 large laptop, ≤1200.98 laptop, ≤991.98 tablet, ≤767.98 mobile, plus ≤575.98 small-mobile fine-tune only (no own token values). Approved deviation from baseline §6 (which has 4 tiers). Minimum supported width 360px. Use no other breakpoints.

BASE MODULE (clone-ready template for every new module)
Content tab: eyebrow, heading as rich text (limited toolbar: format H1–H6/paragraph, bold/italic, link; no heading tag field; empty check uses striptags|trim), rich text description, image (alt only; no size/loading controls; always loading="lazy", resized server-side to max 2× container width), buttons repeater (no maximum): each item is a link button (text, style: any of the 9 button variants or text link, link with new tab + rel options; no aria-label field: the accessible name is the visible text); it renders only with text and a URL (in the editor, a URL is not needed). HubSpot CTA buttons are an opt-in add-on (README "HubSpot CTA buttons (opt-in add-on)"), not part of the boilerplate: the cta field type needs CTA access (Content Hub Pro/Enterprise) and the whole upload fails in portals without it., then a collapsed "Advanced" group last: section ID (anchor), custom class, hide on desktop/tablet/mobile, show/hide toggle (it lives in the Content tab because HubSpot rejects text fields in the Style tab)
Style tab: Background group — type Color / Image / Gradient (empty = no background). Color: a HubSpot color picker (approved exception to the token-only color rule) (with opacity) that inherits theme.global_colors.dark until changed (inherited_value property_value_paths; HubL also falls back to the Dark token if it is empty); output per instance in scope_css as background-color (hex, or rgba when opacity < 100). Image: image + position (top/center/bottom) + overlay color (color picker with built-in opacity, inherits theme.global_colors.dark at 50%; no separate opacity field); no background color field — the overlay color is shown behind the image while it loads. Gradient: start/end color pickers (no opacity; inherit theme.global_colors.secondary / theme.global_colors.dark until changed) + direction; the end color is also the solid fallback. Text color Auto / Dark / Light. Auto: Color → the picked hex is blended with the page background (Page background color) by its opacity, its WCAG relative luminance is computed in HubL (convert_rgb, cubic sRGB approximation, no pow), and the text color (Body text color vs Text on dark backgrounds → Text) with the higher contrast wins; Image → the same hex calculation from the picked overlay color and opacity; Gradient → the same hex calculation for both picked colors: both want light text → light, otherwise dark (help text says to set mixed gradients manually). Spacing group — "Change spacing" toggle: off = theme default section padding (Medium, section-pt-m / section-pb-m); on = HubSpot spacing field per tier with all four padding sides: Desktop & ≤1366.98, ≤1200.98, ≤991.98, ≤767.98; an empty side keeps the larger tier value. Content align group — text alignment desktop + separate mobile, "Change custom width" toggle with px width (320px up to the theme container width; capped in code) + "Content block position" (left/center/right: where the narrower content block sits inside the container). No color scheme field. Content elements carry no classes: each is wrapped in a div with the class (e.g. <div class="section-title"><h2>), and h1–h6 use the same global sizes everywhere (no heading size overrides in wrappers).
Files: module.html (main section class + scope_css for field values), module.css (empty), module.js (always empty, so HubSpot loads no script; all JS lives in js/main.js, see JS RULE), meta.json (neutral label), fields.json (max 5 nesting levels; use advanced_visibility)
README clone checklist: rename folder + label, rename main section class, remove unused fields, add CSS to shared stylesheet, test text color Auto / Dark / Light on light, dark, image and gradient backgrounds.

PLANNED MODULES (generalized from Luma)
- Header: option for Mega menu OR Simple hover dropdown (keep both until requirements confirm). Plus Header – Simple (logo + header button, no navigation) for the landing page template.
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

JS RULE (approved)
- No module.js unless truly unavoidable: every module's module.js stays empty. All JS lives in the shared js/main.js, one init function per module, found by a data-<module> hook on the section/element, with an instance-scoped data-* init guard (one init per element), no IIFE, no DOMContentLoaded. main.js is loaded in the footer. Header and Header – Simple share one init (initSiteHeader, hook data-site-header).

LABEL RULE (approved)
- Modules carry no editor fields whose only job is a label for screen readers or a translated fixed string (no "Accessibility labels" groups, no per-button aria-label field, no logo fallback alt field, no "Other" social name field). Where WCAG needs an accessible name, the code has a fixed one (nav landmarks "Main navigation"/"Footer"/"Legal", menu button "Menu", submenu toggle "<item> submenu"); visible text is the accessible name of links and buttons. Logo alt = the image field's alt, fallback "Home" in code (unlinked footer logo: empty alt). No label="..." on {% module %} tags in partials, no long explanatory HubL comments (short {# Section name #} labels only). Kept: meta.json label (neutral), field labels in fields.json, {# Section #} comments, template header label comments.

HEADER ANIMATIONS (approved exception to the no-animation rule, header only)
- Menu link hover: a 2px currentColor bar (::after) grows from the left (scaleX 0 → 1, .25s ease) on hover, keyboard focus, open parent and the active page. Simple dropdown and Mega panel: fade + 8px slide down, .25s ease (opacity/transform/visibility, so hidden panels are not focusable). Mega only: page overlay fades in (.25s, color-mix of --color-dark at 50%); a click on it closes the menu. Mobile (≤991.98): full-width panel fixed under the header slides in from the left (.35s ease), the page scroll is locked, the toggle icons crossfade/rotate (.2s). prefers-reduced-motion: reduce turns all of it off. While the window is being resized, main.js sets html.is-resizing (removed 150ms after the last resize event) and the header transitions are off, so nothing animates when crossing the breakpoint. CSS in main.css, JS in main.js (data-site-header, data-mega). Everything uses theme variables.

HEADER/FOOTER EDITING (approved)
- Header, Header – Simple and Footer are regular (non-global) modules inside global partials (meta.json "global": false), so editors reach the content in one click and it is still shared site-wide. Sticky header: toggle in the Style tab (default off); base.html wraps the header block in <div class="site-header-wrap"> (outside HubSpot's own partial wrapper); main.js adds .is-sticky to it and sets --site-header-height; html uses it as scroll-padding-top and the open mobile menu scrolls. Footer spacing uses the Base Module's "Change spacing" group (off = section-pt-m / section-pb-m).

CODING CONVENTIONS & HUBSPOT GOTCHAS
- Ask clarifying questions before writing code on complex tasks.
- Targeted, additive changes only; nothing outside the explicit scope changes.
- I edit files on disk between turns: always re-read the current files (and the wider theme) before editing, and build on my changes.
- Module JS scoped per instance with data-* init guards.
- Swiper.js is the only slider library; the theme's own swiper.js file is loaded globally (no CDN import). All slider init code lives in js/main.js only (no module has module.js code): main.js finds sliders by data-* attributes and initializes each instance once with an init guard. Use watchOverflow: true and set loop per breakpoint based on slide count vs slidesPerView.
- fields.json groups nest max 5 levels; use advanced_visibility with boolean_operator AND to avoid extra depth.
- HubDB: list every needed column in columns_to_fetch; row identity is hs_id (not .id); multiselect values need .label.
- HubL {% set %} inside {% for %} doesn't persist outside; use selectattr pre-filtering or namespace().
- dnd_module IDs are unpredictable; use static named {% module %} tags for template-scope field access.
- outline on full-bleed buttons needs outline-offset: -2px or inset box-shadow.
- UI headings (e.g. footer columns) are sized via their wrapper; content headings use the global h1–h6 sizes. Example: footer column, contact and social headings stay semantic (<h2> by default) inside <div class="site-footer-col-title">, styled at the H6 size through .site-footer .site-footer-col-title h2/h3/h4/p.
- HubSpot field limits (upload validation): no text/file fields in a module's Style tab (put them in the Content tab); no field may be named "body" (use body_text); theme fields.json rejects text and file fields (use choice/number/color/font fields, or a global module for free text and files). A field may not be named "label" either. The "cta" field type fails the upload in portals without CTA access ("Account must be upgraded to use cta field type"), so it is never in the boilerplate.

WORKFLOW
- Tool: VS Code + Claude Code (terminal), working directly in the theme folder.
- Git repo for custom-boilerplate/; deploy with hs cms upload to the dev/sandbox portal only.
- Test portal: portal 51597413 (CLI account name wliq). Always pass --account=51597413 (the portal ID) on every hs command, never the account name: hs silently falls back to the default account when a name doesn't match. Never rely on the CLI default account. Upload (from the repo root): hs cms upload theme custom-boilerplate --account=51597413
- QA harness (qa/, see qa/README.md): npm run qa = upload → seed → republish → Playwright → report + README status block. API token in .env (HUBSPOT_QA_TOKEN; never print, log, commit or upload it). The harness only updates/publishes objects it created, tracked by ID in qa/.state/created.json; names "QA – Auto …" (QA_PREFIX constant, en dash) and qa-auto- slugs are extra checks; first run in a portal is a dry run. Never delete or change content the harness didn't create without the user's explicit OK.
- Browser automation in the HubSpot app (qa/setup/ui.js, headed Chromium, profile in qa/.auth/, the user logs in; never handle the password): allowed hosts are exactly app.hubspot.com and app-na2.hubspot.com (this portal lives on NA2), https only. Before every action the URL must carry portal 51597413 (first number in the path, or portalId/hubId in the query); any other portal or host stops immediately and is reported. Screenshot every setup step.

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
- HubSpot validation fixes (Advanced group moved to Content tab, body → body_text, Site fonts global module (later removed for Adobe Fonts), card shadow choice) are on phase-3-base-module, and the theme uploads cleanly to the WLIQ test portal. Manual testing in the portal is NOT done yet.
- Header module built (theme/modules/header.module, non-global module in a global partial): logo image + link, HubSpot menu field rendered with HubL menu(), Simple dropdown / Mega menu, optional header button (link button; HubSpot CTA is the opt-in add-on), bottom border style field. Colors come from Theme settings → Website header (color scheme field removed); menu links underline on hover. JS in its own module.js (data-site-header init guard); the old [data-nav-toggle] code in main.js is removed. Not yet tested in a portal. Sticky header skipped (global partial wrapper blocks position: sticky).
- Footer module built (theme/modules/footer.module, global), see FOOTER DECISIONS. Not yet tested in a portal.
- Two global header modules (decided, replaces the old header-minimal.html / @hubspot/logo partial, which is deleted): Header (header.module, partials/header.html) on page, blog and system templates; Header – Simple (header-simple.module, partials/header-simple.html, static tag "site_header_simple") on the landing page template: logo (image + link), header button (Link button; HubSpot CTA via the README opt-in add-on, same as Header), bottom border toggle, logo fallback alt label. No navigation, empty module.css/module.js, reuses the Header's classes/CSS and the Website header theme settings. The logo is set in both modules (README). Sandbox check 17b covers it.
- Rich-text lists (.section-description and .blog-post-body only, "Rich text" section in main.css): markers outside with 1.25em (ul) / 1.5em (ol) padding, inside when text alignment is center/right (desktop and mobile classes); ul disc → circle → square, ol decimal → lower-alpha → lower-roman via --ul-type/--ol-type set on li / li li; <p> in <li> has no margin; items and nested lists spaced by half the paragraph spacing. An <li> whose first content is a nested list gets data-list-only from HubL regex_replace (Base Module description, blog post body) and shows no marker; if the regex proves unreliable, accept the empty bullet (never use a :has() rule).
- MERGED (2026-11-23): phase-2-foundation and phase-3-base-module are merged into main (fast-forward) after the sandbox checklist passed (107 pass, 0 fail). Open at merge: checks 8 (404 template) and 15 (HubSpot CTA add-on) are VERIFY ON FIRST CLIENT PORTAL; the form-on-dark-background check and blog related posts wait for Phase 4. Phase 4 (core modules) starts next, branching from main.
- Theme settings rebuild (Luma's structure, our values; docs/theme-settings-rebuild.md): DONE, approved, uploaded cleanly to WLIQ (font_set ADOBE accepted) and committed (9492816) on phase-3-base-module. Inherited colours in the rendered main.css still need checking on a live page (sandbox check 19).
- QA approach (approved): regular QA is API + headless Playwright only (npm run qa); no HubSpot editor clicking in normal runs. Editor-only checks (2, 13, 17, 17b, 19) were done once on 2026-11-23 and are tracked by a fingerprint of theme/fields.json, every module fields.json, the header/footer modules, the partials and base.html: when they change the report shows EDITOR CHECK DUE; re-run the editor checks once (with changed, non-default content for header/footer fields), then node run.js --mark-editor-done in qa/. Checks 8 (404 template) and 15 (HubSpot CTA add-on) are VERIFY ON FIRST CLIENT PORTAL and do not block the merge. The live served main.css check runs every time. If the QA harness code itself changes, read the full report, not just the summary. Defaults in Header, Header – Simple and Footer fields.json render complete content in a fresh portal (links are #); only the menu has to be selected in the Header.
- Portal testing is automated by the QA harness (qa/, npm run qa); latest results are in the README sandbox checklist status block. 2026-11-20 final run: 103 pass, 0 fail (Simple and Mega header modes both tested). Fixed: empty fields printed "null" (all |trim on fields are now (x or "")|trim in header, Header – Simple, footer, Base Module); logo link default is empty and HubL falls back to "/". Footer repeater defaults no longer collapse on the first edit: repeaters nested in a plain group (contact, social, bottom) need a group-level default on that outer group (verified on temporary copies, applied to footer.module). Rule for all modules: a repeater inside a plain group gets its default items on the outer group's default too. Submenu arrows show a :focus-visible outline with real Tab presses (Simple and Mega). Open: 404 template is MANUAL (needs a Starter+ portal); blog related posts not built (Phase 4); form on a dark background waits for the Form Section module (Phase 4).
- Portal setup done via browser automation (2026-11-20): navigation menu "QA – Menu" (selected in the global Header, Simple mode, header button set), Header – Simple button, Footer content (3 columns, one without heading; 4 social incl. Other; 2 legal links; contact address with link), blog "QA – Blog" (slug qa-blog, custom-boilerplate templates). The user's page /qa-base-module (id 429450714850) was overwritten by the first harness run and restored from revision 432399029999.
- Next after that: fix the open items above, then Phase 4 (core modules), each cloned from the Base Module by following the README clone checklist.

PHASE 2 DECISIONS (approved)
- Color defaults are a neutral palette, never a client's brand (the 16 Global colors in DESIGN TOKENS; replaces the Luma hex values in docs/phase-1-audit.md). All default text pairs pass 4.5:1 and outline borders 3:1; tightest pair heading-on-primary 4.85.
- Color schemes (Light/Dark/Brand) were removed in the theme settings rebuild (see DESIGN TOKENS: Text colors).
- Form labels, help and error text use the Forms label/help colors (Text on dark backgrounds → Text inside .text-color-light); error text gets an icon + wording. Input boxes keep one global style; input borders use muted (border token is decorative only).
- Fonts: primary Google = Inter (headings 500). Font roles are now per text style (see DESIGN TOKENS: Fonts); the old role choice fields and the button font choice were removed. Forms use the body font. Secondary = Peridot PE Variable from Adobe Fonts (approved; replaces Tobi Pro, whose files, the Site fonts module and the client font-file override were removed). layouts/base.html loads <link rel="stylesheet" href="https://use.typekit.net/kwi4rat.css"> in <head>; the family name is the default of global_fonts.secondary (HubSpot's picker can't choose Adobe families). Variable font, weights 100–950, upright only; elements on a non-Google font get font-synthesis: style. Re-skin needs a code edit for the font (approved): replace the kit link in base.html and, if needed, the secondary font default in fields.json. The kit's domains and font-display (currently auto; set swap) are managed in Adobe Fonts.
- Card shadow setting removed in the theme settings rebuild; --shadow-md stays as a static value.
- No membership templates for now.
- Swiper pinned to 14.3.0 (bundle build). Vendor files keep their MIT banners; the no-comments rule applies to our own code.

FOOTER DECISIONS (approved)
- Footer: module `footer.module` (label "Footer", non-global, not available for new content), placed in `templates/partials/footer.html` with a static `{% module "site_footer" %}` tag. It replaces the old rich_text/menu modules in the partial.
- Footer menu columns are a repeater of columns (max 4), each with an optional heading and a repeater of links (max 8). No HubSpot menu field: everything is edited in one place and works in a fresh portal without creating a navigation menu first.
- Footer colors come from Theme settings → Website footer (text, background; default white on Dark). The module's color scheme choice was removed. Padding top/bottom: S/M/L presets (default M / S).
- Footer social icons are self-drawn inline SVGs (fill currentColor, aria-hidden); the accessible name is visually-hidden text (platform name or the optional label).
- Footer copyright year comes from `local_dt|format_datetime("yyyy")` (toggle "Insert current year").
- Footer screen-reader labels: fixed in code (LABEL RULE); there are no label fields.
- Sticky header: built (see HEADER/FOOTER EDITING). Toggle in the Style tab of Header and Header – Simple, default off.
