# Readwise Cleanup

Bulk delete or archive old Readwise Reader items with restoration support.

## Features

- **Delete or Archive** items older than a given date
- **Target specific streams**: Inbox, Later, Shortlist, or Feed
- **Preview** items before taking action
- **Restoration**: Keeps a history of deleted items with URLs/titles so you can re-add them
- **Doesn't affect archived items** - only processes items in the selected location
- **Nice UI** with quick date buttons (1 week, 1 month, 3 months, etc.)

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

4. **Deploy:**
   ```bash
   wrangler deploy
   ```

## Usage

1. Open your deployed URL
2. Select a location (Inbox, Later, Shortlist, or Feed)
3. Choose a cutoff date using the picker or quick buttons
4. Click "Count Items" to see how many will be affected
5. Click "Preview" to see the specific articles
6. Click "Delete All" or "Archive All" to process

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

32 tests covering API validation, KV storage, CORS, and UI rendering.
