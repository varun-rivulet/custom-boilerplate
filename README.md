# Custom Boilerplate (HubSpot CMS theme)

A reusable HubSpot theme you can clone for each new client. You re-skin it by changing theme settings only (colors, fonts and spacing), with no code edits. The full README and the client clone checklist come in Phase 7. This file covers the foundation (Phase 2) and the Base Module clone checklist (Phase 3).

## Folder layout

```
theme/                 everything that uploads to HubSpot (and nothing else)
  theme.json           theme label, screenshot, editor breakpoint
  fields.json          theme settings: global colors and fonts, spacing, text, text on dark backgrounds, buttons, forms, website header and footer
  css/main.css         the one shared stylesheet (tokens, sections and their media queries)
  css/generic/         _reset.css and _normalize.css (kept as separate files, included in main.css)
  css/swiper.min.css   vendor file
  js/main.js           theme JS: slider init with a data-* init guard
  js/swiper.min.js     vendor file
  images/              placeholder logo and theme screenshot
  modules/             base-module (clone template), header and footer (global)
  templates/           layouts/base.html, page, landing page, blog listing, blog post, partials, system pages
docs/                  internal docs (never uploaded)
```

`.hsignore` keeps `docs/`, `CLAUDE.md` and this README out of uploads. `.gitignore` keeps `hubspot.config.yml` (CLI credentials) out of git.

## Vendor versions

| Library | Version | Files |
|---|---|---|
| Swiper | **14.3.0** (pinned, released 2026-09-28) | `theme/js/swiper.min.js`, `theme/css/swiper.min.css` (the bundle build) |
| normalize.css | 8.0.1 | `theme/css/generic/_normalize.css` |

**Possible optimisation (not done yet):** Swiper currently loads on every page. Later it could load only on pages that have a slider module, by moving the `require_js` / `require_css` calls for Swiper into the slider module's `module.html`.

The vendor files keep their MIT license banners. The only change to them is that the source-map reference lines were removed, because the `.map` files are not shipped. To upgrade Swiper, replace both files with the same version and update this table.

## Fonts

- **Primary font:** a Google font picked in Theme settings → Global fonts → Primary. The default is Inter. HubSpot loads it through its font field, only in the weights the text styles pick (default: 500 for headings).
- **Secondary font:** Peridot PE Variable from Adobe Fonts (Typekit). `layouts/base.html` loads the kit with `<link rel="stylesheet" href="https://use.typekit.net/kwi4rat.css">` in `<head>`, before the theme CSS. Theme settings → Global fonts → Secondary holds the CSS family name `peridot-pe-variable` (font set Adobe) and its fallback (default sans-serif).
  - It is one variable font covering weights 100–950, upright only. Italic text is slanted by the browser (`font-synthesis: style`, set for every text style that uses a non-Google font); weights are never faked.
  - The kit also contains Area Extended, Area Extended Light, Area Normal, Area Normal Light and Neue Kabel. They only download if CSS uses them.
  - **Adobe kit settings (in Adobe Fonts, not in the theme):** add every domain the site runs on (including the HubSpot preview and `*.hs-sites.com` domains) to the kit, or the font won't load there. The kit currently uses `font-display: auto`; set it to `swap` in the kit settings to match our rule.
  - **Re-skin:** replace the `<link>` in `layouts/base.html`. If the family name changes, update the default of `global_fonts.secondary` in `theme/fields.json` (HubSpot's font picker can't select Adobe families).
- **Text styles:** each style in Theme settings → Text (H1–H6, Body, Links, Eyebrow) has its own font field that follows Primary or Secondary until changed, and sets the weight and color. **Defaults:** headings use Primary (Inter 500). Body, links, eyebrow and buttons use Secondary. Forms follow the body font; the form title follows H5.
- **Sizes:** H2–H6 and body have one size per breakpoint tier (Text → style → Font size). Line heights are per style. There are no Display, Lead or Small styles: small text (form help text, blog dates and meta, footer bottom bar) uses the eyebrow size.

## Shadows

