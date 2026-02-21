import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SELF, env } from 'cloudflare:test';
import { extractDomain, buildTtsText, pickBestGmailOpenUrl, pickBestGmailThumbnailUrl, deriveOpenUrl } from './worker.js';

describe('extractDomain', () => {
  it('extracts domain from valid URL', () => {
    expect(extractDomain('https://www.example.com/article')).toBe('example.com');
  });

  it('removes www prefix', () => {
    expect(extractDomain('https://www.nytimes.com/2024/article')).toBe('nytimes.com');
  });

  it('handles URLs without www', () => {
    expect(extractDomain('https://substack.com/article')).toBe('substack.com');
  });

  it('handles subdomains', () => {
    expect(extractDomain('https://blog.example.com/post')).toBe('blog.example.com');
  });

  it('returns Unknown for invalid URLs', () => {
    expect(extractDomain('not-a-url')).toBe('Unknown');
  });

  it('returns Unknown for null', () => {
    expect(extractDomain(null)).toBe('Unknown');
  });

  it('returns Unknown for undefined', () => {
    expect(extractDomain(undefined)).toBe('Unknown');
  });

  it('returns Unknown for empty string', () => {
    expect(extractDomain('')).toBe('Unknown');
  });
});

describe('buildTtsText', () => {
  it('keeps full HTML body text even when it contains the summary', () => {
    const article = {
      title: 'Example Story',
      summary: 'This is a short summary sentence.',
      content: 'This is a short summary sentence.',
      html_content: '<p>This is a short summary sentence. This is the longer full body that should remain for TTS playback.</p>',
    };
    const text = buildTtsText(article);
    expect(text).toContain('This is the longer full body that should remain for TTS playback.');
  });

  it('drops short duplicate summary when a longer body already contains it', () => {
    const article = {
      summary: 'Shared intro sentence.',
      content: 'Shared intro sentence. Then a much longer section of unique content that should be spoken once.',
    };
    const text = buildTtsText(article);
    const matches = text.match(/Shared intro sentence\./g) || [];
    expect(matches.length).toBe(1);
  });

  it('removes repeated extracted lead sentence and boilerplate browser text', () => {
    const article = {
      title: 'Money Stuff: Insider Trading on War',
      author: 'Matt Levine',
      content: 'View in browser Insider trading, I often say around here, is not about fairness; it is about theft. Insider trading, I often say around here , is not about fairness; it is about theft. The problem with insider trading is not that you have information.',
    };
    const text = buildTtsText(article);
    expect(text).not.toMatch(/View in browser/i);
    const matches = text.match(/Insider trading, I often say around here,? is not about fairness; it is about theft\./gi) || [];
    expect(matches.length).toBe(1);
  });

  it('strips URLs, emails, and long machine-like numbers from spoken text', () => {
    const article = {
      content: 'See https://example.com/report and www.example.org. Contact test.user@example.com id 1234-5678-9012-3456 should not be read.',
    };
    const text = buildTtsText(article);
    expect(text).not.toMatch(/https?:\/\//i);
    expect(text).not.toMatch(/\bwww\./i);
    expect(text).not.toMatch(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i);
    expect(text).not.toContain('1234-5678-9012-3456');
  });

  it('includes image captions extracted from HTML figcaptions and alt text', () => {
    const article = {
      html_content: '<figure><img src="x.jpg" alt="A lighthouse at dawn"></figure><figcaption>Harbor traffic before sunrise</figcaption>',
    };
    const text = buildTtsText(article);
    expect(text).toContain('Image caption: A lighthouse at dawn');
    expect(text).toContain('Image caption: Harbor traffic before sunrise');
  });

  it('strips gmail newsletter boilerplate while keeping core body text', () => {
    const article = {
      site_name: 'gmail',
      title: 'Daily Brief',
      content: 'View in browser. If you are having trouble viewing this email click here. Main market update: earnings season is broadening. Manage your preferences. Unsubscribe here.',
    };
    const text = buildTtsText(article);
    expect(text).toContain('Main market update: earnings season is broadening.');
    expect(text).not.toMatch(/view in browser/i);
    expect(text).not.toMatch(/manage your preferences/i);
    expect(text).not.toMatch(/unsubscribe/i);
  });

  it('removes email header fields in gmail content', () => {
    const article = {
      site_name: 'gmail',
      content: 'From: Team Example Subject: Morning Note Date: Tue, 17 Feb 2026 Here is the actual analysis paragraph you should hear.',
    };
    const text = buildTtsText(article);
    expect(text).toContain('Here is the actual analysis paragraph you should hear.');
    expect(text).not.toMatch(/\bFrom:/i);
    expect(text).not.toMatch(/\bSubject:/i);
  });

  it('strips raw html scaffolding when email content is html-heavy', () => {
    const article = {
      site_name: 'gmail',
      title: 'DealBook: Game on for Paramount',
      author: 'Andrew Ross Sorkin',
      content: '<!DOCTYPE html><html><head><style>.x{}</style></head><body><div>DealBook: Game on for Paramount.</div><table><tr><td>Also, Goldman Sachs backtrack on D.E.I.</td></tr></table></body></html>',
    };
    const text = buildTtsText(article);
    expect(text).toContain('DealBook: Game on for Paramount.');
    expect(text).toContain('Also, Goldman Sachs backtrack on D.E.I.');
    expect(text).not.toMatch(/<!DOCTYPE|<html|<head|<table|<tr|<td/i);
  });

  it('uses article-body extraction for html newsletters/readwise pages', () => {
    const article = {
      site_name: 'readwise',
      title: 'Morning Brief',
      html_content: `
        <!DOCTYPE html>
        <html><body>
          <header>Home Markets Opinion</header>
          <nav>Menu About Contact</nav>
          <article>
            <h1>Morning Brief</h1>
            <p>Core insight paragraph one about macro conditions.</p>
            <p>Core insight paragraph two with portfolio implications.</p>
          </article>
          <footer>Unsubscribe | Manage preferences</footer>
        </body></html>`,
    };
    const text = buildTtsText(article);
    expect(text).toContain('Core insight paragraph one about macro conditions.');
    expect(text).toContain('Core insight paragraph two with portfolio implications.');
    expect(text).not.toMatch(/<!DOCTYPE|<html|<nav|<footer/i);
  });
});

describe('gmail extraction helpers', () => {
  it('prefers newsletter content links over unsubscribe links', () => {
    const html = '<a href="https://example.com/unsubscribe?u=1">Unsubscribe</a><a href="https://news.example.com/p/market-wrap">Read story</a>';
    const openUrl = pickBestGmailOpenUrl({ htmlContent: html, fallbackUrl: 'https://mail.google.com/mail/u/0/#all/abc', subject: 'Daily digest' });
    expect(openUrl).toBe('https://news.example.com/p/market-wrap');
  });

  it('extracts non-tracker thumbnail from html images', () => {
    const html = '<img src="https://cdn.example.com/pixel.gif"><img src="https://cdn.example.com/header.jpg">';
    const thumb = pickBestGmailThumbnailUrl(html);
    expect(thumb).toBe('https://cdn.example.com/header.jpg');
  });
});

describe('readwise email-like handling', () => {
  it('avoids arbitrary first-link fallback for forwarded email-like readwise items', () => {
    const article = {
      title: 'Fwd: IrregEx update',
      url: 'https://read.readwise.io/read/abc123',
      html_content: '<p>Begin forwarded message:</p><a href=\"https://en.wikipedia.org/wiki/Everything_Everywhere_All_at_Once\">wiki</a>',
    };
    expect(deriveOpenUrl(article)).toBe('https://read.readwise.io/read/abc123');
  });

  it('applies email boilerplate cleanup even when source is not gmail', () => {
    const article = {
      title: 'Fwd: Portfolio update',
      content: 'Begin forwarded message: From: Partner Subject: Fund update Main thesis: portfolio companies are growing with solid net retention. Manage your preferences. Unsubscribe here.',
      site_name: '',
    };
    const text = buildTtsText(article);
    expect(text).toContain('Main thesis: portfolio companies are growing with solid net retention.');
    expect(text).not.toMatch(/begin forwarded message/i);
    expect(text).not.toMatch(/unsubscribe/i);
  });
});

describe('API Endpoints', () => {
  beforeEach(async () => {
    // Clear KV
    await env.KV.put('deleted_items', JSON.stringify([]));
    await env.KV.put('settings', JSON.stringify({
      defaultSource: 'readwise',
      defaultLocation: 'new',
      defaultDays: 30,
      previewLimit: 100,
      confirmActions: true,
      mockTts: true,
      audioBackSeconds: 15,
      audioForwardSeconds: 30,
      playerAutoNext: true,
      playerAutoAction: 'none',
    }));
    await env.KV.delete('custom_readwise_token');
    await env.KV.delete('custom_openai_key');
  });

  describe('GET /api/locations', () => {
    it('returns available locations', async () => {
      const res = await SELF.fetch('https://example.com/api/locations');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.locations).toContain('new');
      expect(data.locations).toContain('later');
      expect(data.locations).toContain('shortlist');
      expect(data.locations).toContain('feed');
      expect(data.locations).toContain('archive');
    });
  });

  describe('GET /api/count', () => {
    it('returns 400 without date range', async () => {
      const res = await SELF.fetch('https://example.com/api/count?location=new');
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Missing date range');
    });

    // Skip test that requires network access to Readwise
    it.skip('includes location and beforeDate in response (requires network)', async () => {
      const res = await SELF.fetch('https://example.com/api/count?location=new&before=2024-01-01');
      expect(res.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('GET /api/preview', () => {
    it('returns 400 without date range', async () => {
      const res = await SELF.fetch('https://example.com/api/preview?location=new');
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Missing date range');
    });
  });

  describe('POST /api/cleanup', () => {
    it('returns 400 with missing fields', async () => {
      const res = await SELF.fetch('https://example.com/api/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: 'new' }),
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('returns 400 with invalid action', async () => {
      const res = await SELF.fetch('https://example.com/api/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'new',
          beforeDate: '2024-01-01',
          action: 'invalid',
        }),
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Action must be delete, archive, or restore');
    });

    it('returns 400 with empty ids array', async () => {
      const res = await SELF.fetch('https://example.com/api/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'new',
          beforeDate: '2024-01-01',
          action: 'archive',
          ids: [],
        }),
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('No item IDs provided');
    });

    // Skip tests that require network access to Readwise
    it.skip('accepts delete action (requires network)', async () => {
      const res = await SELF.fetch('https://example.com/api/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'new',
          beforeDate: '2024-01-01',
          action: 'delete',
        }),
      });
      expect(res.headers.get('content-type')).toContain('application/json');
    });

    it.skip('accepts archive action (requires network)', async () => {
      const res = await SELF.fetch('https://example.com/api/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'new',
          beforeDate: '2024-01-01',
          action: 'archive',
        }),
      });
      expect(res.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('GET /api/deleted', () => {
    it('returns empty array initially', async () => {
      const res = await SELF.fetch('https://example.com/api/deleted');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.items).toEqual([]);
    });

    it('returns stored deleted items', async () => {
      const testItems = [
        { id: '1', title: 'Test Article', url: 'https://example.com' },
      ];
      await env.KV.put('deleted_items', JSON.stringify(testItems));

      const res = await SELF.fetch('https://example.com/api/deleted');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].title).toBe('Test Article');
    });
  });

  describe('POST /api/restore', () => {
    it('returns 400 without URLs', async () => {
      const res = await SELF.fetch('https://example.com/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('No URLs provided');
    });

    it('returns 400 with empty array', async () => {
      const res = await SELF.fetch('https://example.com/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: [] }),
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('No URLs provided');
    });
  });

  describe('POST /api/clear-deleted', () => {
    it('clears deleted items', async () => {
      // Add some items first
      await env.KV.put('deleted_items', JSON.stringify([{ id: '1' }, { id: '2' }]));

      const res = await SELF.fetch('https://example.com/api/clear-deleted', {
        method: 'POST',
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.cleared).toBe(true);

      // Verify cleared
      const stored = await env.KV.get('deleted_items');
      expect(JSON.parse(stored)).toEqual([]);
    });

    it('clears only selected URLs when urls are provided', async () => {
      await env.KV.put('deleted_items', JSON.stringify([
        { id: '1', url: 'https://example.com/1', title: 'One' },
        { id: '2', url: 'https://example.com/2', title: 'Two' },
        { id: '3', url: 'https://example.com/3', title: 'Three' },
      ]));

      const res = await SELF.fetch('https://example.com/api/clear-deleted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: ['https://example.com/2'] }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.cleared).toBe(true);
      expect(data.scope).toBe('selected');
      expect(data.removed).toBe(1);

      const stored = await env.KV.get('deleted_items');
      const parsed = JSON.parse(stored);
      expect(parsed).toHaveLength(2);
      expect(parsed.find((item) => item.url === 'https://example.com/2')).toBeFalsy();
    });

    it('clears only selected entries when keys are provided', async () => {
      const items = [
        { id: 'same', url: 'https://example.com/shared', title: 'A', deletedAt: '2026-02-17T10:00:00.000Z', savedAt: '2026-02-10T10:00:00.000Z' },
        { id: 'same', url: 'https://example.com/shared', title: 'B', deletedAt: '2026-02-17T11:00:00.000Z', savedAt: '2026-02-10T10:00:00.000Z' },
      ];
      await env.KV.put('deleted_items', JSON.stringify(items));
      const key = ['same', 'https://example.com/shared', '2026-02-17T10:00:00.000Z', '2026-02-10T10:00:00.000Z', 'A'].join('|');

      const res = await SELF.fetch('https://example.com/api/clear-deleted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: [key] }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.cleared).toBe(true);
      expect(data.scope).toBe('selected');
      expect(data.removed).toBe(1);

      const stored = await env.KV.get('deleted_items');
      const parsed = JSON.parse(stored);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].title).toBe('B');
    });
  });

  describe('GET/POST /api/settings', () => {
    it('returns persisted settings', async () => {
      await env.KV.put('settings', JSON.stringify({
        defaultLocation: 'later',
        defaultDays: 45,
        previewLimit: 120,
        confirmActions: false,
      }));

      const res = await SELF.fetch('https://example.com/api/settings');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.settings.defaultSource).toBe('readwise');
      expect(data.settings.defaultLocation).toBe('later');
      expect(data.settings.defaultDays).toBe(45);
      expect(data.settings.previewLimit).toBe(120);
      expect(data.settings.confirmActions).toBe(false);
    });

    it('saves and sanitizes settings values', async () => {
      const res = await SELF.fetch('https://example.com/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultSource: 'invalid-source',
          defaultLocation: 'invalid-location',
          defaultDays: -10,
          previewLimit: 9999,
          confirmActions: 'not-a-bool',
          audioBackSeconds: -99,
          audioForwardSeconds: 9999,
        }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.saved).toBe(true);
      expect(data.settings.defaultSource).toBe('readwise');
      expect(data.settings.defaultLocation).toBe('invalid-location');
      expect(data.settings.defaultDays).toBe(1);
      expect(data.settings.previewLimit).toBe(500);
      expect(data.settings.confirmActions).toBe(true);
      expect(data.settings.mockTts).toBe(true);
      expect(data.settings.audioBackSeconds).toBe(5);
      expect(data.settings.audioForwardSeconds).toBe(180);
      expect(data.settings.maxOpenTabs).toBe(5);
      expect(data.settings.playerAutoNext).toBe(true);
      expect(data.settings.playerAutoAction).toBe('none');
      expect(data.settings.gmailSelectedLabels).toEqual([]);
    });
  });

  describe('GET /api/version', () => {
    it('returns API version', async () => {
      const res = await SELF.fetch('https://example.com/api/version');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.version).toBe('3.3.23');
    });
  });

  describe('Gmail hook settings', () => {
    it('returns gmail status', async () => {
      const res = await SELF.fetch('https://example.com/api/gmail/status');
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.enabled).toBe(true);
      expect(data.mode).toBe('hook');
      expect(data.connected).toBe(false);
      expect(Array.isArray(data.selectedLabels)).toBe(true);
    });

    it('saves and returns gmail selected labels', async () => {
      const saveRes = await SELF.fetch('https://example.com/api/gmail/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labels: [] }),
      });
      const saveData = await saveRes.json();
      expect(saveRes.status).toBe(200);
      expect(saveData.saved).toBe(true);
      expect(saveData.selectedLabels).toEqual([]);

      const getRes = await SELF.fetch('https://example.com/api/gmail/labels');
      const getData = await getRes.json();
      expect(getRes.status).toBe(200);
      expect(getData.selectedLabels).toEqual([]);
    });

    it('rejects gmail label selection when oauth is not connected', async () => {
      const saveRes = await SELF.fetch('https://example.com/api/gmail/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labels: ['newsletters'] }),
      });
      const saveData = await saveRes.json();
      expect(saveRes.status).toBe(400);
      expect(saveData.error).toContain('Connect Gmail');
    });

    it('accepts gmail hook item ingestion', async () => {
      const res = await SELF.fetch('https://example.com/api/gmail/hook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              id: 'gmail-1',
              subject: 'Newsletter test',
              from: 'sender@example.com',
              text: 'Body text for gmail test',
              labels: ['newsletters'],
              date: '2026-02-14T12:00:00.000Z',
              url: 'https://mail.google.com/mail/u/0/#inbox/gmail-1',
            },
          ],
        }),
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.accepted).toBe(1);
    });

    it('returns gmail hook items in source=gmail preview', async () => {
      await SELF.fetch('https://example.com/api/gmail/hook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              id: 'gmail-preview-1',
              subject: 'Digest issue',
              from: 'digest@example.com',
              text: 'A long-form digest body',
              labels: ['newsletters'],
              date: '2026-02-13T09:00:00.000Z',
              url: 'https://mail.google.com/mail/u/0/#inbox/gmail-preview-1',
            },
          ],
        }),
      });

      const res = await SELF.fetch('https://example.com/api/preview?source=gmail&location=new&to=2026-02-15');
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.source).toBe('gmail');
      expect(data.total).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(data.preview)).toBe(true);
      expect(data.preview[0].id).toBe('gmail-preview-1');
    });

    it('returns redirect when gmail connect config is missing', async () => {
      const res = await SELF.fetch('https://example.com/api/gmail/connect', { redirect: 'manual' });
      expect(res.status).toBe(302);
      expect(res.headers.get('location')).toContain('/settings?gmail_oauth=missing_config');
    });

    it('returns popup oauth result page when popup connect config is missing', async () => {
      const res = await SELF.fetch('https://example.com/api/gmail/connect?popup=1');
      const html = await res.text();
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/html');
      expect(html).toContain('gmail-oauth-result');
      expect(html).toContain('window.opener.postMessage');
    });

    it('disconnect endpoint clears oauth token', async () => {
      await env.KV.put('gmail_oauth_token_v1', JSON.stringify({
        accessToken: 'x',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      }));
      const res = await SELF.fetch('https://example.com/api/gmail/disconnect', { method: 'POST' });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.disconnected).toBe(true);
      const stored = await env.KV.get('gmail_oauth_token_v1');
      expect(stored).toBeNull();
    });

    it('sync endpoint requires gmail connection', async () => {
      const res = await SELF.fetch('https://example.com/api/gmail/sync', { method: 'POST' });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain('Gmail is not connected');
    });

    it('gmail status reports oauth config readiness flag', async () => {
      const res = await SELF.fetch('https://example.com/api/gmail/status');
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(typeof data.oauthConfigReady).toBe('boolean');
    });
  });

  describe('API token settings', () => {
    it('returns token status', async () => {
      const res = await SELF.fetch('https://example.com/api/token-status');
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.hasToken).toBe(true);
      expect(data.source).toBe('env');
    });

    it('stores a custom token', async () => {
      const res = await SELF.fetch('https://example.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'rw_test_custom_123' }),
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.saved).toBe(true);
      expect(data.overwritten).toBe(false);
    });

    it('accepts non-rw-prefixed public token format', async () => {
      const res = await SELF.fetch('https://example.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'public_token_without_prefix_123' }),
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.saved).toBe(true);
      expect(data.overwritten).toBe(false);
    });
  });

  describe('OpenAI key settings', () => {
    it('returns OpenAI key status', async () => {
      const res = await SELF.fetch('https://example.com/api/openai-key-status');
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.hasKey).toBe(false);
      expect(data.source).toBe('none');
    });

    it('stores a custom OpenAI key', async () => {
      const res = await SELF.fetch('https://example.com/api/openai-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'sk-test-custom-123' }),
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.saved).toBe(true);
      expect(data.overwritten).toBe(false);
    });
  });

  describe('POST /api/audio/tts', () => {
    it('returns mock audio and then serves cache hit', async () => {
      const body = {
        articleId: 'article-1',
        text: 'Short mock text for audio clip.',
        voice: 'alloy',
        speed: 1,
        chunkIndex: 0,
      };

      const first = await SELF.fetch('https://example.com/api/audio/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const firstBytes = new Uint8Array(await first.arrayBuffer());
      expect(first.status).toBe(200);
      expect(first.headers.get('content-type')).toContain('audio/');
      expect(first.headers.get('X-TTS-Cache')).toBe('MISS');
      expect(first.headers.get('X-TTS-Mock')).toBe('1');
      expect(firstBytes.length).toBeGreaterThan(0);

      const second = await SELF.fetch('https://example.com/api/audio/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const secondBytes = new Uint8Array(await second.arrayBuffer());
      expect(second.status).toBe(200);
      expect(second.headers.get('X-TTS-Cache')).toBe('HIT');
      expect(second.headers.get('X-TTS-Mock')).toBe('1');
      expect(secondBytes.length).toBe(firstBytes.length);
    });

    it('does not call OpenAI endpoint in mock mode', async () => {
      const originalFetch = globalThis.fetch;
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const target = String(input);
        if (target.includes('api.openai.com')) {
          throw new Error('Unexpected OpenAI call in mock mode');
        }
        return originalFetch(input, init);
      });

      try {
        const res = await SELF.fetch('https://example.com/api/audio/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articleId: 'article-2',
            text: 'Another mock clip',
            voice: 'alloy',
            speed: 1,
            chunkIndex: 0,
          }),
        });
        expect(res.status).toBe(200);
        expect(res.headers.get('X-TTS-Mock')).toBe('1');
      } finally {
        fetchSpy.mockRestore();
      }
    });

    it('honors explicit mock=false and returns key-required error when unavailable', async () => {
      await env.KV.put('settings', JSON.stringify({
        defaultLocation: 'new',
        defaultDays: 30,
        previewLimit: 100,
        confirmActions: true,
        mockTts: true,
      }));
      await env.KV.delete('custom_openai_key');

      const res = await SELF.fetch('https://example.com/api/audio/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: 'override-real-mode',
          text: 'This should require a key in real mode.',
          mock: false,
        }),
      });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain('OpenAI key is not configured');
    });
  });

  describe('GET /favicon.ico', () => {
    it('returns a graphical favicon response', async () => {
      const res = await SELF.fetch('https://example.com/favicon.ico');
      const body = await res.text();

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('image/svg+xml');
      expect(body).toContain('<svg');
    });
  });
});

