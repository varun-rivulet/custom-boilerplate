# Custom Boilerplate (HubSpot CMS theme)

A reusable HubSpot theme you can clone for each new client. You re-skin it by changing theme settings only (colors, fonts and spacing), with no code edits. The full README and the client clone checklist come in Phase 7. This file covers the foundation (Phase 2) and the Base Module clone checklist (Phase 3).

## Folder layout

```
theme/                 everything that uploads to HubSpot (and nothing else)
  theme.json           theme label, screenshot, editor breakpoint
  fields.json          theme settings: colors, typography, buttons, layout, color schemes, forms
  css/main.css         the one shared stylesheet (tokens, sections and their media queries)
  css/generic/         _reset.css and _normalize.css (kept as separate files, included in main.css)
  css/swiper.min.css   vendor file
  js/main.js           theme JS: slider init and nav toggle, each with a data-* init guard
  js/swiper.min.js     vendor file
  fonts/               default secondary font (Source Serif 4, OFL) and OFL.txt
  images/              placeholder logo and theme screenshot
  modules/             base-module (clone template) and site-fonts (global, secondary font)
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

- **Primary font:** a Google font picked in the theme settings (Typography → Fonts). The default is Inter, using weights 400 and 500. HubSpot loads it through its font field.
- **Secondary font:** a custom font output as `@font-face` with `font-display: swap`, woff2 first and woff as the fallback.
  - The defaults are `theme/fonts/secondary-400.woff2/.woff` and `secondary-500.woff2/.woff`.
  - They are Source Serif 4 (SIL Open Font License), built as static 400 and 500 weights from Adobe's variable font.
  - Under the OFL Reserved Font Name rule, the modified files are renamed internally to "Secondary". The copyright and license notices are kept, and `OFL.txt` must stay next to the files.
- **Client font:** set in the global **Site fonts** module, not in theme settings (HubSpot doesn't allow text or file fields in theme settings).
  - The module is in `theme/modules/site-fonts.module/`. It's placed once in `templates/layouts/base.html`, so it applies to every template: pages, landing pages, blog listing and post, and system pages. It's hidden from drag-and-drop, so editors can't add it to pages.
  - **Where editors find it:** open any page built on this theme in the page editor. In the left sidebar, click the **Contents** (site tree) icon, then click **Site fonts** (it has the global content icon) and choose **Open in global content editor**. Make the changes, then click **Publish to [#] assets**. This needs the "Global content and theme settings" permission. Developers can also edit it from Design Manager. Confirm these menu names in the test portal; HubSpot's UI labels change from time to time.
  - Fill in **Secondary font family name** and upload the files under **Regular (400)** and **Medium (500)**: woff2 first and woff as the fallback. A weight only gets an `@font-face` when it has at least one file.
  - **Always request both the 400 and 500 files (woff2, plus woff if available) from the client.** The theme never mixes font families per weight, and the browser never fakes a missing weight (`font-synthesis: none` on every element set to the secondary font). With only one weight uploaded, text set to the other weight renders in the nearest real weight.
  - When any file is set, the client font replaces the default font completely. If the name is empty or "Secondary", it's renamed "Secondary Custom" so it can't clash with the default.
  - When no files are set, the module loads the default Source Serif 4 files from `theme/fonts/`.
  - The fallback (serif or sans-serif) is still in Theme settings → Typography → Secondary font. Which elements use the secondary font is still set in Theme settings → Typography → Fonts.
  - Never commit commercial font files to this repo. Upload them to the client's portal only.

## Card shadow

Theme settings → Layout → **Card shadow**: None, Small (default), Medium or Large. `main.css` defines `--shadow-sm`, `--shadow-md` and `--shadow-lg`. Their color is the heading color token mixed with transparency (`color-mix()`), so shadows re-skin with the colors. Cards use `--card-shadow`, which points to the chosen size, or `none`.

## Color schemes

The 10 color tokens are the only hex values. The Light, Dark and Brand schemes pick tokens from that list, including button colors and hover states. So re-skinning a client normally means changing only the 10 tokens.

### Re-skin warning: check contrast

The defaults pass WCAG AA: 4.5:1 for every text pair in all three schemes, and 3:1 for outline button borders. The tightest pair is **heading text on a primary background (4.85:1)**, which the primary buttons use. When you change a client's colors, re-check at least these pairs:

- heading on primary (primary button text, and primary outline button hover)
- white on secondary (secondary button, Brand scheme text)
- accent on dark-bg (Dark scheme eyebrow and link)
- heading on accent (Brand scheme primary button)
- primary on white and on dark-bg (outline borders, 3:1)
- muted on white (form input borders and placeholder text)

If a pair fails, change the scheme's token choice for it in Theme settings → Color schemes. Don't add new hex values.

## Base Module clone checklist

Every new module starts as a copy of `theme/modules/base-module.module/`. The examples below use `cards-grid` as the new module name.

1. **Copy and rename the folder.** For example, copy it to `theme/modules/cards-grid.module/`. In `meta.json`, change `label` to a neutral name (for example "Cards Grid"). Don't add a `module_id`; HubSpot creates one on upload.
2. **Rename the main section class.** In `module.html`, change `base-module` to `cards-grid` in the `classes` list and in every selector inside `scope_css`. Change the `{# Base module #}` comment to the new module name.
3. **Rename the init hook.**
   - In `module.html`, change `data-base-module` to `data-cards-grid`.
   - In `module.js`, change the selector `[data-base-module]`, the guard key `dataset.baseModuleInit` (it becomes `dataset.cardsGridInit`) and the function name `initBaseModule`.
   - If the module needs no JS, leave `module.js` as the stub. Slider modules never get module JS: their init lives in `js/main.js`.
4. **Remove the base fields the module doesn't need** from `fields.json`, together with their `{% set %}` lines, classes and checks in `module.html`. If you remove a content field, also take it out of the "is anything filled in" check on the outer `{% if %}`.
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
   - all 3 color schemes (Light, Dark, Brand), with and without a background color or image;
   - every breakpoint: desktop, ≤1366.98, ≤1200.98, ≤991.98, ≤767.98, ≤575.98, down to 360px wide, with no horizontal scroll;
   - keyboard: every link, button and control can be reached with Tab and shows a visible focus style, in every scheme.

## Sandbox test checklist

Do not merge any phase branch (`phase-2-foundation`, `phase-3-base-module` and later) into `main` until these pass on the dev/sandbox portal:

0. **Delete the old theme folder first:** in the test portal's Design Manager, delete the folder named "Custom Boilerplate" (left over from an earlier upload from another folder). Test only the `custom-boilerplate` theme folder.

1. **Built-in module parameters:** the header and footer `@hubspot/menu` options (`flow`, `flyouts`, `max_levels`) and the `@hubspot/logo` placeholder image (`img.override_inherited_src`, `src`, `alt`, `loading`) behave as expected.
2. **Google font weight:** check how HubSpot reports the font field's `variant` (for example `"500"` or `"regular"`), so `--fw-heading` outputs a real number, and check that weights 400 and 500 both load.
3. **Viewport meta:** check that `standard_header_includes` outputs `<meta name="viewport">`. If it doesn't, add it to `layouts/base.html` after the charset.
4. **New form editor:** check forms built in HubSpot's new form editor, not only legacy `.hs-form` markup, against the global form styling (labels, help and error text in the scheme color, input boxes, focus, error icon).
5. **Link field:** check the `url.type` values HubSpot returns for phone links (`PHONE` or `PHONE_NUMBER`) and whether `url.href` already includes `mailto:` / `tel:`. The Base Module only adds the prefix when it is missing, so `mailto:mailto:` should never appear.
6. **scope_css:** custom padding (and its media queries) and the background image apply only to that module instance, not to other Base Modules on the page.
7. **Overlay opacity:** the Base Module outputs `--overlay-opacity` as a decimal (for example `0.5` for 50%), not `0`.
8. **Site fonts module overrides the default font on all templates:** with no files, the default "Secondary" font loads. After you upload client files and publish the Site fonts global module, the client font replaces it on a page, landing page, blog listing, blog post and a system page (404). The `<style>` block appears in `<head>`.

## Notes

- HubSpot template annotations (`<!-- templateType ... -->`) at the top of templates are required by HubSpot. They are the only HTML comments in the theme. Everywhere else, use HubL comments `{# #}`.
- Form styling covers HubSpot's legacy form markup (`.hs-form`). Check forms built in HubSpot's new form editor once the sandbox portal is available.
