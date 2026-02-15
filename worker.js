// Readwise Cleanup - Cloudflare Worker with embedded PWA
// Bulk delete/archive old Readwise Reader items with restoration support

import { MOCK_TTS_WAV_BASE64 } from './mock-tts-audio.js';
import { getUiHtml } from './ui.js';
import { getSettings, sanitizeSettings } from './settings.js';
import {
  addToReadwise,
  archiveArticle,
  deleteArticle,
  getOpenAIKey,
  getReadwiseToken,
  moveArticleToLocation,
} from './api-interactions.js';

const APP_VERSION = '3.2.3';
const VERSION_HISTORY = [
  { version: '3.2.3', completedAt: '2026-02-15', note: 'Moved Find controls into the main pane as well, making the left rail navigation-only so result workflows stay in the main content area.' },
  { version: '3.2.2', completedAt: '2026-02-15', note: 'Moved History action controls out of the rail into the main Deleted Items History panel so rail stays navigation-focused and results/actions stay together.' },
  { version: '3.2.1', completedAt: '2026-02-15', note: 'Improved v3 layout ergonomics: Deleted History list now has a reliable dedicated scroll container, and Player playlist expands to full available pane height with internal scrolling.' },
  { version: '3.2.0', completedAt: '2026-02-15', note: 'Established redesign branch baseline versioning at 3.2.x for continued UI iteration.' },
  { version: '3.1.3', completedAt: '2026-02-15', note: 'Removed overly strict Readwise token prefix validation so standard public API tokens are accepted in Settings.' },
  { version: '3.1.2', completedAt: '2026-02-15', note: 'Improved Readwise auth error handling: upstream 401/403 now return clearer actionable messages and preserve HTTP status instead of generic server errors.' },
  { version: '3.1.1', completedAt: '2026-02-15', note: 'Fixed async route error handling by awaiting API handlers in dispatcher, preventing Cloudflare 1101 HTML failures and returning structured JSON errors instead.' },
  { version: '3.1.0', completedAt: '2026-02-14', note: 'Experimental redesign branch kickoff from high-fidelity mocks, focused on UI iteration only with one-of source selection in Settings (no new integrations yet).' },
  { version: '3.0.2', completedAt: '2026-02-14', note: 'Renamed Cleanup workflow to Find, changed primary action label from Preview Items to Find, and reordered top nav tabs so History appears last.' },
  { version: '3.0.1', completedAt: '2026-02-14', note: 'Adaptive player rail compaction: narrowed left rail in player-docked mode and stacked transport controls for cleaner fit while preserving touch usability.' },
  { version: '3.0.0', completedAt: '2026-02-13', note: 'Upgraded to v3 with immediate auto-saved settings, live voice preview, larger player controls, denser header layout, faster first-audio chunking, and improved TTS narration cleanup/preface behavior.' },
  { version: '2.0.0', completedAt: '2026-02-13', note: 'Renamed app to Read Flow and finalized the v2 baseline branding/release line prior to planned v3 Gmail support.' },
  { version: '2.2.19', completedAt: '2026-02-13', note: 'Aligned UI action/button accent colors with the new Option C cyan brand palette across primary controls, focus states, and swipe accents.' },
  { version: '2.2.18', completedAt: '2026-02-13', note: 'Applied new Option C branding icon and favicon, adding an audio-wave cue alongside the checkmark to signal read-aloud support.' },
  { version: '2.2.17', completedAt: '2026-02-13', note: 'Restored low-latency startup via 3-stage chunk sizing (short/medium/long), persisted player speed, added approximate seekable playlist progress bars, voice selection in settings, and compact Player title-row controls.' },
  { version: '2.2.16', completedAt: '2026-02-13', note: 'Switched player TTS to consistency-first chunking profile (larger equal chunk sizes, fixed voice request) to reduce voice drift between chunks.' },
  { version: '2.2.15', completedAt: '2026-02-13', note: 'Improved TTS text cleanup by removing common newsletter boilerplate and de-duplicating repeated near-identical sentences from extraction artifacts.' },
  { version: '2.2.14', completedAt: '2026-02-13', note: 'Player now stops immediately when the currently playing item is deleted/archived/restored, and play/pause button now has distinct paused-vs-playing visuals/icons.' },
  { version: '2.2.13', completedAt: '2026-02-13', note: 'Improved Player UX/perf: reduced repeated headline/summary speech, added shorter-start + prefetch chunking to cut startup/gap lag, compact icon lozenge mobile controls, updated header metadata, and refined speed options.' },
  { version: '2.2.12', completedAt: '2026-02-13', note: 'Preview/Refresh button now always fetches fresh data on click instead of short-circuiting to cached results for unchanged queries.' },
  { version: '2.2.11', completedAt: '2026-02-13', note: 'Preview button now switches to Refresh Items when cached preview data is stale by age, even if filters are unchanged.' },
  { version: '2.2.10', completedAt: '2026-02-13', note: 'Reduced per-request TTS synthesis chunk size in Player so long stories always stream across multiple OpenAI clips instead of stalling near short single-clip limits.' },
  { version: '2.2.9', completedAt: '2026-02-13', note: 'Fixed TTS text assembly so full article text is no longer dropped as a duplicate when it contains the summary; this restores long-form playback beyond short summary-length clips.' },
  { version: '2.2.8', completedAt: '2026-02-13', note: 'Persisted full UI session state (tab, filters, results, selections, player queue/progress context, and scroll positions) so app reload restores prior working state.' },
  { version: '2.2.7', completedAt: '2026-02-13', note: 'Player now streams full-story TTS in sequential chunks, prioritizes full extracted text over preview text, and preserves live speed changes while continuing playback.' },
  { version: '2.2.6', completedAt: '2026-02-13', note: 'Fixed player runtime error by defining client-side max TTS text constant used during audio request slicing.' },
  { version: '2.2.5', completedAt: '2026-02-13', note: 'When source is Archive, secondary cleanup action now restores items (to known original location or Feed fallback), including matching button and swipe labeling.' },
  { version: '2.2.4', completedAt: '2026-02-13', note: 'Player text view now uses full extracted story text while keeping TTS request payload bounded.' },
  { version: '2.2.3', completedAt: '2026-02-13', note: 'Fixed real-vs-mock TTS selection by honoring explicit request mode, and added clear Player mode/error feedback when OpenAI TTS is unavailable.' },
  { version: '2.2.2', completedAt: '2026-02-13', note: 'Moved Deleted History All/search/sort controls to the results header for consistent top-of-list filtering and sorting.' },
  { version: '2.2.1', note: 'Fixed per-item playhead persistence, live player progress-bar updates, swipe-release click suppression, and preview Play forcing immediate insert-and-play behavior.' },
  { version: '2.2.0', note: 'Added Player automation settings (auto-next and auto archive/delete), richer swipeable player rows, and stronger per-item playhead restore behavior.' },
  { version: '2.1.9', note: 'Added visible Player tab, auto-load from checked preview items, persisted current playback item/position, and fixed rail search-field overflow sizing.' },
  { version: '2.1.8', note: 'Player queue is now scrollable and supports search plus filtered All-toggle selection, matching preview/deleted list workflows.' },
  { version: '2.1.7', note: 'Player now pauses/saves position when leaving the tab and resumes per-item progress; text extraction keeps longer, cleaner preview text with reduced duplication.' },
  { version: '2.1.6', note: 'Fixed preview Play shortcut click handling, switched it to an icon button, and moved text preview controls into the Player tab.' },
  { version: '2.1.5', note: 'Mock TTS now uses a recorded 20-second WAV clip for realistic player validation without live API calls.' },
  { version: '2.1.4', note: 'Made player queue rows fully clickable so selecting the current-arrow title reliably jumps to that item.' },
  { version: '2.1.3', note: 'Mock TTS now returns a testable ~20s clip, and Player queue now supports selectable items with an Auto play next toggle.' },
  { version: '2.1.2', note: 'Added configurable max-open-tabs setting and preview Play controls that open and run audio in a dedicated Player tab.' },
  { version: '2.1.1', note: 'Added extracted-text visibility in preview items so TTS input can be inspected before playback.' },
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
const MOCK_TTS_SECONDS = 20;
const MAX_TTS_PREVIEW_CHARS = 12000;
const TTS_SYNTH_CHUNK_CHARS = 3200;
const TTS_FIRST_CHUNK_CHARS = 220;
const TTS_SECOND_CHUNK_CHARS = 1000;
const PREVIEW_CACHE_STALE_MS = 15 * 60 * 1000;
const { HTML_APP, HTML_MOCKUP_V3 } = getUiHtml({
  appVersion: APP_VERSION,
  versionHistory: VERSION_HISTORY,
  maxTtsPreviewChars: MAX_TTS_PREVIEW_CHARS,
  ttsSynthChunkChars: TTS_SYNTH_CHUNK_CHARS,
  ttsFirstChunkChars: TTS_FIRST_CHUNK_CHARS,
  ttsSecondChunkChars: TTS_SECOND_CHUNK_CHARS,
  previewCacheStaleMs: PREVIEW_CACHE_STALE_MS,
});
let MOCK_TTS_BYTES = null;

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
        return await handleGetLocations(env, corsHeaders);
      }
      if (url.pathname === '/api/count') {
        return await handleGetCount(request, env, corsHeaders);
      }
      if (url.pathname === '/api/preview') {
        return await handlePreview(request, env, corsHeaders);
      }
      if (url.pathname === '/api/cleanup') {
        return await handleCleanup(request, env, corsHeaders);
      }
      if (url.pathname === '/api/deleted') {
        return await handleGetDeleted(env, corsHeaders);
      }
      if (url.pathname === '/api/restore') {
        return await handleRestore(request, env, corsHeaders);
      }
      if (url.pathname === '/api/clear-deleted') {
        return await handleClearDeleted(request, env, corsHeaders);
      }
      if (url.pathname === '/api/settings') {
        if (request.method === 'POST') {
          return await handleSaveSettings(request, env, corsHeaders);
        }
        return await handleGetSettings(env, corsHeaders);
      }
      if (url.pathname === '/api/token-status') {
        return await handleTokenStatus(env, corsHeaders);
      }
      if (url.pathname === '/api/token') {
        if (request.method === 'POST') {
          return await handleSaveToken(request, env, corsHeaders);
        }
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (url.pathname === '/api/openai-key-status') {
        return await handleOpenAIKeyStatus(env, corsHeaders);
      }
      if (url.pathname === '/api/openai-key') {
        if (request.method === 'POST') {
          return await handleSaveOpenAIKey(request, env, corsHeaders);
        }
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (url.pathname === '/api/audio/tts') {
        if (request.method === 'POST') {
          return await handleAudioTts(request, env, corsHeaders);
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
      if (url.pathname === '/mockup-v3') {
        return new Response(HTML_MOCKUP_V3, {
          headers: { 'Content-Type': 'text/html', ...corsHeaders },
        });
      }

      // Serve PWA
      return new Response(HTML_APP, {
        headers: { 'Content-Type': 'text/html', ...corsHeaders },
      });
    } catch (error) {
      const status = deriveHttpStatusFromError(error);
      return new Response(JSON.stringify({ error: error && error.message ? error.message : 'Unknown server error' }), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};

function deriveHttpStatusFromError(error) {
  const message = error && error.message ? String(error.message) : '';
  const directMatch = message.match(/\b(\d{3})\b/);
  if (directMatch) {
    const code = parseInt(directMatch[1], 10);
    if (Number.isFinite(code) && code >= 400 && code <= 599) return code;
  }
  return 500;
}

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

  const token = await getReadwiseToken(env);
  if (!token) {
    return new Response(JSON.stringify({
      error: 'Readwise API key is not configured for this deployment. Open Settings and save your Readwise API key.',
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const articles = await fetchArticlesOlderThan(env, location, beforeDate, {
    token,
    withHtmlContent: includeHtmlContent,
    fromDate,
    toDate,
    limit: effectivePreviewLimit,
    maxPages: effectivePreviewMaxPages,
  });
  const preview = articles.map(a => {
    const ttsFullText = buildTtsText(a);
    return {
      id: a.id,
      title: a.title || 'Untitled',
      author: a.author || 'Unknown',
      url: deriveOpenUrl(a),
      savedAt: a.saved_at,
      publishedAt: a.published_date || a.published_at || null,
      site: extractDomain(a.source_url || a.url),
      thumbnail: getArticleThumbnail(a),
      originalLocation: a.original_location || a.previous_location || null,
      searchable: buildSearchableText(a),
      ttsFullText,
      ttsPreview: ttsFullText.slice(0, MAX_TTS_PREVIEW_CHARS),
    };
  });

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

  if (!['delete', 'archive', 'restore'].includes(action)) {
    return new Response(JSON.stringify({ error: 'Action must be delete, archive, or restore' }), {
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
      } else if (action === 'restore') {
        const article = articles.find((a) => String(a.id) === String(id));
        const item = Array.isArray(items) ? items.find((it) => String(it && it.id) === String(id)) : null;
        const targetLocation = resolveRestoreLocation(item, article);
        await moveArticleToLocation(env, id, targetLocation);
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
  const explicitMock = typeof body.mock === 'boolean' ? body.mock : null;
  const useMockTts = explicitMock !== null ? explicitMock : settings.mockTts === true;
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
    if (!MOCK_TTS_BYTES) {
      MOCK_TTS_BYTES = base64ToUint8Array(MOCK_TTS_WAV_BASE64 || '');
      if (!MOCK_TTS_BYTES || MOCK_TTS_BYTES.length < 44) {
        MOCK_TTS_BYTES = createMockWavClip(MOCK_TTS_SECONDS);
      }
    }
    audioBytes = MOCK_TTS_BYTES;
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
<defs>
  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0ea5e9"/>
    <stop offset="1" stop-color="#0284c7"/>
  </linearGradient>
</defs>
<rect x="7" y="6" width="50" height="52" rx="12" fill="url(#g2)"/>
<path d="M18 17h28" stroke="#e0f2fe" stroke-width="3" stroke-linecap="round"/>
<path d="M18 24h28" stroke="#e0f2fe" stroke-width="3" stroke-linecap="round"/>
<path d="M18 31h22" stroke="#e0f2fe" stroke-width="3" stroke-linecap="round"/>
<path d="M18 38h17" stroke="#e0f2fe" stroke-width="3" stroke-linecap="round"/>
<circle cx="44" cy="44" r="10" fill="#f8fafc"/>
<path d="M39.6 44.2l2.5 2.5 6.1-6.1" stroke="#0284c7" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
<path d="M14 44l4-3v6z" fill="#e0f2fe"/>
<path d="M19.5 42.2c1 .9 1 2.7 0 3.6" stroke="#e0f2fe" stroke-width="2" stroke-linecap="round" fill="none"/>
<path d="M22.3 40.8c1.9 1.8 1.9 4.8 0 6.6" stroke="#e0f2fe" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>`;
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
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
    throw new Error('Readwise API key is not configured for this deployment. Open Settings and save your Readwise API key.');
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
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Readwise API ${response.status}: Unauthorized. Open Settings and re-save your Readwise API key for this deployment.`);
      }
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
function resolveRestoreLocation(item, article) {
  const candidates = [
    item && item.originalLocation,
    item && item.previousLocation,
    article && article.original_location,
    article && article.previous_location,
    article && article.restored_location,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim() && candidate.trim() !== 'archive') {
      return candidate.trim();
    }
  }
  return 'feed';
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

function createMockWavClip(seconds) {
  const sampleRate = 16000;
  const channels = 1;
  const bitsPerSample = 16;
  const samples = Math.max(1, Math.floor(sampleRate * seconds));
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = samples * channels * bytesPerSample;
  const totalSize = 44 + dataSize;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const baseFreq = 220;
  let offset = 44;
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const envelope = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.25 * t);
    const sample = Math.sin(2 * Math.PI * baseFreq * t) * 0.2 * envelope;
    const intSample = Math.max(-1, Math.min(1, sample)) * 32767;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

function writeAscii(view, offset, text) {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
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

function buildTtsText(article) {
  const sourceLabel = normalizeTtsText(article.site_name || extractDomain(article.source_url || article.url));
  const dateLabel = article.published_date || article.published_at || article.saved_at || '';
  const parsedDate = Date.parse(dateLabel || '');
  const spokenDate = Number.isFinite(parsedDate)
    ? new Date(parsedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';
  const chunks = [];
  const pushUnique = (value) => {
    const cleaned = normalizeTtsText(value);
    if (!cleaned) return;
    const normalized = cleaned.toLowerCase();
    let replaceIndex = -1;
    for (let i = 0; i < chunks.length; i++) {
      const existing = chunks[i];
      const n = existing.toLowerCase();
      if (n === normalized) return;
      // If a short fragment is already contained in a longer chunk, skip it.
      if (normalized.length <= 320 && n.includes(normalized)) return;
      // If a new longer chunk contains an existing short fragment, replace the short one.
      if (n.length <= 320 && normalized.includes(n)) replaceIndex = i;
    }
    if (replaceIndex >= 0) chunks.splice(replaceIndex, 1);
    chunks.push(cleaned);
  };

  const prefaceParts = [];
  if (article.title) prefaceParts.push(article.title);
  if (article.author) prefaceParts.push(`By ${article.author}`);
  if (sourceLabel && sourceLabel !== 'Unknown') prefaceParts.push(`From ${sourceLabel}`);
  if (spokenDate) prefaceParts.push(`Written on ${spokenDate}`);
  pushUnique(prefaceParts.join('. ') + (prefaceParts.length ? '.' : ''));

  pushUnique(article.title);
  pushUnique(article.author ? `By ${article.author}` : '');
  pushUnique(article.summary);
  pushUnique(article.content);
  pushUnique(article.notes);

  if (typeof article.html_content === 'string' && article.html_content.length > 0) {
    const plain = normalizeTtsText(article.html_content
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' '));
    // Keep full readable body text whenever available so TTS can cover the complete story.
    if (plain) pushUnique(plain);
  }

  return cleanupTtsText(chunks.join('\n\n').trim(), {
    title: article.title,
    author: article.author,
    sourceLabel,
    spokenDate,
  });
}

function normalizeTtsText(value) {
  if (!value || typeof value !== 'string') return '';
  return decodeHtmlEntities(value)
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanupTtsText(text, context = {}) {
  let cleaned = normalizeTtsText(text);
  if (!cleaned) return '';
  cleaned = cleaned
    .replace(/\bView in browser\b[:\s-]*/gi, ' ')
    .replace(/\bOpen in browser\b[:\s-]*/gi, ' ')
    .replace(/\bRead online\b[:\s-]*/gi, ' ')
    .replace(/\bProgramming note\b[:\s-]*/gi, ' ')
    .replace(/\bSubscribe\b.*$/gi, ' ')
    .replace(/\bUnsubscribe\b.*$/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const parts = cleaned.split(/(?<=[.!?])\s+/);
  const seen = new Set();
  const deduped = [];
  for (const part of parts) {
    const sentence = normalizeTtsText(part);
    if (!sentence) continue;
    const key = sentence
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!key) continue;
    // Drop repeated short/medium sentences (common extraction artifact).
    if (key.length <= 220 && seen.has(key)) continue;
    seen.add(key);
    deduped.push(sentence);
  }
  let result = deduped.join(' ').trim();

  // Trim common trailing podcast/newsletter boilerplate sections.
  const tailWindowStart = Math.max(0, result.length - 2600);
  const tail = result.slice(tailWindowStart);
  const boilerplateMarkers = [
    /\b(credits|transcript|thanks to|special thanks|produced by|edited by|hosted by|co-hosts?)\b/i,
    /\b(collaborators?|contributors?|panelists?)\b/i,
    /\b(subscribe|unsubscribe|follow us|newsletter|support this podcast)\b/i,
  ];
  let cutAt = -1;
  for (const marker of boilerplateMarkers) {
    const match = tail.match(marker);
    if (match && typeof match.index === 'number') {
      const abs = tailWindowStart + match.index;
      cutAt = cutAt < 0 ? abs : Math.min(cutAt, abs);
    }
  }
  if (cutAt > 0) {
    result = result.slice(0, cutAt).trim();
  }

  // Remove duplicate metadata if it appears again right after preface.
  const metas = [
    normalizeTtsText(context.title || ''),
    normalizeTtsText(context.author ? `By ${context.author}` : ''),
    normalizeTtsText(context.sourceLabel ? `From ${context.sourceLabel}` : ''),
    normalizeTtsText(context.spokenDate ? `Written on ${context.spokenDate}` : ''),
  ].filter(Boolean);
  for (const meta of metas) {
    const escaped = meta.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(\\b${escaped}\\b)`, 'ig');
    let seenMeta = false;
    result = result.replace(re, (m) => {
      if (seenMeta) return '';
      seenMeta = true;
      return m;
    });
    result = result.replace(/\s{2,}/g, ' ').trim();
  }

  return result;
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


// Export helpers for testing
export { fetchArticlesOlderThan, extractDomain, getDeletedItems, buildTtsText };