describe('PWA Serving', () => {
  it('serves HTML at root', async () => {
    const res = await SELF.fetch('https://example.com/');

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
  });

  it('contains app title', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    expect(html).toContain('Read Flow');
  });

  it('contains cleanup tab', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    expect(html).toContain('data-tab="cleanup"');
    expect(html).toContain('data-tab="deleted"');
    expect(html).toContain('href="/deleted"');
  });

  it('includes source and location selectors', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    expect(html).toContain('source-select');
    expect(html).toContain('Readwise + Gmail');
    expect(html).toContain('Inbox (New)');
    expect(html).toContain('Later');
    expect(html).toContain('Shortlist');
    expect(html).toContain('Feed');
  });

  it('includes quick date buttons', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    expect(html).toContain('Start (blank = all time)');
    expect(html).toContain('End');
    expect(html).toContain('Today');
    expect(html).toContain('All Time');
    expect(html).toContain('1 week ago');
    expect(html).toContain('1 month ago');
    expect(html).toContain('3 months ago');
  });

  it('includes preview, delete and archive buttons', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    expect(html).toContain('Find');
    expect(html).toContain('Delete');
    expect(html).toContain('Archive');
  });

  it('includes preview selection and pagination controls', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    expect(html).toContain('select-all-preview');
    expect(html).toContain('preview-prev-btn');
    expect(html).toContain('preview-next-btn');
    expect(html).toContain('preview-page-label');
    expect(html).toContain('webpage-icon');
    expect(html).toContain('preview-thumb');
    expect(html).toContain('open-selected-btn');
    expect(html).toContain('article-link');
    expect(html).toContain('preview-search');
    expect(html).toContain('preview-search-clear');
    expect(html).toContain('preview-sort-added');
    expect(html).toContain('preview-sort-published');
    expect(html).toContain('All (filtered)');
  });

  it('includes deleted-history selection controls', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    expect(html).toContain('select-all-deleted');
    expect(html).toContain('deleted-search');
    expect(html).toContain('deleted-search-clear');
    expect(html).toContain('deleted-sort-added');
    expect(html).toContain('deleted-sort-published');
    expect(html).toContain('deleted-sort-deleted');
    expect(html).toContain('Search history');
    expect(html).toContain('Restore');
    expect(html).toContain('Remove');
    expect(html).toContain('Clear All');
  });

  it('includes settings and about content', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    expect(html).toContain('Default location');
    expect(html).toContain('Default age in days');
    expect(html).toContain('Preview item limit');
    expect(html).toContain('Confirm before delete/archive actions');
    expect(html).toContain('Version');
    expect(html).toContain('v3.3.23');
    expect(html).toContain('2026-02-15');
    expect(html).toContain('text-preview-toggle');
    expect(html).toContain('play-selected-btn');
    expect(html).toContain('setting-max-open-tabs');
    expect(html).toContain('Audio Player');
    expect(html).toContain('player-auto-next');
    expect(html).toContain('player-tts-mode');
    expect(html).toContain('setting-player-auto-next');
    expect(html).toContain('setting-player-auto-action');
    expect(html).toContain('Version History');
    expect(html).toContain('Readwise API Key');
    expect(html).toContain('Gmail Source (OAuth)');
    expect(html).toContain('save-gmail-labels-btn');
    expect(html).toContain('connect-gmail-btn');
    expect(html).toContain('sync-gmail-btn');
    expect(html).toContain('/api/gmail/connect?popup=1');
    expect(html).toContain('Save API Key');
    expect(html).toContain('Mock TTS mode');
    expect(html).toContain('OpenAI API Key');
  });
});

