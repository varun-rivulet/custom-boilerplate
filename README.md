# Custom Boilerplate (HubSpot CMS theme)

A reusable HubSpot theme you can clone for each new client. You re-skin it by changing theme settings only (colors, fonts and spacing), with no code edits. The full README and clone checklist come in Phase 7. This file covers the foundation (Phase 2).

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
- **Client font:** in Typography → Secondary font (custom), set the family name and upload the Regular (400) and Medium (500) woff2/woff files.
  - When any file for a weight is set, it replaces the default files for that weight.
  - Never commit commercial font files to this repo. Upload them to the client's portal only.

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

## Sandbox test checklist

Do not merge `phase-2-foundation` into `main` until these pass on the dev/sandbox portal:

1. **Built-in module parameters:** the header and footer `@hubspot/menu` options (`flow`, `flyouts`, `max_levels`) and the `@hubspot/logo` placeholder image (`img.override_inherited_src`, `src`, `alt`, `loading`) behave as expected.
2. **Google font weight:** check how HubSpot reports the font field's `variant` (for example `"500"` or `"regular"`), so `--fw-heading` outputs a real number, and check that weights 400 and 500 both load.
3. **Viewport meta:** check that `standard_header_includes` outputs `<meta name="viewport">`. If it doesn't, add it to `layouts/base.html` after the charset.
4. **New form editor:** check forms built in HubSpot's new form editor, not only legacy `.hs-form` markup, against the global form styling (labels, help and error text in the scheme color, input boxes, focus, error icon).
5. **Link field:** check the `url.type` values HubSpot returns for phone links (`PHONE` or `PHONE_NUMBER`) and whether `url.href` already includes `mailto:` / `tel:`. The Base Module only adds the prefix when it is missing, so `mailto:mailto:` should never appear.
6. **scope_css:** custom padding (and its media queries) and the background image apply only to that module instance, not to other Base Modules on the page.
7. **Overlay opacity:** the Base Module outputs `--overlay-opacity` as a decimal (for example `0.5` for 50%), not `0`.

## Notes

- HubSpot template annotations (`<!-- templateType ... -->`) at the top of templates are required by HubSpot. They are the only HTML comments in the theme. Everywhere else, use HubL comments `{# #}`.
- Form styling covers HubSpot's legacy form markup (`.hs-form`). Check forms built in HubSpot's new form editor once the sandbox portal is available.
