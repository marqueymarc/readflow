# Read Flow

Bulk delete or archive old Readwise Reader items with restoration support.

## Features

- **Delete or Archive** selected preview items (with large-selection batching)
- **Target specific streams**: Inbox, Later, Shortlist, or Feed
- **Preview** items before taking action
- **Date range filtering** with start/end dates and quick-date shortcuts
- **Search within preview** and bulk-select filtered results
- **Route-backed tabs** (`/`, `/deleted`, `/settings`, `/about`) for back/forward navigation
- **Restoration**: Keeps a history of deleted items with URLs/titles so you can re-add them
- **Doesn't affect archived items** - only processes items in the selected location
- **Predeploy gates** to catch UI/script regressions before deployment

## Deploy

1. **Create KV namespace:**
   ```bash
   wrangler kv namespace create "KV"
   ```

2. **Update wrangler.toml** with the namespace ID from step 1

3. **Add your Readwise token:**
   ```bash
   wrangler secret put READWISE_TOKEN
   ```
   (Get your token from https://readwise.io/access_token)

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Run gated deploy (recommended):**
   ```bash
   npm run deploy
   ```
   This runs:
   - `npm run check:ui` (rendered client script syntax check)
   - `npm run check:browser` (non-destructive browser smoke, includes 57-item batching check)
   - `wrangler deploy`

6. **Optional direct deploy (skips gates):**
   ```bash
   wrangler deploy
   ```

## Usage

1. Open your deployed URL
2. Select a location (Inbox, Later, Shortlist, or Feed)
3. Choose an end date (and optional start date) using picker/shortcuts
4. Click "Preview" to load matching articles
5. Optionally search/filter preview results
6. Select items (all preview items are selected by default)
7. Click "Delete Selected" or "Archive Selected" to process

### Batch Processing Notes

- Cleanup requests are sent in batches of 20 selected IDs.
- Large actions (for example 57 selected items) process as `20 / 20 / 17`.
- UI removes only successfully acted-on items from the preview list.

### Restoring Deleted Items

1. Switch to the "Deleted History" tab
2. Check the items you want to restore
3. Click "Restore Selected"

Items are restored by adding the URL back to Readwise Reader.

## Tests

```bash
npm install
npm test
```

Current suite: `worker.test.js` plus deploy gates:

```bash
npm run check:ui
npm run check:browser
```

Note: in some local environments, `vitest` worker runtime can be fragile when the project path contains spaces. Running tests from a no-space path (for example `/tmp/readwise-cleanup-deploy`) is a reliable workaround.

## Handoff Docs

- `HANDOFF.md` - full technical/project handoff for new instances
- `POSTPONED_UI_WORK.md` - deferred UI/layout work and suggestions
- `NEW_INSTANCE_PROMPT.md` - copy/paste bootstrap prompt for a new Codex instance
