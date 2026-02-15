# New Codex Instance Prompt (Copy/Paste)

Resume Read Flow redesign from the current branch.

## Workspace
Use this as cwd:
`/Volumes/Humboldt/marc-data/src/readflow`

## Read First
1. `AGENTS.md`
2. `HANDOFF.md`
3. `NEW_INSTANCE_PROMPT.md`
4. `POSTPONED_UI_WORK.md`
5. `ui.js`

## Current State
- App tabs/order: **Find**, **Player**, **History**
- Local browser parity pass completed for desktop + iPhone width
- Mobile history sort control clipping fixed in `ui.js`
- Latest proof screenshot after fix: `readflow-mobile-history-fixed.png`

## Immediate Objective
Continue v3 visual parity and then behavior hardening:
1. final spacing/typography polish vs mock
2. behavior checks for player and deleted-history actions
3. run tests and record results
4. prepare deploy when approved

## Guardrails
- Preserve behavior unless explicitly changing it
- Do not revert unrelated dirty files
- Versioning:
  - patch bump for minor fixes
  - minor bump for larger feature additions
- Every `VERSION_HISTORY` entry in `worker.js` must include:
  - `version`
  - `completedAt` (`YYYY-MM-DD`)
  - `note`

## Commands
Start local dev:
```bash
npx wrangler dev --port 8790
```

Run tests:
```bash
npm test
```

Deploy:
```bash
npm run deploy
```

## Acceptance Criteria (current pass)
1. No obvious overflow/cropping in Find/Player/History on desktop and iPhone-width
2. History top toolbar controls remain fully usable at narrow widths
3. Player controls remain usable without cramped targets
4. Provide updated screenshots + concise recommendations
