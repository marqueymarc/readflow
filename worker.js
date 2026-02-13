// Readwise Cleanup - Cloudflare Worker with embedded PWA
// Bulk delete/archive old Readwise Reader items with restoration support

const APP_VERSION = '2.1.0';
const VERSION_HISTORY = [
  { version: '2.1.0', note: 'Added audio TTS API with KV caching, mock-audio mode for low-cost testing, and settings hooks for OpenAI key plus playback skip controls.' },
  { version: '2.0.2', note: 'Refined control rail sizing, moved preview filter/sort/actions to right results header, and hide Open Selected when 5 or more items are selected.' },
  { version: '2.0.1', note: 'Reworked UI into a single control rail with compact mobile mode, dynamic Readwise locations, and settings-managed token override with overwrite confirmation.' },
  { version: '2.0.0', note: 'Introduced v2 layout shell with Readwise-style left rail and top route bar while preserving existing cleanup/deleted/settings/about affordances.' },
  { version: '1.1.27', note: 'Fixed Deleted History title alignment to stay left-aligned and avoid right-justified title rows.' },
  { version: '1.1.26', note: 'Deleted History now supports Added/Published/Deleted sorting with full available date metadata; startup defaults initialize to Inbox + last 7 days.' },
  { version: '1.1.25', note: 'Added Added/Published sort toggle to Deleted History and preserved publication metadata in deleted-item records.' },
  { version: '1.1.24', note: 'Applied stricter archive preview scan caps to avoid worker timeouts and eliminate non-JSON 1101 failures on wide archive ranges.' },
  { version: '1.1.23', note: 'Improved quick-date targeting reliability by tracking Start/End picker interaction across focus/click/change/pointer events.' },
  { version: '1.1.22', note: 'Quick-date shortcuts now target the selected date input directly (Start/End), removing the separate apply-target buttons.' },
  { version: '1.1.21', note: 'Hardened archive previews by avoiding heavy HTML-content fetches and tightening preview scan bounds to prevent 1101 non-JSON failures.' },
  { version: '1.1.20', note: 'Fixed Deleted History All-toggle reliability and bounded archive preview pagination to prevent non-JSON 500 failures on sparse filters.' },
  { version: '1.1.19', note: 'Prevented non-JSON preview failures on large archive scans by limiting preview fetch size and enforcing JSON parse guards in preview requests.' },
  { version: '1.1.18', note: 'Added preview sort toggle (Added/Published) and right-aligned relevant date for faster scanning.' },
  { version: '1.1.17', note: 'Added Archive as a selectable cleanup location and preserved correct archive filtering in API processing.' },
  { version: '1.1.16', note: 'Preserved checkbox state after swipe actions and improved deleted-history selection/search behavior (default selected, filtered toggle, date-deleted sort).' },
  { version: '1.1.15', note: 'Added non-destructive large-batch smoke coverage and switched cleanup client reconciliation to explicit processed IDs.' },
  { version: '1.1.14', note: 'Batched delete/archive requests in 20-item chunks so large selections process fully instead of stopping after one batch.' },
  { version: '1.1.13', note: 'Cleanup now processes exactly selected IDs and retries transient Readwise failures to avoid partial large-batch deletes.' },
  { version: '1.1.12', note: 'Prevented JSON parse crashes during repeated swipe actions with API-response guards and cleanup action locking.' },
  { version: '1.1.11', note: 'Fixed preview title click-to-open and kept preview list after swipe delete/archive by removing only acted-on items.' },
  { version: '1.1.10', note: 'Fixed client script syntax error and hardened predeploy script checks against rendered HTML.' },
  { version: '1.1.9', note: 'Added browser-smoke release gate to block broken UI deploys.' },
  { version: '1.1.8', note: 'Fixed preview link rendering syntax error that blocked UI scripts.' },
  { version: '1.1.7', note: 'Hotfix for frontend script runtime error.' },
  { version: '1.1.6', note: 'Stabilized date shortcut buttons and target state.' },
  { version: '1.1.5', note: 'Route-based tabs for back/forward navigation.' },
  { version: '1.1.4', note: 'Fixed preview link opening and added version history.' },
  { version: '1.1.3', note: 'Improved swipe delete indicator visuals.' },
  { version: '1.1.2', note: 'Search count/date shortcut/drag interaction fixes.' },
  { version: '1.1.1', note: 'URL cleanup, richer thumbnail extraction, favicon.' },
  { version: '1.1.0', note: 'Settings, about, selective actions, preview cache.' },
];
const DEFAULT_SETTINGS = {
  defaultLocation: 'new',
  defaultDays: 7,
  previewLimit: 100,
  confirmActions: true,
  mockTts: true,
  audioBackSeconds: 15,
  audioForwardSeconds: 30,
};
const MOCK_TTS_WAV_BASE64 = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

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
      if (url.pathname === '/api/token-status') {
        return handleTokenStatus(env, corsHeaders);
      }
      if (url.pathname === '/api/token') {
        if (request.method === 'POST') {
          return handleSaveToken(request, env, corsHeaders);
        }
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (url.pathname === '/api/openai-key-status') {
        return handleOpenAIKeyStatus(env, corsHeaders);
      }
      if (url.pathname === '/api/openai-key') {
        if (request.method === 'POST') {
          return handleSaveOpenAIKey(request, env, corsHeaders);
        }
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (url.pathname === '/api/audio/tts') {
        if (request.method === 'POST') {
          return handleAudioTts(request, env, corsHeaders);
        }
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (url.pathname === '/api/version') {
        return handleGetVersion(corsHeaders);
      }
      if (url.pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'Unknown API route' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
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
  const defaults = ['new', 'later', 'shortlist', 'feed', 'archive'];
  const discovered = new Set();
  const token = await getReadwiseToken(env);

  if (token) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600);
      let response;
      try {
        response = await fetch('https://readwise.io/api/v3/list/?page_size=200', {
          headers: { Authorization: `Token ${token}` },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
      if (response.ok) {
        const data = await response.json();
        for (const article of data.results || []) {
          if (article && typeof article.location === 'string' && article.location.trim()) {
            discovered.add(article.location.trim());
          }
        }
      }
    } catch {
      // Fallback to defaults when discovery fails.
    }
  }

  const extras = Array.from(discovered).filter((loc) => !defaults.includes(loc)).sort();
  const locations = [...defaults, ...extras];
  return new Response(JSON.stringify({ locations }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// Count items older than date in specified location
async function handleGetCount(request, env, corsHeaders) {
  const url = new URL(request.url);
  const location = url.searchParams.get('location') || 'new';
  const beforeDate = url.searchParams.get('before');
  const fromDate = url.searchParams.get('from');
  const toDate = url.searchParams.get('to');

  if (!beforeDate && !toDate && !fromDate) {
    return new Response(JSON.stringify({ error: 'Missing date range' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const articles = await fetchArticlesOlderThan(env, location, beforeDate, {
    fromDate,
    toDate,
  });

  return new Response(JSON.stringify({
    count: articles.length,
    location,
    beforeDate,
    fromDate,
    toDate,
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// Preview items that would be affected
async function handlePreview(request, env, corsHeaders) {
  const url = new URL(request.url);
  const location = url.searchParams.get('location') || 'new';
  const beforeDate = url.searchParams.get('before');
  const fromDate = url.searchParams.get('from');
  const toDate = url.searchParams.get('to');
  const requestedLimit = parseInt(url.searchParams.get('limit') || '', 10);
  const previewLimit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(500, requestedLimit)) : 100;
  const requestedMaxPages = parseInt(url.searchParams.get('maxPages') || '', 10);
  const previewMaxPages = Number.isFinite(requestedMaxPages) ? Math.max(1, Math.min(200, requestedMaxPages)) : 20;
  const includeHtmlContent = location !== 'archive';
  const effectivePreviewLimit = location === 'archive' ? Math.min(previewLimit, 50) : previewLimit;
  const effectivePreviewMaxPages = location === 'archive' ? Math.min(previewMaxPages, 5) : previewMaxPages;

  if (!beforeDate && !toDate && !fromDate) {
    return new Response(JSON.stringify({ error: 'Missing date range' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const articles = await fetchArticlesOlderThan(env, location, beforeDate, {
    withHtmlContent: includeHtmlContent,
    fromDate,
    toDate,
    limit: effectivePreviewLimit,
    maxPages: effectivePreviewMaxPages,
  });
  const preview = articles.map(a => ({
    id: a.id,
    title: a.title || 'Untitled',
    author: a.author || 'Unknown',
    url: deriveOpenUrl(a),
    savedAt: a.saved_at,
    publishedAt: a.published_date || a.published_at || null,
    site: extractDomain(a.source_url || a.url),
    thumbnail: getArticleThumbnail(a),
    searchable: buildSearchableText(a)
  }));

  return new Response(JSON.stringify({
    total: articles.length,
    preview,
    showing: preview.length,
    dateRange: { beforeDate, fromDate, toDate },
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// Perform cleanup (delete or archive)
async function handleCleanup(request, env, corsHeaders) {
  const body = await request.json();
  const { location, beforeDate, fromDate, toDate, action, ids, items } = body;

  if (!location || !action || (!beforeDate && !toDate && !fromDate)) {
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

  let articles = [];
  let targetIds = [];
  if (Array.isArray(ids)) {
    targetIds = Array.from(new Set(ids.map((id) => String(id))));
  } else {
    articles = await fetchArticlesOlderThan(env, location, beforeDate, {
      fromDate,
      toDate,
    });
    targetIds = articles.map((article) => String(article.id));
  }

  if (targetIds.length === 0) {
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
    const articleById = new Map(articles.map((article) => [String(article.id), article]));
    const itemById = new Map(
      Array.isArray(items)
        ? items
            .filter((item) => item && item.id !== undefined && item.id !== null)
            .map((item) => [String(item.id), item])
        : []
    );

    for (const id of targetIds) {
      const article = articleById.get(id);
      const item = itemById.get(id);
      deletedItems.push({
        id,
        title: (article && article.title) || (item && item.title) || 'Untitled',
        author: (article && article.author) || (item && item.author) || 'Unknown',
        url: (article && (article.source_url || article.url)) || (item && item.url) || '',
        savedAt: (article && article.saved_at) || (item && item.savedAt) || timestamp,
        publishedAt: (article && (article.published_date || article.published_at)) || (item && item.publishedAt) || null,
        deletedAt: timestamp,
        site: extractDomain((article && (article.source_url || article.url)) || (item && item.url) || ''),
        thumbnail: (article && getArticleThumbnail(article)) || (item && item.thumbnail) || null
      });
    }

    await env.KV.put('deleted_items', JSON.stringify(deletedItems));
  }

  // Process each article
  let processed = 0;
  let errors = [];
  let processedIds = [];

  for (const id of targetIds) {
    try {
      if (action === 'delete') {
        await deleteArticle(env, id);
      } else {
        await archiveArticle(env, id);
      }
      processed++;
      processedIds.push(String(id));
    } catch (err) {
      errors.push({ id, error: err.message });
    }
  }

  return new Response(JSON.stringify({
    processed,
    processedIds,
    errors: errors.length > 0 ? errors : undefined,
    action,
    total: targetIds.length
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

async function handleTokenStatus(env, corsHeaders) {
  const hasCustomToken = !!(await env.KV.get('custom_readwise_token'));
  const hasEnvToken = typeof env.READWISE_TOKEN === 'string' && env.READWISE_TOKEN.length > 0;
  const source = hasCustomToken ? 'custom' : (hasEnvToken ? 'env' : 'none');
  return new Response(JSON.stringify({
    hasToken: hasCustomToken || hasEnvToken,
    hasCustomToken,
    source,
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

async function handleSaveToken(request, env, corsHeaders) {
  const body = await request.json();
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const confirmOverwrite = body.confirmOverwrite === true;

  if (!token) {
    return new Response(JSON.stringify({ error: 'Token is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (!token.startsWith('rw_')) {
    return new Response(JSON.stringify({ error: 'Token format looks invalid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const existing = await env.KV.get('custom_readwise_token');
  const hasExisting = !!existing;
  if (hasExisting && !confirmOverwrite) {
    return new Response(JSON.stringify({ error: 'Token already set; confirm overwrite' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  await env.KV.put('custom_readwise_token', token);
  return new Response(JSON.stringify({
    saved: true,
    overwritten: hasExisting,
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

async function handleOpenAIKeyStatus(env, corsHeaders) {
  const hasCustomKey = !!(await env.KV.get('custom_openai_key'));
  const hasEnvKey = typeof env.OPENAI_API_KEY === 'string' && env.OPENAI_API_KEY.length > 0;
  const source = hasCustomKey ? 'custom' : (hasEnvKey ? 'env' : 'none');
  return new Response(JSON.stringify({
    hasKey: hasCustomKey || hasEnvKey,
    hasCustomKey,
    source,
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

async function handleSaveOpenAIKey(request, env, corsHeaders) {
  const body = await request.json();
  const key = typeof body.key === 'string' ? body.key.trim() : '';
  const confirmOverwrite = body.confirmOverwrite === true;

  if (!key) {
    return new Response(JSON.stringify({ error: 'OpenAI key is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (!key.startsWith('sk-')) {
    return new Response(JSON.stringify({ error: 'OpenAI key format looks invalid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const existing = await env.KV.get('custom_openai_key');
  const hasExisting = !!existing;
  if (hasExisting && !confirmOverwrite) {
    return new Response(JSON.stringify({ error: 'OpenAI key already set; confirm overwrite' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  await env.KV.put('custom_openai_key', key);
  return new Response(JSON.stringify({
    saved: true,
    overwritten: hasExisting,
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

async function handleAudioTts(request, env, corsHeaders) {
  const body = await request.json();
  const articleId = String(body.articleId || '');
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const voice = typeof body.voice === 'string' && body.voice.trim() ? body.voice.trim() : 'alloy';
  const speed = Number.isFinite(Number(body.speed)) ? Math.min(4, Math.max(0.5, Number(body.speed))) : 1;
  const chunkIndex = Number.isFinite(Number(body.chunkIndex)) ? Math.max(0, parseInt(body.chunkIndex, 10)) : 0;

  if (!text) {
    return new Response(JSON.stringify({ error: 'Text is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const settings = await getSettings(env);
  const useMockTts = body.mock === true || settings.mockTts === true;
  const cacheKey = await getTtsCacheKey({
    articleId: articleId || 'none',
    text,
    voice,
    speed,
    chunkIndex,
    model: 'gpt-4o-mini-tts',
    mock: useMockTts,
  });
  const cacheStoreKey = `tts_cache:${cacheKey}`;

  const cached = await env.KV.get(cacheStoreKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const bytes = base64ToUint8Array(parsed.audioBase64 || '');
      return new Response(bytes, {
        headers: {
          'Content-Type': parsed.contentType || 'audio/mpeg',
          'Cache-Control': 'private, max-age=3600',
          'X-TTS-Cache': 'HIT',
          'X-TTS-Mock': parsed.mock ? '1' : '0',
          ...corsHeaders,
        },
      });
    } catch {
      // continue and regenerate below when cache is malformed
    }
  }

  let audioBytes;
  let contentType;
  if (useMockTts) {
    audioBytes = base64ToUint8Array(MOCK_TTS_WAV_BASE64);
    contentType = 'audio/wav';
  } else {
    const openaiKey = await getOpenAIKey(env);
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI key is not configured' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const openaiRes = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        voice,
        input: text.slice(0, 12000),
        format: 'mp3',
        speed,
      }),
    });
    if (!openaiRes.ok) {
      throw new Error(`OpenAI TTS failed: ${openaiRes.status}`);
    }
    contentType = openaiRes.headers.get('content-type') || 'audio/mpeg';
    audioBytes = new Uint8Array(await openaiRes.arrayBuffer());
  }

  await env.KV.put(cacheStoreKey, JSON.stringify({
    audioBase64: uint8ToBase64(audioBytes),
    contentType,
    mock: useMockTts,
  }), { expirationTtl: 60 * 60 * 24 * 14 });

  return new Response(audioBytes, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
      'X-TTS-Cache': 'MISS',
      'X-TTS-Mock': useMockTts ? '1' : '0',
      ...corsHeaders,
    },
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
  const defaultLocation = typeof source.defaultLocation === 'string' && source.defaultLocation.trim()
    ? source.defaultLocation.trim()
    : DEFAULT_SETTINGS.defaultLocation;
  const defaultDays = normalizeInt(source.defaultDays, DEFAULT_SETTINGS.defaultDays, 1, 3650);
  const previewLimit = normalizeInt(source.previewLimit, DEFAULT_SETTINGS.previewLimit, 1, 500);
  const confirmActions = typeof source.confirmActions === 'boolean'
    ? source.confirmActions
    : DEFAULT_SETTINGS.confirmActions;
  const mockTts = typeof source.mockTts === 'boolean'
    ? source.mockTts
    : DEFAULT_SETTINGS.mockTts;
  const audioBackSeconds = normalizeInt(source.audioBackSeconds, DEFAULT_SETTINGS.audioBackSeconds, 5, 120);
  const audioForwardSeconds = normalizeInt(source.audioForwardSeconds, DEFAULT_SETTINGS.audioForwardSeconds, 5, 180);

  return {
    defaultLocation,
    defaultDays,
    previewLimit,
    confirmActions,
    mockTts,
    audioBackSeconds,
    audioForwardSeconds,
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
  let pagesFetched = 0;
  const beforeCutoff = beforeDate ? endOfDay(beforeDate) : null;
  const fromCutoff = options.fromDate ? startOfDay(options.fromDate) : null;
  const toCutoff = options.toDate ? endOfDay(options.toDate) : beforeCutoff;
  const withHtmlContent = options.withHtmlContent === true;
  const hardLimit = Number.isFinite(options.limit) ? Math.max(1, options.limit) : Infinity;
  const maxPages = Number.isFinite(options.maxPages) ? Math.max(1, options.maxPages) : Infinity;
  const token = options.token || await getReadwiseToken(env);
  if (!token) {
    throw new Error('Readwise token is not configured');
  }

  do {
    if (pagesFetched >= maxPages) {
      break;
    }
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
          Authorization: `Token ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Readwise API error: ${response.status}`);
    }

    const data = await response.json();
    pagesFetched += 1;

    // Filter articles older than cutoff date
    // Skip archived items
    const filtered = (data.results || []).filter(article => {
      const savedDate = new Date(article.saved_at);
      const beforeOk = toCutoff ? savedDate <= toCutoff : true;
      const fromOk = fromCutoff ? savedDate >= fromCutoff : true;
      if (location === 'archive') {
        return beforeOk && fromOk && article.location === 'archive';
      }
      return beforeOk && fromOk && article.location !== 'archive';
    });

    const remaining = hardLimit - allArticles.length;
    allArticles.push(...filtered.slice(0, Math.max(0, remaining)));
    if (allArticles.length >= hardLimit) {
      break;
    }
    nextCursor = data.nextPageCursor;
  } while (nextCursor);

  return allArticles;
}

// Helper: Delete article from Readwise
async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status) {
  return status === 429 || status >= 500;
}

async function deleteArticle(env, articleId) {
  const token = await getReadwiseToken(env);
  if (!token) throw new Error('Readwise token is not configured');
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(
      `https://readwise.io/api/v3/delete/${articleId}/`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );

    if (response.ok || response.status === 204) return;
    if (attempt < maxAttempts && isRetryableStatus(response.status)) {
      await sleep(200 * attempt);
      continue;
    }
    throw new Error(`Delete failed: ${response.status}`);
  }
}

// Helper: Archive article in Readwise
async function archiveArticle(env, articleId) {
  const token = await getReadwiseToken(env);
  if (!token) throw new Error('Readwise token is not configured');
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(
      `https://readwise.io/api/v3/update/${articleId}/`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location: 'archive' }),
      }
    );

    if (response.ok) return;
    if (attempt < maxAttempts && isRetryableStatus(response.status)) {
      await sleep(200 * attempt);
      continue;
    }
    throw new Error(`Archive failed: ${response.status}`);
  }
}

// Helper: Add URL back to Readwise
async function addToReadwise(env, url) {
  const token = await getReadwiseToken(env);
  if (!token) throw new Error('Readwise token is not configured');
  const response = await fetch('https://readwise.io/api/v3/save/', {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error(`Add failed: ${response.status}`);
  }
}

async function getReadwiseToken(env) {
  const customToken = await env.KV.get('custom_readwise_token');
  if (customToken && customToken.trim()) return customToken.trim();
  if (typeof env.READWISE_TOKEN === 'string' && env.READWISE_TOKEN.trim()) return env.READWISE_TOKEN.trim();
  return null;
}

async function getOpenAIKey(env) {
  const customKey = await env.KV.get('custom_openai_key');
  if (customKey && customKey.trim()) return customKey.trim();
  if (typeof env.OPENAI_API_KEY === 'string' && env.OPENAI_API_KEY.trim()) return env.OPENAI_API_KEY.trim();
  return null;
}

async function getTtsCacheKey(parts) {
  const textHash = await sha256Hex(parts.text || '');
  return [
    parts.articleId || 'none',
    parts.model || 'gpt-4o-mini-tts',
    parts.voice || 'alloy',
    String(parts.speed || 1),
    String(parts.chunkIndex || 0),
    parts.mock ? 'mock' : 'real',
    textHash.slice(0, 24),
  ].join(':');
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(String(value || ''));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function uint8ToBase64(uint8) {
  let binary = '';
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64) {
  const binary = atob(String(base64 || ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
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
  const sourceUrl = cleanOpenUrl(normalizeHttpUrl(decodeHtmlEntities(article.source_url)));
  const readwiseUrl = cleanOpenUrl(normalizeHttpUrl(decodeHtmlEntities(article.url)));
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

function cleanOpenUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    for (const key of [...parsed.searchParams.keys()]) {
      const lower = key.toLowerCase();
      if (
        lower.startsWith('utm_')
        || lower === 'token'
        || lower === '_bhlid'
        || lower === 'fbclid'
        || lower === 'gclid'
      ) {
        parsed.searchParams.delete(key);
      }
    }
    if (parsed.hash && parsed.hash.toLowerCase().includes('play')) {
      parsed.hash = '';
    }
    return parsed.toString();
  } catch {
    return url;
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
  const decodedHtml = decodeHtmlEntities(html);
  const canonicalMatch = decodedHtml.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    || decodedHtml.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  if (canonicalMatch && canonicalMatch[1]) {
    const canonical = cleanOpenUrl(normalizeHttpUrl(canonicalMatch[1]));
    if (canonical) return canonical;
  }

  const hrefMatches = decodedHtml.match(/href=["']([^"']+)["']/ig) || [];
  for (const raw of hrefMatches) {
    const extracted = raw.replace(/^href=["']|["']$/g, '');
    const normalized = cleanOpenUrl(normalizeHttpUrl(extracted));
    if (!normalized) continue;
    if (isReadwiseDomain(normalized)) continue;
    return normalized;
  }
  return null;
}

function decodeHtmlEntities(value) {
  if (!value || typeof value !== 'string') return value;
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function buildSearchableText(article) {
  const chunks = [
    article.title,
    article.author,
    article.source_url,
    article.url,
    article.summary,
    article.notes,
    article.site_name,
    article.content,
  ];
  if (typeof article.html_content === 'string' && article.html_content.length > 0) {
    const plain = article.html_content
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (plain) chunks.push(plain.slice(0, 20000));
  }
  return chunks.filter(Boolean).join(' ').toLowerCase();
}

function startOfDay(dateValue) {
  const d = new Date(dateValue);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(dateValue) {
  const d = new Date(dateValue);
  d.setHours(23, 59, 59, 999);
  return d;
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
      padding: 0;
    }
    .container { max-width: none; margin: 0; }
    .app-shell {
      display: grid;
      grid-template-columns: 332px minmax(0, 1fr);
      min-height: 100vh;
    }
    .left-rail {
      border-right: 1px solid var(--border);
      background: #f3f6fb;
      padding: 1rem 0.75rem;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    .main-pane {
      min-width: 0;
      padding: 0.75rem 1.1rem 2rem;
      height: 100vh;
      overflow: hidden;
    }
    .main-inner {
      max-width: 1120px;
      margin: 0 auto;
      height: 100%;
    }
    #cleanup-tab { height: 100%; }
    .rail-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      font-size: 1.2rem;
      color: #1f2937;
      padding: 0.35rem 0.5rem 1rem;
    }
    .rail-section {
      margin-top: 0.75rem;
      border-top: 1px solid var(--border);
      padding-top: 0.65rem;
    }
    .rail-item {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.5rem 0.6rem;
      border-radius: 8px;
      color: var(--text);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.95rem;
      margin-bottom: 0.2rem;
    }
    .rail-item.active {
      background: #e9eef8;
      color: #1d4ed8;
    }
    .rail-item:hover {
      background: #e9eef8;
    }
    header {
      padding: 0;
      margin-bottom: 0;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.5rem;
    }
    .logo { width: 28px; height: 28px; }
    h1 { font-size: 1.1rem; color: var(--text); }
    .subtitle { display: none; }
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
      max-height: none;
      height: 100%;
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
    .tab {
      display: inline-block;
      padding: 0.75rem 0.95rem;
      background: none;
      border: none;
      font-size: 0.9rem;
      color: var(--text-muted);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      white-space: nowrap;
      text-decoration: none;
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
    .date-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      align-items: end;
    }
    .left-rail .date-row {
      grid-template-columns: 1fr;
      gap: 0.55rem;
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
    .preview-search {
      min-width: 220px;
      flex: 1;
      max-width: 420px;
    }
    .preview-search-wrap {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      flex: 1;
      min-width: 240px;
      max-width: 480px;
    }
    .sort-toggle {
      display: inline-flex;
      border: 1px solid var(--border);
      border-radius: 999px;
      overflow: hidden;
      background: white;
    }
    .sort-toggle button {
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      cursor: pointer;
    }
    .sort-toggle button.active {
      background: var(--bg);
      color: var(--text);
      font-weight: 600;
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      justify-content: space-between;
    }
    .title-left {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      min-width: 0;
      flex: 1;
    }
    .article-date-right {
      font-size: 0.75rem;
      color: var(--text-muted);
      white-space: nowrap;
      margin-left: 0.6rem;
      flex: 0 0 auto;
    }
    .search-clear-btn {
      width: 2rem;
      height: 2rem;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: white;
      color: var(--text-muted);
      font-size: 1rem;
      line-height: 1;
      cursor: pointer;
    }
    .search-clear-btn:hover {
      background: var(--bg);
      color: var(--text);
    }
    .swipe-item {
      position: relative;
      overflow: hidden;
    }
    .swipe-bg {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 50%;
      display: flex;
      align-items: center;
      color: white;
      font-weight: 600;
      font-size: 0.85rem;
      pointer-events: none;
      z-index: 0;
    }
    .swipe-bg.right {
      left: 0;
      justify-content: flex-start;
      padding-left: 0.8rem;
      background: #dc2626;
    }
    .swipe-bg.left {
      right: 0;
      justify-content: flex-end;
      padding-right: 0.8rem;
      background: #2563eb;
    }
    .swipe-content {
      position: relative;
      background: var(--card);
      transition: transform 0.15s ease;
      cursor: grab;
      touch-action: pan-y;
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
    .history-list {
      margin-top: 0.5rem;
      border-top: 1px solid var(--border);
      padding-top: 0.6rem;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    .history-item {
      margin-bottom: 0.35rem;
    }
    .version-badge {
      margin-top: auto;
      width: 100%;
      font-size: 0.75rem;
      color: var(--text-muted);
      background: white;
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 0.25rem 0.6rem;
      box-shadow: var(--shadow);
      cursor: pointer;
    }
    #results-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      margin-bottom: 0;
    }
    #preview-list {
      flex: 1;
      min-height: 0;
    }
    @media (max-width: 600px) {
      .stats { grid-template-columns: repeat(2, 1fr); }
      .btn-group { flex-direction: column; }
      .btn { width: 100%; }
      .inline-controls { flex-direction: column; align-items: flex-start; }
    }
    @media (max-width: 1024px) {
      .app-shell {
        grid-template-columns: 1fr;
      }
      .left-rail {
        position: static;
        height: auto;
        border-right: none;
        border-bottom: 1px solid var(--border);
        padding-bottom: 0.5rem;
      }
      .main-pane {
        padding-top: 0.4rem;
        height: auto;
        overflow: visible;
      }
      .rail-section {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }
      .rail-item {
        margin-bottom: 0;
      }
      .left-rail .card {
        margin-bottom: 0.55rem;
        padding: 0.85rem;
      }
      .date-row {
        grid-template-columns: 1fr;
      }
      .quick-dates {
        gap: 0.25rem;
      }
      .quick-date {
        padding: 0.3rem 0.45rem;
        font-size: 0.76rem;
      }
      #cleanup-tab,
      .main-inner {
        height: auto;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="app-shell">
      <aside class="left-rail">
        <div class="rail-brand">
          <svg class="logo" viewBox="0 0 64 64" aria-hidden="true">
            <rect x="8" y="6" width="48" height="52" rx="10" fill="#4f46e5"></rect>
            <path d="M20 40c8-1 14-7 15-15" stroke="#ffffff" stroke-width="4" stroke-linecap="round" fill="none"></path>
            <path d="M31 26h15" stroke="#ffffff" stroke-width="4" stroke-linecap="round"></path>
            <circle cx="40" cy="42" r="8" fill="#ffffff"></circle>
            <path d="M37 42l2 2 4-4" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>
          </svg>
          <span>Readwise</span>
        </div>
        <div class="rail-section">
          <a class="rail-item tab active" data-tab="cleanup" href="/">Cleanup</a>
          <a class="rail-item tab" data-tab="deleted" href="/deleted">History <span id="deleted-count" class="badge" style="display:none">0</span></a>
        </div>
        <a class="tab" data-tab="settings" href="/settings" style="display:none" aria-hidden="true">Settings</a>
        <a class="tab" data-tab="about" href="/about" style="display:none" aria-hidden="true">About</a>
        <div id="cleanup-controls" class="card" style="margin-top:0.8rem;">
          <h2>Cleanup</h2>
          <div class="form-group">
            <label for="location">Source</label>
            <select id="location">
              <option value="new">Inbox (New)</option>
              <option value="later">Later</option>
              <option value="shortlist">Shortlist</option>
              <option value="feed">Feed</option>
              <option value="archive">Archive</option>
            </select>
          </div>
          <div class="form-group">
            <label for="from-date">Date Range</label>
            <div class="date-row">
              <div id="to-date-wrap">
                <label for="to-date">End</label>
                <input type="date" id="to-date">
              </div>
              <div id="from-date-wrap">
                <label for="from-date">Start (blank = all time)</label>
                <input type="date" id="from-date">
              </div>
            </div>
            <div class="quick-dates">
              <button type="button" class="quick-date" data-action="today">Today</button>
              <button type="button" class="quick-date" data-action="all-time">All Time</button>
              <button type="button" class="quick-date" data-days="7">1 week ago</button>
              <button type="button" class="quick-date" data-days="30">1 month ago</button>
              <button type="button" class="quick-date" data-days="90">3 months ago</button>
              <button type="button" class="quick-date" data-days="180">6 months ago</button>
              <button type="button" class="quick-date" data-days="365">1 year ago</button>
            </div>
          </div>
          <div class="btn-group">
            <button class="btn btn-primary" id="preview-btn">Preview Items</button>
          </div>
          <div class="stats" style="margin-top:0.8rem;">
            <div class="stat">
              <div class="stat-value" id="item-count">0</div>
              <div class="stat-label">Items Found</div>
            </div>
            <div class="stat">
              <div class="stat-value" id="location-display">-</div>
              <div class="stat-label">Origin</div>
            </div>
          </div>
        </div>
        <div id="deleted-controls" class="card" style="display:none;margin-top:0.8rem;">
          <h2>History</h2>
          <p style="color: var(--text-muted); margin-bottom: 0.8rem; font-size: 0.9rem;">
            Restore selected items to Reader or remove them from local history.
          </p>
          <div class="inline-controls">
            <label class="checkbox-label"><input id="select-all-deleted" type="checkbox"> All (filtered)</label>
            <div class="preview-search-wrap">
              <input class="preview-search" type="text" id="deleted-search" placeholder="Search history (title, author, site, URL)">
              <button type="button" class="search-clear-btn" id="deleted-search-clear" title="Clear search">×</button>
              <div class="sort-toggle" aria-label="Sort deleted history by date">
                <button type="button" id="deleted-sort-added" class="active" title="Sort by date added">Added</button>
                <button type="button" id="deleted-sort-published" title="Sort by publication date">Published</button>
                <button type="button" id="deleted-sort-deleted" title="Sort by date deleted">Deleted</button>
              </div>
            </div>
          </div>
          <div class="btn-group" style="margin-top: 1rem">
            <button class="btn btn-primary" id="restore-btn" disabled>Restore Selected</button>
            <button class="btn btn-outline" id="remove-selected-btn" disabled>Remove from History</button>
            <button class="btn btn-outline" id="clear-history-btn">Clear History</button>
          </div>
        </div>
        <button class="version-badge" id="version-badge" title="Open settings and about">&#9881; Settings · v${APP_VERSION}</button>
      </aside>
      <main class="main-pane">
        <div class="main-inner">
    <div id="cleanup-tab">
      <div class="card" id="results-card">
        <h2>Preview Results</h2>
        <div class="preview-top-controls" id="preview-top-controls" style="display:none">
          <label class="checkbox-label"><input id="select-all-preview" type="checkbox"> All (filtered)</label>
          <div class="preview-search-wrap">
            <input class="preview-search" type="text" id="preview-search" placeholder="Search preview (title, author, content)">
            <button type="button" class="search-clear-btn" id="preview-search-clear" title="Clear search">×</button>
            <div class="sort-toggle" aria-label="Sort preview by date">
              <button type="button" id="preview-sort-added" class="active" title="Sort by date added">Added</button>
              <button type="button" id="preview-sort-published" title="Sort by publication date">Published</button>
            </div>
          </div>
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
        <div id="deleted-list"><div class="loading">Loading...</div></div>
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
            <option value="archive">Archive</option>
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
        <div class="form-group">
          <label class="checkbox-label">
            <input id="setting-mock-tts" type="checkbox">
            Mock TTS mode (use local test clip; no OpenAI call)
          </label>
        </div>
        <div class="form-group">
          <label for="setting-audio-back-seconds">Audio back skip (seconds)</label>
          <input id="setting-audio-back-seconds" type="number" min="5" max="120">
        </div>
        <div class="form-group">
          <label for="setting-audio-forward-seconds">Audio forward skip (seconds)</label>
          <input id="setting-audio-forward-seconds" type="number" min="5" max="180">
        </div>
        <div class="btn-group">
          <button class="btn btn-primary" id="save-settings-btn">Save Settings</button>
        </div>
        <hr style="border:none;border-top:1px solid var(--border);margin:1rem 0;">
        <h2 style="font-size:1rem;margin-bottom:0.65rem;">Readwise API Key</h2>
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:0.6rem;">
          Key is stored server-side in this Worker KV and is never returned to browser clients after save.
        </p>
        <p id="token-status" style="color:var(--text-muted);font-size:0.85rem;margin-bottom:0.5rem;">Checking token status…</p>
        <div class="form-group">
          <label for="setting-readwise-token">Set/replace API key</label>
          <input id="setting-readwise-token" type="password" autocomplete="off" placeholder="rw_...">
        </div>
        <div class="btn-group">
          <button class="btn btn-outline" id="save-token-btn">Save API Key</button>
        </div>
        <hr style="border:none;border-top:1px solid var(--border);margin:1rem 0;">
        <h2 style="font-size:1rem;margin-bottom:0.65rem;">OpenAI API Key</h2>
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:0.6rem;">
          Used only for real TTS generation when mock mode is off.
        </p>
        <p id="openai-key-status" style="color:var(--text-muted);font-size:0.85rem;margin-bottom:0.5rem;">Checking OpenAI key status…</p>
        <div class="form-group">
          <label for="setting-openai-key">Set/replace OpenAI key</label>
          <input id="setting-openai-key" type="password" autocomplete="off" placeholder="sk-...">
        </div>
        <div class="btn-group">
          <button class="btn btn-outline" id="save-openai-key-btn">Save OpenAI Key</button>
        </div>
        <hr style="border:none;border-top:1px solid var(--border);margin:1rem 0;">
        <h2 style="font-size:1rem;margin-bottom:0.5rem;">About & History</h2>
        <p style="margin-bottom: 0.75rem; color: var(--text-muted);">
          Use this tool to quickly review and clean Readwise Reader items by source and date range, while keeping a restorable local delete history.
        </p>
        <div class="history-list" id="version-history"></div>
      </div>
    </div>

    <div id="about-tab" style="display:none">
      <div class="card">
        <h2>About</h2>
        <p style="margin-bottom: 0.75rem;">Version <strong id="about-version">${APP_VERSION}</strong></p>
        <p style="margin-bottom: 0.75rem; color: var(--text-muted);">
          Use this tool to quickly review and clean Readwise Reader items by source and date range, while keeping a restorable local delete history.
        </p>
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
        <div class="history-list"></div>
      </div>
    </div>
        </div>
      </main>
    </div>
  </div>

  <script>
    var APP_VERSION = '${APP_VERSION}';
    var VERSION_HISTORY = ${JSON.stringify(VERSION_HISTORY)};
    var currentCount = 0;
    var previewData = [];
    var selectedPreviewIds = new Set();
    var previewPage = 1;
    var previewPageSize = 10;
    var previewSearch = '';
    var previewSortMode = 'added';
    var activeDateShortcutTarget = 'to';
    var swipeStateById = {};
    var cleanupInFlight = false;
    var cleanupBatchSize = 20;
    var deletedItems = [];
    var selectedDeletedIds = new Set();
    var deletedSearch = '';
    var deletedSortMode = 'deleted';
    var lastQuery = null;
    var settings = {
      defaultLocation: 'new',
      defaultDays: 30,
      previewLimit: 100,
      confirmActions: true,
      mockTts: true,
      audioBackSeconds: 15,
      audioForwardSeconds: 30
    };

    var locationSelect = document.getElementById('location');
    var fromDateInput = document.getElementById('from-date');
    var toDateInput = document.getElementById('to-date');
    var fromDateWrap = document.getElementById('from-date-wrap');
    var toDateWrap = document.getElementById('to-date-wrap');
    var previewBtn = document.getElementById('preview-btn');
    var previewSearchInput = document.getElementById('preview-search');
    var previewSearchClearBtn = document.getElementById('preview-search-clear');
    var previewSortAddedBtn = document.getElementById('preview-sort-added');
    var previewSortPublishedBtn = document.getElementById('preview-sort-published');
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
    var deletedSearchInput = document.getElementById('deleted-search');
    var deletedSearchClearBtn = document.getElementById('deleted-search-clear');
    var deletedSortAddedBtn = document.getElementById('deleted-sort-added');
    var deletedSortPublishedBtn = document.getElementById('deleted-sort-published');
    var deletedSortDeletedBtn = document.getElementById('deleted-sort-deleted');
    var deletedCountBadge = document.getElementById('deleted-count');
    var saveSettingsBtn = document.getElementById('save-settings-btn');
    var cleanupControlsCard = document.getElementById('cleanup-controls');
    var deletedControlsCard = document.getElementById('deleted-controls');
    var versionBadgeBtn = document.getElementById('version-badge');
    var saveTokenBtn = document.getElementById('save-token-btn');
    var tokenStatusEl = document.getElementById('token-status');
    var settingsTokenInput = document.getElementById('setting-readwise-token');
    var settingMockTts = document.getElementById('setting-mock-tts');
    var settingAudioBackSeconds = document.getElementById('setting-audio-back-seconds');
    var settingAudioForwardSeconds = document.getElementById('setting-audio-forward-seconds');
    var openAiKeyStatusEl = document.getElementById('openai-key-status');
    var saveOpenAiKeyBtn = document.getElementById('save-openai-key-btn');
    var settingsOpenAiKeyInput = document.getElementById('setting-openai-key');

    var settingsDefaultLocation = document.getElementById('setting-default-location');
    var settingsDefaultDays = document.getElementById('setting-default-days');
    var settingsPreviewLimit = document.getElementById('setting-preview-limit');
    var settingsConfirmActions = document.getElementById('setting-confirm-actions');
    var TAB_ROUTES = {
      cleanup: '/',
      deleted: '/deleted',
      settings: '/settings',
      about: '/about',
    };
    var ROUTE_TABS = {
      '/': 'cleanup',
      '/deleted': 'deleted',
      '/settings': 'settings',
      '/about': 'about',
    };

    function formatInputDate(date) {
      return date.toISOString().split('T')[0];
    }

    function setDateFromDays(days) {
      var safeDays = Number.isFinite(days) ? days : 30;
      var date = new Date();
      date.setDate(date.getDate() - safeDays);
      var formatted = formatInputDate(date);
      if (activeDateShortcutTarget === 'from') {
        fromDateInput.value = formatted;
      } else {
        toDateInput.value = formatted;
      }
    }

    function setDateShortcutTarget(target) {
      activeDateShortcutTarget = target === 'from' ? 'from' : 'to';
    }

    function applySettingsToUI() {
      var hasDefaultLocation = Array.from(locationSelect.options || []).some(function(opt) {
        return opt && opt.value === settings.defaultLocation;
      });
      if (hasDefaultLocation) {
        locationSelect.value = settings.defaultLocation;
      }
      var today = new Date();
      var fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - settings.defaultDays);
      fromDateInput.value = formatInputDate(fromDate);
      toDateInput.value = formatInputDate(today);
      previewPageSize = settings.previewLimit;
      var hasSettingsDefaultLocation = Array.from(settingsDefaultLocation.options || []).some(function(opt) {
        return opt && opt.value === settings.defaultLocation;
      });
      if (hasSettingsDefaultLocation) {
        settingsDefaultLocation.value = settings.defaultLocation;
      }
      settingsDefaultDays.value = settings.defaultDays;
      settingsPreviewLimit.value = settings.previewLimit;
      settingsConfirmActions.checked = settings.confirmActions;
      settingMockTts.checked = settings.mockTts;
      settingAudioBackSeconds.value = settings.audioBackSeconds;
      settingAudioForwardSeconds.value = settings.audioForwardSeconds;
    }

    function buildLocationOptionLabel(location) {
      if (location === 'new') return 'Inbox (New)';
      if (location === 'later') return 'Later';
      if (location === 'shortlist') return 'Shortlist';
      if (location === 'feed') return 'Feed';
      if (location === 'archive') return 'Archive';
      return location.charAt(0).toUpperCase() + location.slice(1);
    }

    function setLocations(locations) {
      var safeLocations = Array.isArray(locations) && locations.length > 0 ? locations : ['new', 'later', 'shortlist', 'feed', 'archive'];
      var locationHtml = safeLocations.map(function(loc) {
        return '<option value="' + escapeHtml(loc) + '">' + escapeHtml(buildLocationOptionLabel(loc)) + '</option>';
      }).join('');
      locationSelect.innerHTML = locationHtml;
      settingsDefaultLocation.innerHTML = locationHtml;
      applySettingsToUI();
    }

    async function loadLocations() {
      try {
        var res = await fetch('/api/locations');
        var data = await parseApiJson(res);
        setLocations(data.locations || []);
      } catch (err) {
        setLocations([]);
      }
    }

    function buildQueryKey() {
      return [
        locationSelect.value,
        fromDateInput.value || '',
        toDateInput.value || '',
        settings.previewLimit
      ].join('|');
    }

    function on(el, eventName, handler) {
      if (!el) return;
      el.addEventListener(eventName, handler);
    }

    on(toDateWrap, 'pointerdown', function() { setDateShortcutTarget('to'); });
    on(fromDateWrap, 'pointerdown', function() { setDateShortcutTarget('from'); });
    ['focus', 'click', 'input', 'change', 'pointerdown'].forEach(function(evtName) {
      on(toDateInput, evtName, function() { setDateShortcutTarget('to'); });
      on(fromDateInput, evtName, function() { setDateShortcutTarget('from'); });
    });

    document.querySelectorAll('.quick-date').forEach(function(btn) {
      on(btn, 'click', function() {
        if (btn.dataset.action === 'today') {
          var today = formatInputDate(new Date());
          if (activeDateShortcutTarget === 'from') {
            fromDateInput.value = today;
          } else {
            toDateInput.value = today;
          }
          return;
        }
        if (btn.dataset.action === 'all-time') {
          if (activeDateShortcutTarget === 'from') {
            fromDateInput.value = '';
          } else {
            toDateInput.value = formatInputDate(new Date());
          }
          return;
        }
        var days = parseInt(btn.dataset.days, 10);
        setDateFromDays(days);
      });
    });

    function normalizePath(pathname) {
      if (!pathname || pathname === '') return '/';
      if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
      return pathname;
    }

    function getTabFromPath(pathname) {
      var normalized = normalizePath(pathname);
      return ROUTE_TABS[normalized] || 'cleanup';
    }

    function setActiveTab(tabName, options) {
      var opts = options || {};
      var shouldPush = opts.push !== false;
      document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.tab[data-tab="' + tabName + '"]').forEach(function(activeTabEl) {
        activeTabEl.classList.add('active');
      });

      document.getElementById('cleanup-tab').style.display = tabName === 'cleanup' ? 'block' : 'none';
      document.getElementById('deleted-tab').style.display = tabName === 'deleted' ? 'block' : 'none';
      document.getElementById('settings-tab').style.display = tabName === 'settings' ? 'block' : 'none';
      document.getElementById('about-tab').style.display = tabName === 'about' ? 'block' : 'none';
      cleanupControlsCard.style.display = tabName === 'cleanup' ? 'block' : 'none';
      deletedControlsCard.style.display = tabName === 'deleted' ? 'block' : 'none';

      if (tabName === 'deleted') {
        loadDeletedItems();
      }

      var targetPath = TAB_ROUTES[tabName] || '/';
      if (shouldPush && normalizePath(window.location.pathname) !== targetPath) {
        history.pushState({ tab: tabName }, '', targetPath);
      }
    }

    document.querySelectorAll('.tab').forEach(function(tab) {
      on(tab, 'click', function(evt) {
        evt.preventDefault();
        setActiveTab(tab.dataset.tab, { push: true });
      });
    });

    on(window, 'popstate', function() {
      setActiveTab(getTabFromPath(window.location.pathname), { push: false });
    });

    on(versionBadgeBtn, 'click', function() {
      setActiveTab('settings', { push: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    on(previewBtn, 'click', async function() {
      var fromDate = fromDateInput.value || '';
      var toDate = toDateInput.value || '';
      if (!toDate) toDate = formatInputDate(new Date());

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
        var params = new URLSearchParams({
          location: locationSelect.value,
          to: toDate,
          limit: String(settings.previewLimit || 100)
        });
        if (fromDate) params.set('from', fromDate);
        var res = await fetch('/api/preview?' + params.toString());
        var data = await parseApiJson(res);
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

    function getFilteredPreviewItems() {
      if (!previewSearch) return previewData;
      return previewData.filter(function(article) {
        return (article.searchable || '').includes(previewSearch);
      });
    }

    function getPreviewSortTimestamp(item) {
      var rawDate = previewSortMode === 'published' ? item.publishedAt : item.savedAt;
      var ts = Date.parse(rawDate || '');
      return Number.isFinite(ts) ? ts : 0;
    }

    function getSortedFilteredPreviewItems() {
      var filtered = getFilteredPreviewItems().slice();
      filtered.sort(function(a, b) {
        return getPreviewSortTimestamp(b) - getPreviewSortTimestamp(a);
      });
      return filtered;
    }

    function updatePreviewSortButtons() {
      previewSortAddedBtn.classList.toggle('active', previewSortMode === 'added');
      previewSortPublishedBtn.classList.toggle('active', previewSortMode === 'published');
    }

    function getActiveSelectedIds() {
      if (!previewSearch) return Array.from(selectedPreviewIds);
      var filteredIds = new Set(getFilteredPreviewItems().map(function(item) { return String(item.id); }));
      return Array.from(selectedPreviewIds).filter(function(id) { return filteredIds.has(id); });
    }

    function renderPreview() {
      var filtered = getSortedFilteredPreviewItems();
      if (filtered.length === 0) {
        previewList.innerHTML = '<div class="empty">No items match this filter</div>';
        previewBottomControls.style.display = 'none';
        syncPreviewSelectionUI();
        return;
      }

      var totalPages = Math.max(1, Math.ceil(filtered.length / previewPageSize));
      if (previewPage > totalPages) previewPage = totalPages;
      var start = (previewPage - 1) * previewPageSize;
      var end = start + previewPageSize;
      var pageItems = filtered.slice(start, end);

      var html = '<div class="article-list">';
      pageItems.forEach(function(article) {
        var articleId = String(article.id);
        var checked = selectedPreviewIds.has(articleId) ? ' checked' : '';
        html += '<div class="swipe-item" data-article-id="' + escapeHtml(articleId) + '">';
        html += '<div class="swipe-bg right">Delete</div>';
        html += '<div class="swipe-bg left">Archive</div>';
        html += '<div class="article-item swipe-content"';
        html += ' onpointerdown="handlePreviewPointerDown(event,this)"';
        html += ' onpointermove="handlePreviewPointerMove(event,this)"';
        html += ' onpointerup="handlePreviewPointerUp(event,this)"';
        html += ' onpointercancel="handlePreviewPointerCancel(event,this)">';
        html += '<input type="checkbox" data-article-id="' + escapeHtml(articleId) + '" onchange="togglePreviewItem(this)"' + checked + '>';
        if (article.thumbnail) {
          html += '<img class="preview-thumb" src="' + escapeHtml(article.thumbnail) + '" alt="" loading="lazy" referrerpolicy="no-referrer">';
        } else {
          html += '<span class="preview-thumb-fallback">No image</span>';
        }
        html += '<div class="article-info">';
        var activeDateValue = previewSortMode === 'published' ? article.publishedAt : article.savedAt;
        var activeDateLabel = previewSortMode === 'published' ? 'Published' : 'Added';
        html += '<div class="title-row">';
        html += '<div class="title-left"><span class="webpage-icon" aria-hidden="true">🌐</span><a class="article-link preview-open-link" href="' + escapeHtml(article.url || '#') + '" target="_blank" rel="noopener" data-open-url="' + escapeHtml(article.url || '') + '"><div class="article-title">' + escapeHtml(article.title) + '</div></a></div>';
        html += '<span class="article-date-right">' + escapeHtml(activeDateLabel) + ' ' + escapeHtml(formatDate(activeDateValue || article.savedAt)) + '</span>';
        html += '</div>';
        html += '<div class="article-meta"><span class="article-site">' + escapeHtml(article.site) + '</span>';
        if (article.author) {
          html += ' by ' + escapeHtml(article.author);
        }
        html += ' · ' + formatDate(article.savedAt) + '</div></div></div></div>';
      });
      html += '</div>';

      previewList.innerHTML = html;
      previewList.querySelectorAll('.preview-open-link').forEach(function(link) {
        on(link, 'click', function(evt) {
          openPreviewUrl(evt, link.dataset.openUrl || link.getAttribute('href') || '');
        });
      });
      previewPageLabel.textContent = 'Page ' + previewPage + ' / ' + totalPages;
      previewPrevBtn.disabled = previewPage <= 1;
      previewNextBtn.disabled = previewPage >= totalPages;
      previewBottomControls.style.display = totalPages > 1 ? 'flex' : 'none';
      syncPreviewSelectionUI();
    }

    on(deleteBtn, 'click', function() { performCleanup('delete'); });
    on(archiveBtn, 'click', function() { performCleanup('archive'); });

    function syncPreviewSelectionUI() {
      var filtered = getFilteredPreviewItems();
      if (previewData.length === 0 || filtered.length === 0) {
        selectAllPreview.checked = false;
        selectAllPreview.indeterminate = false;
        openSelectedBtn.disabled = true;
        openSelectedBtn.style.display = 'none';
        deleteBtn.disabled = true;
        archiveBtn.disabled = true;
        openSelectedBtn.textContent = 'Open Selected';
        deleteBtn.textContent = 'Delete Selected';
        archiveBtn.textContent = 'Archive Selected';
        return;
      }
      var selectedCount = selectedPreviewIds.size;
      var filteredIds = new Set(filtered.map(function(item) { return String(item.id); }));
      var filteredSelected = [...selectedPreviewIds].filter(function(id) { return filteredIds.has(id); }).length;
      var displayCount = previewSearch ? filteredSelected : selectedCount;
      selectAllPreview.checked = filteredSelected > 0 && filteredSelected === filtered.length;
      selectAllPreview.indeterminate = filteredSelected > 0 && filteredSelected < filtered.length;
      var canOpenFew = displayCount > 0 && displayCount < 5;
      openSelectedBtn.style.display = canOpenFew ? 'inline-flex' : 'none';
      openSelectedBtn.disabled = !canOpenFew;
      deleteBtn.disabled = displayCount === 0;
      archiveBtn.disabled = displayCount === 0;
      openSelectedBtn.textContent = displayCount > 0 ? 'Open Selected (' + displayCount + ')' : 'Open Selected';
      deleteBtn.textContent = displayCount > 0 ? 'Delete Selected (' + displayCount + ')' : 'Delete Selected';
      archiveBtn.textContent = displayCount > 0 ? 'Archive Selected (' + displayCount + ')' : 'Archive Selected';
    }

    function togglePreviewItem(checkbox) {
      var articleId = checkbox.dataset.articleId;
      if (checkbox.checked) selectedPreviewIds.add(articleId);
      else selectedPreviewIds.delete(articleId);
      syncPreviewSelectionUI();
    }
    window.togglePreviewItem = togglePreviewItem;

    on(selectAllPreview, 'change', function() {
      var filtered = getFilteredPreviewItems();
      if (selectAllPreview.checked) {
        filtered.forEach(function(item) { selectedPreviewIds.add(String(item.id)); });
      } else {
        filtered.forEach(function(item) { selectedPreviewIds.delete(String(item.id)); });
      }
      renderPreview();
    });

    on(previewPrevBtn, 'click', function() {
      if (previewPage > 1) {
        previewPage--;
        renderPreview();
      }
    });

    on(previewNextBtn, 'click', function() {
      var totalPages = Math.max(1, Math.ceil(getFilteredPreviewItems().length / previewPageSize));
      if (previewPage < totalPages) {
        previewPage++;
        renderPreview();
      }
    });

    on(previewSearchInput, 'input', function() {
      previewSearch = (previewSearchInput.value || '').trim().toLowerCase();
      previewPage = 1;
      renderPreview();
    });

    on(previewSearchClearBtn, 'click', function() {
      previewSearch = '';
      previewSearchInput.value = '';
      previewPage = 1;
      renderPreview();
      previewSearchInput.focus();
    });

    on(previewSortAddedBtn, 'click', function() {
      previewSortMode = 'added';
      updatePreviewSortButtons();
      previewPage = 1;
      renderPreview();
    });

    on(previewSortPublishedBtn, 'click', function() {
      previewSortMode = 'published';
      updatePreviewSortButtons();
      previewPage = 1;
      renderPreview();
    });
    updatePreviewSortButtons();

    function runSwipeAction(articleId, action) {
      var id = String(articleId);
      performCleanup(action, true, [id]);
    }

    function handlePreviewPointerDown(evt, element) {
      if (
        evt.target &&
        evt.target.closest &&
        (evt.target.closest('.preview-open-link') || evt.target.closest('input[type="checkbox"]'))
      ) {
        return;
      }
      var parent = element.parentElement;
      var articleId = parent.dataset.articleId;
      swipeStateById[articleId] = { startX: evt.clientX, deltaX: 0, pointerId: evt.pointerId };
      element.style.transition = 'none';
      if (element.setPointerCapture) {
        element.setPointerCapture(evt.pointerId);
      }
    }
    window.handlePreviewPointerDown = handlePreviewPointerDown;

    function handlePreviewPointerMove(evt, element) {
      var parent = element.parentElement;
      var articleId = parent.dataset.articleId;
      var state = swipeStateById[articleId];
      if (!state) return;
      if (state.pointerId !== evt.pointerId) return;
      state.deltaX = evt.clientX - state.startX;
      element.style.transform = 'translateX(' + Math.max(-120, Math.min(120, state.deltaX)) + 'px)';
    }
    window.handlePreviewPointerMove = handlePreviewPointerMove;

    function finishPreviewSwipe(evt, element) {
      var parent = element.parentElement;
      var articleId = parent.dataset.articleId;
      var state = swipeStateById[articleId];
      element.style.transition = 'transform 0.15s ease';
      if (!state) {
        element.style.transform = 'translateX(0px)';
        return;
      }
      if (state.deltaX <= -80) {
        element.style.transform = 'translateX(-120px)';
        setTimeout(function() { runSwipeAction(articleId, 'archive'); }, 120);
      } else if (state.deltaX >= 80) {
        element.style.transform = 'translateX(120px)';
        setTimeout(function() { runSwipeAction(articleId, 'delete'); }, 120);
      } else {
        element.style.transform = 'translateX(0px)';
      }
      delete swipeStateById[articleId];
    }
    function handlePreviewPointerUp(evt, element) {
      finishPreviewSwipe(evt, element);
    }
    window.handlePreviewPointerUp = handlePreviewPointerUp;
    function handlePreviewPointerCancel(evt, element) {
      finishPreviewSwipe(evt, element);
    }
    window.handlePreviewPointerCancel = handlePreviewPointerCancel;

    function openPreviewUrl(evt, url) {
      evt.preventDefault();
      evt.stopPropagation();
      if (!url) return;
      window.open(url, '_blank');
    }
    window.openPreviewUrl = openPreviewUrl;

    async function parseApiJson(res) {
      var text = await res.text();
      var contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (contentType.indexOf('application/json') === -1) {
        throw new Error('Server returned non-JSON response (' + res.status + ')');
      }
      try {
        return JSON.parse(text);
      } catch (err) {
        throw new Error('Invalid JSON response from server');
      }
    }

    on(openSelectedBtn, 'click', function() {
      var activeIds = new Set(getActiveSelectedIds());
      if (activeIds.size === 0) return;
      var selected = previewData.filter(function(item) { return activeIds.has(String(item.id)); });
      selected.forEach(function(item) {
        if (item.url) {
          window.open(item.url, '_blank');
        }
      });
    });

    async function performCleanup(action, skipConfirm, forcedIds) {
      if (cleanupInFlight) {
        showToast('Please wait for the current action to finish', 'warning');
        return;
      }
      var activeSelectedIds = Array.isArray(forcedIds) && forcedIds.length > 0
        ? Array.from(new Set(forcedIds.map(function(id) { return String(id); })))
        : getActiveSelectedIds();
      var selectedCount = activeSelectedIds.length;
      if (selectedCount === 0) {
        showToast('Select at least one item first', 'warning');
        return;
      }
      if (settings.confirmActions && !skipConfirm) {
        var confirmed = window.confirm('Confirm ' + action + ' for ' + selectedCount + ' selected items?');
        if (!confirmed) return;
      }

      deleteBtn.disabled = true;
      archiveBtn.disabled = true;
      cleanupInFlight = true;
      var btn = action === 'delete' ? deleteBtn : archiveBtn;
      var originalText = btn.innerHTML;
      btn.innerHTML = '<span class="spinner"></span> Processing...';
      document.getElementById('progress').style.display = 'block';
      document.getElementById('progress-bar').style.width = '50%';

      try {
        var selectedItems = previewData
          .filter(function(item) { return activeSelectedIds.indexOf(String(item.id)) !== -1; })
          .map(function(item) {
            return {
              id: String(item.id),
              title: item.title || '',
              author: item.author || '',
              url: item.url || '',
              savedAt: item.savedAt || '',
              publishedAt: item.publishedAt || null,
              thumbnail: item.thumbnail || null
            };
          });

        var processedTotal = 0;
        var allErrors = [];
        var allProcessedIds = [];
        for (var batchStart = 0; batchStart < activeSelectedIds.length; batchStart += cleanupBatchSize) {
          var idsBatch = activeSelectedIds.slice(batchStart, batchStart + cleanupBatchSize);
          var batchIdSet = new Set(idsBatch);
          var itemsBatch = selectedItems.filter(function(item) { return batchIdSet.has(String(item.id)); });

          var progressPct = Math.round((batchStart / activeSelectedIds.length) * 90) + 5;
          document.getElementById('progress-bar').style.width = String(progressPct) + '%';

          var res = await fetch('/api/cleanup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: locationSelect.value,
              fromDate: fromDateInput.value || undefined,
              toDate: toDateInput.value || formatInputDate(new Date()),
              action: action,
              ids: idsBatch,
              items: itemsBatch
            })
          });
          var batchData = await parseApiJson(res);
          if (batchData.error) throw new Error(batchData.error);
          processedTotal += batchData.processed || 0;
          if (Array.isArray(batchData.processedIds)) {
            allProcessedIds = allProcessedIds.concat(batchData.processedIds.map(function(id) { return String(id); }));
          } else {
            allProcessedIds = allProcessedIds.concat(idsBatch.map(function(id) { return String(id); }));
          }
          if (Array.isArray(batchData.errors)) {
            allErrors = allErrors.concat(batchData.errors);
          }
        }
        var data = {
          processed: processedTotal,
          processedIds: allProcessedIds,
          errors: allErrors.length > 0 ? allErrors : undefined
        };

        document.getElementById('progress-bar').style.width = '100%';
        if (data.processed < selectedCount) {
          showToast(
            (action === 'delete' ? 'Deleted ' : 'Archived ') + data.processed + ' of ' + selectedCount + ' items',
            'warning'
          );
        } else {
          showToast((action === 'delete' ? 'Deleted ' : 'Archived ') + data.processed + ' items', 'success');
        }

        var successfulIds = new Set(
          Array.isArray(data.processedIds) && data.processedIds.length > 0
            ? data.processedIds.map(function(id) { return String(id); })
            : activeSelectedIds.map(function(id) { return String(id); })
        );
        if (Array.isArray(data.errors)) {
          data.errors.forEach(function(err) {
            if (err && err.id !== undefined && err.id !== null) {
              successfulIds.delete(String(err.id));
            }
          });
        }

        if (successfulIds.size > 0) {
          previewData = previewData.filter(function(item) {
            return !successfulIds.has(String(item.id));
          });
          successfulIds.forEach(function(id) { selectedPreviewIds.delete(String(id)); });
          currentCount = Math.max(0, currentCount - successfulIds.size);
        }

        if (previewData.length === 0) {
          selectedPreviewIds.clear();
          lastQuery = null;
          previewPage = 1;
          itemCountEl.textContent = '0';
          renderPreview();
          previewTopControls.style.display = 'none';
          previewBottomControls.style.display = 'none';
        } else {
          var totalPages = Math.max(1, Math.ceil(getFilteredPreviewItems().length / previewPageSize));
          if (previewPage > totalPages) previewPage = totalPages;
          itemCountEl.textContent = String(currentCount);
          renderPreview();
          previewTopControls.style.display = 'flex';
          previewBottomControls.style.display = totalPages > 1 ? 'flex' : 'none';
        }

        document.getElementById('progress').style.display = 'none';
        document.getElementById('progress-bar').style.width = '0%';
        loadDeletedCount();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        cleanupInFlight = false;
        deleteBtn.disabled = false;
        archiveBtn.disabled = false;
        btn.innerHTML = originalText;
      }
    }

    function updateSelectedButtons() {
      var filtered = getFilteredDeletedItems();
      var activeSelectedItems = getActiveSelectedDeletedItems();
      var selectedCount = selectedDeletedIds.size;
      var filteredIdSet = new Set(filtered.map(function(item) { return getDeletedItemKey(item); }));
      var filteredSelected = Array.from(selectedDeletedIds).filter(function(id) { return filteredIdSet.has(id); }).length;
      var displayCount = deletedSearch ? filteredSelected : selectedCount;

      restoreBtn.disabled = activeSelectedItems.length === 0;
      removeSelectedBtn.disabled = activeSelectedItems.length === 0;
      restoreBtn.textContent = displayCount > 0 ? 'Restore Selected (' + displayCount + ')' : 'Restore Selected';
      removeSelectedBtn.textContent = displayCount > 0 ? 'Remove from History (' + displayCount + ')' : 'Remove from History';

      if (deletedItems.length === 0 || filtered.length === 0) {
        selectAllDeleted.checked = false;
        selectAllDeleted.indeterminate = false;
        return;
      }
      selectAllDeleted.checked = filteredSelected > 0 && filteredSelected === filtered.length;
      selectAllDeleted.indeterminate = filteredSelected > 0 && filteredSelected < filtered.length;
    }

    function toggleRestoreItem(checkbox) {
      var itemId = checkbox.dataset.itemId;
      if (checkbox.checked) selectedDeletedIds.add(itemId);
      else selectedDeletedIds.delete(itemId);
      updateSelectedButtons();
    }
    window.toggleRestoreItem = toggleRestoreItem;

    function getDeletedItemKey(item) {
      if (item && item.id !== undefined && item.id !== null) return String(item.id);
      return [
        item && item.url ? item.url : '',
        item && item.deletedAt ? item.deletedAt : '',
        item && item.savedAt ? item.savedAt : '',
        item && item.title ? item.title : '',
      ].join('|');
    }

    function buildDeletedSearchableText(item) {
      return [
        item.title,
        item.author,
        item.site,
        item.url,
      ].filter(Boolean).join(' ').toLowerCase();
    }

    function getFilteredDeletedItems() {
      if (!deletedSearch) return deletedItems;
      return deletedItems.filter(function(item) {
        return buildDeletedSearchableText(item).includes(deletedSearch);
      });
    }

    function getActiveSelectedDeletedItems() {
      var filtered = getFilteredDeletedItems();
      if (!deletedSearch) {
        return deletedItems.filter(function(item) { return selectedDeletedIds.has(getDeletedItemKey(item)); });
      }
      var filteredIdSet = new Set(filtered.map(function(item) { return getDeletedItemKey(item); }));
      return deletedItems.filter(function(item) {
        var id = getDeletedItemKey(item);
        return selectedDeletedIds.has(id) && filteredIdSet.has(id);
      });
    }

    function getDeletedSortTimestamp(item) {
      var rawDate = item.deletedAt;
      if (deletedSortMode === 'published') {
        rawDate = item.publishedAt || item.savedAt || item.deletedAt;
      } else if (deletedSortMode === 'added') {
        rawDate = item.savedAt || item.deletedAt;
      }
      var ts = Date.parse(rawDate || '');
      return Number.isFinite(ts) ? ts : 0;
    }

    function updateDeletedSortButtons() {
      deletedSortAddedBtn.classList.toggle('active', deletedSortMode === 'added');
      deletedSortPublishedBtn.classList.toggle('active', deletedSortMode === 'published');
      deletedSortDeletedBtn.classList.toggle('active', deletedSortMode === 'deleted');
    }

    on(selectAllDeleted, 'change', function() {
      var filtered = getFilteredDeletedItems();
      if (filtered.length === 0) {
        updateSelectedButtons();
        return;
      }
      var shouldSelectAllFiltered = filtered.some(function(item) {
        return !selectedDeletedIds.has(getDeletedItemKey(item));
      });
      if (shouldSelectAllFiltered) {
        filtered.forEach(function(item) { selectedDeletedIds.add(getDeletedItemKey(item)); });
      } else {
        filtered.forEach(function(item) { selectedDeletedIds.delete(getDeletedItemKey(item)); });
      }
      renderDeletedItems();
      updateSelectedButtons();
    });

    on(deletedSearchInput, 'input', function() {
      deletedSearch = (deletedSearchInput.value || '').trim().toLowerCase();
      renderDeletedItems();
    });

    on(deletedSearchClearBtn, 'click', function() {
      deletedSearch = '';
      deletedSearchInput.value = '';
      renderDeletedItems();
      deletedSearchInput.focus();
    });

    on(deletedSortAddedBtn, 'click', function() {
      deletedSortMode = 'added';
      updateDeletedSortButtons();
      renderDeletedItems();
    });

    on(deletedSortPublishedBtn, 'click', function() {
      deletedSortMode = 'published';
      updateDeletedSortButtons();
      renderDeletedItems();
    });

    on(deletedSortDeletedBtn, 'click', function() {
      deletedSortMode = 'deleted';
      updateDeletedSortButtons();
      renderDeletedItems();
    });
    updateDeletedSortButtons();

    async function loadDeletedItems() {
      deletedList.innerHTML = '<div class="loading"><span class="spinner"></span> Loading...</div>';
      try {
        var res = await fetch('/api/deleted');
        var data = await parseApiJson(res);
        deletedItems = data.items || [];
        selectedDeletedIds = new Set(deletedItems.map(function(item) { return getDeletedItemKey(item); }));
        renderDeletedItems();
        updateDeletedBadge();
      } catch (err) {
        deletedList.innerHTML = '<div class="empty">Failed to load deleted items</div>';
      }
    }

    async function loadDeletedCount() {
      try {
        var res = await fetch('/api/deleted');
        var data = await parseApiJson(res);
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
      var filtered = getFilteredDeletedItems();
      if (filtered.length === 0) {
        deletedList.innerHTML = '<div class="empty">No deleted items match this filter</div>';
        updateSelectedButtons();
        return;
      }
      var sorted = filtered.slice().sort(function(a, b) {
        return getDeletedSortTimestamp(b) - getDeletedSortTimestamp(a);
      });

      var html = '<div class="article-list">';
      sorted.forEach(function(item) {
        var itemId = getDeletedItemKey(item);
        html += '<div class="article-item">';
        html += '<input type="checkbox" data-item-id="' + escapeHtml(itemId) + '" onchange="toggleRestoreItem(this)"';
        if (selectedDeletedIds.has(itemId)) html += ' checked';
        html += '>';
        if (item.thumbnail) {
          html += '<img class="preview-thumb" src="' + escapeHtml(item.thumbnail) + '" alt="" loading="lazy" referrerpolicy="no-referrer">';
        } else {
          html += '<span class="preview-thumb-fallback">No image</span>';
        }
        html += '<div class="article-info">';
        html += '<div class="title-row"><div class="title-left"><span class="webpage-icon" aria-hidden="true">🌐</span><a class="article-link deleted-open-link" href="' + escapeHtml(item.url || '#') + '" target="_blank" rel="noopener" data-open-url="' + escapeHtml(item.url || '') + '"><div class="article-title">' + escapeHtml(item.title) + '</div></a></div></div>';
        html += '<div class="article-meta"><span class="article-site">' + escapeHtml(item.site) + '</span>';
        if (item.author) html += ' by ' + escapeHtml(item.author);
        if (item.savedAt) html += ' · Added ' + formatDate(item.savedAt);
        if (item.publishedAt) html += ' · Published ' + formatDate(item.publishedAt);
        if (item.deletedAt) html += ' · Deleted ' + formatDate(item.deletedAt);
        html += '</div></div></div>';
      });
      html += '</div>';

      deletedList.innerHTML = html;
      deletedList.querySelectorAll('.deleted-open-link').forEach(function(link) {
        on(link, 'click', function(evt) {
          openPreviewUrl(evt, link.dataset.openUrl || link.getAttribute('href') || '');
        });
      });
      updateSelectedButtons();
    }

    on(restoreBtn, 'click', async function() {
      var activeSelectedItems = getActiveSelectedDeletedItems();
      if (activeSelectedItems.length === 0) return;
      var activeSelectedUrls = activeSelectedItems.map(function(item) { return item.url; }).filter(Boolean);
      restoreBtn.disabled = true;
      restoreBtn.innerHTML = '<span class="spinner"></span> Restoring...';
      try {
        var res = await fetch('/api/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: activeSelectedUrls })
        });
        var data = await res.json();
        if (data.error) throw new Error(data.error);
        showToast('Restored ' + data.restored + ' items', 'success');
        activeSelectedItems.forEach(function(item) { selectedDeletedIds.delete(getDeletedItemKey(item)); });
        loadDeletedItems();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        restoreBtn.innerHTML = 'Restore Selected';
      }
    });

    on(removeSelectedBtn, 'click', async function() {
      var activeSelectedItems = getActiveSelectedDeletedItems();
      if (activeSelectedItems.length === 0) return;
      var activeSelectedUrls = activeSelectedItems.map(function(item) { return item.url; }).filter(Boolean);
      try {
        var res = await fetch('/api/clear-deleted', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: activeSelectedUrls })
        });
        var data = await res.json();
        if (data.error) throw new Error(data.error);
        showToast('Removed ' + data.removed + ' items from history', 'success');
        activeSelectedItems.forEach(function(item) { selectedDeletedIds.delete(getDeletedItemKey(item)); });
        loadDeletedItems();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    on(clearHistoryBtn, 'click', async function() {
      if (settings.confirmActions && !window.confirm('Clear all deleted-item history?')) return;
      try {
        var res = await fetch('/api/clear-deleted', { method: 'POST' });
        var data = await res.json();
        if (data.error) throw new Error(data.error);
        deletedItems = [];
        selectedDeletedIds.clear();
        renderDeletedItems();
        updateDeletedBadge();
        showToast('History cleared', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    on(saveSettingsBtn, 'click', async function() {
      var payload = {
        defaultLocation: settingsDefaultLocation.value,
        defaultDays: parseInt(settingsDefaultDays.value, 10),
        previewLimit: parseInt(settingsPreviewLimit.value, 10),
        confirmActions: !!settingsConfirmActions.checked,
        mockTts: !!settingMockTts.checked,
        audioBackSeconds: parseInt(settingAudioBackSeconds.value, 10),
        audioForwardSeconds: parseInt(settingAudioForwardSeconds.value, 10)
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
        var data = await parseApiJson(res);
        if (data.settings) settings = data.settings;
      } catch (err) {}
      applySettingsToUI();
    }

    async function loadTokenStatus() {
      try {
        var res = await fetch('/api/token-status');
        var data = await parseApiJson(res);
        if (!data.hasToken) {
          tokenStatusEl.textContent = 'No API key configured.';
          return;
        }
        if (data.source === 'custom') {
          tokenStatusEl.textContent = 'Custom API key is configured.';
          return;
        }
        tokenStatusEl.textContent = 'Using environment API key.';
      } catch (err) {
        tokenStatusEl.textContent = 'Unable to read token status.';
      }
    }

    on(saveTokenBtn, 'click', async function() {
      var token = (settingsTokenInput.value || '').trim();
      if (!token) {
        showToast('Enter an API key first', 'warning');
        return;
      }
      var confirmOverwrite = false;
      try {
        var statusRes = await fetch('/api/token-status');
        var statusData = await parseApiJson(statusRes);
        if (statusData.hasCustomToken) {
          confirmOverwrite = window.confirm('A custom API key is already set. Overwrite it?');
          if (!confirmOverwrite) return;
        }
      } catch (err) {}
      saveTokenBtn.disabled = true;
      var originalText = saveTokenBtn.textContent;
      saveTokenBtn.innerHTML = '<span class="spinner"></span> Saving...';
      try {
        var res = await fetch('/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token, confirmOverwrite: confirmOverwrite }),
        });
        var data = await parseApiJson(res);
        if (data.error) throw new Error(data.error);
        settingsTokenInput.value = '';
        showToast(data.overwritten ? 'API key overwritten' : 'API key saved', 'success');
        loadTokenStatus();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        saveTokenBtn.disabled = false;
        saveTokenBtn.textContent = originalText;
      }
    });

    async function loadOpenAiKeyStatus() {
      try {
        var res = await fetch('/api/openai-key-status');
        var data = await parseApiJson(res);
        if (!data.hasKey) {
          openAiKeyStatusEl.textContent = 'No OpenAI key configured.';
          return;
        }
        if (data.source === 'custom') {
          openAiKeyStatusEl.textContent = 'Custom OpenAI key is configured.';
          return;
        }
        openAiKeyStatusEl.textContent = 'Using environment OpenAI key.';
      } catch (err) {
        openAiKeyStatusEl.textContent = 'Unable to read OpenAI key status.';
      }
    }

    on(saveOpenAiKeyBtn, 'click', async function() {
      var key = (settingsOpenAiKeyInput.value || '').trim();
      if (!key) {
        showToast('Enter an OpenAI key first', 'warning');
        return;
      }
      var confirmOverwrite = false;
      try {
        var statusRes = await fetch('/api/openai-key-status');
        var statusData = await parseApiJson(statusRes);
        if (statusData.hasCustomKey) {
          confirmOverwrite = window.confirm('A custom OpenAI key is already set. Overwrite it?');
          if (!confirmOverwrite) return;
        }
      } catch (err) {}
      saveOpenAiKeyBtn.disabled = true;
      var originalText = saveOpenAiKeyBtn.textContent;
      saveOpenAiKeyBtn.innerHTML = '<span class="spinner"></span> Saving...';
      try {
        var res = await fetch('/api/openai-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: key, confirmOverwrite: confirmOverwrite }),
        });
        var data = await parseApiJson(res);
        if (data.error) throw new Error(data.error);
        settingsOpenAiKeyInput.value = '';
        showToast(data.overwritten ? 'OpenAI key overwritten' : 'OpenAI key saved', 'success');
        loadOpenAiKeyStatus();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        saveOpenAiKeyBtn.disabled = false;
        saveOpenAiKeyBtn.textContent = originalText;
      }
    });

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

    function renderVersionHistory() {
      var historyEl = document.getElementById('version-history');
      if (!historyEl) return;
      var lines = VERSION_HISTORY.map(function(item) {
        return '<div class="history-item"><strong>v' + escapeHtml(item.version) + '</strong> - ' + escapeHtml(item.note) + '</div>';
      });
      historyEl.innerHTML = '<div style="font-weight:600;margin-bottom:0.35rem;color:var(--text)">Version History</div>' + lines.join('');
    }

    setActiveTab(getTabFromPath(window.location.pathname), { push: false });
    loadSettings();
    loadLocations();
    loadTokenStatus();
    loadOpenAiKeyStatus();
    renderVersionHistory();
    loadDeletedCount();
    renderPreview();
  </script>
</body>
</html>`;

// Export helpers for testing
export { fetchArticlesOlderThan, extractDomain, getDeletedItems };
