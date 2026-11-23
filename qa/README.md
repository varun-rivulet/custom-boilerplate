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
- **Ownership by ID:** all writes go through `lib/writer.js`. The harness only updates or publishes objects it created itself, tracked by ID in `qa/.state/created.json` (gitignored, per portal). Everything else is read-only, whatever its name. There is no lookup by name.
- **Extra layers:** harness names start with `AUTO_PREFIX` ("QA – Auto", built from the `QA_PREFIX` constant in `config.js`, en dash) and pages/posts use `qa-auto-` slugs; existing objects are re-checked before every update and publish. Files go only to `/QA`, are never overwritten and are reused by ID. Nothing is ever deleted.
- **Dry run:** `npm run qa:dry-run` lists every write without making it (`reports/<time>/write-plan.md`). The first run in a portal (no state yet) automatically does a dry run and stops; review the plan, then run `npm run qa -- --confirm-first-run`. Every real run also saves its write plan.
- QA pages are noindex (`<meta name="robots">` in the page head HTML) and never added to menus.
- The page `/qa-base-module` is only read, to copy HubSpot's Base Module layout format (cached in `.cache/`); it is never changed.

## How republishing works

Each run writes `<meta name="qa-build" content="<commit>-<time>">` into every QA page and post and pushes it live, then waits until the live HTML shows that build before testing. Test URLs also get a `?qa=<time>` cache-busting query. A page that never shows the build fails the "serves this build" check instead of giving stale results.

## Files

- `config.js`: portal, site URL, `QA_PREFIX`, widths.
- `lib/`: API client (`hubspot.js`), write guard, `.env` loader, Chromium launcher, test image generator.
- `seed/`: Base Module section specs with expected results (`sections.js`), layout builder, seeding and republishing.
- `tests/`: Playwright checks, grouped by README sandbox check number.
- `report.js`: report and README status block.

## Editor-only checks

Regular runs (`npm run qa`) use the API and headless Playwright only. Checks 2, 13, 17, 17b and 19 need the HubSpot editor. They were done once on 2026-11-23. The report shows `EDITOR CHECK DUE` when `theme/fields.json`, a module `fields.json`, the header/footer modules, the partials or `base.html` change. Then re-run the editor checks once (with changed, non-default header/footer content), and record it with `node run.js --mark-editor-done`. If the harness code itself changes, read the full report, not only the summary.

## Theme settings live check (theme-live)
`node theme-live.js [group ...]` (groups: global_colors, spacing, text, text_on_dark, buttons_group, forms, header, footer; no group = all). For each group it writes a temporary theme/fields.json with non-default values (a unique colour per colour field, +3 steps for numbers, the other option for choices), uploads it, republishes the QA pages, checks that every value reaches the served CSS and checks the rendered elements at 1920, 1440, 1366, 1200, 991, 767 and 360. It always restores the real fields.json (try/finally, copy kept in .state/fields.json.real; `node theme-live.js --restore` restores by hand) and uploads it again. Run `node theme-live.js --baseline` after a normal `npm run qa` first. Values saved in the portal's theme editor override the defaults: those fields show NOT APPLIED or FAIL (never a false pass) and must be reset in the theme editor to be tested. Never commit while a run is in progress.
