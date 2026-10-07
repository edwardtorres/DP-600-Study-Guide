# Step 9 audit: spot-check, production polish, deploy, staying current, README

## Part A: spot-check of the Step 8 checkers

Full detail: section 8 of `docs/reviews/step-8-fact-check.md`.

- **Sample:** a fresh agent with no access to the Step 8 ledgers re-verified a seeded random sample of 131 "confirmed" claims (about 5%) against the live Learn pages. 71 of them were key-dependent (question keys, accepted puzzle answers, evaluator rules), with at least 15 from each of the five groups.
- **Agreement: 98.5%** (129/131); 98.6% on the key-dependent claims (70/71). That's under the 3% threshold, so Part B went ahead.
- **Both overturned claims were "unsupported", and no key changed,** so no question needed a blind re-review:
  - **FO-08:** option c's explanation now says OneLake availability is an eventhouse (KQL database) setting.
  - **Lab 1 cleanup:** now cites "Create a workspace" instead of a clean-up section that deletes the workspaces.
- **Wording tightened:** FO-25 s3 and PL-06. Notes verifiedAt dates were restamped.

## Part B: production polish

### Bundle (B1)

| | Before | After |
|---|---|---|
| JS on first load | 1 file, **1,289,782 B** (356,938 B gzip) | entry 254.6 kB + 8 small preloaded chunks ≈ 283 kB (**≈ 91 kB gzip**) |
| Largest chunk | 1,289.8 kB | `questions` 274.4 kB (69.6 kB gzip) |
| Vite 500 kB warning | yes | **gone** |
| CSS | 39.5 kB (7.6 kB gzip) | 40.6 kB (7.8 kB gzip) |

**Lazy chunks:**

| Chunk | Size |
|---|---|
| App | 51.4 kB |
| questions-prepare | 198.2 kB |
| notes | 183.1 kB |
| puzzles | 167.5 kB |
| labs | 65.6 kB |
| LabsPage | 16.2 kB |
| PuzzlePanel | 11.9 kB |
| MockCenter | 10.2 kB |
| MockExam | 8.7 kB |
| answer-key ReviewPage | 7.8 kB |
| Settings | 6.5 kB |
| WeakSpots | 4.4 kB |
| daily ReviewPage | 3.7 kB |
| Glossary | 2.5 kB |
| Badges | 1.7 kB |

**How the first load works:**
- `src/Boot.tsx` renders an inert shell (the header placeholders and the map, drawn from the save) and then lazy-loads the game.
- The four content chunks are imported in parallel first, so each evaluates in its own task. This cut Lighthouse TBT from about 250–380 ms to 70–150 ms.
- `index.html` carries a static copy of the loading header (`src/shell.html`, a Vitest file snapshot of the real `Header`), so the first paint needs no script.
- The `puzzles` chunk group no longer captures its shared dependencies. Before this fix, the first load had to fetch the 167 kB puzzles chunk to get `machines`.

### PWA and offline (B2)

- **Service worker:** `scripts/sw-plugin.ts` is adapted from AZ-900. It precaches all 40 built files under a cache versioned by content hash (`fabric-mill-<hash>`), and the app shows an "Update available, Reload" prompt.
- **Manifest and icons:** `manifest.webmanifest` (standalone) with icons at 192, 512, maskable 512, and an apple-touch icon.
- **Offline:** `e2e:prod` loads the production build, reloads under the service worker, goes offline, reloads again, and opens a machine's notes. It passes at both widths.
- **Fonts:** Fraunces and Inter are now self-hosted (`@fontsource-variable`, Latin woff2) instead of loaded from Google Fonts.
- **Install:** Settings → "Install the app" covers iPhone (Share → Add to Home Screen, then open it from the Home Screen). It also shows an Install button when Chrome or Edge offers one.

### Protecting the save (B3)

- **Persistent storage:** `navigator.storage.persist()` is requested at startup, and Settings shows the result.
  - In headless Chromium on the production build, it shows "Storage: Not persistent: the browser may clear it under storage pressure. Export regularly."
  - That's expected: Chromium grants persistence based on site engagement or installation. I couldn't test Safari here.
- **Backup banner:** appears when there's progress and no export in 7 days. "Export save" is one tap; "Later" hides it for 24 hours.
  - The timestamps live in their own key (`fabric-mill:backup`), so the save stays at v6.
  - A new save with no progress shows no banner.
