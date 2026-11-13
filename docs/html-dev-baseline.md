# WLIQ Development Baseline Standard — HTML Team[^c1]

| **Document** | **Use for** |
|---|---|
| HTML Coding Standards *(internal Notion link removed)* | Markup detail: attribute order, formatting, indentation |
| CSS Coding Standards *(internal Notion link removed)* | CSS detail: :root variables, property order, media query order |
| HTML Team Responsibility Checklist *(internal Notion link removed)* | Daily workflow: 11 AM to-dos, 6:00 PM updates, QA handoff rules |
| WordPress Development Standards *(internal Notion link removed)* | Client-facing scope commitments (plugins, migration, content population) |

## 1. Purpose

Every WLIQ build must look, behave, and be structured the same way regardless of who built it. This document is the minimum technical standard for how we build. QA rejects work against this checklist. It is not per-developer preference.

## 2. Project Setup (Before Writing Any Code)

- The standard Project Info sheet must be filled for every project: Dev Site URL, WP-Admin access, SFTP details, Orbit project/task link, theme/design reference, live site URL.
- **Credentials are never written in plain text** in sheets, Slack, Orbit comments, or code. All passwords live in OnePass only. The sheet references "In OnePass" — never the actual value.
- Read the full design (all pages, all breakpoints if provided) and the Orbit scope before starting. Raise scope mismatches with the PM on day one, not at QA.
- Confirm which page builder (or custom HTML/HubSpot) the project uses. Defaults: Elementor Pro unless specified; DIVI for Nex-Tech and sub-clients; Gutenberg for Build/Create.
- Confirm browser support and any client-specific requirements (fonts, ADA level, special integrations). Premium fonts must be provided by the agency before development; use the design's Google Fonts equivalent until received.
- Work on the dev/staging environment only. Never develop directly on a live site.
- Staging must have "Discourage search engines" enabled — verify it on day one.

## 3. File & Naming Conventions

- **Files/folders:** lowercase, hyphen-separated. about-us.html, hero-banner.webp. No spaces, no final-v2-new.
- **Images:** descriptive names — team-meeting-office.webp, not IMG_2041.webp.
- **CSS classes:** kebab-case, block-based (per the CSS Coding Standards doc):
  - Pattern: .section-name, .section-name-title, .section-name-item; state modifiers .is-active, .has-bg.
  - Prefix project-custom classes in page builders with wl- (.wl-hero, .wl-cta-band) so custom classes are instantly distinguishable from builder-generated ones.
  - No div1/box2/test class names — ever.