describe('CORS', () => {
  it('handles OPTIONS request', async () => {
    const res = await SELF.fetch('https://example.com/api/locations', {
      method: 'OPTIONS',
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
  });

  it('includes CORS headers on API responses', async () => {
    const res = await SELF.fetch('https://example.com/api/locations');

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});

describe('KV Storage', () => {
  it('persists deleted items', async () => {
    const items = [
      { id: '1', title: 'Article 1', url: 'https://example.com/1' },
      { id: '2', title: 'Article 2', url: 'https://example.com/2' },
    ];

    await env.KV.put('deleted_items', JSON.stringify(items));

    const res = await SELF.fetch('https://example.com/api/deleted');
    const data = await res.json();

    expect(data.items).toHaveLength(2);
    expect(data.items[0].title).toBe('Article 1');
    expect(data.items[1].title).toBe('Article 2');
  });

  it('handles malformed JSON in KV gracefully', async () => {
    // With error handling, this should return empty array
    await env.KV.put('deleted_items', 'not-json');

    const res = await SELF.fetch('https://example.com/api/deleted');
    const data = await res.json();

    // Should return empty array due to try-catch in getDeletedItems
    expect(res.status).toBe(200);
    expect(data.items).toEqual([]);
  });
});

describe('Date filtering logic', () => {
  it('quick date buttons exist for common periods', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    expect(html).toContain('data-days="7"');  // 1 week
    expect(html).toContain('data-days="30"'); // 1 month
    expect(html).toContain('data-days="90"'); // 3 months
    expect(html).toContain('data-days="180"'); // 6 months
    expect(html).toContain('data-days="365"'); // 1 year
  });
});

describe('HTML/JavaScript validity', () => {
  it('HTML has no unclosed script tags', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    const scriptOpens = (html.match(/<script/g) || []).length;
    const scriptCloses = (html.match(/<\/script>/g) || []).length;
    expect(scriptOpens).toBe(scriptCloses);
  });

  it('HTML has no unclosed style tags', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    const styleOpens = (html.match(/<style/g) || []).length;
    const styleCloses = (html.match(/<\/style>/g) || []).length;
    expect(styleOpens).toBe(styleCloses);
  });

  it('HTML has balanced div tags', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    const divOpens = (html.match(/<div/g) || []).length;
    const divCloses = (html.match(/<\/div>/g) || []).length;
    expect(divOpens).toBe(divCloses);
  });

  it('JavaScript has no unescaped template literals', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    // Extract the script content
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    expect(scriptMatch).toBeTruthy();

    const script = scriptMatch[1];

    // Check for common escaping issues - backticks should not appear
    // since we're using string concatenation now
    const backtickCount = (script.match(/`/g) || []).length;
    expect(backtickCount).toBe(0); // No template literals in embedded JS
  });

  it('JavaScript has balanced braces', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    const script = scriptMatch[1];

    // Remove strings to avoid false positives
    const noStrings = script.replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '');

    const openBraces = (noStrings.match(/\{/g) || []).length;
    const closeBraces = (noStrings.match(/\}/g) || []).length;
    expect(openBraces).toBe(closeBraces);
  });

  it('JavaScript has balanced parentheses', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    const script = scriptMatch[1];

    // Remove strings to avoid false positives
    const noStrings = script.replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '');

    const openParens = (noStrings.match(/\(/g) || []).length;
    const closeParens = (noStrings.match(/\)/g) || []).length;
    expect(openParens).toBe(closeParens);
  });

  it('player queue rows are wired for click-to-jump', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    expect(scriptMatch).toBeTruthy();
    const script = scriptMatch[1];

    expect(script).toContain("querySelectorAll('.player-queue-row')");
    expect(script).toContain("querySelectorAll('.player-queue-jump')");
    expect(script).toContain('loadPlayerIndex(idx)');
  });

  it('player progress seeking avoids stale overwrite and routes through chunk-aware load', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    expect(scriptMatch).toBeTruthy();
    const script = scriptMatch[1];

    expect(script).toContain('async function seekPlayerQueueRowProgress(queueIdx, ratio)');
    expect(script).toContain('skipSaveCurrentProgress: isCurrent');
    expect(script).toContain('suppressLoadingStatus: suppressLoadingStatus');
    expect(script).toContain('if (!opts.skipSaveCurrentProgress) {');
    expect(script).toContain('idbFindLatestManifestForItem(itemId)');
    expect(script).toContain('idbCountDistinctChunksForItem(itemId)');
  });

  it('preview play shortcut is wired to open player without swipe capture', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    expect(scriptMatch).toBeTruthy();
    const script = scriptMatch[1];

    expect(script).toContain('play-preview-btn');
    expect(script).toContain("evt.target.closest('button')");
    expect(script).toContain('ensurePlayerItemAndPlay(match)');
  });

  it('player rows support swipe actions and auto-finish settings hooks', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    expect(scriptMatch).toBeTruthy();
    const script = scriptMatch[1];

    expect(script).toContain('runPlayerSwipeAction(queueId, action)');
    expect(script).toContain('handlePlayerPointerDown(event,this)');
    expect(script).toContain('settings.playerAutoAction');
    expect(script).toContain('runPlayerItemAction(currentIdx, action)');
    expect(script).toContain("evt.target.closest('.player-row-progress')");
    expect(script).not.toContain('Playback stopped: current item was removed.');
  });

  it('preview play forces insert-and-play in player without queue overwrite', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    expect(scriptMatch).toBeTruthy();
    const script = scriptMatch[1];

    expect(script).toContain("setActiveTab('player', { push: true, syncPlayerFromSelection: false })");
    expect(script).toContain('playerQueue = [item].concat(selected)');
    expect(script).toContain('playerLoadedItemId');
    expect(script).toContain('updatePlayerRowProgressUI(itemId)');
  });

  it('archive source maps secondary cleanup action to restore', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    expect(scriptMatch).toBeTruthy();
    const script = scriptMatch[1];

    expect(script).toContain("return isArchiveSourceSelected() ? 'restore' : 'archive'");
    expect(script).toContain("return getSecondaryCleanupAction() === 'restore' ? 'Restore' : 'Archive'");
  });

  it('player queue supports search, filtered all-toggle, and resume progress hooks', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    expect(scriptMatch).toBeTruthy();
    const script = scriptMatch[1];

    expect(html).toContain('id="player-search"');
    expect(html).toContain('id="player-select-all"');
    expect(script).toContain('saveCurrentPlayerProgress()');
    expect(script).toContain('getFilteredPlayerIndices()');
    expect(script).toContain('getPlayerItemChunks(currentItem)');
    expect(script).toContain('chunkIndex: currentChunkIndex + 1');
    expect(script).toContain("APP_STATE_STORAGE_KEY = 'readwise_cleanup_app_state_v1'");
    expect(script).toContain('applyRestoredAppState(restoredState)');
    expect(script).toContain("previewBtn.innerHTML = isOutOfDate ? 'Refresh Find' : 'Find'");
    expect(script).toContain('CLIENT_TTS_SYNTH_CHUNK_CHARS');
    expect(script).toContain('CLIENT_TTS_FIRST_CHUNK_CHARS');
    expect(script).toContain('CLIENT_TTS_SECOND_CHUNK_CHARS');
    expect(script).toContain('CLIENT_PREVIEW_CACHE_STALE_MS');
    expect(script).toContain('lastPreviewLoadedAt = Date.now()');
    expect(script).toContain('prefetchPlayerChunk(item, itemId, chunks, chunkIndex + 1)');
    expect(html).toContain('id="player-current-header"');
    expect(html).toContain('id="setting-tts-voice"');
    expect(html).toContain('id="cleanup-selected-count"');
    expect(html).toContain('id="player-selected-count"');
    expect(html).toContain('<option value="1.1">1.1x</option>');
    expect(html).toContain('<option value="1.7">1.7x</option>');
    expect(script).toContain('syncPlayerQueueAfterProcessedIds');
    expect(script).toContain("iconEl.textContent = isPlaying ? '⏸' : '▶'");
    expect(script).toContain('voice: settings.ttsVoice || ');
    expect(script).toContain('playerSpeed: Number(parseFloat(playerSpeedSelect');
    expect(script).toContain('splitTtsTextIntoChunks(fullText, maxChars, firstChunkChars, secondChunkChars)');
  });

  it('includes visible player tab and tab-based main pane scrolling', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    expect(scriptMatch).toBeTruthy();
    const script = scriptMatch[1];

    expect(html).toContain('class="rail-item tab" data-tab="player"');
    expect(html).toContain('id="main-pane"');
    expect(script).toContain("mainPane.style.overflowY = tabName === 'cleanup' ? 'hidden' : 'auto'");
  });

  it('HTML does not contain escaped backticks', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    // Should not have \\` or \` patterns which indicate escaping issues
    expect(html).not.toContain('\\`');
    expect(html).not.toContain('\\$');
  });
});

describe('Input validation', () => {
  // Skip - requires network access
  it.skip('validates missing location gracefully (requires network)', async () => {
    const res = await SELF.fetch('https://example.com/api/count?before=2024-01-01');
    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('validates cleanup request body', async () => {
    const res = await SELF.fetch('https://example.com/api/cleanup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'new',
        // missing beforeDate and action
      }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  it('validates restore request has urls array', async () => {
    const res = await SELF.fetch('https://example.com/api/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: 'not-an-array' }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
  });
});
