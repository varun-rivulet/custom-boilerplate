# QA harness

Automated sandbox testing for the theme. One command uploads the theme, seeds QA content through the HubSpot API, republishes it, runs Playwright checks and writes a report.

## Setup (once)

1. Private App in the test portal (51597413) with the scopes `content`, `forms` and `files`. Put its token in `.env` at the repo root: `HUBSPOT_QA_TOKEN=...`. `.env` is gitignored and hsignored; the harness never prints the token.
2. `cd qa && npm install`. Playwright uses an installed Chromium; if none is found, run `npx playwright install chromium`.
3. Manual portal setup (no public API exists for these):
   - Navigation menu "QA – Menu" with sub-items (incl. a no-URL parent, a new-tab item and the QA – Base Module page), selected in the global Header, plus a header button.
   - Global Header – Simple: a header button.
   - Global Footer: menu columns (one without a heading), social links (incl. "Other"), legal links, contact items.
   - Blog "QA – Blog" using the custom-boilerplate listing and post templates.
   - Settings → Website → Pages → System pages: 404 template = `custom-boilerplate/templates/system/404.html`.

## Run

```
cd qa
npm run qa              # upload → seed → republish → test → report → README status
npm run qa:no-upload    # skip the theme upload
npm run qa:no-readme    # don't rewrite the README status block
```

The report is written to `qa/reports/<timestamp>/report.md` with screenshots (gitignored). The README "Sandbox test checklist" status block (between the `qa-status` markers) is rewritten each run.

## Safety

- The token must belong to portal 51597413 (checked before any call); `hs` always runs with `--account=51597413`.
- Every create, update, publish or upload goes through the write guard in `lib/guard.js`: the object's name must start with the `QA_PREFIX` constant from `config.js` ("QA –", en dash, plus a space). Files go only to the `/QA` folder. Nothing is ever deleted.
- QA pages are noindex (`<meta name="robots">` in the page head HTML), use `qa-auto-*` slugs and are never added to menus.
- The page `/qa-base-module` is only read, to copy HubSpot's Base Module layout format; it is never changed.

## How republishing works

Each run writes `<meta name="qa-build" content="<commit>-<time>">` into every QA page and post and pushes it live, then waits until the live HTML shows that build before testing. Test URLs also get a `?qa=<time>` cache-busting query. A page that never shows the build fails the "serves this build" check instead of giving stale results.

## Files

- `config.js`: portal, site URL, `QA_PREFIX`, widths.
- `lib/`: API client (`hubspot.js`), write guard, `.env` loader, Chromium launcher, test image generator.
- `seed/`: Base Module section specs with expected results (`sections.js`), layout builder, seeding and republishing.
- `tests/`: Playwright checks, grouped by README sandbox check number.
- `report.js`: report and README status block.