- **Safari note in Settings:** "Safari may delete a site's data if you don't use it for a while. Installing Fabric Mill to your Home Screen and exporting your save regularly protect your progress."
- **Tests:** unit tests cover the banner rule, Later, the no-progress case, the persistence display, and the Safari note.

### The answer key (B4)

- The `/review` and `#/review` URL routes are removed.
- The question bank and answer key open only from Settings → "Open the question bank…", after this warning: "The question bank shows every question with its answer. Browsing it makes mocks, inspections, and reviews less meaningful."
- A unit test and `e2e:prod` cover the warning and the way back.

### Hosting config (B5): `public/staticwebapp.config.json`

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self';
  font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self';
  form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
Cross-Origin-Opener-Policy: same-origin
```

- **Why `style-src 'unsafe-inline'`:** React sets inline `style` attributes (progress bars, map positions). No inline `<script>` is allowed.
- **No external origins:** the self-hosted fonts mean the CSP needs none.
- **Caching:** `no-cache` for `/`, `index.html`, `sw.js`, and the manifest; `/assets/*` is `public, max-age=31536000, immutable`.
- **Routing:** an SPA `navigationFallback` to `/index.html` (excluding assets and files), and a `404.html` ("No such thread") for missing files.
- **Tested under the real config:** `scripts/serve-dist.ts` serves `dist/` with this file's headers, routes, fallback, and 404. `e2e:prod` asserts the headers, the deep-link fallback, the 404, and **zero CSP violations and zero console or page errors** across these screens:
  - map, notes, start-up check
  - Daily review, Weak Spots, Labs
  - Settings and the answer key
  - a full mock submitted to results
  - four puzzle types and a lab

### Error boundary (B6)

`src/components/ErrorBoundary.tsx` shows "Something went wrong", offers **Export save** (the raw `localStorage` save, so it works even if the app state is broken), and **Reload**. A unit test throws inside a child.

### Accessibility and performance (B7)

**axe** (`@axe-core/playwright`, WCAG 2.0/2.1/2.2 A and AA tags) runs after every no-side-scroll check in all six dev specs, and on every screen in `e2e:prod`. It fails on serious or critical issues. What it found, all now fixed:
- **Color contrast:** locked-node text, "madder" text (now #e2735a, with a darker `madder-deep` for white-on-color badges), and `mill-400`.
- **Target size:** source links (now `inline-block py-1`).
- **Scrollable-region-focusable:** every `<pre>` is focusable with `aria-label="Code"`.
- **Link-in-text-block:** the scaled-score note's link is underlined.
- **Low-contrast "(changing)" label** in puzzles.
- **Missing `<main>` landmark.**

**Lighthouse 13.5** (mobile preset, simulated throttling) on the production build, served with the real headers and gzip. Three runs:

| Run | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| 1 | 93 | 100 | 100 | 100 | 2.3 s | 2.4 s | 150 ms | 0.029 |
| 2 | 95 | 100 | 100 | 100 | 2.3 s | 2.3 s | 70 ms | 0.029 |
| 3 | 95 | 100 | 100 | 100 | 2.3 s | 2.3 s | 80 ms | 0.029 |

**How it got there:**
- **First run: 60.** The local server sent no gzip, and the puzzles chunk was on the critical path.
- **85:** after adding gzip to `serve-dist` (static hosts compress) and taking puzzles off the first load.
- **82, but with a crash caught:** Lighthouse caught a crash from turning off dependency capture for every chunk group. I reverted that and limited it to the puzzles group, and `e2e:prod` now opens puzzles and a lab under the CSP.
- **88–91:** after adding the static header shell, `<main>`, and `robots.txt`.
- **93–95:** after splitting content evaluation into separate tasks.

## Part C: deploy

- **`infra/main.bicep`:** a Free-tier `Microsoft.Web/staticSites`, with no repository link and no token. Outputs: `defaultHostname` and `staticWebAppName`. It matches AZ-900's template.
- **`.github/workflows/deploy.yml`** (push to main, PRs, manual), with `permissions: contents: read`:
  - **`verify` job:** `npm ci` → `npm run check` → `npm run build` (bundle check) → install Playwright Chromium → `npm run e2e` → `npm run e2e:prod`. It uploads `dist`, plus test results on failure.
  - **`deploy` job:** `needs: verify`, main only. It downloads the verified `dist` and runs `Azure/static-web-apps-deploy@v1` with `secrets.AZURE_STATIC_WEB_APPS_API_TOKEN`. While the secret is missing, it skips with a notice instead of failing.
  - **Any failing check blocks the deploy.** The token is never written or echoed.
- **`DEPLOY.md`:** the runbook. The custom-domain steps follow Learn's "Set up a custom domain in Azure Static Web Apps" and the `az staticwebapp hostname` reference.

## Part D: staying current

- **`.github/workflows/freshness.yml`:** Mondays at 06:17 UTC, plus `workflow_dispatch`. Permissions: `contents: read` and `issues: write`, using the built-in `GITHUB_TOKEN` only.
- **What it runs:** `check:freshness -- --report` and `check:content -- --live --report`.
  - The scripts write a report only for real changes: pages updated since verification, pages gone (404/410), or outline differences.
  - Each changed item lists the affected machines, questions, puzzles, and labs. An added bullet lists what sits in the same section.
  - Network errors don't cause an issue; they raise a warning.
- **Issues:** it opens an issue labelled `content-freshness`. While one is open, it comments only when the report's hash differs from the last one posted, so there are no duplicates.
- **Tested locally with a stubbed `gh`:**
  - no change → nothing
  - change → issue created
  - same report → skipped
  - different report → comment
- **Simulated outline difference:** the report correctly mapped M1.1 → `gate-keys`, its 10 questions, AM-01/02/10, and L11.
- **CLAUDE.md** now notes that the DP-600 outline changes on **October 19, 2026**, so the first run after that date matters.

## Part E: README

- `README.md` covers:
  - what the app is
  - how it was built (plan, build, audit; blind review agents; the Learn-only fact-check and the spot-check)
  - the architecture and stack
  - the checks and tests
  - screenshots (`docs/screenshots/`, 1440 and 390 px, made by `scripts/screenshots.ts` from the production build with a fixture save)
- It includes the unofficial / not-affiliated statement, a trademark notice, and the Learn attribution.
- **Repository sweep:**
  - `check:secrets` passes.
  - A grep of all tracked files and every commit message for `claude.ai`, session links, tenant domains (`onmicrosoft.com`), real hostnames, local paths, and token patterns found nothing.
  - The only email-like strings are Microsoft's fictional `@contoso.com` examples, quoted from Learn pages and used in sample data.
  - All 52 earlier commits are authored and committed by the noreply address.

## Test and check results

- **`npm run check`:** typecheck, lint (0 warnings), **275/275** unit tests, the content check, and the secrets check (238 files) all pass.
- **`npm run build`:** passes; check-bundle reports no `?seed=` or `?mock=short` hook in the 29 JS files.
- **`npm run e2e`:** **12/12** (6 flows × 2 widths) with axe.
- **`npm run e2e:prod`:** **10/10** (5 tests × 2 widths).
- **`check:freshness`** (2026-10-07): passed, no cited page changed. **`check:content -- --live`:** matches (41 bullets).

## Not done yet / needs your accounts

- **Account steps:** Azure resource, GitHub secret, Cloudflare CNAME, custom domain (checklist in the chat audit and in `DEPLOY.md`).
- **Live e2e:** waits on those steps.
- **First manual freshness run:** see the chat audit.

## Deviations and things I'm unsure of

- **The live e2e is a subset.**
  - It's the `e2e/prod/` specs: headers, CSP, fallback and 404, map, notes, start-up check, review, Weak Spots, labs, Settings and the answer key, a full mock, puzzles, offline, and the manifest.
  - The seeded dev flows (`?seed=`, `?mock=short`) can't run on production by design. They run in CI against the dev server instead.
- **The fonts are self-hosted, not from Google Fonts** (for offline use and a strict CSP). The AZ-900 app uses Google Fonts.
- **`/review` is removed rather than given an SPA fallback**, so CLAUDE.md's old Step 9 instruction is replaced.
- **Lighthouse ran against a local server.**
  - `serve-dist` gzips text the way Static Web Apps' CDN is expected to.
  - The live site's scores may differ (real network, brotli or gzip, TLS). I'll re-run Lighthouse on the live URL with the live e2e.
- **The deploy workflow also runs on pull requests** (verify only), which the prompt didn't ask for.
- **Storage persistence:** I can confirm the request and the display. I can't confirm Safari's behavior from this environment.
