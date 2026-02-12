// Readwise Cleanup - Cloudflare Worker with embedded PWA
// Bulk delete/archive old Readwise Reader items with restoration support

const APP_VERSION = '1.1.1';
const DEFAULT_SETTINGS = {
  defaultLocation: 'new',
  defaultDays: 30,
  previewLimit: 100,
  confirmActions: true,
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // API Routes
      if (url.pathname === '/api/locations') {
        return handleGetLocations(env, corsHeaders);
      }
      if (url.pathname === '/api/count') {
        return handleGetCount(request, env, corsHeaders);
      }
      if (url.pathname === '/api/preview') {
        return handlePreview(request, env, corsHeaders);
      }
      if (url.pathname === '/api/cleanup') {
        return handleCleanup(request, env, corsHeaders);
      }
      if (url.pathname === '/api/deleted') {
        return handleGetDeleted(env, corsHeaders);
      }
      if (url.pathname === '/api/restore') {
        return handleRestore(request, env, corsHeaders);
      }
      if (url.pathname === '/api/clear-deleted') {
        return handleClearDeleted(request, env, corsHeaders);
      }
      if (url.pathname === '/api/settings') {
        if (request.method === 'POST') {
          return handleSaveSettings(request, env, corsHeaders);
        }
        return handleGetSettings(env, corsHeaders);
      }
      if (url.pathname === '/api/version') {
        return handleGetVersion(corsHeaders);
      }
      if (url.pathname === '/favicon.ico') {
        return handleFavicon();
      }

      // Serve PWA
      return new Response(HTML_APP, {
        headers: { 'Content-Type': 'text/html', ...corsHeaders },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};

// Get available locations/feeds from Readwise
async function handleGetLocations(env, corsHeaders) {
  const locations = ['new', 'later', 'shortlist', 'feed'];
  return new Response(JSON.stringify({ locations }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// Count items older than date in specified location
async function handleGetCount(request, env, corsHeaders) {
  const url = new URL(request.url);
  const location = url.searchParams.get('location') || 'new';
  const beforeDate = url.searchParams.get('before');

  if (!beforeDate) {
    return new Response(JSON.stringify({ error: 'Missing before date' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const articles = await fetchArticlesOlderThan(env, location, beforeDate);

  return new Response(JSON.stringify({
    count: articles.length,
    location,
    beforeDate
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// Preview items that would be affected
async function handlePreview(request, env, corsHeaders) {
  const url = new URL(request.url);
  const location = url.searchParams.get('location') || 'new';
  const beforeDate = url.searchParams.get('before');

  if (!beforeDate) {
    return new Response(JSON.stringify({ error: 'Missing before date' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const articles = await fetchArticlesOlderThan(env, location, beforeDate, { withHtmlContent: true });
  const preview = articles.map(a => ({
    id: a.id,
    title: a.title || 'Untitled',
    author: a.author || 'Unknown',
    url: deriveOpenUrl(a),
    savedAt: a.saved_at,
    site: extractDomain(a.source_url || a.url),
    thumbnail: location === 'feed' ? getArticleThumbnail(a) : null
  }));

  return new Response(JSON.stringify({
    total: articles.length,
    preview,
    showing: preview.length
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// Perform cleanup (delete or archive)
async function handleCleanup(request, env, corsHeaders) {
  const body = await request.json();
  const { location, beforeDate, action, ids } = body;

  if (!location || !beforeDate || !action) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (!['delete', 'archive'].includes(action)) {
    return new Response(JSON.stringify({ error: 'Action must be delete or archive' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (ids !== undefined && (!Array.isArray(ids) || ids.length === 0)) {
    return new Response(JSON.stringify({ error: 'No item IDs provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  let articles = await fetchArticlesOlderThan(env, location, beforeDate);
  if (Array.isArray(ids)) {
    const idSet = new Set(ids.map((id) => String(id)));
    articles = articles.filter((article) => idSet.has(String(article.id)));
  }

  if (articles.length === 0) {
    return new Response(JSON.stringify({
      processed: 0,
      action,
      message: Array.isArray(ids) ? 'No selected articles to process' : 'No articles to process'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Store deleted items for potential restoration (only for delete action)
  if (action === 'delete') {
    const deletedItems = await getDeletedItems(env);
    const timestamp = new Date().toISOString();

    for (const article of articles) {
      deletedItems.push({
        id: article.id,
        title: article.title || 'Untitled',
        author: article.author || 'Unknown',
        url: article.source_url || article.url,
        savedAt: article.saved_at,
        deletedAt: timestamp,
        site: extractDomain(article.source_url || article.url),
        thumbnail: getArticleThumbnail(article)
      });
    }

    await env.KV.put('deleted_items', JSON.stringify(deletedItems));
  }

  // Process each article
  let processed = 0;
  let errors = [];

  for (const article of articles) {
    try {
      if (action === 'delete') {
        await deleteArticle(env, article.id);
      } else {
        await archiveArticle(env, article.id);
      }
      processed++;
    } catch (err) {
      errors.push({ id: article.id, error: err.message });
    }
  }

  return new Response(JSON.stringify({
    processed,
    errors: errors.length > 0 ? errors : undefined,
    action,
    total: articles.length
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// Get list of deleted items
async function handleGetDeleted(env, corsHeaders) {
  const deletedItems = await getDeletedItems(env);
  return new Response(JSON.stringify({ items: deletedItems }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// Restore selected items
async function handleRestore(request, env, corsHeaders) {
  const body = await request.json();
  const { urls } = body;

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return new Response(JSON.stringify({ error: 'No URLs provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  let restored = 0;
  let errors = [];

  for (const url of urls) {
    try {
      await addToReadwise(env, url);
      restored++;
    } catch (err) {
      errors.push({ url, error: err.message });
    }
  }

  // Remove restored items from deleted list
  if (restored > 0) {
    const deletedItems = await getDeletedItems(env);
    const remaining = deletedItems.filter(item => !urls.includes(item.url));
    await env.KV.put('deleted_items', JSON.stringify(remaining));
  }

  return new Response(JSON.stringify({
    restored,
    errors: errors.length > 0 ? errors : undefined
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// Clear all deleted items history or a selected subset by URL
async function handleClearDeleted(request, env, corsHeaders) {
  let urls = null;
  try {
    const bodyText = await request.text();
    if (bodyText) {
      const body = JSON.parse(bodyText);
      if (Array.isArray(body.urls)) {
        urls = body.urls;
      }
    }
  } catch {
    urls = null;
  }

  const deletedItems = await getDeletedItems(env);
  if (urls && urls.length > 0) {
    const remaining = deletedItems.filter((item) => !urls.includes(item.url));
    await env.KV.put('deleted_items', JSON.stringify(remaining));
    return new Response(JSON.stringify({
      cleared: true,
      scope: 'selected',
      removed: deletedItems.length - remaining.length,
      remaining: remaining.length,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  await env.KV.put('deleted_items', JSON.stringify([]));
  return new Response(JSON.stringify({
    cleared: true,
    scope: 'all',
    removed: deletedItems.length,
    remaining: 0,
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

async function handleGetSettings(env, corsHeaders) {
  const settings = await getSettings(env);
  return new Response(JSON.stringify({ settings }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

async function handleSaveSettings(request, env, corsHeaders) {
  const body = await request.json();
  const settings = sanitizeSettings(body);
  await env.KV.put('settings', JSON.stringify(settings));
  return new Response(JSON.stringify({ saved: true, settings }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function handleGetVersion(corsHeaders) {
  return new Response(JSON.stringify({ version: APP_VERSION }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function handleFavicon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect x="8" y="6" width="48" height="52" rx="10" fill="#4f46e5"/>
<path d="M20 40c8-1 14-7 15-15" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none"/>
<path d="M31 26h15" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
<circle cx="40" cy="42" r="8" fill="#fff"/>
<path d="M37 42l2 2 4-4" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

async function getSettings(env) {
  try {
    const stored = await env.KV.get('settings');
    if (!stored) return { ...DEFAULT_SETTINGS };
    return sanitizeSettings(JSON.parse(stored));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function sanitizeSettings(input) {
  const source = input && typeof input === 'object' ? input : {};
  const defaultLocation = ['new', 'later', 'shortlist', 'feed'].includes(source.defaultLocation)
    ? source.defaultLocation
    : DEFAULT_SETTINGS.defaultLocation;
  const defaultDays = normalizeInt(source.defaultDays, DEFAULT_SETTINGS.defaultDays, 1, 3650);
  const previewLimit = normalizeInt(source.previewLimit, DEFAULT_SETTINGS.previewLimit, 1, 500);
  const confirmActions = typeof source.confirmActions === 'boolean'
    ? source.confirmActions
    : DEFAULT_SETTINGS.confirmActions;

  return {
    defaultLocation,
    defaultDays,
    previewLimit,
    confirmActions,
  };
}

function normalizeInt(value, fallback, min, max) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}

// Helper: Fetch articles older than date from specific location
async function fetchArticlesOlderThan(env, location, beforeDate, options = {}) {
  const allArticles = [];
  let nextCursor = null;
  const cutoffDate = new Date(beforeDate);
  const withHtmlContent = options.withHtmlContent === true;

  do {
    const params = new URLSearchParams({
      location,
      pageCursor: nextCursor || '',
    });
    if (withHtmlContent) {
      params.set('withHtmlContent', 'true');
    }

    const response = await fetch(
      `https://readwise.io/api/v3/list/?${params}`,
      {
        headers: {
          Authorization: `Token ${env.READWISE_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Readwise API error: ${response.status}`);
    }

    const data = await response.json();

    // Filter articles older than cutoff date
    // Skip archived items
    const filtered = (data.results || []).filter(article => {
      const savedDate = new Date(article.saved_at);
      return savedDate < cutoffDate && article.location !== 'archive';
    });

    allArticles.push(...filtered);
    nextCursor = data.nextPageCursor;
  } while (nextCursor);

  return allArticles;
}

// Helper: Delete article from Readwise
async function deleteArticle(env, articleId) {
  const response = await fetch(
    `https://readwise.io/api/v3/delete/${articleId}/`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Token ${env.READWISE_TOKEN}`,
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    throw new Error(`Delete failed: ${response.status}`);
  }
}

// Helper: Archive article in Readwise
async function archiveArticle(env, articleId) {
  const response = await fetch(
    `https://readwise.io/api/v3/update/${articleId}/`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Token ${env.READWISE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ location: 'archive' }),
    }
  );

  if (!response.ok) {
    throw new Error(`Archive failed: ${response.status}`);
  }
}

// Helper: Add URL back to Readwise
async function addToReadwise(env, url) {
  const response = await fetch('https://readwise.io/api/v3/save/', {
    method: 'POST',
    headers: {
      Authorization: `Token ${env.READWISE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error(`Add failed: ${response.status}`);
  }
}

// Helper: Get deleted items from KV
async function getDeletedItems(env) {
  try {
    const stored = await env.KV.get('deleted_items');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Helper: Extract domain from URL
function extractDomain(url) {
  if (!url) return 'Unknown';
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'Unknown';
  }
}

function getArticleThumbnail(article) {
  return article.image_url
    || article.image
    || article.thumbnail
    || article.thumbnail_url
    || article.preview_image_url
    || article.top_image_url
    || article.article_image_url
    || article.source_image_url
    || article.lead_image_url
    || article.cover_image_url
    || article.header_image
    || article.hero_image
    || article.imageUrl
    || extractImageFromHtml(article.html_content)
    || null;
}

function deriveOpenUrl(article) {
  const sourceUrl = normalizeHttpUrl(article.source_url);
  const readwiseUrl = normalizeHttpUrl(article.url);
  const htmlUrl = extractFirstHttpUrlFromHtml(article.html_content);

  if (sourceUrl && !looksLikeEmailAddress(sourceUrl)) {
    return sourceUrl;
  }
  if (htmlUrl && !isReadwiseDomain(htmlUrl)) {
    return htmlUrl;
  }
  if (readwiseUrl) {
    return readwiseUrl;
  }
  return sourceUrl || htmlUrl || readwiseUrl || '';
}

function normalizeHttpUrl(value) {
  if (!value || typeof value !== 'string') return null;
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function isReadwiseDomain(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes('readwise.io') || host.includes('read.readwise.io');
  } catch {
    return false;
  }
}

function looksLikeEmailAddress(value) {
  return typeof value === 'string' && /^[^/\s@]+@[^/\s@]+\.[^/\s@]+$/.test(value);
}

function extractImageFromHtml(html) {
  if (!html || typeof html !== 'string') return null;
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch && ogMatch[1]) {
    const normalized = normalizeHttpUrl(ogMatch[1]);
    if (normalized) return normalized;
  }
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    const normalized = normalizeHttpUrl(imgMatch[1]);
    if (normalized) return normalized;
  }
  return null;
}

function extractFirstHttpUrlFromHtml(html) {
  if (!html || typeof html !== 'string') return null;
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  if (canonicalMatch && canonicalMatch[1]) {
    const canonical = normalizeHttpUrl(canonicalMatch[1]);
    if (canonical) return canonical;
  }

  const hrefMatches = html.match(/href=["']([^"']+)["']/ig) || [];
  for (const raw of hrefMatches) {
    const extracted = raw.replace(/^href=["']|["']$/g, '');
    const normalized = normalizeHttpUrl(extracted);
    if (!normalized) continue;
    if (isReadwiseDomain(normalized)) continue;
    return normalized;
  }
  return null;
}

const HTML_APP = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#4f46e5">
  <title>Readwise Cleanup</title>
  <link rel="icon" href="/favicon.ico" type="image/svg+xml">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --primary: #4f46e5;
      --primary-hover: #4338ca;
      --danger: #dc2626;
      --danger-hover: #b91c1c;
      --success: #16a34a;
      --warning: #f59e0b;
      --bg: #f8fafc;
      --card: #ffffff;
      --text: #1e293b;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 1rem;
    }
    .container { max-width: 840px; margin: 0 auto; }
    header {
      text-align: center;
      padding: 1.25rem 0;
      margin-bottom: 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
    .logo { width: 56px; height: 56px; }
    h1 { font-size: 1.75rem; color: var(--primary); }
    .subtitle { color: var(--text-muted); font-size: 0.9rem; }
    .card {
      background: var(--card);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }
    .card h2 {
      font-size: 1.1rem;
      margin-bottom: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }
    .form-group { margin-bottom: 0.95rem; }
    label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 0.45rem;
      color: var(--text-muted);
    }
    .checkbox-label {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      margin-bottom: 0;
      color: var(--text);
    }
    select, input[type="date"], input[type="number"] {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 1rem;
      background: var(--card);
      color: var(--text);
    }
    select:focus, input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      padding: 0.75rem 1.1rem;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-danger { background: var(--danger); color: white; }
    .btn-danger:hover { background: var(--danger-hover); }
    .btn-outline {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text);
    }
    .btn-outline:hover { background: var(--bg); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-group { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .stat {
      text-align: center;
      padding: 1rem;
      background: var(--bg);
      border-radius: 8px;
    }
    .stat-value { font-size: 1.75rem; font-weight: 700; color: var(--primary); }
    .stat-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .article-list {
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid var(--border);
      border-radius: 8px;
    }
    .article-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
    }
    .article-item:last-child { border-bottom: none; }
    .article-item input[type="checkbox"] {
      margin-top: 0.2rem;
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
    .article-info { flex: 1; min-width: 0; }
    .preview-thumb {
      width: 56px;
      height: 56px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid var(--border);
      flex: 0 0 56px;
    }
    .preview-thumb-fallback {
      width: 56px;
      height: 56px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--text-muted);
      font-size: 0.72rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 56px;
    }
    .article-title {
      font-weight: 500;
      margin-bottom: 0.2rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .article-link {
      color: inherit;
      text-decoration: none;
      display: block;
      min-width: 0;
    }
    .article-link:hover {
      text-decoration: underline;
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      min-width: 0;
    }
    .webpage-icon {
      color: var(--text-muted);
      font-size: 0.9rem;
      flex: 0 0 auto;
    }
    .article-meta { font-size: 0.8rem; color: var(--text-muted); }
    .article-site {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      background: var(--bg);
      border-radius: 4px;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .tabs {
      display: flex;
      gap: 0.25rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border);
      overflow-x: auto;
    }
    .tab {
      padding: 0.75rem 0.95rem;
      background: none;
      border: none;
      font-size: 0.9rem;
      color: var(--text-muted);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      white-space: nowrap;
    }
    .tab.active { color: var(--primary); border-bottom-color: var(--primary); }
    .tab:hover:not(.active) { color: var(--text); }
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: var(--text-muted);
    }
    .spinner {
      width: 22px;
      height: 22px;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 0.5rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .toast {
      position: fixed;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%);
      padding: 0.75rem 1.4rem;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      animation: slideUp 0.3s ease;
    }
    .toast.success { background: var(--success); }
    .toast.error { background: var(--danger); }
    .toast.warning { background: var(--warning); }
    @keyframes slideUp {
      from { transform: translate(-50%, 100%); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
    .empty {
      text-align: center;
      padding: 1.5rem;
      color: var(--text-muted);
    }
    .badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      background: var(--primary);
      color: white;
      border-radius: 10px;
      font-size: 0.75rem;
      margin-left: 0.5rem;
    }
    .quick-dates {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
      flex-wrap: wrap;
    }
    .quick-date {
      padding: 0.25rem 0.75rem;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 20px;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .quick-date:hover {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    .progress {
      height: 4px;
      background: var(--border);
      border-radius: 2px;
      overflow: hidden;
      margin-top: 1rem;
    }
    .progress-bar {
      height: 100%;
      background: var(--primary);
      transition: width 0.3s;
    }
    .inline-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .preview-top-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }
    .preview-actions {
      display: inline-flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .pagination-controls {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .preview-bottom-controls {
      display: flex;
      justify-content: center;
      margin-top: 0.75rem;
    }
    .page-label {
      font-size: 0.85rem;
      color: var(--text-muted);
      min-width: 70px;
      text-align: center;
    }
    .about-list { margin-left: 1rem; color: var(--text-muted); }
    .about-list li { margin-bottom: 0.35rem; }
    .version-badge {
      position: fixed;
      right: 0.75rem;
      bottom: 0.65rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      background: white;
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 0.25rem 0.6rem;
      box-shadow: var(--shadow);
    }
    @media (max-width: 600px) {
      .stats { grid-template-columns: repeat(2, 1fr); }
      .btn-group { flex-direction: column; }
      .btn { width: 100%; }
      .inline-controls { flex-direction: column; align-items: flex-start; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <svg class="logo" viewBox="0 0 64 64" aria-hidden="true">
        <rect x="8" y="6" width="48" height="52" rx="10" fill="#4f46e5"></rect>
        <path d="M20 40c8-1 14-7 15-15" stroke="#ffffff" stroke-width="4" stroke-linecap="round" fill="none"></path>
        <path d="M31 26h15" stroke="#ffffff" stroke-width="4" stroke-linecap="round"></path>
        <circle cx="40" cy="42" r="8" fill="#ffffff"></circle>
        <path d="M37 42l2 2 4-4" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>
      </svg>
      <h1>Readwise Cleanup</h1>
      <p class="subtitle">Bulk delete or archive old Reader items</p>
    </header>

    <div class="tabs">
      <button class="tab active" data-tab="cleanup">Cleanup</button>
      <button class="tab" data-tab="deleted">Deleted History <span id="deleted-count" class="badge" style="display:none">0</span></button>
      <button class="tab" data-tab="settings">Settings</button>
      <button class="tab" data-tab="about">About</button>
    </div>

    <div id="cleanup-tab">
      <div class="card">
        <h2>Select Items</h2>
        <div class="form-group">
          <label for="location">Location</label>
          <select id="location">
            <option value="new">Inbox (New)</option>
            <option value="later">Later</option>
            <option value="shortlist">Shortlist</option>
            <option value="feed">Feed</option>
          </select>
        </div>
        <div class="form-group">
          <label for="before-date">Items saved before</label>
          <input type="date" id="before-date">
          <div class="quick-dates">
            <span class="quick-date" data-days="7">1 week ago</span>
            <span class="quick-date" data-days="30">1 month ago</span>
            <span class="quick-date" data-days="90">3 months ago</span>
            <span class="quick-date" data-days="180">6 months ago</span>
            <span class="quick-date" data-days="365">1 year ago</span>
          </div>
        </div>
        <div class="btn-group">
          <button class="btn btn-primary" id="preview-btn">Preview Items</button>
        </div>
      </div>

      <div class="card" id="results-card" style="display:none">
        <div class="stats">
          <div class="stat">
            <div class="stat-value" id="item-count">0</div>
            <div class="stat-label">Items Found</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="location-display">-</div>
            <div class="stat-label">Location</div>
          </div>
        </div>
        <div class="preview-top-controls" id="preview-top-controls" style="display:none">
          <label class="checkbox-label"><input id="select-all-preview" type="checkbox"> All</label>
          <div class="preview-actions">
            <button class="btn btn-outline" id="open-selected-btn" disabled>Open Selected</button>
            <button class="btn btn-danger" id="delete-btn" disabled>Delete Selected</button>
            <button class="btn btn-primary" id="archive-btn" disabled>Archive Selected</button>
          </div>
        </div>
        <div id="preview-list"></div>
        <div class="preview-bottom-controls" id="preview-bottom-controls" style="display:none">
          <div class="pagination-controls">
            <button class="btn btn-outline" id="preview-prev-btn" disabled>Prev</button>
            <span class="page-label" id="preview-page-label">Page 1 / 1</span>
            <button class="btn btn-outline" id="preview-next-btn" disabled>Next</button>
          </div>
        </div>
        <div class="progress" id="progress" style="display:none">
          <div class="progress-bar" id="progress-bar" style="width: 0%"></div>
        </div>
      </div>
    </div>

    <div id="deleted-tab" style="display:none">
      <div class="card">
        <h2>Deleted Items History</h2>
        <p style="color: var(--text-muted); margin-bottom: 0.8rem; font-size: 0.9rem;">
          Select items to restore them to Reader, or remove only selected items from local history.
        </p>
        <div class="inline-controls">
          <label class="checkbox-label"><input id="select-all-deleted" type="checkbox"> Select all</label>
        </div>
        <div id="deleted-list"><div class="loading">Loading...</div></div>
        <div class="btn-group" style="margin-top: 1rem">
          <button class="btn btn-primary" id="restore-btn" disabled>Restore Selected</button>
          <button class="btn btn-outline" id="remove-selected-btn" disabled>Remove from History</button>
          <button class="btn btn-outline" id="clear-history-btn">Clear History</button>
        </div>
      </div>
    </div>

    <div id="settings-tab" style="display:none">
      <div class="card">
        <h2>Settings</h2>
        <div class="form-group">
          <label for="setting-default-location">Default location</label>
          <select id="setting-default-location">
            <option value="new">Inbox (New)</option>
            <option value="later">Later</option>
            <option value="shortlist">Shortlist</option>
            <option value="feed">Feed</option>
          </select>
        </div>
        <div class="form-group">
          <label for="setting-default-days">Default age in days</label>
          <input id="setting-default-days" type="number" min="1" max="3650">
        </div>
        <div class="form-group">
          <label for="setting-preview-limit">Preview item limit</label>
          <input id="setting-preview-limit" type="number" min="1" max="500">
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input id="setting-confirm-actions" type="checkbox">
            Confirm before delete/archive actions
          </label>
        </div>
        <div class="btn-group">
          <button class="btn btn-primary" id="save-settings-btn">Save Settings</button>
        </div>
      </div>
    </div>

    <div id="about-tab" style="display:none">
      <div class="card">
        <h2>About</h2>
        <p style="margin-bottom: 0.75rem;">Version <strong id="about-version">${APP_VERSION}</strong></p>
        <p style="margin-bottom: 0.5rem;">Features:</p>
        <ul class="about-list">
          <li>Preview old items before action.</li>
          <li>Delete or archive items by location/date.</li>
          <li>Restore deleted URLs from history.</li>
          <li>Store preferences for defaults and confirmations.</li>
        </ul>
        <p style="margin-top: 0.9rem; color: var(--text-muted);">
          Privacy: this app stores settings and deleted-item history in your Cloudflare KV namespace only.
        </p>
      </div>
    </div>
  </div>

  <div class="version-badge">v${APP_VERSION}</div>

  <script>
    var APP_VERSION = '${APP_VERSION}';
    var currentCount = 0;
    var previewData = [];
    var selectedPreviewIds = new Set();
    var previewPage = 1;
    var previewPageSize = 10;
    var deletedItems = [];
    var selectedItems = new Set();
    var lastQuery = null;
    var settings = {
      defaultLocation: 'new',
      defaultDays: 30,
      previewLimit: 100,
      confirmActions: true
    };

    var locationSelect = document.getElementById('location');
    var beforeDateInput = document.getElementById('before-date');
    var previewBtn = document.getElementById('preview-btn');
    var openSelectedBtn = document.getElementById('open-selected-btn');
    var deleteBtn = document.getElementById('delete-btn');
    var archiveBtn = document.getElementById('archive-btn');
    var resultsCard = document.getElementById('results-card');
    var itemCountEl = document.getElementById('item-count');
    var locationDisplay = document.getElementById('location-display');
    var previewList = document.getElementById('preview-list');
    var previewTopControls = document.getElementById('preview-top-controls');
    var previewBottomControls = document.getElementById('preview-bottom-controls');
    var selectAllPreview = document.getElementById('select-all-preview');
    var previewPrevBtn = document.getElementById('preview-prev-btn');
    var previewNextBtn = document.getElementById('preview-next-btn');
    var previewPageLabel = document.getElementById('preview-page-label');
    var deletedList = document.getElementById('deleted-list');
    var restoreBtn = document.getElementById('restore-btn');
    var removeSelectedBtn = document.getElementById('remove-selected-btn');
    var clearHistoryBtn = document.getElementById('clear-history-btn');
    var selectAllDeleted = document.getElementById('select-all-deleted');
    var deletedCountBadge = document.getElementById('deleted-count');
    var saveSettingsBtn = document.getElementById('save-settings-btn');

    var settingsDefaultLocation = document.getElementById('setting-default-location');
    var settingsDefaultDays = document.getElementById('setting-default-days');
    var settingsPreviewLimit = document.getElementById('setting-preview-limit');
    var settingsConfirmActions = document.getElementById('setting-confirm-actions');

    function setDateFromDays(days) {
      var safeDays = Number.isFinite(days) ? days : 30;
      var date = new Date();
      date.setDate(date.getDate() - safeDays);
      beforeDateInput.value = date.toISOString().split('T')[0];
    }

    function applySettingsToUI() {
      locationSelect.value = settings.defaultLocation;
      setDateFromDays(settings.defaultDays);
      previewPageSize = settings.previewLimit;
      settingsDefaultLocation.value = settings.defaultLocation;
      settingsDefaultDays.value = settings.defaultDays;
      settingsPreviewLimit.value = settings.previewLimit;
      settingsConfirmActions.checked = settings.confirmActions;
    }

    function buildQueryKey() {
      return locationSelect.value + '|' + beforeDateInput.value + '|' + settings.previewLimit;
    }

    document.querySelectorAll('.quick-date').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var days = parseInt(btn.dataset.days, 10);
        setDateFromDays(days);
      });
    });

    document.querySelectorAll('.tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');

        var tabName = tab.dataset.tab;
        document.getElementById('cleanup-tab').style.display = tabName === 'cleanup' ? 'block' : 'none';
        document.getElementById('deleted-tab').style.display = tabName === 'deleted' ? 'block' : 'none';
        document.getElementById('settings-tab').style.display = tabName === 'settings' ? 'block' : 'none';
        document.getElementById('about-tab').style.display = tabName === 'about' ? 'block' : 'none';

        if (tabName === 'deleted') {
          loadDeletedItems();
        }
      });
    });

    previewBtn.addEventListener('click', async function() {
      var before = beforeDateInput.value;
      if (!before) {
        showToast('Please select a date', 'warning');
        return;
      }

      var queryKey = buildQueryKey();
      if (lastQuery === queryKey && previewData.length > 0) {
        syncPreviewSelectionUI();
        renderPreview();
        showToast('Using cached preview', 'success');
        return;
      }

      previewBtn.disabled = true;
      previewBtn.innerHTML = '<span class="spinner"></span> Loading...';

      try {
        var res = await fetch('/api/preview?location=' + locationSelect.value + '&before=' + before);
        var data = await res.json();
        if (data.error) throw new Error(data.error);

        currentCount = data.total || 0;
        previewData = data.preview || [];
        selectedPreviewIds = new Set(previewData.map(function(item) { return String(item.id); }));
        previewPage = 1;
        lastQuery = queryKey;
        syncPreviewSelectionUI();
        renderPreview();

        itemCountEl.textContent = currentCount;
        locationDisplay.textContent = locationSelect.value;
        resultsCard.style.display = 'block';
        previewTopControls.style.display = previewData.length > 0 ? 'flex' : 'none';
        previewBottomControls.style.display = previewData.length > previewPageSize ? 'flex' : 'none';
        showToast('Loaded preview for ' + currentCount + ' items', currentCount ? 'success' : 'warning');
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        previewBtn.disabled = false;
        previewBtn.innerHTML = 'Preview Items';
      }
    });

    function renderPreview() {
      if (previewData.length === 0) {
        previewList.innerHTML = '<div class="empty">No items to preview</div>';
        previewTopControls.style.display = 'none';
        previewBottomControls.style.display = 'none';
        syncPreviewSelectionUI();
        return;
      }

      var totalPages = Math.max(1, Math.ceil(previewData.length / previewPageSize));
      if (previewPage > totalPages) previewPage = totalPages;
      var start = (previewPage - 1) * previewPageSize;
      var end = start + previewPageSize;
      var pageItems = previewData.slice(start, end);

      var html = '<div class="article-list">';
      pageItems.forEach(function(article) {
        var articleId = String(article.id);
        var checked = selectedPreviewIds.has(articleId) ? ' checked' : '';
        html += '<div class="article-item">';
        html += '<input type="checkbox" data-article-id="' + escapeHtml(articleId) + '" onchange="togglePreviewItem(this)"' + checked + '>';
        if (article.thumbnail) {
          html += '<img class="preview-thumb" src="' + escapeHtml(article.thumbnail) + '" alt="" loading="lazy" referrerpolicy="no-referrer">';
        } else {
          html += '<span class="preview-thumb-fallback">No image</span>';
        }
        html += '<div class="article-info">';
        html += '<div class="title-row"><span class="webpage-icon" aria-hidden="true">🌐</span><a class="article-link" href="' + escapeHtml(article.url || '#') + '" target="_blank" rel="noopener noreferrer"><div class="article-title">' + escapeHtml(article.title) + '</div></a></div>';
        html += '<div class="article-meta"><span class="article-site">' + escapeHtml(article.site) + '</span>';
        if (article.author) {
          html += ' by ' + escapeHtml(article.author);
        }
        html += ' · ' + formatDate(article.savedAt) + '</div></div></div>';
      });
      html += '</div>';

      if (currentCount > previewData.length) {
        html += '<p style="text-align:center;color:var(--text-muted);margin-top:0.5rem;font-size:0.85rem">Showing ' + previewData.length + ' of ' + currentCount + ' items</p>';
      }

      previewList.innerHTML = html;
      previewPageLabel.textContent = 'Page ' + previewPage + ' / ' + totalPages;
      previewPrevBtn.disabled = previewPage <= 1;
      previewNextBtn.disabled = previewPage >= totalPages;
      previewBottomControls.style.display = totalPages > 1 ? 'flex' : 'none';
      syncPreviewSelectionUI();
    }

    deleteBtn.addEventListener('click', function() { performCleanup('delete'); });
    archiveBtn.addEventListener('click', function() { performCleanup('archive'); });

    function syncPreviewSelectionUI() {
      if (previewData.length === 0) {
        selectAllPreview.checked = false;
        selectAllPreview.indeterminate = false;
        openSelectedBtn.disabled = true;
        deleteBtn.disabled = true;
        archiveBtn.disabled = true;
        openSelectedBtn.textContent = 'Open Selected';
        deleteBtn.textContent = 'Delete Selected';
        archiveBtn.textContent = 'Archive Selected';
        return;
      }
      var selectedCount = selectedPreviewIds.size;
      selectAllPreview.checked = selectedCount === previewData.length;
      selectAllPreview.indeterminate = selectedCount > 0 && selectedCount < previewData.length;
      openSelectedBtn.disabled = selectedCount === 0;
      deleteBtn.disabled = selectedCount === 0;
      archiveBtn.disabled = selectedCount === 0;
      openSelectedBtn.textContent = selectedCount > 0 ? 'Open Selected (' + selectedCount + ')' : 'Open Selected';
      deleteBtn.textContent = selectedCount > 0 ? 'Delete Selected (' + selectedCount + ')' : 'Delete Selected';
      archiveBtn.textContent = selectedCount > 0 ? 'Archive Selected (' + selectedCount + ')' : 'Archive Selected';
    }

    function togglePreviewItem(checkbox) {
      var articleId = checkbox.dataset.articleId;
      if (checkbox.checked) selectedPreviewIds.add(articleId);
      else selectedPreviewIds.delete(articleId);
      syncPreviewSelectionUI();
    }
    window.togglePreviewItem = togglePreviewItem;

    selectAllPreview.addEventListener('change', function() {
      selectedPreviewIds.clear();
      if (selectAllPreview.checked) {
        previewData.forEach(function(item) { selectedPreviewIds.add(String(item.id)); });
      }
      renderPreview();
    });

    previewPrevBtn.addEventListener('click', function() {
      if (previewPage > 1) {
        previewPage--;
        renderPreview();
      }
    });

    previewNextBtn.addEventListener('click', function() {
      var totalPages = Math.max(1, Math.ceil(previewData.length / previewPageSize));
      if (previewPage < totalPages) {
        previewPage++;
        renderPreview();
      }
    });

    openSelectedBtn.addEventListener('click', function() {
      if (selectedPreviewIds.size === 0) return;
      var selected = previewData.filter(function(item) { return selectedPreviewIds.has(String(item.id)); });
      selected.forEach(function(item) {
        if (item.url) {
          window.open(item.url, '_blank', 'noopener,noreferrer');
        }
      });
    });

    async function performCleanup(action) {
      var selectedCount = selectedPreviewIds.size;
      if (selectedCount === 0) {
        showToast('Select at least one item first', 'warning');
        return;
      }
      if (settings.confirmActions) {
        var confirmed = window.confirm('Confirm ' + action + ' for ' + selectedCount + ' selected items?');
        if (!confirmed) return;
      }

      deleteBtn.disabled = true;
      archiveBtn.disabled = true;
      var btn = action === 'delete' ? deleteBtn : archiveBtn;
      var originalText = btn.innerHTML;
      btn.innerHTML = '<span class="spinner"></span> Processing...';
      document.getElementById('progress').style.display = 'block';
      document.getElementById('progress-bar').style.width = '50%';

      try {
        var res = await fetch('/api/cleanup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: locationSelect.value,
            beforeDate: beforeDateInput.value,
            action: action,
            ids: Array.from(selectedPreviewIds)
          })
        });
        var data = await res.json();
        if (data.error) throw new Error(data.error);

        document.getElementById('progress-bar').style.width = '100%';
        showToast((action === 'delete' ? 'Deleted ' : 'Archived ') + data.processed + ' items', 'success');

        setTimeout(function() {
          currentCount = 0;
          previewData = [];
          selectedPreviewIds.clear();
          lastQuery = null;
          previewPage = 1;
          itemCountEl.textContent = '0';
          previewList.innerHTML = '';
          previewTopControls.style.display = 'none';
          previewBottomControls.style.display = 'none';
          resultsCard.style.display = 'none';
          document.getElementById('progress').style.display = 'none';
          document.getElementById('progress-bar').style.width = '0%';
          loadDeletedCount();
        }, 600);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        deleteBtn.disabled = false;
        archiveBtn.disabled = false;
        btn.innerHTML = originalText;
      }
    }

    function updateSelectedButtons() {
      restoreBtn.disabled = selectedItems.size === 0;
      removeSelectedBtn.disabled = selectedItems.size === 0;
      restoreBtn.textContent = selectedItems.size > 0 ? 'Restore Selected (' + selectedItems.size + ')' : 'Restore Selected';
      removeSelectedBtn.textContent = selectedItems.size > 0 ? 'Remove from History (' + selectedItems.size + ')' : 'Remove from History';

      if (deletedItems.length === 0) {
        selectAllDeleted.checked = false;
        selectAllDeleted.indeterminate = false;
        return;
      }
      selectAllDeleted.checked = selectedItems.size === deletedItems.length;
      selectAllDeleted.indeterminate = selectedItems.size > 0 && selectedItems.size < deletedItems.length;
    }

    function toggleRestoreItem(checkbox) {
      var url = checkbox.dataset.url;
      if (checkbox.checked) selectedItems.add(url);
      else selectedItems.delete(url);
      updateSelectedButtons();
    }
    window.toggleRestoreItem = toggleRestoreItem;

    selectAllDeleted.addEventListener('change', function() {
      selectedItems.clear();
      if (selectAllDeleted.checked) {
        deletedItems.forEach(function(item) { selectedItems.add(item.url); });
      }
      renderDeletedItems();
      updateSelectedButtons();
    });

    async function loadDeletedItems() {
      deletedList.innerHTML = '<div class="loading"><span class="spinner"></span> Loading...</div>';
      try {
        var res = await fetch('/api/deleted');
        var data = await res.json();
        deletedItems = data.items || [];
        selectedItems.clear();
        renderDeletedItems();
        updateDeletedBadge();
      } catch (err) {
        deletedList.innerHTML = '<div class="empty">Failed to load deleted items</div>';
      }
    }

    async function loadDeletedCount() {
      try {
        var res = await fetch('/api/deleted');
        var data = await res.json();
        deletedItems = data.items || [];
        updateDeletedBadge();
      } catch (err) {}
    }

    function updateDeletedBadge() {
      if (deletedItems.length > 0) {
        deletedCountBadge.textContent = deletedItems.length;
        deletedCountBadge.style.display = 'inline-block';
      } else {
        deletedCountBadge.style.display = 'none';
      }
    }

    function renderDeletedItems() {
      if (deletedItems.length === 0) {
        deletedList.innerHTML = '<div class="empty">No deleted items in history</div>';
        updateSelectedButtons();
        return;
      }

      var html = '<div class="article-list">';
      deletedItems.forEach(function(item) {
        html += '<div class="article-item">';
        html += '<input type="checkbox" data-url="' + escapeHtml(item.url) + '" onchange="toggleRestoreItem(this)"';
        if (selectedItems.has(item.url)) html += ' checked';
        html += '>';
        if (item.thumbnail) {
          html += '<img class="preview-thumb" src="' + escapeHtml(item.thumbnail) + '" alt="" loading="lazy" referrerpolicy="no-referrer">';
        } else {
          html += '<span class="preview-thumb-fallback">No image</span>';
        }
        html += '<div class="article-info">';
        html += '<div class="article-title">' + escapeHtml(item.title) + '</div>';
        html += '<div class="article-meta"><span class="article-site">' + escapeHtml(item.site) + '</span>';
        if (item.author) html += ' by ' + escapeHtml(item.author);
        if (item.savedAt) html += ' · Saved ' + formatDate(item.savedAt);
        html += ' · Deleted ' + formatDate(item.deletedAt) + '</div></div></div>';
      });
      html += '</div>';

      deletedList.innerHTML = html;
      updateSelectedButtons();
    }

    restoreBtn.addEventListener('click', async function() {
      if (selectedItems.size === 0) return;
      restoreBtn.disabled = true;
      restoreBtn.innerHTML = '<span class="spinner"></span> Restoring...';
      try {
        var res = await fetch('/api/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: Array.from(selectedItems) })
        });
        var data = await res.json();
        if (data.error) throw new Error(data.error);
        showToast('Restored ' + data.restored + ' items', 'success');
        selectedItems.clear();
        loadDeletedItems();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        restoreBtn.innerHTML = 'Restore Selected';
      }
    });

    removeSelectedBtn.addEventListener('click', async function() {
      if (selectedItems.size === 0) return;
      try {
        var res = await fetch('/api/clear-deleted', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: Array.from(selectedItems) })
        });
        var data = await res.json();
        if (data.error) throw new Error(data.error);
        showToast('Removed ' + data.removed + ' items from history', 'success');
        selectedItems.clear();
        loadDeletedItems();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    clearHistoryBtn.addEventListener('click', async function() {
      if (settings.confirmActions && !window.confirm('Clear all deleted-item history?')) return;
      try {
        var res = await fetch('/api/clear-deleted', { method: 'POST' });
        var data = await res.json();
        if (data.error) throw new Error(data.error);
        deletedItems = [];
        selectedItems.clear();
        renderDeletedItems();
        updateDeletedBadge();
        showToast('History cleared', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    saveSettingsBtn.addEventListener('click', async function() {
      var payload = {
        defaultLocation: settingsDefaultLocation.value,
        defaultDays: parseInt(settingsDefaultDays.value, 10),
        previewLimit: parseInt(settingsPreviewLimit.value, 10),
        confirmActions: !!settingsConfirmActions.checked
      };
      try {
        var res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        var data = await res.json();
        if (data.error) throw new Error(data.error);
        settings = data.settings;
        applySettingsToUI();
        lastQuery = null;
        showToast('Settings saved', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    async function loadSettings() {
      try {
        var res = await fetch('/api/settings');
        var data = await res.json();
        if (data.settings) settings = data.settings;
      } catch (err) {}
      applySettingsToUI();
    }

    function showToast(message, type) {
      type = type || 'success';
      var existing = document.querySelector('.toast');
      if (existing) existing.remove();
      var toast = document.createElement('div');
      toast.className = 'toast ' + type;
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(function() { toast.remove(); }, 3000);
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function formatDate(dateStr) {
      if (!dateStr) return '';
      var date = new Date(dateStr);
      var opts = { month: 'short', day: 'numeric' };
      if (date.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
      return date.toLocaleDateString('en-US', opts);
    }

    loadSettings();
    loadDeletedCount();
  </script>
</body>
</html>`;

// Export helpers for testing
export { fetchArticlesOlderThan, extractDomain, getDeletedItems };
