# Read Flow Handoff

## Workspace
- Repo: `/Volumes/Humboldt/marc-data/src/readflow`
- Branch: `codex/redesign-v3-1`
- Focus stream: v3 mock-aligned UI parity (`v3.2.x`)

## Read First In New Session
1. `AGENTS.md`
2. `HANDOFF.md`
3. `NEW_INSTANCE_PROMPT.md`
4. `POSTPONED_UI_WORK.md`
5. `ui.js`

## Session Progress (Completed)
1. Ran local browser checks against `http://localhost:8790` for:
- `/` (Find)
- `/player`
- `/deleted`

2. Captured screenshots:
- Desktop:
  - `readflow-desktop-find.png`
  - `readflow-desktop-player.png`
  - `readflow-desktop-history.png`
- Mobile (390x844):
  - `readflow-mobile-find.png`
  - `readflow-mobile-player.png`
  - `readflow-mobile-history.png`
  - `readflow-mobile-history-fixed.png` (after fix)

3. Fixed one responsive bug in `ui.js`:
- Mobile `/deleted` toolbar clipped the sort segmented control.
- Added targeted `@media (max-width: 600px)` rules for `#deleted-top-controls` to:
  - stack search + clear + sort cleanly
  - make sort toggle full-width with 3 equal columns
  - avoid horizontal clipping

## Remaining Work
1. Final visual polish pass vs v3 mock (spacing/type fine-tuning)
2. Behavior deep pass for deleted-history actions and player interactions
3. Test pass (`npm test`) in this workspace and capture failures if any
4. Deploy when approved and verify `/api/version`

## Constraints / Rules
- Every new `VERSION_HISTORY` entry in `worker.js` must include:
  - `version`
  - `completedAt` (`YYYY-MM-DD`)
  - `note`
- Patch bump for minor fixes; minor bump for larger feature shifts
- Do not revert unrelated dirty files in the working tree

## Quick Commands
- Start local dev: `npx wrangler dev --port 8790`
- Run tests: `npm test`
- Deploy: `npm run deploy`