The header dropdown uses `--shadow-md`, whose color is the heading color mixed with transparency (`color-mix()`), so it re-skins with the colors. There is no shadow setting (card shadow was removed).

## H1 size and image radius

- **H1** has one size setting (Theme settings → Text → Heading one (H1) → Size (largest), default 85px). It is full size on screens 1440px wide and up, then scales down with the screen width and stops at 55% of the value (never below 40px). With 85px: 81px at 1366, 71px at 1200, 58px at 991, 47px at 767 and below. H2–H6 and body keep one setting per breakpoint.
- **Image radius** (Theme settings → Spacing → Image radius, default 4px) rounds images inside any element with the utility class `.img-radius` (the class goes on the image wrapper, for example `<div class="section-media img-radius">`). The Base Module image and the blog post featured image use it. Logos, icons, header and footer images and images inside rich text don't get the class, so they are never rounded. New modules add the class to their content-image wrapper.

## Colors

Theme settings → **Global colors** holds the 16 palette colors: Primary, Text, Secondary, White, Page background, Heading, Dark, Secondary tint (light), Secondary tint, Accent tint, Primary tint, Muted, Accent, Primary dark, Highlight and Border. They are the only hex values you normally change. Every other color setting (text styles, buttons, forms, website header and footer, text on dark backgrounds) is a color picker that follows a palette color until someone changes it.

- **When you change Primary, update Primary dark too.** Primary dark is a fixed color, not calculated from Primary.
- **Page background** is the body background. **Border** is for decorative lines only; form inputs have their own border (Forms → Fields → Border).
- Narrow pages (blog post, system pages) use `.container-narrow`, which is 65% of the maximum content width (858px at the default 1320px). There is no separate setting.

How modules use them:
- Light backgrounds use the text style colors (Text → H1–H6, Body, Links, Eyebrow). The Base Module's **Text color: Dark** uses the same values.
- **Text on dark backgrounds** (heading, text, eyebrow, link, link hover) supplies the Base Module's **Text color: Light**. Form labels, help and error text switch to its text color. Text color (Auto / Dark / Light) only affects text, never buttons: every button keeps the variant the editor selected, on any background. On dark backgrounds, choose a suitable variant (e.g. White or White outline).
- **Website header** and **Website footer** set the header and footer colors. The footer uses its text color for headings, links and icons too, and the same color at 25% opacity for dividers. Header menu links underline on hover.

### Re-skin warning: check contrast

The defaults pass WCAG AA: 4.5:1 for text and 3:1 for outline button borders. The tightest pair is **heading text on a primary background (4.85:1)**, which the primary button uses. When you change a client's colors, re-check at least these pairs:

- heading on primary (primary button text, primary outline button hover)
- white on secondary and dark (secondary and dark buttons)
- heading on accent (accent button)
- accent on dark (eyebrow and link on dark backgrounds)
- secondary (links) and text on page background
- primary on page background and white on dark (outline borders, 3:1)
- muted on white (form input borders and placeholder text)

