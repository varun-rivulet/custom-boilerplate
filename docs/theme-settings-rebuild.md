# Theme settings rebuild to Luma's structure (IN PROGRESS, resume here)

Status on 2026-11-17: DONE. Approved, uploaded to WLIQ and committed (9492816).

## Goal

Rebuild `theme/fields.json` to match the **structure** of Luma's theme `fields.json` (read-only: `../Luma-Phase2-2026/fields.json`): same groups, order, labels, field types and options. Keep **our current default values**, our Peridot Adobe kit, and neutral naming (no Luma names). Then update every CSS variable and theme reference in `main.css`, templates and modules, run the local checks, show the user the final settings tree, and **wait for OK** before uploading (`--account=WLIQ`) and committing.

Earlier misunderstanding: "make the theme identical to Luma" was first read as copying Luma's colors/fonts/values. That value-mapping table and its decisions 1–8 were **discarded**. Apply none of them.

## Luma's structure (reference)

Top-level groups in order, with labels to keep (neutralized):

1. `global_colors` "Global colors": colour fields, opacity hidden.
2. `global_fonts` "Global fonts": `primary`, `secondary` (`font` fields, size and styles hidden; they carry a colour). Luma uses `font_set: "ADOBE"` for Adobe families; mirror that for Peridot.
3. `spacing` "Spacing": `vertical_spacing` "Vertical spacing" (number, slider 0–500 px, default 0; Luma uses it as dnd section padding), `maximum_content_width` "Maximum content width" (number, slider 900–2500 px).
4. `text` "Text": `h1`…`h6` "Heading one (H1)"… each with `font` "Font" (`font` field) and `transform` "Transform" (choice none|capitalize|uppercase|lowercase); `body_font` "Body" → `font`; `links` "Links" → `font` (size hidden).
5. `buttons_group` "Buttons Group": 11 variants, each with the same shape:
   `text` { `font` (font), `transform` (choice) }, `background` { `color` }, `border` { `border` (border field) }, `corner` { `radius` (number) }, `spacing` { `spacing` (spacing field, margin hidden) }, `hover` { `text`.`color`, `background`.`color`, `border`.`border`, `corner`.`radius` }.
6. `forms` "Forms": `title` → `text` → `font`; `labels` → `text` → `color`; `help_text` → `text` → `color`; `fields` → `text`.`color`, `background`.`color`, `border`.`border`, `corner`.`radius`.
7. `header` "Website header": `menu` → `text`.`color`; `menu` → `drop_downs` → `text`.`color`, `background`.`color`, `border`.`border`; `background`.`color`.
8. `footer` "Website footer": `text`.`color`, `background`.`color`.

Luma field pattern to copy: colour/font/border fields use `inherited_value.property_value_paths` (e.g. `{"color": "theme.global_colors.primary.color"}`; border sides `"top.color"` etc.; font `font`, `font_set`, `fallback`, `color`).

To regenerate the full Luma tree (read-only): read `../Luma-Phase2-2026/fields.json` and walk `children` recursively.

## Approved decisions

**A. Headings/body:** Luma's `font` field per level (family, weight via variant, colour; hide size and styles) **plus our per-breakpoint size fields beside them** (desktop / large_laptop / laptop / tablet / mobile). H1 keeps one size field with the current clamp. Keep line heights per level.

**B. Colours:** mirror Luma's slots with neutral names; drop Luma's duplicate body_bg/body_background → 16 slots, in this order:

| # | name | label | default |
|---|---|---|---|
| 1 | primary | Primary | #3B82F6 |
| 2 | text | Text | #1F2937 |
| 3 | secondary | Secondary | #334155 |
| 4 | white | White | #FFFFFF |
| 5 | page_bg | Page background | #F8FAFC |
| 6 | heading | Heading | #0F172A |
| 7 | dark | Dark | #0B1F3A |
| 8 | secondary_tint_light | Secondary tint (light) | #F1F5F9 |
| 9 | secondary_tint | Secondary tint | #E2E8F0 |
| 10 | accent_tint | Accent tint | #FDE68A |
| 11 | primary_tint | Primary tint | #DBEAFE |
| 12 | muted | Muted | #64748B |
| 13 | accent | Accent | #F59E0B |
| 14 | primary_dark | Primary dark | #1D4ED8 (fixed colour, no inheritance) |
| 15 | highlight | Highlight | #D97706 |
| 16 | border | Border | #CBD5E1 |

CSS variables: keep `--color-heading`; rename `--color-light-bg` → `--color-page-bg` and `--color-dark-bg` → `--color-dark`; add the new ones (`--color-secondary-tint-light`, `--color-secondary-tint`, `--color-accent-tint`, `--color-primary-tint`, `--color-primary-dark`, `--color-highlight`). Update every reference. README re-skin steps must say: "When you change Primary, update Primary dark too."

