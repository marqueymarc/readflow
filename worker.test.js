import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SELF, env } from 'cloudflare:test';
import { extractDomain } from './worker.js';

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

describe('API Endpoints', () => {
  beforeEach(async () => {
    // Clear KV
    await env.KV.put('deleted_items', JSON.stringify([]));
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
    });
  });

  describe('GET /api/count', () => {
    it('returns 400 without before date', async () => {
      const res = await SELF.fetch('https://example.com/api/count?location=new');
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Missing before date');
    });

    // Skip test that requires network access to Readwise
    it.skip('includes location and beforeDate in response (requires network)', async () => {
      const res = await SELF.fetch('https://example.com/api/count?location=new&before=2024-01-01');
      expect(res.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('GET /api/preview', () => {
    it('returns 400 without before date', async () => {
      const res = await SELF.fetch('https://example.com/api/preview?location=new');
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Missing before date');
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
      expect(data.error).toBe('Action must be delete or archive');
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

    expect(html).toContain('Readwise Cleanup');
  });

  it('contains cleanup tab', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    expect(html).toContain('data-tab="cleanup"');
    expect(html).toContain('data-tab="deleted"');
  });

  it('includes location selector', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    expect(html).toContain('Inbox (New)');
    expect(html).toContain('Later');
    expect(html).toContain('Shortlist');
    expect(html).toContain('Feed');
  });

  it('includes quick date buttons', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    expect(html).toContain('1 week ago');
    expect(html).toContain('1 month ago');
    expect(html).toContain('3 months ago');
  });

  it('includes delete and archive buttons', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    expect(html).toContain('Delete All');
    expect(html).toContain('Archive All');
  });

  it('includes restore functionality', async () => {
    const res = await SELF.fetch('https://example.com/');
    const html = await res.text();

    expect(html).toContain('Restore Selected');
    expect(html).toContain('Clear History');
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