If a pair fails, change the setting that uses it (for example the button's text color) to another palette color. Don't add new hex values.

## Header
Header and Header – Simple are regular (non-global) modules inside global partials. Their `fields.json` defaults render a complete header (logo placeholder, "Get started" button) and footer (columns, contact, social and legal links with `#` links) in a fresh portal; only the Header menu has to be selected. The content is edited in one click and is still shared by every page that uses the header.

- **Header** (`modules/header.module`, static `{% module "site_header" %}` tag in `templates/partials/header.html`): logo, menu and header button. Used by the page, blog and system templates.
- **Header – Simple** (`modules/header-simple.module`, static `{% module "site_header_simple" %}` tag in `templates/partials/header-simple.html`): logo and header button only, no navigation. Used by the landing page template. It reuses the Header's classes and CSS (`.site-header`, `.site-header-inner`, `.site-header-logo`, `.site-header-cta`) and follows the same Website header theme settings and bottom border toggle.

**The logo is set in both modules (Header and Header – Simple).** When you re-skin for a client, update the logo, logo link and alt text in each. The logo alt text is the image's alt field; when it is empty the code uses "Home".

Header menu type: Simple dropdown (2 levels) or Mega menu (3 levels: top item → column heading → links). The menu tree is rendered with HubL `menu()`; there are no flyout/max-level options. Optional header button: a link button (any of the 9 theme button styles). Colors come from Theme settings → Website header (menu text, drop-down text, background and border, header background); the module itself only has the bottom border toggle. For HubSpot CTAs, see "HubSpot CTA buttons (opt-in add-on)". 

**Sticky header:** a toggle in the Style tab of Header and Header – Simple (default off). HubSpot wraps the header partial in its own `<div>`, so `position: sticky` on `.site-header` alone would only stick inside that wrapper. `layouts/base.html` therefore wraps the header block in `<div class="site-header-wrap">`; `js/main.js` adds `.is-sticky` to it (CSS: `position: sticky; top: 0; z-index: 100`) and sets `--site-header-height`, which `html` uses as `scroll-padding-top` so anchor links don't land under the header. While sticky, an open mobile menu scrolls inside the remaining screen height. The header stays in the page flow, so content never hides under it.

**Header animations (the only animated part of the theme).** Menu links show a 2px bar that grows from the left on hover, focus, open parent and the active page (.25s). The Simple dropdown and the Mega panel fade in with an 8px slide down (.25s). With the Mega menu, the page behind fades to a dark overlay (a click on it closes the menu). On mobile (up to 991.98px) the menu is a full-width panel that slides in from the left (.35s) with the page scroll locked, and the menu icon crossfades to the close icon. All of it is switched off for visitors who prefer reduced motion. The CSS is in `css/main.css` (Website header section), the behaviour in `js/main.js`.

## Footer

The site footer is the **Footer** module, a regular (non-global) module inside the global partial `templates/partials/footer.html`. Edit it once and it changes on every page. **Where editors find it:** open any page built on this theme in the page editor and click the footer; its settings open in one step. This needs the "Global content and theme settings" permission. Confirm the exact menu names in the test portal; HubSpot's UI labels change from time to time.

- **Logo:** image + optional link (usually the home page). Alt text is required when the logo is linked. The partial passes the theme's placeholder logo as the starting value; replace it for each client. Empty image = no logo.
- **Description:** rich text under the logo.
- **Menu columns:** up to 4 columns, each with an optional heading and up to 8 links. A column shows only when at least one link has text and a URL. The heading tag (H2 by default, or H3/H4/Paragraph) is one setting for the column, contact and social headings. These are UI headings: each sits in a `<div class="site-footer-col-title">` wrapper that sizes it at the H6 size, so the tag doesn't change their look. Content headings elsewhere use the global h1–h6 sizes.
- **Contact:** up to 4 items (email, phone, address). Email and phone link automatically (`mailto:` / `tel:`) from the text; the optional link field overrides that or links an address to a map.
- **Social links:** up to 8 (Facebook, Instagram, LinkedIn, X, YouTube, TikTok, Other). A link shows only when it has a URL. Screen readers hear the platform name ("Website" for Other).
- **Bottom bar:** © + current year (toggle) + copyright text, and up to 5 legal links.
- **Accessibility labels:** there are no label fields. The code uses fixed names: "Footer" and "Legal" for the two navigation landmarks, and the logo's alt text (fallback "Home" when the logo is linked).
- **Style tab:** "Change spacing" toggle, same as the Base Module (off = theme default section padding, Medium; on = padding per breakpoint). Colors come from Theme settings → Website footer (text and background; default white on Dark).
- Placeholder links without a URL show only in the editor, never on the live page.

## HubSpot CTA buttons (opt-in add-on)

The boilerplate has link buttons only. HubSpot's `cta` field type needs CTA access (Content Hub Professional or Enterprise). In a portal without it, the whole upload fails with "Account must be upgraded to use 'cta' field type", so the field can't be in the shared boilerplate. Add it per client, only when that portal has CTA access.

**Base Module buttons**
1. In `fields.json`, inside the `buttons` repeater, add a first field: choice `button_type` "Button type" with choices `link` "Link button" / `cta` "HubSpot CTA" (default `link`). Give `text`, `style` and `link` an `advanced_visibility` rule (`buttons.button_type` matches `^link$`), and add `{"type": "cta", "name": "cta", "label": "HubSpot CTA"}` shown when `buttons.button_type` matches `^cta$`. Add `"button_type": "link"` to the repeater default.
2. In `module.html`, count a CTA item as valid only when one is picked: `{% if item.button_type == "cta" %}{% if item.cta %}{% do valid_buttons.append(item) %}{% endif %}{% elif item.text|trim and (item.link.url.href or is_in_editor) %}{% do valid_buttons.append(item) %}{% endif %}`.
3. In the buttons loop, render it before the link button: `{% if item.button_type == "cta" %}<div class="section-cta">{% cta guid="{{ item.cta }}" %}</div>{% else %}` … link button … `{% endif %}`. The CTA's look and link come from HubSpot's CTA tool, not the theme button styles.

**Header button (Header and Header – Simple)**
Do these steps in both `header.module` and `header-simple.module`. Header – Simple has no `has_panel`; skip that part there.
1. In `fields.json`, in the `cta` group, add the choice `["hubspot", "HubSpot CTA"]` to `type`, and add `{"type": "cta", "name": "hubspot_cta", "label": "HubSpot CTA"}` shown when `cta.type` matches `^hubspot$`.
2. In `module.html`, add `{% set has_hubspot_cta = header_cta.type == "hubspot" and header_cta.hubspot_cta %}`, include it in `has_panel`, and after the link button block add `{% elif has_hubspot_cta %}<div class="site-header-cta">{% cta guid="{{ header_cta.hubspot_cta }}" %}</div>`.

Then run sandbox check 15 in that client's portal.

## Base Module clone checklist

Every new module starts as a copy of `theme/modules/base-module.module/`. The examples below use `cards-grid` as the new module name.

1. **Copy and rename the folder.** For example, copy it to `theme/modules/cards-grid.module/`. In `meta.json`, change `label` to a neutral name (for example "Cards Grid"). Don't add a `module_id`; HubSpot creates one on upload.
2. **Rename the main section class.** In `module.html`, change `base-module` to `cards-grid` in the `classes` list and in every selector inside `scope_css`. Change the `{# Base module #}` comment to the new module name.
3. **Module JS (only if the module needs it).** Every module's `module.js` stays empty, so HubSpot loads no script for it. All JS lives in `js/main.js`. Leave `main.js` alone when the new module has no interactive parts. When it does:
   - In `module.html`, add the hook attribute to the main section: `<section ... data-cards-grid>`.
   - In `js/main.js`, add an init function and call it at the bottom (one init per element with a data-* guard; no IIFE, no `DOMContentLoaded`, because `main.js` is loaded in the footer):

     ```js
     const initCardsGrid = (root = document) => {
       root.querySelectorAll('[data-cards-grid]').forEach((section) => {
         if (section.dataset.cardsGridInit === 'true') return;
         section.dataset.cardsGridInit = 'true';
       });
     };

     initCardsGrid();
     ```
4. **Remove the base fields the module doesn't need** from `fields.json`, together with their `{% set %}` lines, classes and checks in `module.html`. If you remove a content field, also take it out of the "is anything filled in" check on the outer `{% if %}`.
   - If the module has no buttons, remove the whole `buttons` repeater and the `valid_buttons` loop.
5. **Add the new fields** inside the existing tabs and groups. Keep to 5 nesting levels at most. Text, file and other free-input fields go in the Content tab: HubSpot rejects them in the Style tab. Never name a field `body`. Use `visibility` / `advanced_visibility` (with `boolean_operator: "AND"`) instead of extra groups.
6. **Put the CSS in `theme/css/main.css`.**
   - Add a section under its own `{# Cards grid #}` label, in page display order, with that section's media queries right after it (desktop first, large to small, theme breakpoints only).
   - Scope every selector under the main class (`.cards-grid .cards-grid-item`). Use kebab-case, and `.is-active` / `.has-bg` for states.
   - Use the shared `.section-*` classes (`.section-eyebrow`, `.section-title`, `.section-description`, `.section-buttons`, `.section-media`) first, and only add module classes for what they don't cover.
   - Single-line rules, no CSS comments, no `!important`, nesting 3 levels at most, z-index in steps of 10 up to 100, and theme CSS variables only (no hard-coded colors, fonts or spacing).
7. **Keep `module.css` empty.** Use `scope_css` (inside `require_css`) in `module.html` only for values that come from fields.
8. **Check the output in HubSpot.**
   - No empty elements render when a field is blank: each wrapper sits inside an `{% if %}`, and the section disappears when nothing is filled in or "Show section" is off.
   - The editor preview works: placeholder content such as buttons without a link still shows when `is_in_editor` is true, and doesn't show on the live page.
   - Two instances on one page don't affect each other (scoped CSS, init guard).
9. **Test**:
   - text color Auto / Dark / Light on: a light picked color, a dark picked color, a mid-tone (for example the primary token) and a picked color at 50% opacity; an image with light and dark overlay colors; light, dark and mixed gradients;
   - every breakpoint: desktop, ≤1366.98, ≤1200.98, ≤991.98, ≤767.98, ≤575.98, down to 360px wide, with no horizontal scroll;
   - keyboard: every link, button and control can be reached with Tab and shows a visible focus style, with Text color Dark and Light.

## Sandbox test checklist

<!-- qa-status:start -->
**Last automated run:** 2026-11-23, branch `main`, commit `915c40f` (uncommitted theme changes) (`npm run qa` in `qa/`).

| Check | Status | Notes |
|---|---|---|
| 0. Old theme folder deleted | PASS | Old theme folder deleted by hand (2026-11-23). |
| 2. Font fields | PASS | Editor part verified 2026-11-23 (font picker shows the Adobe secondary font) |
| 3. Viewport meta | PASS |  |
| 4. Forms | PASS (auto part) | MANUAL: Form on a dark background (Waits for the Form Section module (Phase 4)) |
| 5. Link field | PASS |  |
| 6. scope_css per instance | PASS |  |
| 7. Overlay color | PASS |  |
| 8. Secondary font on all template types | VERIFY ON FIRST CLIENT PORTAL | The 404 template needs a Starter+ portal (system page templates). Verify on the first client portal; does not block the merge. |
| 9. Spacing field value shape | PASS |  |
| 10. Light text on dark backgrounds | PASS |  |
| 11. Image type with no image | PASS |  |
| 12. H1 and image radius | PASS |  |
| 13. Background color picker inheritance | PASS | Editor part verified 2026-11-23 (color pickers show the inherited palette color) |
| 14. Auto text color from hex | PASS |  |
| 15. HubSpot CTA add-on | VERIFY ON FIRST CLIENT PORTAL | The HubSpot CTA add-on needs CTA access (Content Hub Pro/Enterprise). Verify on the first client portal; does not block the merge. |
| 16. Image position | PASS |  |
| 17. Header module | PASS | Editor part verified 2026-11-23 (Simple/Mega switching, sticky toggle) |
| 17b. Header – Simple | PASS | Editor part verified 2026-11-23 (Header – Simple editor fields) |
| 18. Footer module | PASS |  |
| 19. Theme settings inheritance | PASS | Editor part verified 2026-11-23 (palette change reaches the served main.css) |
| 20. Button styles | PASS |  |
<!-- qa-status:end -->

Do not merge any phase branch (`phase-2-foundation`, `phase-3-base-module` and later) into `main` until these pass on the dev/sandbox portal:

Most checks run automatically: `cd qa && npm run qa` uploads the theme, seeds "QA –" content in the test portal, republishes it, runs Playwright and rewrites the status table below. Setup, safety rules and the manual portal steps are in `qa/README.md`.

0. **Delete the old theme folder first:** in the test portal's Design Manager, delete the folder named "Custom Boilerplate" (left over from an earlier upload from another folder). Test only the `custom-boilerplate` theme folder.

2. **Font fields:** check how HubSpot reports a font field's `variant` (for example `"500"` or `"regular"`), so `--h1-weight`, `--body-weight` and `--btn-weight` output real numbers, and that only the Inter weights in use load. Check that the upload accepts `font_set: "ADOBE"` on Global fonts → Secondary, that the editor shows it without resetting it, and that text styles following it output `"peridot-pe-variable", sans-serif`.
3. **Viewport meta:** check that `standard_header_includes` outputs `<meta name="viewport">`. If it doesn't, add it to `layouts/base.html` after the charset.
4. **New form editor:** check forms built in HubSpot's new form editor, not only legacy `.hs-form` markup, against the global form styling (labels, help and error text in the Forms colors, input boxes, focus, error icon, form title).
5. **Link field:** check the `url.type` values HubSpot returns for phone links (`PHONE` or `PHONE_NUMBER`) and whether `url.href` already includes `mailto:` / `tel:`. The Base Module only adds the prefix when it is missing, so `mailto:mailto:` should never appear.
6. **scope_css:** custom padding (and its media queries) and the background image apply only to that module instance, not to other Base Modules on the page.
7. **Overlay color:** the Base Module overlay is a color picker with opacity. It starts as the theme's Dark color at 50%. Check that `--overlay-opacity` is a decimal (for example `0.5`), that the overlay color also shows behind the image while it loads, and that Auto text color follows the picked overlay color and opacity.
8. **Secondary font loads and is used:** on a page, landing page, blog listing, blog post and a system page (404), the Adobe Fonts kit (`use.typekit.net/kwi4rat.css`) loads with status 200 and DevTools → Network → Font shows the Peridot font file. DevTools → Elements → Computed on body text shows the rendered font "peridot-pe-variable"; headings show Inter. If the font doesn't load, add the portal's domains (including the preview domain) to the kit in Adobe Fonts. **404 part: MANUAL – needs a Starter+ portal (plan limitation).** System page templates can't be set in the free test portal (Settings has no System pages option), so the theme's 404 template is checked by hand in a Starter+ portal: Settings → Content → Pages → System pages → 404 = `custom-boilerplate/templates/system/404.html`.
9. **Spacing field value shape:** turn on "Change spacing" in a Base Module and set all four sides at each breakpoint. Check that the values arrive as `padding.top.value` / `padding.top.units` (and the same for right, bottom and left), and that the scoped CSS outputs each side at the right breakpoint. Also check that a side left empty keeps the value from the larger breakpoint.
10. **Light text on dark backgrounds:** with a dark picked background color (and Text color Auto or Light), check that the heading, text, eyebrow and links use Text on dark backgrounds. Every button (including a form's submit button) keeps the variant selected in its style field; nothing switches to White. A visible keyboard focus outline should show on every link and button.
11. **Image type with no image:** set Background type to Image without choosing an image. The section should have no background and use dark text (Auto), with no broken `background-image` in the CSS.
12. **H1 and image radius:** at 1440px an H1 is 85px; at 360px it is 47px and nothing overflows horizontally. A Base Module image and a blog post featured image get the Image radius; the header logo does not.
13. **Background color picker inheritance:** add a Base Module, set Background type Color and don't touch the picker. It should show the theme's Dark color. Change Dark in Global colors: the module follows it. Then pick another color: it keeps that color. If HubSpot rejects `theme.global_colors.dark.color` in `inherited_value` (or the `{"color": null, "opacity": null}` default) on upload, remove `inherited_value`, set the default to `{"color": "", "opacity": 100}` and rely on the HubL fallback.
14. **Auto text color from hex:** check that `convert_rgb` returns three numbers (for example `59,130,246`), and that Auto gives dark text on #3B82F6, light text on #334155 and #64748B, dark text on #F59E0B, and dark text on #0B1F3A at 10% opacity. With opacity below 100, the CSS shows `rgba(r,g,b,0.5)`.
15. **HubSpot CTA add-on (only in a portal with CTA access):** after adding the add-on ("HubSpot CTA buttons (opt-in add-on)" above), pick a CTA in a button set to HubSpot CTA. It renders on the live page and in the editor; a button with no CTA picked renders nothing (no empty `section-cta` div). Check whether the `cta` field lists new CTAs (Marketing > CTAs) or only legacy ones; if new ones render nothing with `{% cta guid=... %}`, try `{{ cta(item.cta) }}`. The WLIQ test portal has no CTA access, so this can't be tested there.
16. **Image position:** top, center and bottom each move the background image as expected.
17. **Header module:** open Header in the page editor (one click on the header).
  - Menu: with the Menu field empty the portal's default menu shows; pick another menu and it switches. Build a test menu with 3 levels, a "no link" parent and an item set to open in a new tab.
  - Simple dropdown: hover opens; Tab to the arrow button, Enter/Space opens, Escape closes and focus returns to the arrow; clicking outside closes; the current page link has aria-current="page".
  - Mega menu: full-width panel under the header; 2nd-level items are column headings (linked when they have a URL), 3rd-level items list below; 4 and 5 columns wrap on smaller desktops.
  - Mobile (≤991.98px): the menu button opens/closes the panel; submenus open as accordions in both menu types; Escape closes.
  - Logo: empty image shows the placeholder (theme/images/logo-placeholder.svg via get_asset_url) at 160×40; an uploaded logo outputs its width/height and loading="eager".
  - Header button: the link button is hidden on the live page until a link is set.
  - Website header colors: change menu text, drop-down text/background/border and header background in Theme settings; the header follows, menu links underline on hover, and focus outlines are visible. On mobile the submenus use the header colors.
17b. **Header – Simple (on a landing page):** create a page from the Landing page template and click Header – Simple in the page editor.
  - It shows the logo (placeholder at 160×40 when empty; an uploaded logo outputs its width/height and loading="eager") and the header button, and no menu or menu button at any width.
  - The header button is hidden on the live page until it has text and a link; all 9 styles render.
  - Website header colors and the bottom border toggle apply, same as the main Header.
  - No console errors and no horizontal scroll from 1440 down to 360px; logo and button stay usable at 360px.
18. **Footer module:**
   - The placeholder logo passed from the partial (`logo={"image": {...}}` with `get_asset_url`) appears on first upload. If global module tag parameters are ignored, the logo is simply hidden until an image is chosen.
   - `local_dt|format_datetime("yyyy")` prints the four-digit year (fallback: `local_dt|datetimeformat('%Y')`). Check that a cached live page shows the new year after 1 January (republish if needed).
   - Nested repeaters (columns → links) save and reorder correctly; `sorting_label_field` paths (`columns.links.text`, `contact.items.text`, `social.items.platform`) show useful labels.
   - Email/phone items output `mailto:` / `tel:` once (never doubled), with and without the optional link field.
   - Website footer colors: with the default (white on Dark) and with dark text on a light background, text, headings, links, social icon borders and the bottom-bar border are visible; focus outline shows on every link.
   - Layout at every breakpoint down to 360px: three areas side by side on desktop, logo row on top at ≤991.98, one column with 2-column menus at ≤767.98, no horizontal scroll.

19. **Theme settings inheritance:** change Primary in Global colors. The primary button, primary outline button and every other setting that still follows Primary change with it, in the editor preview and on the live page. Change a button's background directly: it keeps that color. Check that inherited values reach `main.css` (for example `--btn-bg` is a hex, not empty).
20. **Button styles:** all 9 styles plus Text link render in the Base Module and as the header button, with hover colors and hover radius; the form submit button follows Forms → Submit button → Style. Each variant's line height, letter spacing and desktop/mobile padding apply (mobile padding at ≤767.98px); the space between buttons follows Spacing → Button gap.

## Notes

- HubSpot template annotations (`<!-- templateType ... -->`) at the top of templates are required by HubSpot. They are the only HTML comments in the theme. Everywhere else, use HubL comments `{# #}`.
- Form styling covers HubSpot's legacy form markup (`.hs-form`). Check forms built in HubSpot's new form editor once the sandbox portal is available.
