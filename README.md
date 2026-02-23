# Read Flow

Read Flow is a queue manager and text-to-speech web app for saved stories and newsletters.

It supports Readwise Reader plus Gmail-sourced newsletter/email content, with playback-oriented workflow across Find, Player, and History.

Current app version: `3.3.27`

## Core Capabilities

- Unified **Find -> Player -> History** workflow for triage and listening
- Source-aware preview and actions for:
  - Readwise locations (`inbox`, `later`, `shortlist`, `feed`)
  - Gmail items (via OAuth + label filtering)
- Bulk actions on filtered + selected items:
  - `Play`, `Open`, `Archive`, `Delete`
- Player queue management with:
  - selection-aware auto-next
  - seekable progress bars
  - persistent playback state
  - per-item download status for offline use
- Robust TTS cleanup for newsletter/email content (reduced boilerplate/URLs/noise)
- Version history exposed through the version chip in-app

## TTS Providers

Read Flow supports two server-side TTS providers:

- `openai` (default)
- `aws_polly_standard`

Provider and voice are controlled in Settings and persisted in KV-backed app settings.

## Required and Optional Secrets

Set secrets with Wrangler:

```bash
wrangler secret put READWISE_TOKEN
wrangler secret put OPENAI_API_KEY
```

Required for core Readwise + OpenAI playback:

- `READWISE_TOKEN`
- `OPENAI_API_KEY` (unless running mock TTS mode)

Optional Gmail integration:

- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REDIRECT_URI` (optional override; defaults to `https://<origin>/api/gmail/oauth/callback`)
- `GMAIL_HOOK_SECRET` (optional for secured hook calls)

Optional AWS Polly integration:

- `AWS_ACCESS_KEY_ID` or `AWS_POLLY_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY` or `AWS_POLLY_SECRET_ACCESS_KEY`
- `AWS_REGION` or `AWS_POLLY_REGION`
- `AWS_SESSION_TOKEN` or `AWS_POLLY_SESSION_TOKEN` (optional)

## Local Development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Run predeploy checks manually:

```bash
npm run check:ui
npm run check:browser
```

## Deploy

1. Create KV namespace:

```bash
wrangler kv namespace create "KV"
```

2. Put the KV namespace ID into `wrangler.toml` for binding `KV`.
3. Add required secrets.
4. Deploy with gates (recommended):

```bash
npm run deploy
```

Equivalent direct deploy:

```bash
wrangler deploy
```

## Routes and APIs

Top-level routes:

- `/` Find
- `/player`
- `/deleted`
- `/settings`
- `/about`

Primary APIs:

- `/api/preview`, `/api/cleanup`, `/api/deleted`, `/api/restore`
- `/api/settings`, `/api/version`
- `/api/audio/tts`
- `/api/gmail/status`, `/api/gmail/connect`, `/api/gmail/oauth/callback`, `/api/gmail/disconnect`, `/api/gmail/labels`, `/api/gmail/sync`

## Repo Notes

- Repo path: `/Volumes/Humboldt/marc-data/src/readflow`
- Remote: `https://github.com/marqueymarc/readflow.git`
- Package/worker name remains `readwise-cleanup` for deployment compatibility.

## Handoff Docs

- `HANDOFF.md` - detailed project handoff
- `POSTPONED_UI_WORK.md` - deferred UI/design ideas
- `NEW_INSTANCE_PROMPT.md` - bootstrap prompt for new instances