**C. Buttons:** all 11 variants with neutral names, in Luma's per-variant shape. Proposed names (not yet shown to the user; confirm in the final tree): primary, secondary, dark (Luma tertiary), white, heading-colour (Luma black), accent (Luma dark yellow), primary_outline, secondary_outline, white_outline, dark_outline (Luma dark green outline), heading-colour outline (Luma black outline). Defaults come from our current light-scheme button colours (white/white-outline from the current dark-scheme secondary/secondary-outline colours). Our current shared button values (font size 16, weight 500, line-height 1.25, letter-spacing 0, border 2, radius 24, padding 12/32, mobile 10/24, gap 16) become each variant's defaults. Line-height, letter-spacing, mobile padding and gap have no Luma slot: proposed small shared "All buttons" group (flag to user). Offer all 11 variants (+ text link) in the Base Module button style and header CTA style choices.

**D. Colour schemes:** remove the `color_schemes` group. Add a small "Text on dark backgrounds" group with heading, text and link colours. When Text color resolves to Light, buttons use the white / white-outline variants (solid → white, outline → white outline; colours only). Auto / Dark / Light text colour in the Base Module keeps working. Replace `.scheme-light` in the 9 templates (blog-listing, blog-post, header-minimal, 7 system pages) with the new approach.

**E. Keep:** line heights, eyebrow, gutter, section padding S/M/L, spacing values, card radius, image radius. **Merge:** text link → Luma's "Links" group; extra form settings (placeholder, input padding, label gap, field gap, label weight, submit variant) → Luma's Forms structure (title / labels / help text / fields). **Remove:** narrow width, card shadow.

**F. Add:** `vertical_spacing`, per-heading text transform, Links font group, Website header group, Website footer group. The header/footer groups drive the Header and Footer modules; **remove those modules' own colour-scheme choices**.

**G. Colours in buttons, forms, header, footer and text-on-dark:** colour pickers that inherit a palette colour via `inherited_value`, so they follow the palette until changed.

## Findings to handle during the rebuild

- Templates with `scheme-light`: `blog-listing.html`, `blog-post.html`, `partials/header-minimal.html`, all 7 `system/*.html`.
- `header.module/module.html` builds `scheme-<choice>` from its own `style.color_scheme`; `footer.module/module.html` uses `scheme-{{ s.color_scheme or 'dark' }}`. Both choices get removed (F).
- Base Module `fields.json` inherits `theme.colors.dark_bg.*` (background colour, overlay colour, gradient end) and `theme.colors.secondary.color` (gradient start): repoint to `theme.global_colors.dark.color` / `theme.global_colors.secondary.color`. Its `module.html` Auto text colour reads `theme.colors.*` and `theme.color_schemes.light/dark` (page bg, dark text, light text): repoint to the new paths (body text colour, text-on-dark text colour, white).
- `.container-narrow` (uses `--narrow-width`) is used by `blog-post.html` and all system pages. Narrow width is being removed → decide a replacement (e.g. a value derived from the container width) and flag it.
- `--shadow-md` is used by the header dropdown; `--card-shadow` is unused. Keep `--shadow-md` as a static derived value when the card shadow setting is removed.
- Footer default today is dark (dark bg, white text). The footer CSS relies on `--scheme-*` variables; the new footer group (text + background) must feed them.
- `main.css` lines 1–51 hold the whole settings → CSS-variable layer (tokens, `scheme_vars` macro, button variables); button classes at `{# Buttons #}`, forms at `{# Forms #}`, header at `{# Header #}`, footer at `{# Footer #}`.

## Remaining steps

1. Rebuild `theme/fields.json` (decisions A–G).
2. Rewrite the settings layer of `main.css` and every affected rule; update templates and the Base, Header and Footer modules.
3. Run the local checks (no CSS comments, no identity names, no !important, valid JSON, nesting ≤5, no text/file/richtext in theme settings or Style tabs, no field named body/label, no cta fields, approved breakpoints only, selectors ≤3 levels, HubL blocks balanced, JS syntax).
4. Update CLAUDE.md (design tokens, Phase 2 decisions, Base Module spec) and the README (re-skin steps incl. "When you change Primary, update Primary dark too", sandbox checklist).
5. Show the user the final settings tree and wait for OK, then upload with `--account=WLIQ` and commit on `phase-3-base-module`.

## Other open items (not part of this rebuild)

- **Part 3 testing:** waiting for the user's test page URL on the WLIQ portal. Then use Playwright to check console errors, failed requests (404s, blocked fonts) and horizontal scroll at 1440 / 1366 / 1200 / 991 / 767 / 360, take screenshots, and list visual differences. Playwright was installed in a session scratch folder that may be gone; reinstall in a scratch folder with `npm i playwright` and `npx playwright install chromium`.
- **Swiper:** the `{% raw %}` fix is committed and uploaded; confirming the served (HubL-processed) file on a live page still needs the test URL.
- **Adobe kit:** add the WLIQ portal's domains (incl. the HubSpot preview domain) to kit `kwi4rat` in Adobe Fonts; the kit uses `font-display: auto` (our rule is swap).