- **IDs:** camelCase (#mainNav, #contactForm), unique per page, used for anchors and JS hooks. Style with classes, not IDs.
- **Custom HTML projects:** standard folder structure:

  ```
  /assets/css  /assets/js  /assets/images  /assets/fonts
  index.html, style.css (compiled), one JS entry file
  ```

## 4. HTML Standards

Full markup rules live in the HTML Coding Standards doc. Non-negotiables:

- HTML5 doctype, lang on `<html>`, UTF-8 charset, viewport meta. `<head>` ordered: charset, viewport, title, meta description, OG tags, canonical, styles, critical preloads.
- **Semantic markup:** header, nav, main, section, article, aside, footer. No anonymous div stacks where a semantic element exists.
- **One`<h1>`per page — the page title.** Heading levels never skip (h2 → h4 is a defect). Headings are chosen by structure, styled by CSS.
- Buttons are `<button>`, links are `<a href>`. Never a div with a click handler.
- External links: target="_blank" with rel="noopener noreferrer" (WLIQ standard).
- No inline styles except genuinely dynamic values (e.g., CMS-set background image).
- Spacing comes from CSS — never `<br><br>` or empty spacer divs.
- Comment major sections in custom builds: `<!-- Hero section -->`.
- Valid HTML: no unclosed tags, no duplicate IDs (W3C validator on custom builds).

## 5. CSS Standards[^c2][^c3]

Full rules live in the CSS Coding Standards doc. Non-negotiables:

- One central stylesheet per project (child theme vendor.css, builder global custom CSS, or compiled SCSS), organized in page display order (body, header, navigation, content, footer) with section comments. **Do not scatter CSS across individual widgets/modules.**
- :root variables (or builder Global Colors/Fonts) for colors, fonts, and core spacing. No repeated hardcoded hex values.
- Media queries: desktop-first, ordered large → small, using only the WLIQ tiers in Section 7. No random one-off breakpoints unless a specific layout genuinely breaks between tiers.
- No !important except to override builder-generated inline styles — comment why when used.
- Selector nesting max 3 levels; keep selectors simple.
- z-index scale in steps of 10, max 100 for overlays/modals. No z-index: 99999.
- Remove dead/commented-out CSS and unused classes before handoff.

## 6. Responsive System — Tiers, Breakpoints, and Vertical Rhythm

One system drives everything: layout breakpoints, section spacing, and builder responsive controls all follow the same **four tiers**. Design reference width is 1440px. **Minimum supported width is 360px — we do not build or fix below 360px.**

| **Tier** | **Device range** | **Media query (desktop-first)** | **Section top/bottom padding** |
|---|---|---|---|
| Desktop | 1200px/1400px and up | Base styles (no query) | 100px |
| Laptop | 992–1199px | @media (max-width: 1199.98px) | 80px |
| Tablet | 768–991px | @media (max-width: 991.98px) | 60px |
| Mobile | 360–767px | @media (max-width: 767.98px) | 50px |

- Section padding values adjust to the design if the design specifies otherwise, but stay consistent site-wide within each tier — never eyeballed per section.
- An extra fine-tune query at 575.98px is allowed inside the Mobile tier when small-mobile layouts genuinely need it (e.g., column stacking, font step-down). It is a fine-tune, not a fifth tier — no separate rhythm value.
- In page builders, map the builder's responsive controls to these tiers (Elementor/DIVI tablet mode = Tablet tier, mobile mode = Mobile tier; add a custom breakpoint for Laptop where the design needs it).

**Verification widths** (check rendering here — these are QA checkpoints, not breakpoints): 1920 / 1440 / 1366 / 1280/ 1199 / 1024 / 991 / 767 / 575 / 360

**Responsive rules:**

- **Left/right gutter is mandatory at every width.** Content never touches the viewport edge. Minimum container side padding: **20px on Laptop/Tablet/Mobile** (or the design value if larger). This is the most common QA rejection.
- Container max-width per design (typically 1170–1320px), centered, identical across all pages.
- No horizontal scrollbar anywhere from 360px to 1920px.
- Layouts must hold **between** tiers, not just at them — a page that breaks at 1100px fails even if 991 and 1199 look fine.
- Images, videos, iframes: max-width: 100%; embeds wrapped for aspect ratio.
- Tap targets on Mobile minimum 24×24px; menus, sliders, accordions touch-usable.
- Text that overlays images on desktop moves below the image on Mobile (WLIQ standard).
- Text never overflows its container; long words/URLs handled (overflow-wrap).
- Do not duplicate a section's DOM just to restyle it per tier unless unavoidable — duplicate DOM hurts accessibility and performance.

## 7. Typography[^c4][^c5][^c6]

- Fonts, sizes, weights, and line heights come from the design — set once globally (Global Fonts / theme.json / :root), then reused. Never redefine font-family per element.
- Maximum 2 font families per site; load only the weights actually used.
- Self-host fonts in woff2 (or use the builder's local font option). font-display: swap. No premium font files committed without a license from the agency.
- Base body font size never below 16px on Mobile.
- Heading and body sizes step down consistently per tier — define once per tier, don't resize headings section-by-section.

## 8. Pixel-Perfect Standard

- Desktop build is compared against the design at the design's artboard width (1440px reference) using **PerfectPixel (or equivalent overlay)**.
- Tolerance: **±2–3px** on spacing/sizing. Fonts, weights, colors, and alignment must be exact.[^c7]
- Colors picked from the design file values, not eyeballed from JPG exports.
- Spacing between elements follows the design's system consistently — if the designer used 24px gaps, don't ship 20/25/30 mixed.
- Where the design lacks tablet/mobile artboards, follow the desktop design's proportions plus Section 6; confirm structural judgment calls with the lead.
- Hover, focus, and active states are part of pixel-perfect. If the design doesn't define them, use the site's global interaction pattern — never leave default browser styling.

## 9. Images & Media

- **Format:** WebP for all photographic/raster content (mandatory). SVG for logos and icons. PNG only when transparency + WebP is not viable.
- **Compression is mandatory** (TinyPNG/ShortPixel/Squoosh) with no visible quality loss.
- **Weight guidelines:** hero/banner ≤ 300KB, content images ≤ 150KB, thumbnails ≤ 60KB.
- **Dimensions:** export at rendered size (1.5x for retina where sharpness matters). Never upload a 4000px original for a 400px card.
- **alttext is mandatory on every image.** Descriptive, meaningful, no "image of…". Purely decorative images get alt="" (empty, not missing).
- loading="lazy" on below-the-fold images; srcset/sizes on responsive images in custom builds. **Never lazy-load the hero/LCP image**; give it explicit dimensions (or aspect-ratio) to prevent CLS.
- WordPress: insert the correct registered image size, never "Full". HubSpot: use built-in resizing/srcset.
- SVGs optimized (SVGO), no editor metadata. Use the current color value/property.
- Videos: no autoplay with sound; poster image set; compressed; prefer YouTube/Vimeo embeds with lazy loading. Caption should be off in youtube videos from the client side.
- Favicon set via native WP Site Identity (plus 180px apple-touch); OG/social image present per scope.
- Sliders: Swiper Slider JS is the WLIQ default for custom builds.

## 10. Accessibility — WCAG 2.1 AA Baseline

This is the minimum on every build, whether or not the client bought an ADA package. (Userway or a full remediation pass is a separately scoped service — this baseline is what we ship by default.)

- Color contrast: **4.5:1** normal text, **3:1** large text and UI components. Flag design violations to the PM — do not silently ship them.
- Full keyboard operability: menus (including dropdowns), sliders, accordions, tabs, modals. Logical tab order, no keyboard traps.
- **Visible focus state** on all interactive elements. Never outline: none without a replacement.
- Skip-to-content (skip-to-footer) link as the first focusable element.
- Every form input has an associated `<label>` (visually hidden if the design shows none). Placeholder is not a label.
- Meaningful link text — no bare "click here"/"read more" (add aria-label or visually hidden text if the design forces short labels).
- Landmarks via semantic tags; ARIA only where native HTML can't express it (aria-expanded on toggles, aria-label on icon-only buttons, aria-hidden on decorative icons).
- Content readable and functional at 200% browser zoom.
- No information conveyed by color alone (form errors also get text/icon).
- Run wave, axe or Lighthouse accessibility checks before QA handoff; fix high-severity issues.
- Background color is mandatory in background image.

## 11. Forms

- Labels on all fields, required fields marked, correct input types (email, tel, url) and autocomplete attributes.
- Client-side validation with inline error messages next to the field — not only a browser popup or generic alert. Errors linked to fields with ARIA for screen readers.
- Visible success state; test the actual submission and notification email on staging.
- Spam protection per project standard (honeypot/reCAPTCHA as scoped).
- Form styling matches design at all tiers, including error and focus states.

## 12. Performance Baseline

- **Targets (staging, before handoff):** PageSpeed **≥ 85 desktop / ≥ 70 mobile**; Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms.
- Scripts deferred (defer) or at end of body; no render-blocking third-party scripts without approval.
- Only the plugins/modules the project needs are active; standard optimization stack per the WordPress Development Standards (Autoptimize, TinyPNG, etc.).
- Zero console errors and zero 404s (assets, fonts, favicon) in DevTools.
- Fonts per Section 7; preload the primary font if it drives LCP.
- One slider/animation library per site maximum, and only when the design requires it.
- Keep DOM lean — fewer wrappers, shallow nesting (this matters double in page builders).

## 13. Page Builder Standards — All Builders

These rules apply to **every** builder project (Elementor, DIVI, WPBakery, Beaver Builder, Gutenberg):

**Before development starts:**

- **Disable every module/widget/element the project will not use** so unused assets never load and the editor stays clean. Note the enabled set in the project sheet.
- Configure global colors and global fonts from the design **before building any section**. No hardcoded colors inside individual modules.
- Set the builder's content width and responsive breakpoints to match Section 6.
- Any third-party add-on pack or extra plugin requires lead approval — never install a pack for one widget.

**During development:**

- Reusable parts (header, footer, CTA bands, testimonial blocks) built once as global/template/saved elements — never rebuilt per page.
- Custom CSS lives in one central place (child theme stylesheet or the builder's global custom CSS area). Per-widget/module CSS boxes only for a genuinely one-off tweak — they scatter styles and make maintenance impossible.
- Add the wl- custom class to every custom-styled section so QA and future developers can locate styles.
- Name sections in the builder's navigator/structure panel (Hero, Services Grid, CTA) — no stack of unnamed containers.
- Keep nesting shallow — every extra wrapper is DOM weight and a responsive risk.
- Spacing via the builder's padding/gap controls following Section 6 — not stacked empty spacer elements.
- Set responsive values through the builder's tier controls (tablet/mobile modes), not blanket custom CSS fighting the builder.
- Use correct image sizes in image modules — never "Full" by default.

**Before handoff:**

- Delete unused draft sections, hidden test pages, and unused saved templates.
- Verify the front-end output DOM — remove unnecessary inner rows/wrappers the builder generated.

**Builder-specific notes:**

| **Builder** | **Key specifics on top of the group rules** |
|---|---|
| DIVI (Nex-Tech default) | Child theme active. Performance options ON: Dynamic CSS, Critical CSS, deferred JS; disable external Google Fonts if self-hosted. Global presets for buttons/headings/blurbs. Theme Builder for header/footer; Divi Library (global) for shared sections. Disable unused modules before dev. |
| WPBakery | Custom classes + central stylesheet; **avoid per-element Design Options CSS** (generates scattered inline styles). Consistent row structure; stretch-row deliberate. Disable unused elements via element/role manager. Templates for repeats. Watch its heavy nesting in output. |
| Beaver Builder | Global Settings first (page width, default spacing, breakpoints per Section 6). Saved Rows/Modules (global for shared content); Themer for header/footer when licensed. Disable unused modules under Settings > Modules. |
| Gutenberg (Build/Create default) | Core blocks first; patterns for repeating layouts; synced blocks for shared content. Tokens in theme.json, not hardcoded block styles. Custom/ACF blocks only when core can't do it (lead approval). Lock unneeded blocks if editor cleanup is scoped. |

## 14. Elementor Standard (WLIQ Default Builder)

All Section 13 group rules apply. Elementor-specific requirements:

**Setup (before building):**

- Theme: Hello Elementor (or project-specified); child theme when PHP customization is expected.
- **Element Manager** (WP Admin > Elementor > Element Manager): review the full element list and **toggle off every widget the project will not use**. Use **Scan Element Usage** on existing sites before disabling anything — disabling an element that is already in use breaks it on the front end. This matters most for third-party add-on packs, whose widgets can load assets even when unused; native Elementor widgets load assets only on pages that use them, but disabling unused ones still keeps the editor clean and prevents accidental off-standard usage.
- **Settings > Features:** turn OFF unused Pro features (Popups, Custom Fonts, Custom Icons, Motion Effects, etc. when not in scope); keep stable performance features ON — Improved Asset Loading, Improved CSS Loading, Optimized DOM Output. Leave alpha/unstable experiments OFF unless the lead approves.
- **CSS Print Method: External File** (Settings > Advanced) so Elementor CSS is cacheable.
- **Site Settings first:** Global Colors, Global Fonts, typography scale, button styles, form styles, layout content width, and breakpoints mapped to Section 6 tiers — all before page work begins.
- **Fonts:** remove unused weights/variations in Site Settings > Global Fonts; host fonts locally as custom fonts in woff2 (disable external Google Fonts loading). After any font/global change, run Elementor > Tools > **Regenerate CSS & Data**.

**Building:**

- **Flexbox Containers only** — no legacy Sections/Columns on new builds. Containers produce cleaner DOM and better responsive control.
- Minimize nesting: one container per layout row wherever possible; use flex gap for spacing between items instead of nested wrappers or margin stacking.
- Theme Builder for header/footer; saved templates or global widgets for repeating blocks.
- Global custom CSS in Site Settings > Custom CSS (Pro) — not per-widget Advanced > Custom CSS except for true one-offs.
- Enable lazy-load for background images where available; set per-tier background images when the design differs across tiers.
- Responsive values via Elementor's responsive mode per tier; add a custom breakpoint for the Laptop tier when the design needs it.
- Dynamic content and global widgets add database calls — use static content where the client won't edit it.

**Handoff:**

- Delete unused templates, popups, and draft pages; run Scan Element Usage once more and disable anything that ended up unused.
- Regenerate CSS & Data, then run the performance checks in Section 12.

## 15. HubSpot Standards

- Build as a **theme with theme fields** (colors, fonts, spacing exposed in theme settings) — global values, not per-module hardcoding.
- Custom modules with editable fields for every content element the client should edit — no hardcoded text/images in module HTML.
- Global partials for header and footer; drag-and-drop areas where the client needs layout flexibility.
- HubL: module-scoped require_css/require_js so assets load only where used; module fields over logic-heavy templates.
- Use HubSpot's image resizing/srcset; same image rules as Section 9.
- Forms styled through global form styling, not per page.
- Test in the actual page editor: every module must be editable without breaking layout, at all tiers.

## 16. Browser & Device Testing Matrix

Minimum before sending to QA:

| **Type** | **Must test** |
|---|---|
| Desktop browsers | Chrome, Firefox, Safari, Edge (latest) |
| Mobile | iOS Safari, Android Chrome (real device or accurate emulation) |
| Widths | 1920, 1440, 1366, 1199, 1024, 991, 767, 575, 360 |
| Modes | Landscape tablet; browser zoom 200% |

- Safari is mandatory — flex/gap, sticky, video, and form quirks surface there.
- Test as a logged-out visitor (admin bars and logged-in caching hide issues).
- Bugherd is used during the agency review phase — keep it functional on staging.

## 17. Developer Self-Check Before QA Handoff (Definition of Done)

QA time is budgeted at 10% — it is for catching edge cases, not baseline violations. Self-testing is non-negotiable (see the HTML Team Responsibility Checklist for the daily workflow around this). Run this list before moving any task to Ready for QA:

- Matches design at 1440px within ±2–3px (PerfectPixel checked)
- All four tiers checked plus verification widths 360–1920px; no horizontal scroll; gutters present everywhere
- Section rhythm follows the tier padding values consistently
- All images WebP/SVG, compressed, correct size, all alt attributes set
- Hero/LCP image not lazy-loaded; below-fold images lazy-loaded
- One h1 (page title), heading order valid, semantic structure used
- Class naming convention followed; wl- prefix on custom classes; sections named in builder navigator
- Unused builder modules/widgets disabled (Element Manager scanned on Elementor); no unapproved add-ons
- Global colors/fonts used — no rogue hex values or font-family overrides
- Keyboard navigation works; focus visible; contrast checked; forms labeled; axe/Lighthouse high-severity issues fixed
- Forms submit successfully; validation and error states styled; notification email received
- Hover/focus/active states styled on all links and buttons
- External links target="_blank" + rel="noopener noreferrer"; all internal links work; no 404 assets; console clean
- Favicon, page titles, and (if scoped) meta descriptions in place; staging still set to discourage indexing
- PageSpeed targets met on staging
- Tested in Chrome, Firefox, Safari, Edge + iOS/Android
- Dev/test pages and unused templates deleted; no credentials anywhere in code, comments, or sheets
- Project Info sheet complete and current; Orbit task updated with dev URL and status; QA notified per handoff rules

## 18. Ownership & Enforcement

- QA rejects work that fails Section 17 items and logs the rejection reason in the Orbit task.
- Repeated baseline violations by the same developer are raised to Pravin.
- This document is reviewed quarterly. Suggestions go to Pravin — do not fork personal versions of this standard.

Outline svg

Svg box shadow/gradient

Email template content

---

> **Conversion notes:** converted from `docs/html-dev-baseline.docx`. Reviewer comments appear as footnotes `[^cN]` on the text they were anchored to. Internal Notion links, a screenshot link and one email address were removed per data-handling rules; titles and names are kept. The three short lines before this note ("Outline svg", "Svg box shadow/gradient", "Email template content") are loose notes at the end of the source doc, kept as-is.

## Reviewer comments

[^c1]: **Comment C1** (Rakesh Gadara, 2026-07-13). 

    - Do not add custom CSS in WordPress → Appearance → Additional CSS.

    If temporary CSS is required during development, remove it before the site goes live or after client approval, and move it to the project's main stylesheet via SFTP.

    - Configure the Form Notification email template for every form to ensure consistent email formatting across the website.

    - For Elementor projects, review the Element Manager before starting development.

    Enable only the widgets required for the project and disable all unused widgets to improve editor performance and prevent unnecessary asset loading.

[^c2]: **Comment C2** (Divya Dave, 2026-07-13). For CSS, there are two possible approaches:

    1. Maintaining CSS section-wise

    2. Combining all CSS together

    We should discuss and decide which approach will be easier to understand, maintain, and manage in the long term.

    @Pravin Kanzariya *(email removed)*

[^c3]: **Comment C3** (Pravin Kanzariya, 2026-07-14). section with media query.

[^c4]: **Comment C4** (Jaimin Patel, 2026-07-13). Overall Suggestions

    1. Design System & Layout Guide

    Suggestion: For in-house designs created by the design team (Figma/XD), consider defining and following a common layout guide. This should include:

    Designers should consider using a consistent layout grid (e.g., 12-column grid *(screenshot link removed)* ) in Figma/XD while creating page designs. Following a grid system will help maintain consistent alignment, spacing, container widths, and responsive behavior across all pages. This will also make the development process smoother and reduce manual adjustments during implementation.

    Typography scale

    Section top/bottom spacing

    Heading-to-content spacing

    Content-to-button spacing

    Consistent grid/layout guide (e.g., 12-column layout)

    This will improve consistency between design and development, reduce unnecessary spacing adjustments, and speed up implementation.

    2. Elementor Design Feasibility

    Suggestion: While designing for Elementor projects, consider using standard Elementor widgets whenever possible. Some highly customized components (such as advanced accordions, sliders, mega menus, or interactive layouts) require significant custom development because Elementor does not provide equivalent functionality out of the box. Where possible, using Elementor-native patterns can reduce development effort, simplify maintenance, and improve performance.

    3. Responsive Design Considerations

    Suggestion: During the design phase, consider how components will adapt across breakpoints. In some cases, elements positioned at the bottom of a section on desktop are expected to move to the top or inside different content blocks on mobile. These layouts may require duplicating elements or creating different DOM structures to achieve the intended design. When possible, responsive layouts should minimize the need for duplicated elements while maintaining the desired user experience.

[^c5]: **Comment C5** (Jaimin Patel, 2026-07-13). 4. Design–Development Collaboration

    Suggestion: For complex interactions or layouts, a short feasibility review between the design and development teams before design approval can help identify implementation challenges early and reduce rework during development.

[^c6]: **Comment C6** (Jaimin Patel, 2026-07-13). These suggestions focus on improving the collaboration between design and development, especially for Elementor-based projects, while maintaining design quality and reducing implementation effort.

[^c7]: **Comment C7** (Divya Dave, 2026-07-13). This can be adjusted by 5-8px, as there are multiple line-height variations in the design. We are following a common global line-height value to maintain consistency across the website.
