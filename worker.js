// Readwise Cleanup - Cloudflare Worker with embedded PWA
// Bulk delete/archive old Readwise Reader items with restoration support

import { MOCK_TTS_WAV_BASE64 } from './mock-tts-audio.js';
import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
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

const APP_VERSION = '3.3.22';
const VERSION_HISTORY = [
  { version: '3.3.22', completedAt: '2026-02-21', note: 'Improved audio download failure diagnostics by surfacing explicit OpenAI TTS quota/auth/upstream error details through the API and player feedback/toast messaging instead of generic download failure text.' },
  { version: '3.3.21', completedAt: '2026-02-18', note: 'Integrated open-source article extraction for HTML newsletters/content using Mozilla Readability with linkedom DOM parsing, tightened Gmail MIME handling to avoid treating HTML parts as plain text, and improved TTS text assembly to prefer extracted readable body/excerpt/byline content while preventing raw HTML leakage.' },
  { version: '3.3.20', completedAt: '2026-02-17', note: 'Fixed Find full-width preview scrolling by preserving tab grid display semantics and enforcing main cleanup pane height constraints; removed redundant Remove action from Deleted History; aligned Player/History summary chips onto header row like Find; and fixed Gmail newsletter TTS extraction so HTML-only messages are converted to readable text instead of leaking raw markup.' },
  { version: '3.3.19', completedAt: '2026-02-17', note: 'Kept native date widgets but removed programmatic min/max constraint mutation to avoid iOS segmented day-entry digit coercion (for example 16 becoming 06); range validation remains enforced at Find submit.' },
  { version: '3.3.18', completedAt: '2026-02-17', note: 'Added top informational summary chips to Player and Deleted History views to mirror Find (filtered count, selected count, and total queue/history context) with live updates during search and selection.' },
  { version: '3.3.17', completedAt: '2026-02-17', note: 'Restored native calendar date widgets in Find and fixed iPhone segmented day-entry regression by deferring date min/max constraint updates until change/blur (instead of input), avoiding live constraint mutation while typing.' },
  { version: '3.3.16', completedAt: '2026-02-17', note: 'Reworked Find date range inputs to text-based ISO entry with normalization/validation so day typing behaves predictably on iPhone keyboards (for example typing 16 remains 16 instead of segmented 01/06 behavior).' },
  { version: '3.3.15', completedAt: '2026-02-17', note: 'Fixed Readwise inbox forwarded-email behavior by preventing arbitrary first-link open-url fallback for email-like items, and extended email boilerplate TTS cleanup heuristics beyond Gmail-source-only metadata so forwarded newsletters read cleaner body content.' },
  { version: '3.3.14', completedAt: '2026-02-17', note: 'Fixed mobile Find preview scrolling by restoring page-level vertical scrolling under tablet/phone breakpoints where main-pane switches to auto/visible overflow.' },
  { version: '3.3.13', completedAt: '2026-02-17', note: 'Fixed iPhone Find preview scroll regression by improving swipe gesture intent detection: preview rows now capture pointer only for clear horizontal swipes, preserving vertical list scrolling while keeping swipe archive/delete actions.' },
  { version: '3.3.12', completedAt: '2026-02-17', note: 'Added functional alternate /v4 UI route with mobile-first expanded-active-item interaction: larger touch targets, active-row emphasis for preview/player controls, preserved swipe archive/delete behavior, and unchanged default / experience.' },
  { version: '3.3.11', completedAt: '2026-02-17', note: 'Refined dedicated iPhone mock concepts with explicit action labeling: active-row controls now show concrete per-item actions and hybrid shelf mock shows batch action labels for selection workflows.' },
  { version: '3.3.10', completedAt: '2026-02-17', note: 'Refined dedicated iPhone mock route to focus on two candidate interaction models only: B (expanded active item) and A+B hybrid (persistent action shelf plus expanded active item), removing unrelated mock variants from the preview set.' },
  { version: '3.3.9', completedAt: '2026-02-17', note: 'Removed the non-actionable current-item stopped toast after Find delete/archive actions, and added non-active iPhone-focused CSS mock concepts in About to evaluate larger touch targets, collapsed secondary controls, and bottom action ergonomics before implementation.' },
  { version: '3.3.8', completedAt: '2026-02-17', note: 'Enabled real Gmail mailbox actions for Gmail-source cleanup (archive/delete via Gmail API with oauth modify scope), improved Gmail newsletter extraction by preferring canonical content links and image thumbnails from email HTML, and preserved Gmail deep-link fallback when no newsletter URL is available.' },
  { version: '3.3.7', completedAt: '2026-02-17', note: 'Updated Find preview source labeling for Gmail items to display label-aware origin (for example gmail/Subscription) instead of generic site text.' },
  { version: '3.3.6', completedAt: '2026-02-17', note: 'Improved Gmail source UX and reliability: Settings now supports validated label selection against live Gmail labels, and Find-triggered Gmail sync uses selected labels with safer incremental fetch behavior before previewing Gmail results.' },
  { version: '3.3.5', completedAt: '2026-02-17', note: 'Hardened Gmail OAuth sync reliability by capping per-run full-message fetch volume to stay within Cloudflare Worker subrequest limits for larger mailboxes, preventing sync failures with "Too many subrequests".' },
  { version: '3.3.4', completedAt: '2026-02-17', note: 'Improved Gmail sync diagnostics and label handling: removed forced inbox-only query, validate/resolve selected labels against live Gmail labels, and return explicit guidance when configured labels do not match any Gmail label names.' },
  { version: '3.3.3', completedAt: '2026-02-15', note: 'Improved Gmail OAuth readiness UX: status now reports OAuth config readiness and disables Connect with clear guidance when client credentials are missing, avoiding opaque connect errors.' },
  { version: '3.3.2', completedAt: '2026-02-15', note: 'Added popup-based Gmail OAuth UX so Connect opens a permission dialog window and returns result to Settings via postMessage/auto-close without full-page navigation.' },
  { version: '3.3.1', completedAt: '2026-02-15', note: 'Extended Gmail integration with OAuth connect/callback/disconnect flow, token refresh support, direct Gmail sync endpoint, and Settings controls to connect/sync/disconnect without manual hook payload posting.' },
  { version: '3.3.0', completedAt: '2026-02-15', note: 'Started Gmail source integration with source-aware query plumbing, Gmail hook/status/labels APIs, and normalized Gmail item ingestion for Find/Player workflows.' },
  { version: '3.2.18', completedAt: '2026-02-15', note: 'Removed non-actionable “playback stopped” status messaging after auto archive/delete transitions so end-of-item automation no longer emits redundant stop feedback in player status.' },
  { version: '3.2.17', completedAt: '2026-02-15', note: 'Improved downloaded-audio persistence visibility across fresh app instances by adding cross-profile (voice/mode aware fallback) manifest/chunk lookup and distinct-chunk hydration, so previously downloaded queue entries reliably show downloaded state and remain playable offline.' },
  { version: '3.2.16', completedAt: '2026-02-15', note: 'Fixed timeline click interception in playlist rows by excluding progress bars from swipe gesture capture, so progress-bar clicks consistently invoke seek behavior instead of row navigation.' },
  { version: '3.2.15', completedAt: '2026-02-15', note: 'Fixed player timeline seeking fidelity: seeking from queue/current progress bars now routes through target chunk loads without stale-progress overwrite, seeks can jump directly when already in the loaded chunk, and downloaded-target seeks suppress redundant loading-status flashes.' },
  { version: '3.2.14', completedAt: '2026-02-15', note: 'Improved player resilience and control fidelity: persisted/localized download progress across refresh/navigation, tightened filtered-selection action scoping, added mini-player back skip, stabilized queue buffer invalidation on resets/removals, improved thumbnail fallback handling, and hardened TTS text cleanup to exclude URLs/machine-style long numbers while preserving image captions.' },
  { version: '3.2.13', completedAt: '2026-02-15', note: 'Moved red player error/loading feedback into a dedicated line below transport controls to keep the player layout stable during status updates while preserving high-visibility messaging.' },
  { version: '3.2.12', completedAt: '2026-02-15', note: 'Refined local-audio workflow and queue UX: unified played/downloaded progress into one selectable bar (blue played over green downloaded), moved download controls to per-item queue buttons with pause/resume semantics, added queue-level download state in player header, enabled background/forced queue downloads using the same indicators, preserved playback while downloads continue, and tightened rail button contrast.' },
  { version: '3.2.11', completedAt: '2026-02-15', note: 'Increased rail nav button contrast, added floating player red/green status dot, introduced queue-download workflow (selected queueing, sequential downloads, abort, per-item status/progress), enabled offline playback fallback for downloaded stories, surfaced current-story progress in player header, added open/download actions in queue rows, moved auto-next control to Settings-only defaults, and made loading-chunk status text red for visibility.' },
  { version: '3.2.10', completedAt: '2026-02-15', note: 'Added red/green state dot to floating player hover, strengthened rail menu button styling, and refined playback control presentation while keeping speed control in custom player controls only.' },
  { version: '3.2.9', completedAt: '2026-02-15', note: 'Improved queue-management UX: stabilized player queue indicator updates, refined Find date-range behavior, moved timestamped fix history back into Settings, and updated About copy for queue + TTS workflows.' },
  { version: '3.2.8', completedAt: '2026-02-15', note: 'Aligned v3 layout to mock intent: player controls now dock to the rail on desktop, and History actions/filter/sort controls now live at the top of the History results card.' },
  { version: '3.2.7', completedAt: '2026-02-15', note: 'Constrained docked rail control layouts to prevent overflow into the main pane and keep result lists visually anchored in the main content area.' },
  { version: '3.2.6', completedAt: '2026-02-15', note: 'Fixed initialization-time control docking so Find/History controls reliably move into the left rail on desktop without requiring a manual resize.' },
  { version: '3.2.5', completedAt: '2026-02-15', note: 'Expanded v3 rail docking so Find/History controls move into the left rail at standard desktop widths with rail-specific card/button sizing.' },
  { version: '3.2.4', completedAt: '2026-02-15', note: 'Implemented mock-aligned responsive docking so Find and History control cards move into the left rail on wide screens while results stay in the main pane.' },
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
const GMAIL_ITEMS_KEY = 'gmail_items_v1';
const GMAIL_LABELS_KEY = 'gmail_labels_v1';
const GMAIL_OAUTH_TOKEN_KEY = 'gmail_oauth_token_v1';
const GMAIL_OAUTH_STATE_KEY = 'gmail_oauth_state_v1';
const GMAIL_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
];
const GMAIL_SYNC_MAX_MESSAGE_FETCH = 40;
const { HTML_APP, HTML_APP_V4, HTML_MOCKUP_V3, HTML_MOCKUP_IPHONE } = getUiHtml({
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
      if (url.pathname === '/api/gmail/status') {
        return await handleGmailStatus(env, corsHeaders);
      }
      if (url.pathname === '/api/gmail/connect') {
        return await handleGmailConnect(request, env);
      }
      if (url.pathname === '/api/gmail/oauth/callback') {
        return await handleGmailOauthCallback(request, env);
      }
      if (url.pathname === '/api/gmail/disconnect') {
        if (request.method === 'POST') {
          return await handleGmailDisconnect(env, corsHeaders);
        }
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (url.pathname === '/api/gmail/labels') {
        if (request.method === 'POST') {
          return await handleSaveGmailLabels(request, env, corsHeaders);
        }
        return await handleGetGmailLabels(env, corsHeaders);
      }
      if (url.pathname === '/api/gmail/sync') {
        if (request.method === 'POST') {
          return await handleGmailSync(env, corsHeaders);
        }
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (url.pathname === '/api/gmail/hook') {
        if (request.method === 'POST') {
          return await handleGmailHook(request, env, corsHeaders);
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
      if (url.pathname === '/v4') {
        return new Response(HTML_APP_V4, {
          headers: { 'Content-Type': 'text/html', ...corsHeaders },
        });
      }
      if (url.pathname === '/mockup-iphone') {
        return new Response(HTML_MOCKUP_IPHONE, {
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
  const source = normalizeSource(url.searchParams.get('source'));
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

  const settings = await getSettings(env);
  const items = await fetchItemsBySource(env, {
    source,
    location,
    beforeDate,
    fromDate,
    toDate,
    gmailLabels: settings.gmailSelectedLabels || [],
    limit: 2000,
    includeHtmlContent: false,
  });

  return new Response(JSON.stringify({
    count: items.length,
    source,
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
  const source = normalizeSource(url.searchParams.get('source'));
  const location = url.searchParams.get('location') || 'new';
  const beforeDate = url.searchParams.get('before');
  const fromDate = url.searchParams.get('from');
  const toDate = url.searchParams.get('to');
  const requestedLimit = parseInt(url.searchParams.get('limit') || '', 10);
  const previewLimit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(500, requestedLimit)) : 100;
  const requestedMaxPages = parseInt(url.searchParams.get('maxPages') || '', 10);
  const previewMaxPages = Number.isFinite(requestedMaxPages) ? Math.max(1, Math.min(200, requestedMaxPages)) : 20;
  const effectivePreviewLimit = location === 'archive' ? Math.min(previewLimit, 50) : previewLimit;
  const effectivePreviewMaxPages = location === 'archive' ? Math.min(previewMaxPages, 5) : previewMaxPages;

  if (!beforeDate && !toDate && !fromDate) {
    return new Response(JSON.stringify({ error: 'Missing date range' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const settings = await getSettings(env);
  const items = await fetchItemsBySource(env, {
    source,
    location,
    beforeDate,
    fromDate,
    toDate,
    gmailLabels: settings.gmailSelectedLabels || [],
    limit: effectivePreviewLimit,
    maxPages: effectivePreviewMaxPages,
    includeHtmlContent: location !== 'archive',
  });
  const preview = items.map(normalizePreviewItem);

  return new Response(JSON.stringify({
    total: items.length,
    preview,
    showing: preview.length,
    source,
    dateRange: { beforeDate, fromDate, toDate },
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// Perform cleanup (delete or archive)
async function handleCleanup(request, env, corsHeaders) {
  const body = await request.json();
  const { location, beforeDate, fromDate, toDate, action, ids, items } = body;
  const source = normalizeSource(body.source);

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
    const settings = await getSettings(env);
    articles = await fetchItemsBySource(env, {
      source,
      location,
      beforeDate,
      fromDate,
      toDate,
      gmailLabels: settings.gmailSelectedLabels || [],
      limit: 2000,
      includeHtmlContent: false,
    });
    targetIds = articles.map((article) => String(article.id || ''));
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

  const itemById = new Map(Array.isArray(items) ? items
    .filter((item) => item && item.id !== undefined && item.id !== null)
    .map((item) => [String(item.id), item]) : []);
  const articleById = new Map(articles.map((article) => [String(article.id || ''), article]));
  const gmailIds = [];
  const readwiseIds = [];
  for (const id of targetIds) {
    const item = itemById.get(String(id));
    const article = articleById.get(String(id));
    const kind = String((item && item.kind) || (article && article.kind) || '').toLowerCase();
    const site = String((item && item.site) || (article && article.site) || '').toLowerCase();
    const isGmail = source === 'gmail' || kind === 'gmail' || site === 'gmail';
    if (isGmail) gmailIds.push(String(id));
    else readwiseIds.push(String(id));
  }

  if (gmailIds.length > 0) {
    const gmailResult = await processGmailCleanup(env, gmailIds, action);
    processed += gmailResult.processed;
    processedIds = processedIds.concat(gmailResult.processedIds);
    errors = errors.concat(gmailResult.errors);
  }

  for (const id of readwiseIds) {
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
    source,
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
  const urls = Array.isArray(body.urls) ? body.urls : [];
  const keys = Array.isArray(body.keys) ? body.keys.map((key) => String(key || '')).filter(Boolean) : [];

  if (urls.length === 0 && keys.length === 0) {
    return new Response(JSON.stringify({ error: 'No URLs provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const deletedItems = await getDeletedItems(env);
  const keySet = new Set(keys);
  const selectedItems = keySet.size > 0
    ? deletedItems.filter((item) => keySet.has(getDeletedItemKey(item)))
    : deletedItems.filter((item) => urls.includes(item.url));
  const selectedUrls = Array.from(new Set(selectedItems.map((item) => item.url).filter(Boolean)));

  if (selectedUrls.length === 0) {
    return new Response(JSON.stringify({ restored: 0, errors: undefined }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  let restored = 0;
  let errors = [];

  for (const url of selectedUrls) {
    try {
      await addToReadwise(env, url);
      restored++;
    } catch (err) {
      errors.push({ url, error: err.message });
    }
  }

  // Remove restored items from deleted list
  if (restored > 0) {
    const restoredUrlSet = new Set(selectedUrls);
    const selectedKeySet = new Set(selectedItems.map((item) => getDeletedItemKey(item)));
    const remaining = deletedItems.filter((item) => {
      const itemKey = getDeletedItemKey(item);
      if (selectedKeySet.has(itemKey)) return false;
      if (keySet.size === 0 && restoredUrlSet.has(item.url)) return false;
      return true;
    });
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
  let keys = null;
  try {
    const bodyText = await request.text();
    if (bodyText) {
      const body = JSON.parse(bodyText);
      if (Array.isArray(body.urls)) {
        urls = body.urls;
      }
      if (Array.isArray(body.keys)) {
        keys = body.keys.map((key) => String(key || '')).filter(Boolean);
      }
    }
  } catch {
    urls = null;
    keys = null;
  }

  const deletedItems = await getDeletedItems(env);
  if ((keys && keys.length > 0) || (urls && urls.length > 0)) {
    const keySet = new Set(Array.isArray(keys) ? keys : []);
    const urlSet = new Set(Array.isArray(urls) ? urls : []);
    const remaining = deletedItems.filter((item) => {
      if (keySet.size > 0 && keySet.has(getDeletedItemKey(item))) return false;
      if (keySet.size === 0 && urlSet.size > 0 && urlSet.has(item.url)) return false;
      return true;
    });
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

function getDeletedItemKey(item) {
  const id = item && item.id !== undefined && item.id !== null ? String(item.id) : '';
  const url = item && item.url ? String(item.url) : '';
  const deletedAt = item && item.deletedAt ? String(item.deletedAt) : '';
  const savedAt = item && item.savedAt ? String(item.savedAt) : '';
  const title = item && item.title ? String(item.title) : '';
  return [id, url, deletedAt, savedAt, title].join('|');
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

async function handleGmailStatus(env, corsHeaders) {
  const settings = await getSettings(env);
  const hasHookSecret = typeof env.GMAIL_HOOK_SECRET === 'string' && env.GMAIL_HOOK_SECRET.length > 0;
  const oauthConfigReady = typeof env.GMAIL_CLIENT_ID === 'string'
    && env.GMAIL_CLIENT_ID.trim().length > 0
    && typeof env.GMAIL_CLIENT_SECRET === 'string'
    && env.GMAIL_CLIENT_SECRET.trim().length > 0;
  const token = await getGmailOauthToken(env);
  const validAccessToken = token ? await getValidGmailAccessToken(env) : '';
  const items = await getGmailItems(env);
  let labels = await getKnownGmailLabels(env);
  if (validAccessToken) {
    const live = await fetchGmailLabelsCatalog(validAccessToken);
    if (live.names.length > 0) {
      labels = live.names;
      await env.KV.put(GMAIL_LABELS_KEY, JSON.stringify(labels));
    }
  }
  return new Response(JSON.stringify({
    enabled: true,
    mode: token ? 'oauth' : 'hook',
    oauthConfigReady,
    hookConfigured: hasHookSecret,
    connected: !!token,
    tokenExpiresAt: token && token.expiresAt ? token.expiresAt : null,
    itemCount: items.length,
    selectedLabels: settings.gmailSelectedLabels || [],
    labels,
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

async function handleGmailConnect(request, env) {
  const config = getGmailOauthConfig(request, env);
  const requestUrl = new URL(request.url);
  const popupMode = requestUrl.searchParams.get('popup') === '1';
  if (!config.clientId || !config.clientSecret || !config.redirectUri) {
    if (popupMode) return createGmailOauthPopupResultPage(config.origin, 'missing_config', 'missing_config');
    const fallback = `${config.origin}/settings?gmail_oauth=missing_config`;
    return Response.redirect(fallback, 302);
  }
  const state = crypto.randomUUID();
  await env.KV.put(GMAIL_OAUTH_STATE_KEY, JSON.stringify({
    state,
    createdAt: Date.now(),
    popupMode,
  }), { expirationTtl: 10 * 60 });
  const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  auth.searchParams.set('client_id', config.clientId);
  auth.searchParams.set('redirect_uri', config.redirectUri);
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('scope', GMAIL_OAUTH_SCOPES.join(' '));
  auth.searchParams.set('access_type', 'offline');
  auth.searchParams.set('prompt', 'consent');
  auth.searchParams.set('state', state);
  return Response.redirect(auth.toString(), 302);
}

async function handleGmailOauthCallback(request, env) {
  const url = new URL(request.url);
  const config = getGmailOauthConfig(request, env);
  const state = url.searchParams.get('state') || '';
  const code = url.searchParams.get('code') || '';
  const err = url.searchParams.get('error') || '';
  const redirectBase = `${config.origin}/settings`;

  if (err) {
    return Response.redirect(`${redirectBase}?gmail_oauth=error&reason=${encodeURIComponent(err)}`, 302);
  }
  if (!state || !code) {
    return Response.redirect(`${redirectBase}?gmail_oauth=invalid_callback`, 302);
  }
  const rawSavedState = await env.KV.get(GMAIL_OAUTH_STATE_KEY);
  await env.KV.delete(GMAIL_OAUTH_STATE_KEY);
  if (!rawSavedState) {
    return Response.redirect(`${redirectBase}?gmail_oauth=state_missing`, 302);
  }
  let savedState = null;
  try { savedState = JSON.parse(rawSavedState); } catch {}
  if (!savedState || savedState.state !== state) {
    return Response.redirect(`${redirectBase}?gmail_oauth=state_mismatch`, 302);
  }
  const popupMode = !!savedState.popupMode;
  if (!config.clientId || !config.clientSecret || !config.redirectUri) {
    if (popupMode) return createGmailOauthPopupResultPage(config.origin, 'missing_config', 'missing_config');
    return Response.redirect(`${redirectBase}?gmail_oauth=missing_config`, 302);
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }),
    });
    const data = await tokenRes.json();
    if (!tokenRes.ok || !data || !data.access_token) {
      const reason = data && (data.error_description || data.error) ? String(data.error_description || data.error) : `token_${tokenRes.status}`;
      if (popupMode) return createGmailOauthPopupResultPage(config.origin, 'token_error', reason);
      return Response.redirect(`${redirectBase}?gmail_oauth=token_error&reason=${encodeURIComponent(reason)}`, 302);
    }
    const now = Date.now();
    const expiresIn = Number(data.expires_in || 3600);
    const next = {
      accessToken: String(data.access_token),
      refreshToken: data.refresh_token ? String(data.refresh_token) : '',
      scope: typeof data.scope === 'string' ? data.scope : GMAIL_OAUTH_SCOPES.join(' '),
      tokenType: typeof data.token_type === 'string' ? data.token_type : 'Bearer',
      expiresAt: new Date(now + (expiresIn * 1000)).toISOString(),
      updatedAt: new Date(now).toISOString(),
    };
    await saveGmailOauthToken(env, next);
    if (popupMode) return createGmailOauthPopupResultPage(config.origin, 'connected', '');
    return Response.redirect(`${redirectBase}?gmail_oauth=connected`, 302);
  } catch (error) {
    if (popupMode) return createGmailOauthPopupResultPage(config.origin, 'token_exception', error.message || 'unknown');
    return Response.redirect(`${redirectBase}?gmail_oauth=token_exception&reason=${encodeURIComponent(error.message || 'unknown')}`, 302);
  }
}

async function handleGmailDisconnect(env, corsHeaders) {
  await env.KV.delete(GMAIL_OAUTH_TOKEN_KEY);
  return new Response(JSON.stringify({
    disconnected: true,
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

async function handleGetGmailLabels(env, corsHeaders) {
  const settings = await getSettings(env);
  const labels = await getKnownGmailLabels(env);
  return new Response(JSON.stringify({
    labels,
    selectedLabels: settings.gmailSelectedLabels || [],
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

async function handleSaveGmailLabels(request, env, corsHeaders) {
  const body = await request.json();
  let labels = Array.isArray(body.labels) ? body.labels : [];
  labels = labels.map((label) => String(label || '').trim()).filter(Boolean);
  if (labels.length > 0) {
    const token = await getValidGmailAccessToken(env);
    if (!token) {
      return new Response(JSON.stringify({ error: 'Connect Gmail before saving label filters.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    const resolution = await resolveGmailLabelSelection(token, labels);
    if (resolution.unmatchedNames.length > 0) {
      return new Response(JSON.stringify({
        error: `Unknown Gmail labels: ${resolution.unmatchedNames.join(', ')}`,
        unknownLabels: resolution.unmatchedNames,
        availableLabels: resolution.availableNames,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    labels = resolution.matchedNames;
  }
  const settings = await getSettings(env);
  const sanitized = sanitizeSettings({ ...settings, gmailSelectedLabels: labels });
  await env.KV.put('settings', JSON.stringify(sanitized));
  return new Response(JSON.stringify({
    saved: true,
    selectedLabels: sanitized.gmailSelectedLabels,
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

async function handleGmailHook(request, env, corsHeaders) {
  const secret = typeof env.GMAIL_HOOK_SECRET === 'string' ? env.GMAIL_HOOK_SECRET : '';
  if (secret) {
    const supplied = request.headers.get('x-gmail-hook-secret') || '';
    if (!supplied || supplied !== secret) {
      return new Response(JSON.stringify({ error: 'Unauthorized gmail hook request' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }

  const body = await request.json();
  const incoming = Array.isArray(body && body.items) ? body.items : [];
  if (incoming.length === 0) {
    return new Response(JSON.stringify({ error: 'No gmail items provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const existing = await getGmailItems(env);
  const byId = new Map(existing.map((item) => [String(item.id), item]));
  const labelSet = new Set(await getKnownGmailLabels(env));
  let accepted = 0;
  for (const raw of incoming) {
    const normalized = normalizeGmailItem(raw);
    if (!normalized) continue;
    byId.set(String(normalized.id), normalized);
    accepted += 1;
    for (const label of normalized.labels || []) labelSet.add(label);
  }

  const nextItems = Array.from(byId.values())
    .sort((a, b) => Date.parse(b.savedAt || 0) - Date.parse(a.savedAt || 0))
    .slice(0, 4000);
  await env.KV.put(GMAIL_ITEMS_KEY, JSON.stringify(nextItems));
  await env.KV.put(GMAIL_LABELS_KEY, JSON.stringify(Array.from(labelSet).sort()));

  return new Response(JSON.stringify({
    accepted,
    total: nextItems.length,
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

async function handleGmailSync(env, corsHeaders) {
  const token = await getValidGmailAccessToken(env);
  if (!token) {
    return new Response(JSON.stringify({ error: 'Gmail is not connected. Use Connect Gmail in Settings first.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  const settings = await getSettings(env);
  const selectedLabels = Array.isArray(settings.gmailSelectedLabels) ? settings.gmailSelectedLabels : [];
  const labelResolution = await resolveGmailLabelSelection(token, selectedLabels);
  if (selectedLabels.length > 0 && labelResolution.matchedIds.length === 0) {
    return new Response(JSON.stringify({
      error: `No matching Gmail labels found for selection: ${selectedLabels.join(', ')}`,
      selectedLabels,
      availableLabels: labelResolution.availableNames,
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  const gmailLabelIds = labelResolution.matchedIds;
  const q = '';
  const listUrl = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  listUrl.searchParams.set('maxResults', String(GMAIL_SYNC_MAX_MESSAGE_FETCH));
  if (q) listUrl.searchParams.set('q', q);
  for (const labelId of gmailLabelIds) {
    listUrl.searchParams.append('labelIds', labelId);
  }
  const listRes = await fetch(listUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listData = await listRes.json();
  if (!listRes.ok) {
    const msg = listData && (listData.error && listData.error.message) ? listData.error.message : `gmail_list_${listRes.status}`;
    return new Response(JSON.stringify({ error: msg }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  const messages = Array.isArray(listData.messages) ? listData.messages.slice(0, GMAIL_SYNC_MAX_MESSAGE_FETCH) : [];
  const items = [];
  for (const message of messages) {
    const id = String(message && message.id || '');
    if (!id) continue;
    const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=full`;
    const msgRes = await fetch(msgUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!msgRes.ok) continue;
    const msgData = await msgRes.json();
    const normalized = normalizeGmailMessageFromApi(msgData, selectedLabels);
    if (normalized) items.push(normalized);
  }
  const existing = await getGmailItems(env);
  const byId = new Map(existing.map((item) => [String(item.id), item]));
  const labelSet = new Set(await getKnownGmailLabels(env));
  for (const item of items) {
    byId.set(String(item.id), item);
    for (const label of item.labels || []) labelSet.add(label);
  }
  const nextItems = Array.from(byId.values())
    .sort((a, b) => Date.parse(b.savedAt || 0) - Date.parse(a.savedAt || 0))
    .slice(0, 4000);
  await env.KV.put(GMAIL_ITEMS_KEY, JSON.stringify(nextItems));
  await env.KV.put(GMAIL_LABELS_KEY, JSON.stringify(Array.from(labelSet).sort()));
  return new Response(JSON.stringify({
    synced: items.length,
    total: nextItems.length,
    selectedLabels,
    matchedLabelIds: gmailLabelIds,
    unmatchedLabels: labelResolution.unmatchedNames,
    syncFetchLimit: GMAIL_SYNC_MAX_MESSAGE_FETCH,
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function normalizeSource(value) {
  if (value === 'gmail' || value === 'all') return value;
  return 'readwise';
}

function normalizePreviewItem(item) {
  if (!item) return null;
  if (item.kind === 'gmail') {
    const ttsFullText = cleanupTtsText(buildTtsText({
      title: item.title || 'Untitled',
      author: item.author || '',
      content: item.textContent || '',
      summary: item.summary || '',
      html_content: item.htmlContent || '',
      source_url: item.url || '',
      url: item.url || '',
      site_name: item.site || 'gmail',
      notes: item.labels && item.labels.length ? `Labels: ${item.labels.join(', ')}` : '',
    }), { sourceLabel: item.site || 'gmail' });
    const searchable = normalizeTtsText([item.title, item.author, item.url, item.site, item.textContent, item.summary, (item.labels || []).join(' ')].filter(Boolean).join(' ')).toLowerCase();
    return {
      id: item.id,
      title: item.title || 'Untitled',
      author: item.author || 'Unknown',
      url: item.openUrl || item.url || '',
      openUrl: item.openUrl || item.url || '',
      gmailUrl: item.gmailUrl || '',
      savedAt: item.savedAt || new Date().toISOString(),
      publishedAt: item.publishedAt || null,
      site: item.site || 'gmail',
      thumbnail: item.thumbnail || null,
      originalLocation: 'gmail',
      searchable,
      ttsFullText,
      ttsPreview: ttsFullText.slice(0, MAX_TTS_PREVIEW_CHARS),
      labels: item.labels || [],
      kind: 'gmail',
    };
  }

  const a = item;
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
    kind: 'readwise',
  };
}

async function fetchItemsBySource(env, options = {}) {
  const source = normalizeSource(options.source);
  const includeReadwise = source === 'readwise' || source === 'all';
  const includeGmail = source === 'gmail' || source === 'all';
  const out = [];

  if (includeReadwise) {
    const token = await getReadwiseToken(env);
    if (!token && source === 'readwise') {
      throw new Error('400 Readwise API key is not configured for this deployment. Open Settings and save your Readwise API key.');
    }
    if (token) {
      const readwiseItems = await fetchArticlesOlderThan(env, options.location || 'new', options.beforeDate, {
        token,
        withHtmlContent: options.includeHtmlContent !== false,
        fromDate: options.fromDate,
        toDate: options.toDate,
        limit: options.limit || 100,
        maxPages: options.maxPages || 20,
      });
      out.push(...readwiseItems);
    }
  }

  if (includeGmail) {
    const gmailItems = await getFilteredGmailItems(env, {
      fromDate: options.fromDate,
      toDate: options.toDate || options.beforeDate,
      labels: options.gmailLabels || [],
      limit: options.limit || 100,
    });
    out.push(...gmailItems);
  }

  out.sort((a, b) => {
    const aDate = Date.parse(a.saved_at || a.savedAt || 0);
    const bDate = Date.parse(b.saved_at || b.savedAt || 0);
    return bDate - aDate;
  });
  return out.slice(0, options.limit || 100);
}

async function getGmailItems(env) {
  try {
    const raw = await env.KV.get(GMAIL_ITEMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function getKnownGmailLabels(env) {
  try {
    const raw = await env.KV.get(GMAIL_LABELS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string' && v.trim()).map((v) => v.trim()) : [];
  } catch {
    return [];
  }
}

function getGmailOauthConfig(request, env) {
  const reqUrl = new URL(request.url);
  const origin = `${reqUrl.protocol}//${reqUrl.host}`;
  const clientId = typeof env.GMAIL_CLIENT_ID === 'string' ? env.GMAIL_CLIENT_ID.trim() : '';
  const clientSecret = typeof env.GMAIL_CLIENT_SECRET === 'string' ? env.GMAIL_CLIENT_SECRET.trim() : '';
  const redirectUri = typeof env.GMAIL_REDIRECT_URI === 'string' && env.GMAIL_REDIRECT_URI.trim()
    ? env.GMAIL_REDIRECT_URI.trim()
    : `${origin}/api/gmail/oauth/callback`;
  return { origin, clientId, clientSecret, redirectUri };
}

function createGmailOauthPopupResultPage(origin, status, reason) {
  const safeOrigin = JSON.stringify(String(origin || ''));
  const safeStatus = JSON.stringify(String(status || 'unknown'));
  const safeReason = JSON.stringify(String(reason || ''));
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Gmail OAuth</title></head><body><script>
  (function () {
    var payload = { type: 'gmail-oauth-result', status: ${safeStatus}, reason: ${safeReason} };
    try {
      if (window.opener && window.opener.postMessage) {
        window.opener.postMessage(payload, ${safeOrigin});
      }
    } catch (e) {}
    setTimeout(function () { window.close(); }, 60);
  })();
  </script><p style="font-family:sans-serif;color:#334155">You can close this window.</p></body></html>`;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

async function getGmailOauthToken(env) {
  try {
    const raw = await env.KV.get(GMAIL_OAUTH_TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function saveGmailOauthToken(env, token) {
  await env.KV.put(GMAIL_OAUTH_TOKEN_KEY, JSON.stringify(token));
}

async function refreshGmailAccessTokenIfNeeded(env, token) {
  if (!token) return null;
  const expTs = Date.parse(token.expiresAt || '');
  const now = Date.now();
  if (Number.isFinite(expTs) && expTs > now + 60 * 1000) return token;
  if (!token.refreshToken) return null;
  const clientId = typeof env.GMAIL_CLIENT_ID === 'string' ? env.GMAIL_CLIENT_ID.trim() : '';
  const clientSecret = typeof env.GMAIL_CLIENT_SECRET === 'string' ? env.GMAIL_CLIENT_SECRET.trim() : '';
  if (!clientId || !clientSecret) return null;

  const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: token.refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await refreshRes.json();
  if (!refreshRes.ok || !data || !data.access_token) return null;
  const next = {
    ...token,
    accessToken: String(data.access_token),
    scope: typeof data.scope === 'string' ? data.scope : token.scope,
    tokenType: typeof data.token_type === 'string' ? data.token_type : (token.tokenType || 'Bearer'),
    expiresAt: new Date(Date.now() + (Number(data.expires_in || 3600) * 1000)).toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await saveGmailOauthToken(env, next);
  return next;
}

async function getValidGmailAccessToken(env) {
  const token = await getGmailOauthToken(env);
  if (!token) return '';
  const valid = await refreshGmailAccessTokenIfNeeded(env, token);
  if (!valid || !valid.accessToken) return '';
  return String(valid.accessToken);
}

function decodeBase64Url(input) {
  if (!input) return '';
  const normalized = String(input).replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLen);
  try {
    return atob(padded);
  } catch {
    return '';
  }
}

function looksLikeHtmlMarkup(value) {
  if (!value || typeof value !== 'string') return false;
  if (value.length < 20) return false;
  return /<!doctype|<html\b|<body\b|<article\b|<main\b|<table\b|<[a-z][^>]*>/i.test(value);
}

function htmlToPlainText(html) {
  if (!html || typeof html !== 'string') return '';
  return normalizeTtsText(
    decodeHtmlEntities(html)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<!DOCTYPE[^>]*>/gi, ' ')
      .replace(/<\/?(html|head|body|table|tr|td|th|div|section|article|header|footer|nav|p|br|li|ul|ol|h[1-6]|span)[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
  );
}

function extractReadableArticleFromHtml(html, options = {}) {
  if (!looksLikeHtmlMarkup(html)) return null;
  try {
    const { document } = parseHTML(decodeHtmlEntities(String(html)));
    const reader = new Readability(document, {
      charThreshold: Number.isFinite(options.charThreshold) ? options.charThreshold : 220,
      keepClasses: false,
      disableJSONLD: false,
    });
    const parsed = reader.parse();
    if (!parsed) return null;
    const textContent = normalizeTtsText(parsed.textContent || '');
    if (!textContent || textContent.length < 80) return null;
    return {
      textContent,
      title: normalizeTtsText(parsed.title || ''),
      byline: normalizeTtsText(parsed.byline || ''),
      excerpt: normalizeTtsText(parsed.excerpt || ''),
    };
  } catch {
    return null;
  }
}

function htmlToReadableText(html, options = {}) {
  const readable = extractReadableArticleFromHtml(html, options);
  if (readable && readable.textContent) return readable.textContent;
  return htmlToPlainText(html);
}

function extractMessageHeaders(payload) {
  const headers = Array.isArray(payload && payload.headers) ? payload.headers : [];
  const byName = new Map(headers
    .filter((h) => h && typeof h.name === 'string')
    .map((h) => [h.name.toLowerCase(), String(h.value || '')]));
  return byName;
}

function extractPlainTextFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return '';
  const mimeType = String(payload.mimeType || '').toLowerCase();
  const bodyData = payload.body && payload.body.data ? decodeBase64Url(payload.body.data) : '';
  if (mimeType === 'text/plain' && bodyData) return bodyData;
  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const text = extractPlainTextFromPayload(part);
      if (text) return text;
    }
  }
  return '';
}

function extractHtmlFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return '';
  const mimeType = String(payload.mimeType || '').toLowerCase();
  const bodyData = payload.body && payload.body.data ? decodeBase64Url(payload.body.data) : '';
  if (mimeType === 'text/html' && bodyData) return bodyData;
  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const html = extractHtmlFromPayload(part);
      if (html) return html;
    }
  }
  return '';
}

function extractCandidateHttpUrlsFromHtml(html) {
  if (!html || typeof html !== 'string') return [];
  const out = [];
  const re = /href\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const raw = normalizeHttpUrl(m[1]);
    if (!raw) continue;
    const cleaned = cleanOpenUrl(raw);
    if (!cleaned) continue;
    out.push(cleaned);
    if (out.length >= 50) break;
  }
  return out;
}

function isLikelyNewsletterContentUrl(url, subject = '') {
  if (!url) return false;
  const value = String(url).toLowerCase();
  const badHints = [
    'unsubscribe',
    'preferences',
    'viewinbrowser',
    'manage-preferences',
    'privacy',
    'mailto:',
    'support.',
    'help.',
    'track',
    'pixel',
    'doubleclick',
    'googleadservices',
  ];
  if (badHints.some((hint) => value.includes(hint))) return false;
  const goodHints = ['newsletter', '/p/', '/articles/', '/story', '/post', 'substack', 'medium.com'];
  if (goodHints.some((hint) => value.includes(hint))) return true;
  if (subject && subject.length > 0) return true;
  return false;
}

function pickBestGmailOpenUrl({ htmlContent, fallbackUrl, subject }) {
  const links = extractCandidateHttpUrlsFromHtml(htmlContent);
  for (const candidate of links) {
    if (isLikelyNewsletterContentUrl(candidate, subject)) return candidate;
  }
  return fallbackUrl || '';
}

function pickBestGmailThumbnailUrl(htmlContent) {
  if (!htmlContent) return '';
  const re = /<img[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(htmlContent))) {
    const src = normalizeHttpUrl(m[1]);
    if (!src) continue;
    const lower = src.toLowerCase();
    if (lower.includes('pixel') || lower.includes('track') || lower.includes('doubleclick')) continue;
    return src;
  }
  return '';
}

function normalizeGmailMessageFromApi(message, selectedLabels = []) {
  if (!message || typeof message !== 'object') return null;
  const id = String(message.id || '');
  if (!id) return null;
  const payload = message.payload || {};
  const headers = extractMessageHeaders(payload);
  const subject = headers.get('subject') || 'Untitled';
  const from = headers.get('from') || 'Unknown';
  const internalDate = Number(message.internalDate || 0);
  const savedAt = Number.isFinite(internalDate) && internalDate > 0
    ? new Date(internalDate).toISOString()
    : new Date().toISOString();
  const labelIds = Array.isArray(message.labelIds) ? message.labelIds.map((v) => String(v || '')).filter(Boolean) : [];
  const labels = selectedLabels && selectedLabels.length > 0 ? selectedLabels : labelIds;
  const textBody = extractPlainTextFromPayload(payload);
  const htmlContent = extractHtmlFromPayload(payload);
  const gmailUrl = `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(id)}`;
  const openUrl = pickBestGmailOpenUrl({ htmlContent, fallbackUrl: gmailUrl, subject });
  const readable = extractReadableArticleFromHtml(htmlContent, {
    charThreshold: 120,
    url: openUrl || gmailUrl,
  });
  const readableBody = textBody || (readable && readable.textContent) || htmlToPlainText(htmlContent);
  const thumbnail = pickBestGmailThumbnailUrl(htmlContent);
  return normalizeGmailItem({
    id,
    subject: normalizeTtsText(subject) || (readable && readable.title) || 'Untitled',
    from: normalizeTtsText(from) || (readable && readable.byline) || 'Unknown',
    summary: (readable && readable.excerpt) || '',
    text: readableBody,
    htmlContent,
    labels,
    date: savedAt,
    url: openUrl,
    openUrl,
    gmailUrl,
    thumbnail,
  });
}

async function fetchGmailLabelsCatalog(accessToken) {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok || !data || !Array.isArray(data.labels)) return { names: [], byName: new Map(), canonicalByLower: new Map() };
  const names = [];
  const byName = new Map();
  const canonicalByLower = new Map();
  for (const label of data.labels) {
    const name = String(label && label.name || '').trim();
    if (!name) continue;
    const lower = name.toLowerCase();
    const id = String(label.id || '');
    if (id) byName.set(lower, id);
    if (!canonicalByLower.has(lower)) canonicalByLower.set(lower, name);
    names.push(name);
  }
  return { names: Array.from(new Set(names)).sort(), byName, canonicalByLower };
}

async function resolveGmailLabelSelection(accessToken, names) {
  const selected = Array.isArray(names) ? names.map((v) => String(v || '').trim()).filter(Boolean) : [];
  if (selected.length === 0) return { matchedIds: [], matchedNames: [], unmatchedNames: [], availableNames: [] };
  const catalog = await fetchGmailLabelsCatalog(accessToken);
  const matchedIds = [];
  const matchedNames = [];
  const unmatchedNames = [];
  for (const name of selected) {
    const id = catalog.byName.get(name.toLowerCase());
    if (id) {
      matchedIds.push(id);
      matchedNames.push(catalog.canonicalByLower.get(name.toLowerCase()) || name);
    }
    else unmatchedNames.push(name);
  }
  return { matchedIds, matchedNames, unmatchedNames, availableNames: catalog.names };
}

function normalizeGmailItem(item) {
  if (!item || typeof item !== 'object') return null;
  const id = item.id || item.messageId;
  if (!id) return null;
  const labels = Array.isArray(item.labels)
    ? item.labels.map((label) => String(label || '').trim()).filter(Boolean).slice(0, 50)
    : [];
  const savedAt = item.savedAt || item.receivedAt || item.date || new Date().toISOString();
  const savedAtIso = (() => {
    const ts = Date.parse(savedAt);
    return Number.isFinite(ts) ? new Date(ts).toISOString() : new Date().toISOString();
  })();
  const publishedAtIso = (() => {
    if (!item.publishedAt) return null;
    const ts = Date.parse(item.publishedAt);
    return Number.isFinite(ts) ? new Date(ts).toISOString() : null;
  })();
  return {
    kind: 'gmail',
    id: String(id),
    title: String(item.title || item.subject || 'Untitled'),
    author: String(item.author || item.from || 'Unknown'),
    url: cleanOpenUrl(normalizeHttpUrl(String(item.url || item.openUrl || item.sourceUrl || ''))),
    openUrl: cleanOpenUrl(normalizeHttpUrl(String(item.openUrl || item.url || item.sourceUrl || ''))),
    gmailUrl: cleanOpenUrl(normalizeHttpUrl(String(item.gmailUrl || `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(String(id))}`))),
    savedAt: savedAtIso,
    publishedAt: publishedAtIso,
    site: 'gmail',
    thumbnail: item.thumbnail ? String(item.thumbnail) : null,
    labels,
    summary: normalizeTtsText(item.summary || ''),
    textContent: normalizeTtsText(item.text || item.textContent || ''),
    htmlContent: typeof item.htmlContent === 'string' ? item.htmlContent : '',
  };
}

async function getFilteredGmailItems(env, options = {}) {
  const all = await getGmailItems(env);
  const fromTs = parseDateFloor(options.fromDate);
  const toTs = parseDateCeil(options.toDate);
  const selectedLabels = Array.isArray(options.labels) ? options.labels.filter(Boolean) : [];
  const selectedSet = new Set(selectedLabels);
  const filtered = all.filter((item) => {
    const ts = Date.parse(item.savedAt || 0);
    if (Number.isFinite(fromTs) && ts < fromTs) return false;
    if (Number.isFinite(toTs) && ts > toTs) return false;
    if (selectedSet.size > 0) {
      const labels = Array.isArray(item.labels) ? item.labels : [];
      if (!labels.some((label) => selectedSet.has(label))) return false;
    }
    return true;
  });
  filtered.sort((a, b) => Date.parse(b.savedAt || 0) - Date.parse(a.savedAt || 0));
  return filtered.slice(0, options.limit || 100);
}

function parseDateFloor(value) {
  if (!value) return Number.NaN;
  const date = new Date(`${value}T00:00:00.000Z`);
  const ts = Number(date.getTime());
  return Number.isFinite(ts) ? ts : Number.NaN;
}

function parseDateCeil(value) {
  if (!value) return Number.NaN;
  const date = new Date(`${value}T23:59:59.999Z`);
  const ts = Number(date.getTime());
  return Number.isFinite(ts) ? ts : Number.NaN;
}

async function processGmailCleanup(env, targetIds, action) {
  const ids = new Set(targetIds.map((id) => String(id)));
  if (action === 'restore') {
    return {
      processed: 0,
      processedIds: [],
      errors: [{ id: 'gmail', error: 'Restore is not supported for gmail-hook items' }],
    };
  }
  const token = await getValidGmailAccessToken(env);
  if (!token) {
    return {
      processed: 0,
      processedIds: [],
      errors: [{ id: 'gmail', error: 'Gmail is not connected. Connect Gmail in Settings before delete/archive actions.' }],
    };
  }
  const current = await getGmailItems(env);
  const keep = [];
  const removed = [];
  const errors = [];
  for (const item of current) {
    const id = String(item.id || '');
    if (!ids.has(id)) {
      keep.push(item);
      continue;
    }
    try {
      if (action === 'delete') {
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}/trash`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(body || `gmail_delete_${res.status}`);
        }
      } else {
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}/modify`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ removeLabelIds: ['INBOX'] }),
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(body || `gmail_archive_${res.status}`);
        }
      }
      removed.push(id);
    } catch (error) {
      keep.push(item);
      const msg = String(error && error.message ? error.message : 'gmail_action_failed');
      errors.push({ id, error: msg.includes('insufficientPermissions') ? 'Gmail token lacks modify scope. Reconnect Gmail after enabling gmail.modify.' : msg });
    }
  }
  await env.KV.put(GMAIL_ITEMS_KEY, JSON.stringify(keep));
  return {
    processed: removed.length,
    processedIds: removed,
    errors,
  };
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
      let upstreamMessage = '';
      try {
        const errJson = await openaiRes.json();
        upstreamMessage = String(
          (errJson && errJson.error && (errJson.error.message || errJson.error.code))
          || ''
        ).trim();
      } catch {
        try {
          upstreamMessage = String(await openaiRes.text() || '').trim();
        } catch {}
      }
      if (openaiRes.status === 429) {
        throw new Error(`OpenAI TTS rate-limited or quota exceeded (429). Check OpenAI billing/quota, then retry. ${upstreamMessage}`.trim());
      }
      if (openaiRes.status === 401 || openaiRes.status === 403) {
        throw new Error(`OpenAI TTS unauthorized (${openaiRes.status}). Verify saved OpenAI API key in Settings. ${upstreamMessage}`.trim());
      }
      throw new Error(`OpenAI TTS failed (${openaiRes.status}). ${upstreamMessage}`.trim());
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
  const emailLike = looksLikeEmailLikeArticle(article);
  const sourceUrl = cleanOpenUrl(normalizeHttpUrl(decodeHtmlEntities(article.source_url)));
  const readwiseUrl = cleanOpenUrl(normalizeHttpUrl(decodeHtmlEntities(article.url)));
  const htmlUrl = extractFirstHttpUrlFromHtml(article.html_content);

  if (sourceUrl && !looksLikeEmailAddress(sourceUrl) && !isReadwiseDomain(sourceUrl)) {
    return sourceUrl;
  }
  // For forwarded/email-like Readwise items, avoid jumping to arbitrary first link.
  if (emailLike) {
    return readwiseUrl || sourceUrl || '';
  }
  if (htmlUrl && !isReadwiseDomain(htmlUrl)) {
    if (isLikelyNewsletterContentUrl(htmlUrl, article.title || '')) return htmlUrl;
  }
  if (readwiseUrl) {
    return readwiseUrl;
  }
  if (htmlUrl && !isReadwiseDomain(htmlUrl)) {
    return htmlUrl;
  }
  return sourceUrl || htmlUrl || readwiseUrl || '';
}

function looksLikeEmailLikeArticle(article) {
  if (!article || typeof article !== 'object') return false;
  const title = normalizeTtsText(article.title || '').toLowerCase();
  const source = normalizeTtsText(article.site_name || article.site || '').toLowerCase();
  const content = normalizeTtsText(article.content || article.text || '').toLowerCase();
  const html = normalizeTtsText(typeof article.html_content === 'string' ? article.html_content.replace(/<[^>]+>/g, ' ') : '').toLowerCase();
  if (/^(fwd:|fw:|re:)/i.test(title)) return true;
  if (source.startsWith('gmail')) return true;
  const corpus = `${title} ${content} ${html}`;
  const markers = [
    'begin forwarded message',
    'forwarded message',
    'unsubscribe',
    'manage your preferences',
    'view in browser',
    'from:',
    'subject:',
    'reply-to:',
    'sent:',
  ];
  let hits = 0;
  for (const marker of markers) {
    if (corpus.includes(marker)) hits += 1;
  }
  return hits >= 2;
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

function extractImageCaptionsFromHtml(html) {
  if (!html || typeof html !== 'string') return [];
  const out = [];
  const figCaptions = html.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/gi) || [];
  figCaptions.forEach((raw) => {
    const plain = normalizeTtsText(raw.replace(/<[^>]+>/g, ' '));
    if (plain) out.push(plain);
  });
  const imgTags = html.match(/<img[^>]*>/gi) || [];
  imgTags.forEach((tag) => {
    const altMatch = tag.match(/\salt=["']([^"']+)["']/i);
    if (altMatch && altMatch[1]) {
      const plain = normalizeTtsText(altMatch[1]);
      if (plain) out.push(plain);
    }
  });
  return Array.from(new Set(out)).slice(0, 20);
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
  const isEmailSource = /^gmail\b/i.test(sourceLabel) || looksLikeEmailLikeArticle(article);
  const readableFromHtml = (typeof article.html_content === 'string' && article.html_content.length > 0)
    ? extractReadableArticleFromHtml(article.html_content, {
      charThreshold: isEmailSource ? 120 : 220,
      url: article.source_url || article.url || '',
    })
    : null;
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
  else if (readableFromHtml && readableFromHtml.byline) prefaceParts.push(`By ${readableFromHtml.byline}`);
  if (sourceLabel && sourceLabel !== 'Unknown') prefaceParts.push(`From ${sourceLabel}`);
  if (spokenDate) prefaceParts.push(`Written on ${spokenDate}`);
  pushUnique(prefaceParts.join('. ') + (prefaceParts.length ? '.' : ''));

  pushUnique(article.title);
  pushUnique(article.author ? `By ${article.author}` : (readableFromHtml && readableFromHtml.byline ? `By ${readableFromHtml.byline}` : ''));
  pushUnique(article.summary);
  pushUnique(isEmailSource ? (htmlToReadableText(article.content || '', { charThreshold: 120 }) || article.content) : article.content);
  if (!isEmailSource) pushUnique(article.notes);
  if (readableFromHtml && readableFromHtml.excerpt) pushUnique(readableFromHtml.excerpt);

  if (typeof article.html_content === 'string' && article.html_content.length > 0) {
    const captions = extractImageCaptionsFromHtml(article.html_content);
    captions.forEach((caption) => pushUnique(`Image caption: ${caption}`));
    const plain = (readableFromHtml && readableFromHtml.textContent)
      ? readableFromHtml.textContent
      : htmlToReadableText(article.html_content);
    // Keep full readable body text whenever available so TTS can cover the complete story.
    if (plain) pushUnique(plain);
  }

  return cleanupTtsText(chunks.join('\n\n').trim(), {
    title: article.title,
    author: article.author,
    sourceLabel,
    spokenDate,
    isEmailSource,
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
  const isEmailSource = !!context.isEmailSource
    || /^gmail\b/i.test(normalizeTtsText(context.sourceLabel || ''))
    || looksLikeEmailBoilerplateText(cleaned);
  if (isEmailSource) {
    cleaned = cleanupEmailNewsletterText(cleaned);
  }
  cleaned = cleaned
    .replace(/<[^>]+>/g, ' ')
    .replace(/\bhttps?:\/\/[^\s)]+/gi, ' ')
    .replace(/\bwww\.[^\s)]+/gi, ' ')
    .replace(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi, ' ')
    .replace(/\b(?:\d[ -]?){7,}\d\b/g, ' ')
    .replace(/\bView in browser\b[:\s-]*/gi, ' ')
    .replace(/\bOpen in browser\b[:\s-]*/gi, ' ')
    .replace(/\bRead online\b[:\s-]*/gi, ' ')
    .replace(/\bProgramming note\b[:\s-]*/gi, ' ')
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
  result = result.replace(/\s+([,.;:!?])/g, '$1').trim();

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

function looksLikeEmailBoilerplateText(text) {
  const value = normalizeTtsText(text).toLowerCase();
  if (!value) return false;
  const strongMarkers = [
    'begin forwarded message',
    'forwarded message',
  ];
  if (strongMarkers.some((m) => value.includes(m))) return true;
  const weakMarkers = [
    'unsubscribe',
    'manage your preferences',
    'view in browser',
    'if you are having trouble viewing this email',
    'from:',
    'to:',
    'cc:',
    'subject:',
    'reply-to:',
    'sent:',
  ];
  let weakHits = 0;
  for (const marker of weakMarkers) {
    if (value.includes(marker)) weakHits += 1;
    if (weakHits >= 2) return true;
  }
  return false;
}

function cleanupEmailNewsletterText(text) {
  let out = normalizeTtsText(text);
  if (!out) return '';
  out = out
    .replace(/\bbegin forwarded message:?\b/gi, ' ')
    .replace(/\bforwarded message:?\b/gi, ' ')
    .replace(/\bfrom:\s*[^:]{0,120}(?=\b(?:to|cc|bcc|subject|date|sent|reply-to):)/gi, ' ')
    .replace(/\bto:\s*[^:]{0,120}(?=\b(?:cc|bcc|subject|date|sent|reply-to):)/gi, ' ')
    .replace(/\bcc:\s*[^:]{0,120}(?=\b(?:bcc|subject|date|sent|reply-to):)/gi, ' ')
    .replace(/\bbcc:\s*[^:]{0,120}(?=\b(?:subject|date|sent|reply-to):)/gi, ' ')
    .replace(/\bsubject:\s*[^:]{0,160}(?=\b(?:date|sent|reply-to):)/gi, ' ')
    .replace(/\bsubject:\s*.{0,140}?(?=\s+[A-Z][A-Za-z]+(?:\s+[A-Za-z]+){0,2}:|\s*$)/gi, ' ')
    .replace(/\breply-to:\s*[^\s]{0,120}(?=\b[A-Z][a-z]+\b|\bHere\b|\bToday\b|\bIn\b)/gi, ' ')
    .replace(/\b(?:view(?:ing)? (?:this )?email in your browser|view in browser|read online|open in browser)\b[^.?!]{0,220}[.?!]?/gi, ' ')
    .replace(/\b(?:manage (?:your )?preferences|update your preferences|email preferences|privacy policy|terms of service)\b[^.?!]{0,220}[.?!]?/gi, ' ')
    .replace(/\b(?:unsubscribe(?: here)?|opt out|stop receiving these emails|no longer wish to receive)\b[^.?!]{0,260}[.?!]?/gi, ' ')
    .replace(/\b(?:if you (?:are|re) having trouble viewing this email)\b[^.?!]{0,260}[.?!]?/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tailWindowStart = Math.max(0, out.length - 3200);
  const tail = out.slice(tailWindowStart);
  const footerMarkers = [
    /\bunsubscribe\b/i,
    /\bmanage (?:your )?preferences\b/i,
    /\bprivacy policy\b/i,
    /\bterms of service\b/i,
    /\ball rights reserved\b/i,
  ];
  let cutAt = -1;
  for (const marker of footerMarkers) {
    const match = tail.match(marker);
    if (match && typeof match.index === 'number') {
      const abs = tailWindowStart + match.index;
      cutAt = cutAt < 0 ? abs : Math.min(cutAt, abs);
    }
  }
  if (cutAt > 0) out = out.slice(0, cutAt).trim();
  return out;
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
export { fetchArticlesOlderThan, extractDomain, getDeletedItems, buildTtsText, pickBestGmailOpenUrl, pickBestGmailThumbnailUrl, deriveOpenUrl };
