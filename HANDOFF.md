# Readwise Cleanup Deploy Handoff

## Project Path
`/Users/marc/Library/Application Support/Claude/local-agent-mode-sessions/2b883275-d134-4582-be12-fdecbeaa2cdc/63515e73-7f49-4520-b1e6-b8f5b7bb6248/local_6346d824-fcdf-48aa-a695-64c1261c8c29/outputs/readwise-cleanup-deploy`

## Current State (as of 2026-02-12)
- Local code version: `1.1.15`
- Live API version: `1.1.15` (`/api/version`)
- Local gates pass:
  - `npm run check:ui`
  - `npm run check:browser`
- `vitest` is still environment-fragile in this path due module resolution/path-space behavior in worker runtime.

## Key Working Rules
- Every release must bump version (package + app + test assertions).
- Deploy via gated script only:
  - `npm run deploy`
  - This runs both gates before `wrangler deploy`.
- Preserve existing user behavior choices:
  - Preview items default selected.
  - Actions apply only to selected items.
  - Paging size follows settings `previewLimit`.

## Files That Matter Most
- `worker.js`: worker API + embedded PWA UI script + version history.
- `worker.test.js`: version/content assertions and API tests.
- `check-ui-script.mjs`: rendered-script syntax gate.
- `check-ui-browser-smoke.mjs`: browser interaction + large-selection batching smoke gate.
- `package.json`: scripts and version.

## What Was Fixed Recently
1. Script syntax/runtime stability
- Fixed generated client script parse break (`missing ) after argument list`).
- Added rendered-script syntax check so template-escape issues are caught predeploy.

2. Route and button resilience
- Added `/api/*` unknown-route JSON fallback to avoid HTML parse failures on API requests.
- Added JSON content-type guard on client parsing (`parseApiJson`).
- Added cleanup in-flight locking to prevent overlap races.

3. Preview behavior
- Clicking preview titles opens in new tab.
- Swipe/delete/archive removes only affected items from preview, not full preview reset.

4. Large selection cleanup
- Cleanup requests are batched client-side in chunks of 20 IDs.
- Designed for observed API behavior where only ~20 were processed per call.

5. Non-destructive regression coverage
- Browser smoke now simulates 57 selected items and asserts 3 cleanup calls with sizes `20/20/17`.
- This uses mocked fetch only; no destructive real deletes in smoke tests.

## Known Risk Areas
- Readwise API may partially fail per ID (429/5xx).
- Current behavior retries transient failures server-side and reports partial success.
- UI reconciliation now depends on processed/error IDs rather than only counts.

## Open/Pending Work
- See `POSTPONED_UI_WORK.md`.

## Deploy Checklist
1. Ensure sandbox root/cwd is this repo path.
2. `npm run check:ui`
3. `npm run check:browser`
4. `npm run deploy`
5. Verify:
   - `curl -sS https://readwise-cleanup.marcmeyer.workers.dev/api/version`
   - hard refresh browser (`Cmd+Shift+R`) before manual UI validation.

## Suggested Immediate Follow-up Tests (manual)
1. Select 57+ preview items and delete.
- Expect all selected processed across batches.
- Expect preview list to keep non-deleted items.

2. Deselect subset then delete twice.
- Expect no JSON parse exceptions.
- Expect second run to only act on remaining selected items.

3. Click title link in preview.
- Expect open in new tab every time.

## Skill Usage Context
When using Codex skills in this repo/session:
- Primary relevant skill: `cloudflare-deploy`
  - Use for auth check, gated deploy, and Cloudflare-specific troubleshooting.
- Other listed skills in AGENTS are optional and currently not required for core flow.

## Git/Workspace Notes
- There may be untracked `node_modules/` and `package-lock.json` depending on session setup.
- Avoid reverting unrelated local changes.
- Prefer keeping commits scoped to `worker.js`, `worker.test.js`, checks, and docs.
