import worker from './worker.js';
if (!worker || typeof worker.fetch !== 'function') {
  console.error('Browser smoke failed: worker fetch handler unavailable');
  process.exit(1);
}

const response = await worker.fetch(new Request('https://example.com/'), {});
const html = await response.text();
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('Browser smoke failed: <script> block not found');
  process.exit(1);
}
if (!/#deleted-list\s*\{[\s\S]*overflow-y:\s*auto;[\s\S]*\}/.test(html)) {
  console.error('Browser smoke failed: missing dedicated deleted-list scroll container styles');
  process.exit(1);
}
if (!/#player-queue\s*\{[\s\S]*overflow-y:\s*auto;[\s\S]*\}/.test(html)) {
  console.error('Browser smoke failed: missing dedicated player-queue scroll container styles');
  process.exit(1);
}
if (!/\.left-rail\s+\.rail-docked-control\s*\{[\s\S]*max-width:\s*100%;[\s\S]*overflow:\s*hidden;[\s\S]*\}/.test(html)) {
  console.error('Browser smoke failed: rail-docked controls must be width-constrained to avoid rail overflow into results pane');
  process.exit(1);
}
if (!/\.rail-controls-host\s*\{[\s\S]*width:\s*100%;[\s\S]*overflow:\s*hidden;[\s\S]*\}/.test(html)) {
  console.error('Browser smoke failed: rail control host must constrain overflow for docked controls');
  process.exit(1);
}
if (!/function shouldDockPlayerControlsRight\(\)\s*\{\s*return window\.innerWidth <= 1024;\s*\}/.test(html)) {
  console.error('Browser smoke failed: player controls should dock in rail on desktop and move to main only on narrow layouts');
  process.exit(1);
}
if (!/<div id=\"deleted-controls-main-host\">[\s\S]*<div class=\"card\" id=\"deleted-controls-card\">[\s\S]*<div id=\"deleted-list\">/.test(html)) {
  console.error('Browser smoke failed: deleted history controls/list should render in a unified main results card');
  process.exit(1);
}
const script = scriptMatch[1];
const firstChunkMatch = script.match(/var CLIENT_TTS_FIRST_CHUNK_CHARS = (\d+);/);
const secondChunkMatch = script.match(/var CLIENT_TTS_SECOND_CHUNK_CHARS = (\d+);/);
const steadyChunkMatch = script.match(/var CLIENT_TTS_SYNTH_CHUNK_CHARS = (\d+);/);
if (!firstChunkMatch || !secondChunkMatch || !steadyChunkMatch) {
  console.error('Browser smoke failed: missing staged TTS chunk constants');
  process.exit(1);
}
const firstChunk = Number(firstChunkMatch[1]);
const secondChunk = Number(secondChunkMatch[1]);
const steadyChunk = Number(steadyChunkMatch[1]);
if (!(firstChunk > 0 && firstChunk < secondChunk && secondChunk <= steadyChunk)) {
  console.error(`Browser smoke failed: expected first<second<=steady chunk sizes for fast-start audio, got ${firstChunk}/${secondChunk}/${steadyChunk}`);
  process.exit(1);
}

function parseAttrs(tag) {
  const attrs = {};
  for (const m of tag.matchAll(/([a-zA-Z0-9_:-]+)=["']([^"']*)["']/g)) attrs[m[1]] = m[2];
  return attrs;
}

