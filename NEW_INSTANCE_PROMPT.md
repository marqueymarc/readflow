# New Instance Bootstrap Prompt

Paste this to a new Codex instance rooted at this repo:

---
You are resuming work on Readwise Cleanup deploy repo.

Repo path:
`/Users/marc/Library/Application Support/Claude/local-agent-mode-sessions/2b883275-d134-4582-be12-fdecbeaa2cdc/63515e73-7f49-4520-b1e6-b8f5b7bb6248/local_6346d824-fcdf-48aa-a695-64c1261c8c29/outputs/readwise-cleanup-deploy`

Read first:
1. `HANDOFF.md`
2. `POSTPONED_UI_WORK.md`
3. `worker.js`
4. `check-ui-script.mjs`
5. `check-ui-browser-smoke.mjs`

Important context:
- Local/live target is version `1.1.15` right now.
- Always rev version each release.
- Deploy only through `npm run deploy` (runs both gates).
- Large cleanup selections must batch in chunks of 20.
- Smoke test includes non-destructive 57-item batch assertion (20/20/17).

Immediate tasks:
1. Verify `npm run check:ui` and `npm run check:browser` pass.
2. If making changes, keep smoke test non-destructive and deterministic.
3. Deploy and verify `/api/version` after each release.

Use cloudflare skill:
- Primary skill: `cloudflare-deploy`.

Do not regress:
- Preview title opens in new tab.
- Repeated delete actions do not throw JSON parse errors.
- Cleanup removes only acted-on preview items from UI.
- Route-backed tabs keep browser back/forward behavior.
---