class Element {
  constructor(id = '') {
    this.id = id;
    this.style = {};
    this.value = '';
    this.textContent = '';
    this._innerHTML = '';
    this.checked = false;
    this.disabled = false;
    this.indeterminate = false;
    this.dataset = {};
    this.listeners = {};
    this.classListSet = new Set();
    this.classList = {
      add: (c) => this.classListSet.add(c),
      remove: (c) => this.classListSet.delete(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (this.classListSet.has(c)) this.classListSet.delete(c);
          else this.classListSet.add(c);
          return;
        }
        if (force) this.classListSet.add(c);
        else this.classListSet.delete(c);
      },
    };
  }

  set innerHTML(v) {
    this._innerHTML = String(v || '');
  }

  get innerHTML() {
    return this._innerHTML;
  }

  addEventListener(name, fn) {
    this.listeners[name] = this.listeners[name] || [];
    this.listeners[name].push(fn);
  }

  querySelectorAll(sel) {
    if (sel === '.preview-open-link') {
      const links = [];
      for (const m of this._innerHTML.matchAll(/<a[^>]*class=["'][^"']*\bpreview-open-link\b[^"']*["'][^>]*>/g)) {
        const attrs = parseAttrs(m[0]);
        const el = new Element();
        el.dataset.openUrl = attrs['data-open-url'] || '';
        el.href = attrs.href || '';
        links.push(el);
      }
      return links;
    }
    return [];
  }

  remove() {}
  focus() {}
  blur() {}

  async dispatch(name, evt = {}) {
    const calls = this.listeners[name] || [];
    for (const fn of calls) {
      await fn(evt);
    }
  }
}

const idSet = new Set();
for (const m of html.matchAll(/id=["']([^"']+)["']/g)) idSet.add(m[1]);
const byId = new Map();
for (const id of idSet) byId.set(id, new Element(id));

const quickDates = [];
for (const m of html.matchAll(/<button[^>]*class=["'][^"']*\bquick-date\b[^"']*["'][^>]*>/g)) {
  const attrs = parseAttrs(m[0]);
  const el = new Element();
  el.dataset = Object.fromEntries(
    Object.entries(attrs)
      .filter(([k]) => k.startsWith('data-'))
      .map(([k, v]) => [k.replace('data-', '').replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v])
  );
  quickDates.push(el);
}

const tabs = [];
for (const m of html.matchAll(/<a[^>]*class=["'][^"']*\btab\b[^"']*["'][^>]*>/g)) {
  const attrs = parseAttrs(m[0]);
  const el = new Element();
  if (attrs.class) attrs.class.split(/\s+/).forEach((c) => c && el.classList.add(c));
  el.dataset.tab = attrs['data-tab'] || '';
  el.href = attrs.href || '/';
  tabs.push(el);
}

const toastHolder = { current: null };
const doc = {
  body: { appendChild(el) { toastHolder.current = el; } },
  getElementById(id) { return byId.get(id) || null; },
  querySelectorAll(sel) {
    if (sel === '.quick-date') return quickDates;
    if (sel === '.tab') return tabs;
    return [];
  },
  querySelector(sel) {
    if (sel === '.toast') return toastHolder.current;
    const tabSel = sel.match(/^\.tab\[data-tab="([^"]+)"\]$/);
    if (tabSel) return tabs.find((t) => t.dataset.tab === tabSel[1]) || null;
    return null;
  },
  createElement() { return new Element(); },
};

const locationState = { pathname: '/' };
const win = {
  location: locationState,
  history: { pushState(_s, _t, path) { locationState.pathname = path; } },
  addEventListener() {},
  open() {},
  confirm() { return true; },
};

function makeJsonResponse(payload, status = 200) {
  const body = JSON.stringify(payload);
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get(name) { return String(name || '').toLowerCase() === 'content-type' ? 'application/json; charset=utf-8' : null; } },
    async text() { return body; },
    async json() { return JSON.parse(body); },
  };
}

const previewItems = Array.from({ length: 57 }, (_, i) => {
  const id = String(i + 1);
  return {
    id,
    title: `Item ${id}`,
    author: 'A',
    url: `https://example.com/${id}`,
    savedAt: '2025-01-01T00:00:00.000Z',
    site: 'example.com',
    thumbnail: null,
    searchable: `item ${id} a example.com`
  };
});
const deletedHistoryItems = [
  {
    id: 'd1',
    title: 'Alpha newest',
    author: 'Author A',
    url: 'https://example.com/a-new',
    site: 'example.com',
    savedAt: '2025-01-03T00:00:00.000Z',
    deletedAt: '2025-02-03T00:00:00.000Z',
  },
  {
    id: 'd2',
    title: 'Beta middle',
    author: 'Author B',
    url: 'https://example.com/b-mid',
    site: 'example.com',
    savedAt: '2025-01-02T00:00:00.000Z',
    deletedAt: '2025-02-02T00:00:00.000Z',
  },
  {
    id: 'd3',
    title: 'Alpha older',
    author: 'Author C',
    url: 'https://example.com/a-old',
    site: 'example.com',
    savedAt: '2025-01-01T00:00:00.000Z',
    deletedAt: '2025-02-01T00:00:00.000Z',
  },
];
const cleanupCalls = [];

async function fetchMock(url, options = {}) {
  const u = String(url);
  if (u.includes('/api/settings')) {
    return makeJsonResponse({ settings: { defaultLocation: 'new', defaultDays: 30, previewLimit: 100, confirmActions: false } });
  }
  if (u.includes('/api/deleted')) return makeJsonResponse({ items: deletedHistoryItems });
  if (u.includes('/api/version')) return makeJsonResponse({ version: '0.0.0' });
  if (u.includes('/api/preview')) return makeJsonResponse({ total: 57, preview: previewItems, showing: 57 });
  if (u.includes('/api/cleanup')) {
    const parsed = JSON.parse(options.body || '{}');
    const ids = Array.isArray(parsed.ids) ? parsed.ids.map((id) => String(id)) : [];
    cleanupCalls.push(ids);
    return makeJsonResponse({ processed: ids.length, processedIds: ids, total: ids.length, action: parsed.action });
  }
  return makeJsonResponse({});
}

globalThis.window = win;
globalThis.document = doc;
globalThis.history = win.history;
globalThis.location = locationState;
globalThis.fetch = fetchMock;
globalThis.URLSearchParams = URLSearchParams;
globalThis.setTimeout = setTimeout;
globalThis.clearTimeout = clearTimeout;
globalThis.console = console;
globalThis.localStorage = {
  getItem(key) {
    if (key === 'readwise_cleanup_app_state_v1') {
      return JSON.stringify({ tab: 'deleted' });
    }
    return null;
  },
  setItem() {},
  removeItem() {},
};

try {
  // eslint-disable-next-line no-new-func
  new Function(script)();
} catch (error) {
  console.error('Browser smoke failed: script execution error');
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
}

await new Promise((resolve) => setTimeout(resolve, 0));

const cleanupTabEl = byId.get('cleanup-tab');
const deletedTabEl = byId.get('deleted-tab');
if (!cleanupTabEl || !deletedTabEl) {
  console.error('Browser smoke failed: expected cleanup/deleted tab containers');
  process.exit(1);
}
if (cleanupTabEl.style.display === 'none' || deletedTabEl.style.display !== 'none') {
  console.error('Browser smoke failed: explicit route "/" should win over restored tab state');
  process.exit(1);
}

const toDateInput = byId.get('to-date');
if (!toDateInput || !toDateInput.value) {
  console.error('Browser smoke failed: expected End date to initialize');
  process.exit(1);
}

const todayQuick = quickDates.find((q) => q.dataset.action === 'today');
if (!todayQuick) {
  console.error('Browser smoke failed: Today quick-date button missing');
  process.exit(1);
}
await todayQuick.dispatch('click');
if (!toDateInput.value) {
  console.error('Browser smoke failed: Today quick-date click had no effect');
  process.exit(1);
}

const settingsTab = tabs.find((t) => t.dataset.tab === 'settings');
if (!settingsTab) {
  console.error('Browser smoke failed: Settings tab not found');
  process.exit(1);
}
await settingsTab.dispatch('click', { preventDefault() {} });
if (locationState.pathname !== '/settings') {
  console.error(`Browser smoke failed: expected route '/settings', got '${locationState.pathname}'`);
  process.exit(1);
}

locationState.pathname = '/';
const previewBtn = byId.get('preview-btn');
const deleteBtn = byId.get('delete-btn');
const selectAllPreview = byId.get('select-all-preview');
if (!previewBtn || !deleteBtn || !selectAllPreview) {
  console.error('Browser smoke failed: preview/delete controls missing');
  process.exit(1);
}

await previewBtn.dispatch('click');
selectAllPreview.checked = true;
await selectAllPreview.dispatch('change');
await deleteBtn.dispatch('click');
for (let i = 0; i < 30 && cleanupCalls.length < 3; i += 1) {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

if (cleanupCalls.length !== 3) {
  console.error('Browser smoke failed: expected 3 cleanup batch calls, got ' + cleanupCalls.length);
  process.exit(1);
}
const sizes = cleanupCalls.map((ids) => ids.length);
if (sizes[0] !== 20 || sizes[1] !== 20 || sizes[2] !== 17) {
  console.error('Browser smoke failed: expected cleanup batch sizes 20/20/17, got ' + sizes.join('/'));
  process.exit(1);
}
const unique = new Set(cleanupCalls.flat());
if (unique.size !== 57) {
  console.error('Browser smoke failed: expected 57 unique cleanup ids, got ' + unique.size);
  process.exit(1);
}

const deletedTab = tabs.find((t) => t.dataset.tab === 'deleted');
const deletedSearchInput = byId.get('deleted-search');
const selectAllDeleted = byId.get('select-all-deleted');
const restoreBtn = byId.get('restore-btn');
const deletedList = byId.get('deleted-list');
if (!deletedTab || !deletedSearchInput || !selectAllDeleted || !restoreBtn || !deletedList) {
  console.error('Browser smoke failed: deleted-history controls missing');
  process.exit(1);
}

await deletedTab.dispatch('click', { preventDefault() {} });
await new Promise((resolve) => setTimeout(resolve, 0));
if (!restoreBtn.textContent.includes('(3)')) {
  console.error('Browser smoke failed: expected deleted-history default selection count 3, got "' + restoreBtn.textContent + '"');
  process.exit(1);
}

deletedSearchInput.value = 'alpha';
await deletedSearchInput.dispatch('input');
if (!restoreBtn.textContent.includes('(2)')) {
  console.error('Browser smoke failed: expected filtered deleted-history selection count 2, got "' + restoreBtn.textContent + '"');
  process.exit(1);
}

const alphaNewestIdx = deletedList.innerHTML.indexOf('Alpha newest');
const alphaOlderIdx = deletedList.innerHTML.indexOf('Alpha older');
if (alphaNewestIdx < 0 || alphaOlderIdx < 0 || alphaNewestIdx > alphaOlderIdx) {
  console.error('Browser smoke failed: expected deleted-history sort by deleted date (newest first)');
  process.exit(1);
}

await selectAllDeleted.dispatch('change');
if (!restoreBtn.disabled) {
  console.error('Browser smoke failed: expected filtered select-all toggle to deselect filtered subset');
  process.exit(1);
}

deletedSearchInput.value = '';
await deletedSearchInput.dispatch('input');
if (!restoreBtn.textContent.includes('(1)')) {
  console.error('Browser smoke failed: expected one non-filtered item to remain selected after filtered deselect');
  process.exit(1);
}

await selectAllDeleted.dispatch('change');
if (!restoreBtn.textContent.includes('(3)')) {
  console.error('Browser smoke failed: expected select-all to restore full deleted-history selection, got "' + restoreBtn.textContent + '"');
  process.exit(1);
}

console.log('Browser smoke passed: script initialized, routing/date wiring works, and large cleanup selections are batched 20/20/17 non-destructively.');
