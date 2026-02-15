function buildUiHtml(config) {
  const APP_VERSION = config.appVersion;
  const VERSION_HISTORY = config.versionHistory;
  const MAX_TTS_PREVIEW_CHARS = config.maxTtsPreviewChars;
  const TTS_SYNTH_CHUNK_CHARS = config.ttsSynthChunkChars;
  const TTS_FIRST_CHUNK_CHARS = config.ttsFirstChunkChars;
  const TTS_SECOND_CHUNK_CHARS = config.ttsSecondChunkChars;
  const PREVIEW_CACHE_STALE_MS = config.previewCacheStaleMs;

const HTML_MOCKUP_V3 = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Read Flow - v3 Mockup</title>
  <style>
    :root {
      --bg: #f3f6fb;
      --card: #ffffff;
      --line: #d7e0ec;
      --text: #1f2a44;
      --muted: #61708a;
      --blue: #1574d4;
      --blue-soft: #e9f2ff;
      --danger: #cf2b2b;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--text); font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .app { display: grid; grid-template-columns: 320px minmax(0, 1fr); min-height: 100vh; gap: 0; }
    .rail { border-right: 1px solid var(--line); background: #eef3fa; padding: 1rem 0.8rem; display: flex; flex-direction: column; gap: 0.8rem; }
    .brand { font-size: 1.35rem; font-weight: 700; padding: 0.1rem 0.4rem 0.6rem; }
    .tabs { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 0.35rem; }
    .tab { text-align: center; padding: 0.5rem 0.3rem; border-radius: 10px; border: 1px solid var(--line); background: #fff; font-weight: 600; font-size: 0.9rem; }
    .tab.active { border-color: #b8d6fb; background: var(--blue-soft); color: #0f4f9e; }
    .card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 0.95rem; box-shadow: 0 1px 3px rgba(23, 32, 52, 0.08); }
    .card h3 { margin: 0 0 0.6rem; font-size: 1rem; }
    .muted { color: var(--muted); font-size: 0.84rem; }
    .controls-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    .pill { border: 1px solid var(--line); border-radius: 999px; padding: 0.3rem 0.62rem; font-size: 0.82rem; background: #fff; }
    .transport { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 0.35rem; margin-top: 0.55rem; }
    .btn-transport { border: 1px solid #c1d2e8; border-radius: 999px; min-height: 46px; background: #fff; font-size: 1.3rem; display: flex; align-items: center; justify-content: center; }
    .btn-transport.primary { background: var(--blue); color: #fff; border-color: var(--blue); }
    .mini-player { margin-top: auto; background: #0f203a; color: #f5f9ff; border-radius: 999px; padding: 0.45rem 0.7rem; display: flex; align-items: center; justify-content: space-between; gap: 0.45rem; }
    .mini-dot { width: 8px; height: 8px; border-radius: 50%; background: #33d17a; }
    .mini-actions { display: inline-flex; gap: 0.32rem; }
    .mini-btn { border: 1px solid #3b4f73; background: #1a3156; color: #fff; border-radius: 8px; min-width: 30px; min-height: 28px; font-size: 0.78rem; }
    .main { padding: 0.7rem 1rem 1rem; display: grid; grid-template-rows: auto auto 1fr; gap: 0.7rem; }
    .main-top { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 0.7rem; }
    .main-title { font-size: 1.1rem; font-weight: 700; }
    .search { width: 100%; border: 1px solid var(--line); border-radius: 10px; padding: 0.58rem 0.66rem; font-size: 0.9rem; background: #fff; }
    .result-card { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 0.65rem 0.75rem; margin-bottom: 0.52rem; display: grid; grid-template-columns: auto 1fr auto; gap: 0.7rem; align-items: center; }
    .thumb { width: 56px; height: 56px; border-radius: 10px; border: 1px solid var(--line); background: linear-gradient(135deg,#f7fbff,#e8f2ff); }
    .item-title { font-weight: 600; line-height: 1.25; }
    .meta { color: var(--muted); font-size: 0.82rem; }
    .actions-inline { display: inline-flex; gap: 0.3rem; }
    .chip { border: 1px solid var(--line); border-radius: 999px; padding: 0.2rem 0.52rem; font-size: 0.74rem; background: #fff; }
    .chip.blue { background: var(--blue-soft); color: #0f4f9e; border-color: #b8d6fb; }
    .chip.red { background: #ffefef; color: #9b1f1f; border-color: #ffc9c9; }
    .settings-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 0.6rem; }
    .source-row { border: 1px solid var(--line); border-radius: 10px; padding: 0.58rem 0.6rem; background: #fff; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
    .toggle { width: 38px; height: 22px; border-radius: 999px; background: #c4d2e6; position: relative; }
    .toggle::after { content: ""; position: absolute; width: 16px; height: 16px; border-radius: 50%; background: #fff; top: 3px; left: 3px; }
    .toggle.on { background: #6ab3ff; }
    .toggle.on::after { left: 19px; }
    .stack { display: grid; gap: 0.55rem; }
    @media (max-width: 1024px) {
      .app { grid-template-columns: 1fr; }
      .rail { border-right: none; border-bottom: 1px solid var(--line); }
      .transport { grid-template-columns: repeat(5, minmax(0,1fr)); }
    }
    @media (max-width: 600px) {
      .tabs { grid-template-columns: repeat(3, minmax(0,1fr)); }
      .btn-transport { min-height: 56px; font-size: 1.55rem; }
      .main-top { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside class="rail">
      <div class="brand">Read Flow</div>
      <div class="tabs">
        <div class="tab active">Find</div>
        <div class="tab">Player</div>
        <div class="tab">History</div>
      </div>

      <div class="card">
        <h3>Find Controls</h3>
        <div class="stack">
          <div class="source-row"><span>Source: Inbox</span><span class="chip blue">One selected</span></div>
          <div class="controls-grid">
            <div class="pill">From: Last 7 days</div>
            <div class="pill">Sort: Added</div>
          </div>
          <div class="controls-grid">
            <div class="pill">Actions: Archive</div>
            <div class="pill">Mode: Multi-select</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Player Controls</h3>
        <div class="controls-grid">
          <div class="pill">Auto next: On</div>
          <div class="pill">Speed: 1.2x</div>
        </div>
        <div style="margin-top:0.6rem;" class="muted">Now playing: The Search for Nancy G...</div>
        <div class="transport">
          <button class="btn-transport">⏮</button>
          <button class="btn-transport">⏪</button>
          <button class="btn-transport primary">⏸</button>
          <button class="btn-transport">⏩</button>
          <button class="btn-transport">⏭</button>
        </div>
      </div>

      <div class="card">
        <h3>Settings Preview</h3>
        <div class="settings-grid">
          <div class="source-row"><span>Inbox (new)</span><span class="toggle on"></span></div>
          <div class="source-row"><span>Feed</span><span class="toggle"></span></div>
          <div class="source-row"><span>Later</span><span class="toggle"></span></div>
          <div class="source-row"><span>Archive</span><span class="toggle"></span></div>
        </div>
        <div class="muted" style="margin-top:0.5rem;">UI-only redesign pass: settings currently model one source at a time.</div>
      </div>

      <div class="mini-player">
        <div style="display:flex;align-items:center;gap:0.42rem;"><span class="mini-dot"></span><span style="font-size:0.77rem;">Playing while browsing</span></div>
        <div class="mini-actions">
          <button class="mini-btn">⏸</button>
          <button class="mini-btn">⏭</button>
        </div>
      </div>
    </aside>

    <main class="main">
      <div class="main-top">
        <div class="main-title">Find Results</div>
        <div class="chip blue">All (filtered): 12</div>
        <div class="chip">Player queue: 5</div>
      </div>
      <input class="search" placeholder="Search results, author, source, content..." />
      <div>
        <div class="result-card">
          <div class="thumb"></div>
          <div>
            <div class="item-title">The Search for Nancy Grace Roman and Modern Sky Survey Systems</div>
            <div class="meta">By Ten Tabs • Inbox • Added Feb 14</div>
          </div>
          <div class="actions-inline">
            <span class="chip blue">Add to Player</span>
            <span class="chip">Open</span>
          </div>
        </div>
        <div class="result-card">
          <div class="thumb"></div>
          <div>
            <div class="item-title">A Better Way to Build News Digests from Label-Based Sources</div>
            <div class="meta">By Platform Weekly • Feed • Published Feb 11</div>
          </div>
          <div class="actions-inline">
            <span class="chip">Archive</span>
            <span class="chip red">Delete</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</body>
</html>`;

const HTML_APP = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#0284c7">
  <title>Read Flow</title>
  <link rel="icon" href="/favicon.ico" type="image/svg+xml">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --primary: #0284c7;
      --primary-hover: #0369a1;
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
      overflow-x: hidden;
    }
    .container { max-width: none; margin: 0; }
    .app-shell {
      display: grid;
      grid-template-columns: 288px minmax(0, 1fr);
      min-height: 100vh;
    }
    .player-rail-compact .app-shell {
      grid-template-columns: 252px minmax(0, 1fr);
    }
    .left-rail {
      border-right: 1px solid var(--border);
      background: #eef3fa;
      padding: 0.9rem 0.7rem 0.6rem;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    .main-pane {
      min-width: 0;
      padding: 0.7rem 0.95rem 1.2rem;
      height: 100vh;
      overflow-y: auto;
      background: radial-gradient(circle at 8% 10%, #f9fcff 0%, #f4f8fc 45%, #f3f7fb 100%);
    }
    .main-inner {
      max-width: none;
      margin: 0;
      min-height: 100%;
    }
    #cleanup-tab {
      min-height: 100%;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      gap: 0.8rem;
    }
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
      margin-top: 0.65rem;
      border-top: 1px solid var(--border);
      padding-top: 0.55rem;
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.35rem;
    }
    .rail-controls-host {
      margin-top: 0.8rem;
      display: none;
      width: 100%;
      min-width: 0;
      overflow: hidden;
    }
    .left-rail .rail-docked-control {
      margin-bottom: 0.6rem;
      padding: 0.9rem;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      overflow: hidden;
    }
    .left-rail .rail-docked-control .form-group {
      margin-bottom: 0.62rem;
    }
    .left-rail .rail-docked-control .btn {
      padding: 0.6rem 0.72rem;
      font-size: 0.84rem;
    }
    .left-rail .rail-docked-control .quick-date {
      padding: 0.22rem 0.58rem;
      font-size: 0.74rem;
    }
    .left-rail .rail-docked-control .quick-dates {
      gap: 0.3rem;
    }
    .left-rail .rail-docked-control .stats {
      margin-top: 0.55rem;
      gap: 0.52rem;
    }
    .left-rail .rail-docked-control .stat {
      padding: 0.68rem 0.45rem;
    }
    .left-rail .rail-docked-control .stat-value {
      font-size: 1.35rem;
      line-height: 1.05;
    }
    .left-rail .rail-docked-control .stat-label {
      font-size: 0.68rem;
    }
    .left-rail .rail-docked-control:last-child {
      margin-bottom: 0;
    }
    .left-rail .rail-docked-control .btn-group {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.45rem;
    }
    .left-rail .rail-docked-control .btn-group .btn {
      width: 100%;
    }
    .left-rail #deleted-controls-card .history-actions-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.4rem;
      margin-bottom: 0.68rem;
    }
    .left-rail #deleted-controls-card .history-actions-grid .btn {
      margin: 0;
    }
    .left-rail #deleted-controls-card .history-actions-grid .btn:nth-child(3) {
      grid-column: 1 / -1;
    }
    .left-rail #deleted-controls-card .preview-search-wrap {
      max-width: none;
      min-width: 0;
      width: 100%;
    }
    .left-rail .rail-docked-control .preview-top-controls {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 0.45rem;
      min-width: 0;
    }
    .left-rail .rail-docked-control .preview-search-wrap,
    .left-rail .rail-docked-control .preview-search,
    .left-rail .rail-docked-control .sort-toggle {
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    .left-rail .rail-docked-control .sort-toggle {
      justify-content: flex-start;
    }
    .rail-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.32rem;
      padding: 0.52rem 0.5rem;
      border-radius: 10px;
      border: 1px solid #d6dfeb;
      background: #ffffff;
      color: var(--text);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      margin-bottom: 0;
    }
    .rail-item.active {
      background: #e9f2ff;
      border-color: #b8d6fb;
      color: #0f4f9e;
    }
    .rail-item:hover {
      background: #f4f8ff;
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
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.18);
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
    .text-preview-toggle {
      margin-left: 0.4rem;
      font-size: 0.72rem;
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 0.08rem 0.45rem;
      background: white;
      color: var(--text-muted);
      cursor: pointer;
    }
    .text-preview-toggle:hover {
      background: var(--bg);
      color: var(--text);
    }
    .icon-btn {
      min-width: 2rem;
      padding: 0.08rem 0.45rem;
      font-size: 0.9rem;
      line-height: 1.1;
    }
    .tts-preview {
      margin-top: 0.45rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0.55rem 0.65rem;
      background: #fafcff;
      font-size: 0.8rem;
      color: var(--text);
      max-height: 160px;
      overflow-y: auto;
      white-space: pre-wrap;
    }
    .player-queue-scroll {
      max-height: 42vh;
      overflow-y: auto;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.25rem;
      background: #fff;
    }
    .player-row-progress {
      margin-top: 0.35rem;
      height: 4px;
      background: var(--border);
      border-radius: 999px;
      overflow: hidden;
    }
    .player-row-progress-fill {
      height: 100%;
      width: 0%;
      background: var(--primary);
    }
    .player-queue-row.current {
      background: #e0f2fe;
      border-left: 3px solid var(--primary);
    }
    .player-current-header {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      margin-bottom: 0.55rem;
    }
    .player-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.35rem;
      flex-wrap: wrap;
    }
    .player-title-controls {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      flex-wrap: wrap;
    }
    .player-current-meta {
      min-width: 0;
      flex: 1;
    }
    #player-current-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: min(100%, 58ch);
    }
    .player-controls-row {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      width: 100%;
      gap: 0.45rem;
    }
    .player-icon-btn {
      border-radius: 999px;
      min-width: 0;
      min-height: 46px;
      padding: 0.42rem 0.25rem;
      white-space: nowrap;
    }
    #player-playpause-btn {
      background: #fff;
      color: var(--primary);
      border: 1px solid var(--primary);
    }
    #player-playpause-btn.is-playing {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
    }
    .control-icon {
      font-size: 1.8rem;
      line-height: 1;
    }
    .control-text {
      font-size: 0.75rem;
      line-height: 1;
    }
    #player-controls-right-host .control-icon {
      font-size: 2.15rem;
    }
    #player-controls-right-host .player-icon-btn {
      min-height: 52px;
      padding: 0.52rem 0.3rem;
    }
    #player-controls-right-host .player-title-controls {
      margin-left: auto;
      justify-content: flex-end;
    }
    #player-controls-left-host .player-controls-row {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.35rem;
    }
    #player-controls-left-host .player-icon-btn {
      min-height: 44px;
      padding: 0.34rem 0.2rem;
    }
    #player-controls-left-host .control-icon {
      font-size: 1.55rem;
    }
    #player-controls-left-host .control-text {
      font-size: 0.7rem;
    }
    .now-playing-badge {
      display: inline-block;
      margin-left: 0.4rem;
      padding: 0.08rem 0.45rem;
      border-radius: 999px;
      background: var(--primary);
      color: #fff;
      font-size: 0.68rem;
      font-weight: 600;
      vertical-align: middle;
    }
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
    .empty-state-panel {
      height: 100%;
      min-height: 260px;
      border: 1px dashed #c7d8ec;
      border-radius: 12px;
      background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(249,252,255,0.96));
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 0.55rem;
      padding: 1.3rem;
      color: var(--text-muted);
    }
    .empty-state-title {
      font-size: 1.06rem;
      font-weight: 600;
      color: var(--text);
    }
    .empty-state-subtitle {
      font-size: 0.88rem;
      max-width: 480px;
    }
    .empty-state-action {
      margin-top: 0.25rem;
      min-width: 160px;
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
    .preview-top-controls > * {
      min-width: 0;
    }
    .preview-actions {
      display: inline-flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      flex: 1 1 420px;
      min-width: 0;
      justify-content: flex-end;
    }
    .preview-actions .btn {
      flex: 1 1 180px;
      min-width: 0;
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
    .left-rail .preview-search-wrap {
      min-width: 0;
      max-width: 100%;
      width: 100%;
    }
    .left-rail .preview-search {
      min-width: 0;
      max-width: none;
      width: 100%;
    }
    .left-rail .preview-actions {
      justify-content: stretch;
    }
    .left-rail .preview-actions .btn {
      flex: 1 1 100%;
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
      background: #0284c7;
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
    .rail-footer {
      position: sticky;
      bottom: 0;
      margin-top: auto;
      background: linear-gradient(to bottom, rgba(238,243,250,0), rgba(238,243,250,1) 28%);
      padding-top: 0.6rem;
    }
    .version-badge {
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
      min-height: 0;
      height: auto;
      margin-bottom: 0;
    }
    #preview-list {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
    #deleted-tab {
      min-height: 100%;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      gap: 0.8rem;
    }
    #deleted-tab .card {
      display: flex;
      flex-direction: column;
      height: auto;
      min-height: 0;
      margin-bottom: 0;
    }
    #deleted-list {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      margin-top: 0.5rem;
      border-top: 1px solid var(--border);
      padding-top: 0.6rem;
    }
    #player-tab {
      min-height: 100%;
      display: grid;
      grid-template-rows: minmax(0, 1fr);
    }
    #player-tab .card {
      display: flex;
      flex-direction: column;
      height: auto;
      min-height: 0;
      margin-bottom: 0;
    }
    #player-queue {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      margin-top: 0.8rem;
    }
    @media (max-width: 600px) {
      .stats { grid-template-columns: repeat(2, 1fr); }
      .btn-group { flex-direction: column; }
      .btn { width: 100%; }
      .inline-controls { flex-direction: column; align-items: flex-start; }
      .player-controls-row {
        flex-direction: row;
        flex-wrap: nowrap;
        gap: 0.35rem;
      }
      .player-title-row {
        align-items: flex-start;
      }
      .player-title-controls {
        width: 100%;
        justify-content: flex-start;
      }
      .player-controls-row .btn {
        width: auto;
      }
      .player-icon-btn {
        border-radius: 999px;
        min-height: 58px;
        padding: 0.66rem 0.3rem;
      }
      .player-icon-btn .control-icon {
        font-size: 2.55rem;
      }
      .player-icon-btn .control-text {
        display: none;
      }
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
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.26rem;
      }
      .rail-item {
        justify-content: center;
        font-size: 0.85rem;
        padding: 0.44rem 0.3rem;
      }
      .left-rail .card {
        margin-bottom: 0.55rem;
        padding: 0.85rem;
      }
      .rail-footer {
        position: static;
        background: transparent;
        padding-top: 0.45rem;
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
      #deleted-tab,
      #player-tab,
      .main-inner {
        height: auto;
        min-height: 0;
        display: block;
      }
      #deleted-tab .card,
      #player-tab .card {
        height: auto;
      }
      #deleted-list,
      #player-queue {
        overflow: visible;
      }
    }
    @media (max-width: 600px) {
      .left-rail {
        padding: 0.55rem 0.45rem 0.35rem;
      }
      .rail-brand {
        font-size: 1rem;
        gap: 0.4rem;
        padding: 0.2rem 0.35rem 0.5rem;
      }
      .rail-brand .logo {
        width: 24px;
        height: 24px;
      }
      .rail-section { gap: 0.22rem; }
      .rail-item {
        justify-content: center;
        white-space: nowrap;
        min-width: 0;
        padding: 0.38rem 0.22rem;
        font-size: 0.84rem;
        gap: 0.26rem;
        margin-bottom: 0;
      }
      .rail-item .badge {
        font-size: 0.67rem;
        padding: 0.08rem 0.35rem;
      }
      .version-badge {
        margin-top: 0.45rem;
        font-size: 0.72rem;
        padding: 0.2rem 0.5rem;
      }
      .left-rail .card {
        padding: 0.72rem;
        margin-top: 0.42rem;
      }
      .main-pane {
        padding: 0.12rem 0.55rem 1.2rem;
      }
      .main-inner .card {
        padding: 0.88rem;
      }
      .card h2 {
        margin-bottom: 0.62rem;
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
            <defs>
              <linearGradient id="logoG2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#0ea5e9"></stop>
                <stop offset="1" stop-color="#0284c7"></stop>
              </linearGradient>
            </defs>
            <rect x="7" y="6" width="50" height="52" rx="12" fill="url(#logoG2)"></rect>
            <path d="M18 17h28" stroke="#e0f2fe" stroke-width="3" stroke-linecap="round"></path>
            <path d="M18 24h28" stroke="#e0f2fe" stroke-width="3" stroke-linecap="round"></path>
            <path d="M18 31h22" stroke="#e0f2fe" stroke-width="3" stroke-linecap="round"></path>
            <path d="M18 38h17" stroke="#e0f2fe" stroke-width="3" stroke-linecap="round"></path>
            <circle cx="44" cy="44" r="10" fill="#f8fafc"></circle>
            <path d="M39.6 44.2l2.5 2.5 6.1-6.1" stroke="#0284c7" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>
            <path d="M14 44l4-3v6z" fill="#e0f2fe"></path>
            <path d="M19.5 42.2c1 .9 1 2.7 0 3.6" stroke="#e0f2fe" stroke-width="2" stroke-linecap="round" fill="none"></path>
            <path d="M22.3 40.8c1.9 1.8 1.9 4.8 0 6.6" stroke="#e0f2fe" stroke-width="2" stroke-linecap="round" fill="none"></path>
          </svg>
          <span>Read Flow</span>
        </div>
        <div class="rail-section">
          <a class="rail-item tab active" data-tab="cleanup" href="/">Find <span id="cleanup-selected-count" class="badge" style="display:none">0</span></a>
          <a class="rail-item tab" data-tab="player" href="/player">Player <span id="player-selected-count" class="badge" style="display:none">0</span></a>
          <a class="rail-item tab" data-tab="deleted" href="/deleted">History <span id="deleted-count" class="badge" style="display:none">0</span></a>
        </div>
        <a class="tab" data-tab="settings" href="/settings" style="display:none" aria-hidden="true">Settings</a>
        <a class="tab" data-tab="about" href="/about" style="display:none" aria-hidden="true">About</a>
        <div id="cleanup-controls-left-host" class="rail-controls-host"></div>
        <div id="deleted-controls-left-host" class="rail-controls-host"></div>
        <div id="cleanup-controls" style="display:none"></div>
        <div id="deleted-controls" style="display:none"></div>
        <div id="player-controls-left-host" style="display:none">
        <div id="player-controls" class="card" style="display:none;margin-top:0.8rem;">
          <div class="player-title-row">
            <h2 style="margin-bottom:0;">Audio Player</h2>
            <div class="player-title-controls">
              <label class="checkbox-label" style="font-size:0.85rem;">
                <input id="player-auto-next" type="checkbox" checked>
                Auto next
              </label>
              <label for="player-speed" style="margin:0; font-size:0.82rem;">Speed</label>
              <select id="player-speed" style="width:auto; min-width: 84px; padding: 0.4rem 0.5rem;">
                <option value="0.8">0.8x</option>
                <option value="1" selected>1.0x</option>
                <option value="1.1">1.1x</option>
                <option value="1.2">1.2x</option>
                <option value="1.3">1.3x</option>
                <option value="1.5">1.5x</option>
                <option value="1.7">1.7x</option>
              </select>
              <button type="button" id="player-text-toggle" class="text-preview-toggle" style="margin-left:0.2rem;">Text</button>
            </div>
          </div>
          <p id="player-status" style="color: var(--text-muted); margin-bottom: 0.6rem;">Queue is empty.</p>
          <p id="player-tts-mode" style="display:none; color: var(--text-muted); margin-bottom: 0.4rem; font-size: 0.82rem;">TTS mode: mock clip</p>
          <div id="player-current-header" class="player-current-header" style="display:none;">
            <img id="player-current-thumb" class="preview-thumb" alt="" loading="lazy" referrerpolicy="no-referrer" style="display:none;">
            <span id="player-current-thumb-fallback" class="preview-thumb-fallback" style="display:none;">No image</span>
            <div class="player-current-meta">
              <div id="player-current-title" style="font-weight:600;"></div>
              <div id="player-current-author" class="article-meta"></div>
            </div>
          </div>
          <div id="player-current-text" class="tts-preview" style="display:none; margin-top:0; margin-bottom:0.7rem;"></div>
          <div class="btn-group player-controls-row" style="margin-bottom:0.6rem;">
            <button class="btn btn-outline player-icon-btn" id="player-prev-btn" title="Previous" aria-label="Previous"><span class="control-icon">⏮</span></button>
            <button class="btn btn-outline player-icon-btn" id="player-back-btn" title="Back" aria-label="Back"><span class="control-icon">⏪</span><span class="control-text">15s</span></button>
            <button class="btn player-icon-btn" id="player-playpause-btn" title="Play" aria-label="Play"><span class="control-icon">▶</span></button>
            <button class="btn btn-outline player-icon-btn" id="player-forward-btn" title="Forward" aria-label="Forward"><span class="control-icon">⏩</span><span class="control-text">30s</span></button>
            <button class="btn btn-outline player-icon-btn" id="player-next-btn" title="Next" aria-label="Next"><span class="control-icon">⏭</span></button>
          </div>
          <audio id="player-audio" controls style="width:100%; margin-top: 0.4rem;"></audio>
        </div>
        </div>
        <div class="rail-footer">
          <button class="version-badge" id="version-badge" title="Open settings and about">&#9881; Settings · v${APP_VERSION}</button>
        </div>
      </aside>
      <main class="main-pane" id="main-pane">
        <div class="main-inner">
    <div id="cleanup-tab">
      <div id="cleanup-controls-right-host"></div>
      <div id="cleanup-main-controls" class="card">
        <h2>Find</h2>
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
          <button class="btn btn-primary" id="preview-btn">Find</button>
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
            <button class="btn btn-outline" id="play-selected-btn" disabled>Play Selected</button>
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
      <div id="deleted-controls-right-host"></div>
      <div class="card" id="deleted-controls-card">
        <h2>Deleted Items History</h2>
        <p style="color: var(--text-muted); margin-bottom: 0.8rem; font-size: 0.9rem;">
          Restore selected items to Reader or remove them from local history.
        </p>
        <div class="btn-group history-actions-grid" style="margin-top: 0.4rem; margin-bottom: 0.8rem;">
          <button class="btn btn-primary" id="restore-btn" disabled>Restore Selected</button>
          <button class="btn btn-outline" id="remove-selected-btn" disabled>Remove from History</button>
          <button class="btn btn-outline" id="clear-history-btn">Clear History</button>
        </div>
        <div class="preview-top-controls" id="deleted-top-controls">
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
      </div>
      <div class="card">
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
          <label for="setting-tts-voice">TTS voice</label>
          <select id="setting-tts-voice">
            <option value="alloy" selected>Alloy (default)</option>
            <option value="onyx">Onyx (male)</option>
            <option value="echo">Echo (male)</option>
            <option value="nova">Nova (female)</option>
            <option value="shimmer">Shimmer (female)</option>
          </select>
        </div>
        <div class="form-group">
          <label for="setting-audio-back-seconds">Audio back skip (seconds)</label>
          <input id="setting-audio-back-seconds" type="number" min="5" max="120">
        </div>
        <div class="form-group">
          <label for="setting-audio-forward-seconds">Audio forward skip (seconds)</label>
          <input id="setting-audio-forward-seconds" type="number" min="5" max="180">
        </div>
        <div class="form-group">
          <label for="setting-max-open-tabs">Max tabs to open</label>
          <input id="setting-max-open-tabs" type="number" min="1" max="50">
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input id="setting-player-auto-next" type="checkbox">
            Player auto play next
          </label>
        </div>
        <div class="form-group">
          <label for="setting-player-auto-action">After finishing a story</label>
          <select id="setting-player-auto-action">
            <option value="none">Do nothing</option>
            <option value="archive">Auto archive</option>
            <option value="delete">Auto delete</option>
          </select>
        </div>
        <p style="color:var(--text-muted);font-size:0.82rem;margin-top:0.2rem;">Settings auto-save immediately (API keys still require Save).</p>
        <hr style="border:none;border-top:1px solid var(--border);margin:1rem 0;">
        <h2 style="font-size:1rem;margin-bottom:0.65rem;">Readwise API Key</h2>
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:0.6rem;">
          Key is stored server-side in this Worker KV and is never returned to browser clients after save.
        </p>
        <p id="token-status" style="color:var(--text-muted);font-size:0.85rem;margin-bottom:0.5rem;">Checking token status…</p>
        <div class="form-group">
          <label for="setting-readwise-token">Set/replace API key</label>
          <input id="setting-readwise-token" type="password" autocomplete="off" placeholder="Paste Readwise API token">
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

    <div id="player-tab" style="display:none">
      <div id="player-controls-right-host" style="display:none"></div>
      <div class="card">
        <h2>Playlist</h2>
        <div class="preview-top-controls" style="margin-top:0.7rem;">
          <label class="checkbox-label" style="font-size:0.85rem; margin:0;">
            <input id="player-select-all" type="checkbox">
            All
          </label>
          <div class="preview-search-wrap" style="max-width:none;">
            <input type="text" id="player-search" class="preview-search" placeholder="Search player queue...">
            <button type="button" id="player-search-clear" class="search-clear-btn" title="Clear player search" aria-label="Clear player search">×</button>
          </div>
        </div>
        <div id="player-queue" class="history-list"></div>
      </div>
    </div>
        </div>
      </main>
    </div>
  </div>

  <script>
    var APP_VERSION = '${APP_VERSION}';
    var CLIENT_MAX_TTS_PREVIEW_CHARS = ${MAX_TTS_PREVIEW_CHARS};
    var CLIENT_TTS_SYNTH_CHUNK_CHARS = ${TTS_SYNTH_CHUNK_CHARS};
    var CLIENT_TTS_FIRST_CHUNK_CHARS = ${TTS_FIRST_CHUNK_CHARS};
    var CLIENT_TTS_SECOND_CHUNK_CHARS = ${TTS_SECOND_CHUNK_CHARS};
    var CLIENT_PREVIEW_CACHE_STALE_MS = ${PREVIEW_CACHE_STALE_MS};
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
    var playerSwipeStateByQueueId = {};
    var cleanupInFlight = false;
    var cleanupBatchSize = 20;
    var deletedItems = [];
    var selectedDeletedIds = new Set();
    var deletedSearch = '';
    var deletedSortMode = 'deleted';
    var lastQuery = null;
    var lastPreviewLoadedAt = 0;
    var settings = {
      defaultLocation: 'new',
      defaultDays: 30,
      previewLimit: 100,
      confirmActions: true,
      mockTts: true,
      ttsVoice: 'alloy',
      audioBackSeconds: 15,
      audioForwardSeconds: 30,
      maxOpenTabs: 5,
      playerAutoNext: true,
      playerAutoAction: 'none'
    };
    var playerQueue = [];
    var playerIndex = 0;
    var playerEnabledIds = new Set();
    var playerProgressByItemId = {};
    var playerDurationByItemId = {};
    var playerChunkDurationsByItemId = {};
    var playerChunkStateByItemId = {};
    var playerLastItemId = '';
    var playerLoadedItemId = '';
    var playerLoadedChunkIndex = 0;
    var playerSearch = '';
    var currentTabName = 'cleanup';
    var playerStatePersistTimer = null;
    var playerAudioObjectUrl = '';
    var playerLoadToken = 0;
    var playerChunkFetchByKey = {};
    var playerChunkBlobByKey = {};
    var PLAYER_STATE_STORAGE_KEY = 'readwise_cleanup_player_state_v1';
    var APP_STATE_STORAGE_KEY = 'readwise_cleanup_app_state_v1';
    var appStatePersistTimer = null;
    var settingsSaveTimer = null;
    var settingsSaveInFlight = false;
    var voicePreviewAudio = null;

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
    var playSelectedBtn = document.getElementById('play-selected-btn');
    var openSelectedBtn = document.getElementById('open-selected-btn');
    var deleteBtn = document.getElementById('delete-btn');
    var archiveBtn = document.getElementById('archive-btn');
    var mainPane = document.getElementById('main-pane');
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
    var cleanupSelectedCountBadge = document.getElementById('cleanup-selected-count');
    var playerSelectedCountBadge = document.getElementById('player-selected-count');
    var saveSettingsBtn = document.getElementById('save-settings-btn');
    var cleanupControlsCard = document.getElementById('cleanup-controls');
    var deletedControlsCard = document.getElementById('deleted-controls');
    var cleanupMainControlsCard = document.getElementById('cleanup-main-controls');
    var deletedMainControlsCard = document.getElementById('deleted-controls-card');
    var cleanupControlsLeftHost = document.getElementById('cleanup-controls-left-host');
    var deletedControlsLeftHost = document.getElementById('deleted-controls-left-host');
    var cleanupControlsRightHost = document.getElementById('cleanup-controls-right-host');
    var deletedControlsRightHost = document.getElementById('deleted-controls-right-host');
    var playerControlsCard = document.getElementById('player-controls');
    var playerControlsLeftHost = document.getElementById('player-controls-left-host');
    var playerControlsRightHost = document.getElementById('player-controls-right-host');
    var leftRailEl = document.querySelector('.left-rail');
    var versionBadgeBtn = document.getElementById('version-badge');
    var saveTokenBtn = document.getElementById('save-token-btn');
    var tokenStatusEl = document.getElementById('token-status');
    var settingsTokenInput = document.getElementById('setting-readwise-token');
    var settingMockTts = document.getElementById('setting-mock-tts');
    var settingTtsVoice = document.getElementById('setting-tts-voice');
    var settingAudioBackSeconds = document.getElementById('setting-audio-back-seconds');
    var settingAudioForwardSeconds = document.getElementById('setting-audio-forward-seconds');
    var settingMaxOpenTabs = document.getElementById('setting-max-open-tabs');
    var settingPlayerAutoNext = document.getElementById('setting-player-auto-next');
    var settingPlayerAutoAction = document.getElementById('setting-player-auto-action');
    var openAiKeyStatusEl = document.getElementById('openai-key-status');
    var saveOpenAiKeyBtn = document.getElementById('save-openai-key-btn');
    var settingsOpenAiKeyInput = document.getElementById('setting-openai-key');
    var playerAudio = document.getElementById('player-audio');
    var playerStatus = document.getElementById('player-status');
    var playerTtsModeEl = document.getElementById('player-tts-mode');
    var playerCurrentHeader = document.getElementById('player-current-header');
    var playerCurrentThumb = document.getElementById('player-current-thumb');
    var playerCurrentThumbFallback = document.getElementById('player-current-thumb-fallback');
    var playerCurrentTitle = document.getElementById('player-current-title');
    var playerCurrentAuthor = document.getElementById('player-current-author');
    var playerTextToggleBtn = document.getElementById('player-text-toggle');
    var playerCurrentText = document.getElementById('player-current-text');
    var playerQueueEl = document.getElementById('player-queue');
    var playerSelectAll = document.getElementById('player-select-all');
    var playerSearchInput = document.getElementById('player-search');
    var playerSearchClearBtn = document.getElementById('player-search-clear');
    var playerPrevBtn = document.getElementById('player-prev-btn');
    var playerPlayPauseBtn = document.getElementById('player-playpause-btn');
    var playerNextBtn = document.getElementById('player-next-btn');
    var playerBackBtn = document.getElementById('player-back-btn');
    var playerForwardBtn = document.getElementById('player-forward-btn');
    var playerSpeedSelect = document.getElementById('player-speed');
    var playerAutoNextCheckbox = document.getElementById('player-auto-next');
    var playerShowText = false;

    var settingsDefaultLocation = document.getElementById('setting-default-location');
    var settingsDefaultDays = document.getElementById('setting-default-days');
    var settingsPreviewLimit = document.getElementById('setting-preview-limit');
    var settingsConfirmActions = document.getElementById('setting-confirm-actions');
    var TAB_ROUTES = {
      cleanup: '/',
      deleted: '/deleted',
      settings: '/settings',
      about: '/about',
      player: '/player',
    };
    var ROUTE_TABS = {
      '/': 'cleanup',
      '/deleted': 'deleted',
      '/settings': 'settings',
      '/about': 'about',
      '/player': 'player',
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
      if (settingTtsVoice) settingTtsVoice.value = settings.ttsVoice || 'alloy';
      settingAudioBackSeconds.value = settings.audioBackSeconds;
      settingAudioForwardSeconds.value = settings.audioForwardSeconds;
      settingMaxOpenTabs.value = settings.maxOpenTabs;
      settingPlayerAutoNext.checked = !!settings.playerAutoNext;
      settingPlayerAutoAction.value = settings.playerAutoAction || 'none';
      playerAutoNextCheckbox.checked = !!settings.playerAutoNext;
      var backTextEl = playerBackBtn && playerBackBtn.querySelector ? playerBackBtn.querySelector('.control-text') : null;
      var fwdTextEl = playerForwardBtn && playerForwardBtn.querySelector ? playerForwardBtn.querySelector('.control-text') : null;
      if (backTextEl) backTextEl.textContent = settings.audioBackSeconds + 's';
      if (fwdTextEl) fwdTextEl.textContent = settings.audioForwardSeconds + 's';
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
      updatePreviewButtonLabel();
    }

    function buildQueryKey() {
      return [
        locationSelect.value,
        fromDateInput.value || '',
        toDateInput.value || '',
        settings.previewLimit
      ].join('|');
    }

    function updatePreviewButtonLabel() {
      var hasCachedPreview = previewData.length > 0 && !!lastQuery;
      var hasStaleCache = hasCachedPreview && lastPreviewLoadedAt > 0
        && (Date.now() - lastPreviewLoadedAt) >= CLIENT_PREVIEW_CACHE_STALE_MS;
      var isOutOfDate = hasCachedPreview && (buildQueryKey() !== lastQuery || hasStaleCache);
      previewBtn.innerHTML = isOutOfDate ? 'Refresh Find' : 'Find';
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

    function shouldDockPlayerControlsRight() {
      if (window.innerWidth <= 1024) return true;
      if (!leftRailEl || !leftRailEl.getBoundingClientRect) return false;
      var railWidth = leftRailEl.getBoundingClientRect().width || 0;
      return railWidth > 0 && railWidth < 380;
    }

    function shouldDockMainControlsLeft() {
      if (window.innerWidth <= 1024) return false;
      if (!leftRailEl || !leftRailEl.getBoundingClientRect) return true;
      var railWidth = leftRailEl.getBoundingClientRect().width || 0;
      if (railWidth <= 0) return window.innerWidth >= 1180;
      return railWidth >= 240;
    }

    function syncMainControlsDock() {
      var dockLeft = shouldDockMainControlsLeft();
      if (cleanupMainControlsCard && cleanupControlsLeftHost && cleanupControlsRightHost) {
        var cleanupTargetHost = dockLeft ? cleanupControlsLeftHost : cleanupControlsRightHost;
        if (cleanupMainControlsCard.parentElement !== cleanupTargetHost && typeof cleanupTargetHost.appendChild === 'function') {
          cleanupTargetHost.appendChild(cleanupMainControlsCard);
        }
        cleanupMainControlsCard.classList.toggle('rail-docked-control', dockLeft);
      }
      if (deletedMainControlsCard && deletedControlsLeftHost && deletedControlsRightHost) {
        var deletedTargetHost = dockLeft ? deletedControlsLeftHost : deletedControlsRightHost;
        if (deletedMainControlsCard.parentElement !== deletedTargetHost && typeof deletedTargetHost.appendChild === 'function') {
          deletedTargetHost.appendChild(deletedMainControlsCard);
        }
        deletedMainControlsCard.classList.toggle('rail-docked-control', dockLeft);
      }
      if (cleanupControlsLeftHost) {
        cleanupControlsLeftHost.style.display = currentTabName === 'cleanup' && dockLeft ? 'block' : 'none';
      }
      if (deletedControlsLeftHost) {
        deletedControlsLeftHost.style.display = currentTabName === 'deleted' && dockLeft ? 'block' : 'none';
      }
    }

    function syncPlayerControlsDock() {
      if (!playerControlsCard || !playerControlsLeftHost || !playerControlsRightHost) return;
      if (typeof playerControlsLeftHost.appendChild !== 'function' || typeof playerControlsRightHost.appendChild !== 'function') return;
      var dockRight = shouldDockPlayerControlsRight();
      var targetHost = dockRight ? playerControlsRightHost : playerControlsLeftHost;
      if (playerControlsCard.parentElement !== targetHost) {
        targetHost.appendChild(playerControlsCard);
      }
      var showPlayer = currentTabName === 'player';
      playerControlsRightHost.style.display = showPlayer && dockRight ? 'block' : 'none';
      playerControlsLeftHost.style.display = showPlayer && !dockRight ? 'block' : 'none';
      if (document && document.body && document.body.classList) {
        document.body.classList.toggle('player-rail-compact', showPlayer && !dockRight);
      }
    }

    function getTabFromPath(pathname) {
      var normalized = normalizePath(pathname);
      return ROUTE_TABS[normalized] || 'cleanup';
    }

    function setActiveTab(tabName, options) {
      var opts = options || {};
      var shouldPush = opts.push !== false;
      var syncPlayerFromSelection = opts.syncPlayerFromSelection !== false;
      if (currentTabName === 'player' && tabName !== 'player') {
        saveCurrentPlayerProgress();
        if (playerAudio && !playerAudio.paused) playerAudio.pause();
      }
      document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.tab[data-tab="' + tabName + '"]').forEach(function(activeTabEl) {
        activeTabEl.classList.add('active');
      });

      document.getElementById('cleanup-tab').style.display = tabName === 'cleanup' ? 'block' : 'none';
      document.getElementById('deleted-tab').style.display = tabName === 'deleted' ? 'block' : 'none';
      document.getElementById('settings-tab').style.display = tabName === 'settings' ? 'block' : 'none';
      document.getElementById('about-tab').style.display = tabName === 'about' ? 'block' : 'none';
      document.getElementById('player-tab').style.display = tabName === 'player' ? 'block' : 'none';
      cleanupControlsCard.style.display = tabName === 'cleanup' ? 'block' : 'none';
      if (deletedControlsCard) deletedControlsCard.style.display = tabName === 'deleted' ? 'block' : 'none';
      if (playerControlsCard) playerControlsCard.style.display = tabName === 'player' ? 'block' : 'none';
      mainPane.style.overflowY = tabName === 'cleanup' ? 'hidden' : 'auto';

      if (tabName === 'deleted') {
        loadDeletedItems();
      }
      if (tabName === 'player' && syncPlayerFromSelection) {
        refreshPlayerQueueFromPreviewSelection({ autoplay: true });
      }

      var targetPath = TAB_ROUTES[tabName] || '/';
      if (shouldPush && normalizePath(window.location.pathname) !== targetPath) {
        history.pushState({ tab: tabName }, '', targetPath);
      }
      currentTabName = tabName;
      syncMainControlsDock();
      syncPlayerControlsDock();
      schedulePersistAppState();
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
    on(window, 'resize', function() {
      syncMainControlsDock();
      syncPlayerControlsDock();
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
        lastPreviewLoadedAt = Date.now();
        syncPreviewSelectionUI();
        renderPreview();
        updatePreviewButtonLabel();

        itemCountEl.textContent = currentCount;
        locationDisplay.textContent = locationSelect.value;
        previewTopControls.style.display = previewData.length > 0 ? 'flex' : 'none';
        previewBottomControls.style.display = previewData.length > previewPageSize ? 'flex' : 'none';
        showToast('Loaded preview for ' + currentCount + ' items', currentCount ? 'success' : 'warning');
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        previewBtn.disabled = false;
        updatePreviewButtonLabel();
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

    function updateRailSelectionBadges() {
      var cleanupCount = getActiveSelectedIds().length;
      if (cleanupSelectedCountBadge) {
        if (cleanupCount > 0) {
          cleanupSelectedCountBadge.textContent = String(cleanupCount);
          cleanupSelectedCountBadge.style.display = 'inline-block';
        } else {
          cleanupSelectedCountBadge.style.display = 'none';
        }
      }

      var playerCount = 0;
      if (playerQueue.length > 0 && playerEnabledIds && typeof playerEnabledIds.size === 'number') {
        playerCount = playerEnabledIds.size;
      }
      if (playerSelectedCountBadge) {
        if (playerCount > 0) {
          playerSelectedCountBadge.textContent = String(playerCount);
          playerSelectedCountBadge.style.display = 'inline-block';
        } else {
          playerSelectedCountBadge.style.display = 'none';
        }
      }
    }

    function isArchiveSourceSelected() {
      return String(locationSelect.value || '') === 'archive';
    }

    function getSecondaryCleanupAction() {
      return isArchiveSourceSelected() ? 'restore' : 'archive';
    }

    function getSecondaryActionLabel() {
      return getSecondaryCleanupAction() === 'restore' ? 'Restore Selected' : 'Archive Selected';
    }

    function getActionPastTense(action) {
      if (action === 'delete') return 'Deleted';
      if (action === 'restore') return 'Restored';
      return 'Archived';
    }

    function renderPreview() {
      var filtered = getSortedFilteredPreviewItems();
      if (filtered.length === 0) {
        var emptyBtnLabel = (previewData.length > 0) ? 'Refresh Find' : 'Find Items';
        previewList.innerHTML = '<div class="empty-state-panel"><div class="empty-state-title">No items match this filter</div><div class="empty-state-subtitle">Adjust search/date/source filters or refresh to pull the latest matching stories.</div><button type="button" class="btn btn-outline empty-state-action" id="preview-empty-find-btn">' + emptyBtnLabel + '</button></div>';
        var emptyFindBtn = document.getElementById('preview-empty-find-btn');
        on(emptyFindBtn, 'click', function() {
          if (previewBtn && !previewBtn.disabled) previewBtn.click();
        });
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
        html += '<div class="swipe-bg left">' + (isArchiveSourceSelected() ? 'Restore' : 'Archive') + '</div>';
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
        html += '<button type="button" class="text-preview-toggle icon-btn play-preview-btn" data-article-id="' + escapeHtml(articleId) + '" title="Play in Player" aria-label="Play in Player">▶</button>';
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
      previewList.querySelectorAll('.play-preview-btn').forEach(function(btn) {
        on(btn, 'click', function() {
          var articleId = String(btn.dataset.articleId || '');
          var match = previewData.find(function(item) { return String(item.id) === articleId; });
          if (!match) return;
          ensurePlayerItemAndPlay(match);
        });
      });
      previewPageLabel.textContent = 'Page ' + previewPage + ' / ' + totalPages;
      previewPrevBtn.disabled = previewPage <= 1;
      previewNextBtn.disabled = previewPage >= totalPages;
      previewBottomControls.style.display = totalPages > 1 ? 'flex' : 'none';
      syncPreviewSelectionUI();
      schedulePersistAppState();
    }

    on(deleteBtn, 'click', function() { performCleanup('delete'); });
    on(archiveBtn, 'click', function() { performCleanup(getSecondaryCleanupAction()); });

    function syncPreviewSelectionUI() {
      var filtered = getFilteredPreviewItems();
      if (previewData.length === 0 || filtered.length === 0) {
        selectAllPreview.checked = false;
        selectAllPreview.indeterminate = false;
        openSelectedBtn.disabled = true;
        openSelectedBtn.style.display = 'none';
        playSelectedBtn.disabled = true;
        deleteBtn.disabled = true;
        archiveBtn.disabled = true;
        openSelectedBtn.textContent = 'Open Selected';
        deleteBtn.textContent = 'Delete Selected';
        archiveBtn.textContent = getSecondaryActionLabel();
        updateRailSelectionBadges();
        return;
      }
      var selectedCount = selectedPreviewIds.size;
      var filteredIds = new Set(filtered.map(function(item) { return String(item.id); }));
      var filteredSelected = [...selectedPreviewIds].filter(function(id) { return filteredIds.has(id); }).length;
      var displayCount = previewSearch ? filteredSelected : selectedCount;
      selectAllPreview.checked = filteredSelected > 0 && filteredSelected === filtered.length;
      selectAllPreview.indeterminate = filteredSelected > 0 && filteredSelected < filtered.length;
      var maxTabs = Number(settings.maxOpenTabs || 5);
      var canOpenFew = displayCount > 0 && displayCount <= maxTabs;
      openSelectedBtn.style.display = canOpenFew ? 'inline-flex' : 'none';
      openSelectedBtn.disabled = !canOpenFew;
      playSelectedBtn.disabled = displayCount === 0;
      playSelectedBtn.textContent = displayCount > 0 ? 'Play Selected (' + displayCount + ')' : 'Play Selected';
      deleteBtn.disabled = displayCount === 0;
      archiveBtn.disabled = displayCount === 0;
      openSelectedBtn.textContent = displayCount > 0 ? 'Open Selected (' + displayCount + ')' : 'Open Selected';
      deleteBtn.textContent = displayCount > 0 ? 'Delete Selected (' + displayCount + ')' : 'Delete Selected';
      var secondaryLabel = getSecondaryActionLabel();
      archiveBtn.textContent = displayCount > 0 ? (secondaryLabel + ' (' + displayCount + ')') : secondaryLabel;
      updateRailSelectionBadges();
    }

    function togglePreviewItem(checkbox) {
      var articleId = checkbox.dataset.articleId;
      if (checkbox.checked) selectedPreviewIds.add(articleId);
      else selectedPreviewIds.delete(articleId);
      syncPreviewSelectionUI();
      schedulePersistAppState();
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
    on(locationSelect, 'change', function() {
      syncPreviewSelectionUI();
      if (previewData.length > 0) renderPreview();
      updatePreviewButtonLabel();
      schedulePersistAppState();
    });
    on(fromDateInput, 'change', function() {
      updatePreviewButtonLabel();
      schedulePersistAppState();
    });
    on(toDateInput, 'change', function() {
      updatePreviewButtonLabel();
      schedulePersistAppState();
    });

    function runSwipeAction(articleId, action) {
      var id = String(articleId);
      if (action === 'archive' && isArchiveSourceSelected()) {
        performCleanup('restore', true, [id]);
        return;
      }
      performCleanup(action, true, [id]);
    }

    async function runPlayerSwipeAction(queueId, action) {
      var idx = playerQueue.findIndex(function(item, qIdx) {
        return getPlayerQueueId(item, qIdx) === queueId;
      });
      if (idx < 0) return;
      await runPlayerItemAction(idx, action);
    }

    function handlePreviewPointerDown(evt, element) {
      if (
        evt.target &&
        evt.target.closest &&
        (evt.target.closest('.preview-open-link') || evt.target.closest('input[type="checkbox"]') || evt.target.closest('button'))
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

    function handlePlayerPointerDown(evt, element) {
      if (
        evt.target &&
        evt.target.closest &&
        (evt.target.closest('.player-queue-jump') || evt.target.closest('.player-queue-check') || evt.target.closest('input[type="checkbox"]') || evt.target.closest('button'))
      ) {
        return;
      }
      var parent = element.parentElement;
      var queueId = parent.dataset.queueId;
      playerSwipeStateByQueueId[queueId] = { startX: evt.clientX, deltaX: 0, pointerId: evt.pointerId, moved: false };
      element.style.transition = 'none';
      if (element.setPointerCapture) {
        element.setPointerCapture(evt.pointerId);
      }
    }
    window.handlePlayerPointerDown = handlePlayerPointerDown;

    function handlePlayerPointerMove(evt, element) {
      var parent = element.parentElement;
      var queueId = parent.dataset.queueId;
      var state = playerSwipeStateByQueueId[queueId];
      if (!state) return;
      if (state.pointerId !== evt.pointerId) return;
      state.deltaX = evt.clientX - state.startX;
      if (Math.abs(state.deltaX) > 8) state.moved = true;
      element.style.transform = 'translateX(' + Math.max(-120, Math.min(120, state.deltaX)) + 'px)';
    }
    window.handlePlayerPointerMove = handlePlayerPointerMove;

    async function finishPlayerSwipe(evt, element) {
      var parent = element.parentElement;
      var queueId = parent.dataset.queueId;
      var state = playerSwipeStateByQueueId[queueId];
      if (!state || state.pointerId !== evt.pointerId) return;
      element.style.transition = 'transform 0.15s ease';
      if (state.moved) parent.dataset.suppressClick = '1';
      if (state.deltaX <= -80) {
        element.style.transform = 'translateX(-120px)';
        setTimeout(function() { runPlayerSwipeAction(queueId, 'archive'); }, 120);
      } else if (state.deltaX >= 80) {
        element.style.transform = 'translateX(120px)';
        setTimeout(function() { runPlayerSwipeAction(queueId, 'delete'); }, 120);
      } else {
        element.style.transform = 'translateX(0px)';
      }
      delete playerSwipeStateByQueueId[queueId];
    }

    function handlePlayerPointerUp(evt, element) {
      finishPlayerSwipe(evt, element);
    }
    window.handlePlayerPointerUp = handlePlayerPointerUp;
    function handlePlayerPointerCancel(evt, element) {
      finishPlayerSwipe(evt, element);
    }
    window.handlePlayerPointerCancel = handlePlayerPointerCancel;

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
      var maxTabs = Number(settings.maxOpenTabs || 5);
      selected.slice(0, maxTabs).forEach(function(item) {
        if (item.url) {
          window.open(item.url, '_blank');
        }
      });
      if (selected.length > maxTabs) {
        showToast('Opened first ' + maxTabs + ' tabs (max tabs setting)', 'warning');
      }
    });

    on(playSelectedBtn, 'click', function() {
      var activeIds = new Set(getActiveSelectedIds());
      if (activeIds.size === 0) return;
      var selected = previewData.filter(function(item) { return activeIds.has(String(item.id)); });
      startPlayerWithItems(selected);
    });

    function ensurePlayerItemAndPlay(item) {
      if (!item) return;
      var itemId = String(item.id || '');
      if (!itemId) return;
      var selected = getSelectedPreviewItemsForPlayer().filter(function(qItem) {
        return String(qItem && qItem.id || '') !== itemId;
      });
      playerQueue = [item].concat(selected);
      playerEnabledIds = new Set(playerQueue.map(function(qItem, qIdx) { return getPlayerQueueId(qItem, qIdx); }));
      playerIndex = 0;
      playerSearch = '';
      playerSearchInput.value = '';
      setActiveTab('player', { push: true, syncPlayerFromSelection: false });
      loadPlayerIndex(0);
    }

    function getSelectedPreviewItemsForPlayer() {
      var activeIds = new Set(getActiveSelectedIds());
      if (activeIds.size === 0) return [];
      return previewData.filter(function(item) { return activeIds.has(String(item.id)); });
    }

    function refreshPlayerQueueFromPreviewSelection(opts) {
      var options = opts || {};
      var autoplay = options.autoplay !== false;
      var selected = getSelectedPreviewItemsForPlayer();
      if (!selected.length) return;
      var selectedIds = selected.map(function(item) { return String(item.id || ''); });
      var queueIds = playerQueue.map(function(item) { return String(item && item.id ? item.id : ''); });
      if (selectedIds.join('|') === queueIds.join('|') && playerQueue.length > 0) return;

      saveCurrentPlayerProgress();
      playerQueue = selected.slice();
      playerEnabledIds = new Set(playerQueue.map(function(item, idx) { return getPlayerQueueId(item, idx); }));
      playerSearch = '';
      playerSearchInput.value = '';
      var restoreId = playerLastItemId || '';
      var restoreIdx = playerQueue.findIndex(function(item, idx) { return getPlayerItemId(item, idx) === restoreId; });
      playerIndex = restoreIdx >= 0 ? restoreIdx : 0;
      renderPlayerQueue();
      renderPlayerText();
      if (autoplay) loadPlayerIndex(playerIndex);
    }

    function getPlayerItemId(item, idx) {
      return String(item && item.id ? item.id : 'item-' + idx);
    }

    function getCurrentPlayerItemId() {
      if (playerIndex < 0 || playerIndex >= playerQueue.length) return '';
      return getPlayerItemId(playerQueue[playerIndex], playerIndex);
    }

    function getCurrentPlayerQueueId() {
      if (playerIndex < 0 || playerIndex >= playerQueue.length) return '';
      return getPlayerQueueId(playerQueue[playerIndex], playerIndex);
    }

    function getPlayerItemText(item) {
      return String(
        (item && item.ttsFullText) ||
        (item && item.ttsPreview) ||
        (item && item.title) ||
        ''
      ).trim();
    }

    function splitTtsTextIntoChunks(fullText, maxChars, firstChunkChars, secondChunkChars) {
      var text = String(fullText || '').trim();
      var limit = Number(maxChars) > 500 ? Number(maxChars) : 12000;
      var firstLimit = Number(firstChunkChars) > 200 ? Math.min(limit, Number(firstChunkChars)) : limit;
      var secondLimit = Number(secondChunkChars) > 200 ? Math.min(limit, Number(secondChunkChars)) : limit;
      if (!text) return [''];
      var chunks = [];
      var pos = 0;
      while (pos < text.length) {
        var currentLimit = chunks.length === 0 ? firstLimit : (chunks.length === 1 ? secondLimit : limit);
        var end = Math.min(text.length, pos + currentLimit);
        if (end < text.length) {
          var boundary = text.lastIndexOf('\\n\\n', end);
          if (boundary <= pos + Math.floor(currentLimit * 0.6)) {
            boundary = text.lastIndexOf('. ', end);
          }
          if (boundary <= pos + Math.floor(currentLimit * 0.6)) {
            boundary = text.lastIndexOf(' ', end);
          }
          if (boundary > pos + 200) {
            end = boundary + 1;
          }
        }
        var chunk = text.slice(pos, end).trim();
        if (chunk) chunks.push(chunk);
        pos = end;
      }
      return chunks.length ? chunks : [''];
    }

    function getPlayerItemChunks(item) {
      if (!item || typeof item !== 'object') return [''];
      if (Array.isArray(item._ttsChunks) && item._ttsChunks.length > 0) {
        return item._ttsChunks;
      }
      item._ttsChunks = splitTtsTextIntoChunks(
        getPlayerItemText(item),
        CLIENT_TTS_SYNTH_CHUNK_CHARS,
        CLIENT_TTS_FIRST_CHUNK_CHARS,
        CLIENT_TTS_SECOND_CHUNK_CHARS
      );
      return item._ttsChunks;
    }

    function getChunkDurationMap(itemId) {
      if (!itemId) return {};
      if (!playerChunkDurationsByItemId[itemId] || typeof playerChunkDurationsByItemId[itemId] !== 'object') {
        playerChunkDurationsByItemId[itemId] = {};
      }
      return playerChunkDurationsByItemId[itemId];
    }

    function sumKnownChunkDurations(itemId) {
      var durationMap = getChunkDurationMap(itemId);
      return Object.keys(durationMap).reduce(function(sum, key) {
        var val = Number(durationMap[key] || 0);
        return sum + (Number.isFinite(val) && val > 0 ? val : 0);
      }, 0);
    }

    function getChunkOffsetSeconds(itemId, chunkIndex) {
      var durationMap = getChunkDurationMap(itemId);
      var offset = 0;
      for (var i = 0; i < chunkIndex; i++) {
        var dur = Number(durationMap[i] || 0);
        if (Number.isFinite(dur) && dur > 0) offset += dur;
      }
      return offset;
    }

    function resolvePlayerResumePoint(itemId, chunksLength) {
      var state = playerChunkStateByItemId[itemId];
      if (
        state &&
        Number.isFinite(state.chunkIndex) &&
        state.chunkIndex >= 0 &&
        state.chunkIndex < chunksLength
      ) {
        return {
          chunkIndex: state.chunkIndex,
          chunkTime: Number.isFinite(state.chunkTime) ? Math.max(0, state.chunkTime) : 0,
        };
      }
      var absolute = Number(playerProgressByItemId[itemId] || 0);
      if (!Number.isFinite(absolute) || absolute <= 0) {
        return { chunkIndex: 0, chunkTime: 0 };
      }
      var durationMap = getChunkDurationMap(itemId);
      var remaining = absolute;
      var chunkIndex = 0;
      while (chunkIndex < chunksLength - 1) {
        var dur = Number(durationMap[chunkIndex] || 0);
        if (!(Number.isFinite(dur) && dur > 0)) break;
        if (remaining < dur) break;
        remaining -= dur;
        chunkIndex += 1;
      }
      return {
        chunkIndex: chunkIndex,
        chunkTime: Math.max(0, remaining),
      };
    }

    function clearPlayerAudioSource() {
      if (playerAudio) {
        playerAudio.pause();
        playerAudio.removeAttribute('src');
        playerAudio.load();
      }
      if (playerAudioObjectUrl) {
        URL.revokeObjectURL(playerAudioObjectUrl);
        playerAudioObjectUrl = '';
      }
      setPlayerPlayPauseButtonState();
    }

    function setPlayerPlayPauseButtonState() {
      if (!playerPlayPauseBtn) return;
      var isPlaying = !!(playerAudio && playerAudio.src && !playerAudio.paused);
      var iconEl = playerPlayPauseBtn.querySelector ? playerPlayPauseBtn.querySelector('.control-icon') : null;
      if (iconEl) iconEl.textContent = isPlaying ? '⏸' : '▶';
      playerPlayPauseBtn.classList.toggle('is-playing', isPlaying);
      playerPlayPauseBtn.title = isPlaying ? 'Pause' : 'Play';
      if (playerPlayPauseBtn.setAttribute) {
        playerPlayPauseBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
      }
    }

    function syncPlayerQueueAfterProcessedIds(processedIds, opts) {
      if (!Array.isArray(processedIds) || processedIds.length === 0) return false;
      var options = opts || {};
      var removedSet = new Set(processedIds.map(function(id) { return String(id); }));
      var currentPlayingId = String(playerLoadedItemId || getCurrentPlayerItemId() || '');
      var removedCurrent = currentPlayingId && removedSet.has(currentPlayingId);
      if (removedCurrent) {
        clearPlayerAudioSource();
        playerLoadedItemId = '';
        playerLoadedChunkIndex = 0;
        playerStatus.textContent = 'Playback stopped: current item was removed.';
      }
      if (!playerQueue.length) {
        setPlayerPlayPauseButtonState();
        return removedCurrent;
      }
      playerQueue = playerQueue.filter(function(item) {
        return !removedSet.has(String(item && item.id ? item.id : ''));
      });
      playerEnabledIds = new Set(playerQueue.map(function(item, idx) { return getPlayerQueueId(item, idx); }));
      if (playerQueue.length === 0) {
        playerIndex = 0;
        renderPlayerQueue();
        renderPlayerText();
        schedulePersistAppState();
        return removedCurrent;
      }
      if (playerIndex >= playerQueue.length) playerIndex = playerQueue.length - 1;
      renderPlayerQueue();
      renderPlayerText();
      if (!removedCurrent && options.autoloadCurrent) {
        loadPlayerIndex(playerIndex, { autoplay: false });
      }
      schedulePersistAppState();
      return removedCurrent;
    }

    function getPlayerChunkCacheKey(itemId, chunkIndex) {
      return String(itemId || '') + '|' + String(chunkIndex || 0) + '|' + (settings.mockTts ? 'mock' : 'real') + '|' + String(settings.ttsVoice || 'alloy');
    }

    async function fetchPlayerChunkBlob(item, itemId, chunkText, chunkIndex) {
      var key = getPlayerChunkCacheKey(itemId, chunkIndex);
      if (playerChunkBlobByKey[key]) return playerChunkBlobByKey[key];
      if (playerChunkFetchByKey[key]) return playerChunkFetchByKey[key];
      playerChunkFetchByKey[key] = (async function() {
        var res = await fetch('/api/audio/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articleId: item.id,
            text: chunkText,
            voice: settings.ttsVoice || 'alloy',
            speed: 1,
            chunkIndex: chunkIndex,
            mock: !!settings.mockTts,
          }),
        });
        var ttsMockHeader = res.headers.get('X-TTS-Mock');
        if (!res.ok) {
          var errMsg = 'Audio failed (' + res.status + ')';
          try {
            var errJson = await res.json();
            if (errJson && errJson.error) errMsg = errJson.error;
          } catch (e) {
            try {
              var errText = await res.text();
              if (errText) errMsg = errText;
            } catch (e2) {}
          }
          throw new Error(errMsg);
        }
        var blob = await res.blob();
        var packet = {
          blob: blob,
          isMock: ttsMockHeader === '1',
          isReal: ttsMockHeader === '0',
          key: key,
        };
        playerChunkBlobByKey[key] = packet;
        return packet;
      })().finally(function() {
        delete playerChunkFetchByKey[key];
      });
      return playerChunkFetchByKey[key];
    }

    function prefetchPlayerChunk(item, itemId, chunks, chunkIndex) {
      if (!item || !chunks || chunkIndex < 0 || chunkIndex >= chunks.length) return;
      var chunkText = chunks[chunkIndex] || '';
      if (!chunkText.trim()) return;
      fetchPlayerChunkBlob(item, itemId, chunkText, chunkIndex).catch(function() {});
    }

    function snapshotPreviewItemsForStorage(items) {
      if (!Array.isArray(items)) return [];
      return items.map(function(item) {
        return {
          id: item && item.id,
          title: item && item.title ? String(item.title) : '',
          author: item && item.author ? String(item.author) : '',
          site: item && item.site ? String(item.site) : '',
          url: item && item.url ? String(item.url) : '',
          thumbnail: item && item.thumbnail ? String(item.thumbnail) : '',
          savedAt: item && item.savedAt ? String(item.savedAt) : '',
          publishedAt: item && item.publishedAt ? String(item.publishedAt) : '',
          searchable: item && item.searchable ? String(item.searchable) : '',
          ttsPreview: item && item.ttsPreview ? String(item.ttsPreview) : '',
          ttsFullText: item && item.ttsFullText ? String(item.ttsFullText).slice(0, 48000) : '',
        };
      });
    }

    function snapshotDeletedItemsForStorage(items) {
      if (!Array.isArray(items)) return [];
      return items.map(function(item) {
        return {
          id: item && item.id,
          title: item && item.title ? String(item.title) : '',
          author: item && item.author ? String(item.author) : '',
          site: item && item.site ? String(item.site) : '',
          url: item && item.url ? String(item.url) : '',
          thumbnail: item && item.thumbnail ? String(item.thumbnail) : '',
          savedAt: item && item.savedAt ? String(item.savedAt) : '',
          publishedAt: item && item.publishedAt ? String(item.publishedAt) : '',
          deletedAt: item && item.deletedAt ? String(item.deletedAt) : '',
        };
      });
    }

    function getPlayerQueueScrollTop() {
      var scroller = playerQueueEl ? playerQueueEl.querySelector('.player-queue-scroll') : null;
      return scroller ? Math.max(0, Number(scroller.scrollTop || 0)) : 0;
    }

    function persistAppState() {
      try {
        var payload = {
          tab: currentTabName || 'cleanup',
          location: locationSelect.value || '',
          fromDate: fromDateInput.value || '',
          toDate: toDateInput.value || '',
          activeDateShortcutTarget: activeDateShortcutTarget || 'to',
          lastQuery: lastQuery || null,
          lastPreviewLoadedAt: Number(lastPreviewLoadedAt || 0),
          currentCount: Number(currentCount || 0),
          previewData: snapshotPreviewItemsForStorage(previewData),
          selectedPreviewIds: Array.from(selectedPreviewIds || []),
          previewPage: Number(previewPage || 1),
          previewSearch: previewSearch || '',
          previewSortMode: previewSortMode || 'added',
          deletedItems: snapshotDeletedItemsForStorage(deletedItems),
          selectedDeletedIds: Array.from(selectedDeletedIds || []),
          deletedSearch: deletedSearch || '',
          deletedSortMode: deletedSortMode || 'deleted',
          playerQueue: snapshotPreviewItemsForStorage(playerQueue),
          playerIndex: Number(playerIndex || 0),
          playerEnabledIds: Array.from(playerEnabledIds || []),
          playerSearch: playerSearch || '',
          playerShowText: !!playerShowText,
          playerSpeed: Number(parseFloat(playerSpeedSelect && playerSpeedSelect.value || '1')),
          scroll: {
            mainPane: Number(mainPane && mainPane.scrollTop || 0),
            previewList: Number(previewList && previewList.scrollTop || 0),
            deletedList: Number(deletedList && deletedList.scrollTop || 0),
            playerQueue: getPlayerQueueScrollTop(),
          },
        };
        localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(payload));
      } catch (err) {}
    }

    function schedulePersistAppState() {
      if (appStatePersistTimer) return;
      appStatePersistTimer = setTimeout(function() {
        appStatePersistTimer = null;
        persistAppState();
      }, 250);
    }

    function restoreAppState() {
      try {
        var raw = localStorage.getItem(APP_STATE_STORAGE_KEY);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
      } catch (err) {
        return null;
      }
    }

    function persistPlayerState() {
      try {
        var payload = {
          progressByItemId: playerProgressByItemId,
          durationByItemId: playerDurationByItemId,
          chunkDurationsByItemId: playerChunkDurationsByItemId,
          chunkStateByItemId: playerChunkStateByItemId,
          lastItemId: playerLastItemId || getCurrentPlayerItemId() || '',
        };
        localStorage.setItem(PLAYER_STATE_STORAGE_KEY, JSON.stringify(payload));
      } catch (err) {}
    }

    function schedulePersistPlayerState() {
      if (playerStatePersistTimer) return;
      playerStatePersistTimer = setTimeout(function() {
        playerStatePersistTimer = null;
        persistPlayerState();
      }, 250);
    }

    function restorePlayerState() {
      try {
        var raw = localStorage.getItem(PLAYER_STATE_STORAGE_KEY);
        if (!raw) return;
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.progressByItemId && typeof parsed.progressByItemId === 'object') {
            playerProgressByItemId = parsed.progressByItemId;
          }
          if (parsed.durationByItemId && typeof parsed.durationByItemId === 'object') {
            playerDurationByItemId = parsed.durationByItemId;
          }
          if (parsed.chunkDurationsByItemId && typeof parsed.chunkDurationsByItemId === 'object') {
            playerChunkDurationsByItemId = parsed.chunkDurationsByItemId;
          }
          if (parsed.chunkStateByItemId && typeof parsed.chunkStateByItemId === 'object') {
            playerChunkStateByItemId = parsed.chunkStateByItemId;
          }
          if (typeof parsed.lastItemId === 'string') {
            playerLastItemId = parsed.lastItemId;
          }
        }
      } catch (err) {}
    }

    function applyRestoredAppState(state) {
      if (!state || typeof state !== 'object') return;
      var hasLocation = Array.from(locationSelect.options || []).some(function(opt) {
        return opt && opt.value === state.location;
      });
      if (hasLocation) locationSelect.value = state.location;
      if (typeof state.fromDate === 'string') fromDateInput.value = state.fromDate;
      if (typeof state.toDate === 'string') toDateInput.value = state.toDate;
      if (state.activeDateShortcutTarget === 'from' || state.activeDateShortcutTarget === 'to') {
        activeDateShortcutTarget = state.activeDateShortcutTarget;
      }

      if (Array.isArray(state.previewData)) previewData = snapshotPreviewItemsForStorage(state.previewData);
      if (Array.isArray(state.selectedPreviewIds)) {
        var validPreviewIds = new Set(previewData.map(function(item) { return String(item.id); }));
        selectedPreviewIds = new Set(state.selectedPreviewIds.map(String).filter(function(id) { return validPreviewIds.has(id); }));
      }
      if (typeof state.previewPage === 'number' && state.previewPage > 0) previewPage = Math.floor(state.previewPage);
      if (typeof state.previewSearch === 'string') {
        previewSearch = state.previewSearch.toLowerCase();
        previewSearchInput.value = state.previewSearch;
      }
      if (state.previewSortMode === 'added' || state.previewSortMode === 'published') {
        previewSortMode = state.previewSortMode;
      }
      if (typeof state.currentCount === 'number') currentCount = Math.max(0, Math.floor(state.currentCount));
      if (typeof state.lastQuery === 'string' && state.lastQuery) lastQuery = state.lastQuery;
      if (typeof state.lastPreviewLoadedAt === 'number' && Number.isFinite(state.lastPreviewLoadedAt)) {
        lastPreviewLoadedAt = Math.max(0, Math.floor(state.lastPreviewLoadedAt));
      }

      if (Array.isArray(state.deletedItems)) deletedItems = snapshotDeletedItemsForStorage(state.deletedItems);
      if (Array.isArray(state.selectedDeletedIds)) {
        var validDeletedIds = new Set(deletedItems.map(getDeletedItemKey));
        selectedDeletedIds = new Set(state.selectedDeletedIds.map(String).filter(function(id) { return validDeletedIds.has(id); }));
      }
      if (typeof state.deletedSearch === 'string') {
        deletedSearch = state.deletedSearch.toLowerCase();
        deletedSearchInput.value = state.deletedSearch;
      }
      if (state.deletedSortMode === 'added' || state.deletedSortMode === 'published' || state.deletedSortMode === 'deleted') {
        deletedSortMode = state.deletedSortMode;
      }

      if (Array.isArray(state.playerQueue) && state.playerQueue.length > 0) {
        playerQueue = snapshotPreviewItemsForStorage(state.playerQueue);
        playerEnabledIds = Array.isArray(state.playerEnabledIds)
          ? new Set(state.playerEnabledIds.map(String))
          : new Set(playerQueue.map(function(item, idx) { return getPlayerQueueId(item, idx); }));
        if (typeof state.playerIndex === 'number') {
          playerIndex = Math.max(0, Math.min(playerQueue.length - 1, Math.floor(state.playerIndex)));
        } else {
          playerIndex = 0;
        }
        if (typeof state.playerSearch === 'string') {
          playerSearch = state.playerSearch.toLowerCase();
          playerSearchInput.value = state.playerSearch;
        }
        playerShowText = !!state.playerShowText;
      }
      var restoredSpeed = Number(state.playerSpeed || 0);
      if (restoredSpeed > 0 && playerSpeedSelect) {
        var hasSpeed = Array.from(playerSpeedSelect.options || []).some(function(opt) {
          return opt && Number(opt.value) === restoredSpeed;
        });
        if (hasSpeed) playerSpeedSelect.value = String(restoredSpeed);
      }

      itemCountEl.textContent = currentCount;
      locationDisplay.textContent = locationSelect.value || '-';
      previewTopControls.style.display = previewData.length > 0 ? 'flex' : 'none';
      previewBottomControls.style.display = previewData.length > previewPageSize ? 'flex' : 'none';
      renderPreview();
      updateDeletedBadge();
      renderDeletedItems();
      renderPlayerQueue();
      renderPlayerText();

      var normalizedPath = normalizePath(window.location.pathname);
      var hasExplicitRoute = Object.prototype.hasOwnProperty.call(ROUTE_TABS, normalizedPath);
      var pathTab = hasExplicitRoute ? ROUTE_TABS[normalizedPath] : '';
      var restoredTab = typeof state.tab === 'string' ? state.tab : '';
      var tabToUse = pathTab || (TAB_ROUTES[restoredTab] ? restoredTab : 'cleanup');
      setActiveTab(tabToUse, { push: false, syncPlayerFromSelection: false });

      if (state.scroll && typeof state.scroll === 'object') {
        setTimeout(function() {
          if (mainPane) mainPane.scrollTop = Number(state.scroll.mainPane || 0);
          if (previewList) previewList.scrollTop = Number(state.scroll.previewList || 0);
          if (deletedList) deletedList.scrollTop = Number(state.scroll.deletedList || 0);
          var scroller = playerQueueEl ? playerQueueEl.querySelector('.player-queue-scroll') : null;
          if (scroller) scroller.scrollTop = Number(state.scroll.playerQueue || 0);
        }, 0);
      }
      schedulePersistAppState();
    }

    function saveCurrentPlayerProgress() {
      if (!playerAudio || !playerAudio.src) return;
      var itemId = playerLoadedItemId || getCurrentPlayerItemId();
      if (!itemId) return;
      var current = Number(playerAudio.currentTime || 0);
      if (Number.isFinite(current) && current >= 0) {
        var chunkOffset = getChunkOffsetSeconds(itemId, playerLoadedChunkIndex || 0);
        var absolute = chunkOffset + current;
        playerProgressByItemId[itemId] = absolute;
        playerChunkStateByItemId[itemId] = {
          chunkIndex: playerLoadedChunkIndex || 0,
          chunkTime: current,
        };
        playerDurationByItemId[itemId] = Math.max(
          Number(playerDurationByItemId[itemId] || 0),
          sumKnownChunkDurations(itemId),
          absolute
        );
        playerLastItemId = itemId;
        schedulePersistPlayerState();
        updatePlayerRowProgressUI(itemId);
        schedulePersistAppState();
      }
    }

    function updatePlayerRowProgressUI(itemId) {
      var item = itemId || (playerLoadedItemId || getCurrentPlayerItemId());
      if (!item) return;
      var queueIdx = playerQueue.findIndex(function(it, idx) { return getPlayerItemId(it, idx) === item; });
      var queueItem = queueIdx >= 0 ? playerQueue[queueIdx] : null;
      var progressSeconds = Number(playerProgressByItemId[item] || 0);
      var durationSeconds = queueItem
        ? getEstimatedTotalDurationSeconds(queueItem, item)
        : Math.max(Number(playerDurationByItemId[item] || 0), sumKnownChunkDurations(item));
      var progressPct = 0;
      if (durationSeconds > 0) {
        progressPct = Math.max(0, Math.min(100, (progressSeconds / durationSeconds) * 100));
      } else if (progressSeconds > 0) {
        progressPct = Math.max(0, Math.min(100, (progressSeconds / 60) * 100));
      }
      playerQueueEl.querySelectorAll('.player-row-progress-fill').forEach(function(el) {
        if (String(el.dataset.itemId || '') === item) {
          el.style.width = progressPct.toFixed(1) + '%';
        }
      });
    }

    function buildPlayerSearchText(item) {
      return [
        item && item.title ? item.title : '',
        item && item.author ? item.author : '',
        item && item.site ? item.site : '',
        item && item.url ? item.url : '',
      ].join(' ').toLowerCase();
    }

    function getFilteredPlayerIndices() {
      var term = (playerSearch || '').trim().toLowerCase();
      var indices = [];
      for (var i = 0; i < playerQueue.length; i++) {
        if (!term || buildPlayerSearchText(playerQueue[i]).includes(term)) {
          indices.push(i);
        }
      }
      return indices;
    }

    function estimateChunkDurationSeconds(item, itemId, chunkIndex, chunks) {
      var durationMap = getChunkDurationMap(itemId);
      var known = Number(durationMap[chunkIndex] || 0);
      if (Number.isFinite(known) && known > 0) return known;
      var knownChars = 0;
      var knownSeconds = 0;
      for (var i = 0; i < chunks.length; i++) {
        var d = Number(durationMap[i] || 0);
        if (Number.isFinite(d) && d > 0) {
          knownSeconds += d;
          knownChars += String(chunks[i] || '').length;
        }
      }
      var charsPerSecond = knownSeconds > 0 && knownChars > 0 ? (knownChars / knownSeconds) : 16;
      charsPerSecond = Math.max(10, Math.min(26, charsPerSecond));
      var chunkChars = String(chunks[chunkIndex] || '').length;
      if (chunkChars <= 0) return 1;
      return Math.max(1, chunkChars / charsPerSecond);
    }

    function getEstimatedTotalDurationSeconds(item, itemId) {
      var chunks = getPlayerItemChunks(item);
      if (!chunks.length) return 0;
      var total = 0;
      for (var i = 0; i < chunks.length; i++) {
        total += estimateChunkDurationSeconds(item, itemId, i, chunks);
      }
      return Math.max(total, Number(playerDurationByItemId[itemId] || 0), sumKnownChunkDurations(itemId));
    }

    function getEstimatedSeekPoint(item, itemId, targetSeconds) {
      var chunks = getPlayerItemChunks(item);
      if (!chunks.length) return { chunkIndex: 0, chunkTime: 0, total: 0 };
      var remaining = Math.max(0, targetSeconds);
      for (var i = 0; i < chunks.length; i++) {
        var duration = estimateChunkDurationSeconds(item, itemId, i, chunks);
        if (remaining <= duration || i === chunks.length - 1) {
          return {
            chunkIndex: i,
            chunkTime: Math.max(0, Math.min(duration - 0.1, remaining)),
            total: getEstimatedTotalDurationSeconds(item, itemId),
          };
        }
        remaining -= duration;
      }
      return { chunkIndex: chunks.length - 1, chunkTime: 0, total: getEstimatedTotalDurationSeconds(item, itemId) };
    }

    function seekPlayerQueueRowProgress(queueIdx, ratio) {
      var idx = Number(queueIdx);
      if (!Number.isFinite(idx) || idx < 0 || idx >= playerQueue.length) return;
      var item = playerQueue[idx];
      var itemId = getPlayerItemId(item, idx);
      var total = getEstimatedTotalDurationSeconds(item, itemId);
      if (!(total > 0)) return;
      var clampedRatio = Math.max(0, Math.min(1, Number(ratio || 0)));
      var targetSeconds = total * clampedRatio;
      var seekPoint = getEstimatedSeekPoint(item, itemId, targetSeconds);
      playerProgressByItemId[itemId] = targetSeconds;
      playerChunkStateByItemId[itemId] = {
        chunkIndex: seekPoint.chunkIndex,
        chunkTime: seekPoint.chunkTime,
      };
      schedulePersistPlayerState();
      updatePlayerRowProgressUI(itemId);
      if (idx === playerIndex) {
        var shouldAutoplay = !!(playerAudio && playerAudio.src && !playerAudio.paused);
        loadPlayerIndex(idx, { chunkIndex: seekPoint.chunkIndex, seekSeconds: seekPoint.chunkTime, autoplay: shouldAutoplay });
      } else {
        renderPlayerQueue();
      }
      schedulePersistAppState();
    }

    function renderPlayerQueue() {
      if (playerQueue.length === 0) {
        playerQueueEl.innerHTML = '<div class="history-item">No queued items.</div>';
        playerCurrentHeader.style.display = 'none';
        playerCurrentTitle.textContent = '';
        playerCurrentAuthor.textContent = '';
        playerStatus.textContent = 'Queue is empty.';
        playerTtsModeEl.style.display = settings.mockTts ? 'block' : 'none';
        playerTtsModeEl.textContent = settings.mockTts ? 'TTS mode: mock clip' : '';
        playerLoadedItemId = '';
        playerCurrentText.style.display = 'none';
        playerCurrentText.textContent = '';
        playerTextToggleBtn.textContent = 'Text';
        playerSelectAll.checked = false;
        playerSelectAll.indeterminate = false;
        playerSelectAll.disabled = true;
        updateRailSelectionBadges();
        schedulePersistAppState();
        return;
      }
      playerSelectAll.disabled = false;
      playerStatus.textContent = '';
      var currentItem = playerQueue[playerIndex] || {};
      playerCurrentHeader.style.display = 'flex';
      playerCurrentTitle.textContent = currentItem.title || 'Untitled';
      playerCurrentAuthor.textContent = currentItem.author ? ('By ' + currentItem.author) : (currentItem.site || '');
      if (currentItem.thumbnail) {
        playerCurrentThumb.src = currentItem.thumbnail;
        playerCurrentThumb.style.display = 'inline-flex';
        playerCurrentThumbFallback.style.display = 'none';
      } else {
        playerCurrentThumb.removeAttribute('src');
        playerCurrentThumb.style.display = 'none';
        playerCurrentThumbFallback.style.display = 'inline-flex';
      }
      var filteredIndices = getFilteredPlayerIndices();
      if (filteredIndices.length === 0) {
        playerQueueEl.innerHTML = '<div class="history-item">No queued items match this filter.</div>';
        playerSelectAll.checked = false;
        playerSelectAll.indeterminate = false;
        updateRailSelectionBadges();
        schedulePersistAppState();
        return;
      }

      var filteredSelected = filteredIndices.filter(function(idx) {
        return playerEnabledIds.has(getPlayerQueueId(playerQueue[idx], idx));
      }).length;
      playerSelectAll.checked = filteredSelected > 0 && filteredSelected === filteredIndices.length;
      playerSelectAll.indeterminate = filteredSelected > 0 && filteredSelected < filteredIndices.length;

      playerQueueEl.innerHTML = '<div class="player-queue-scroll">' + filteredIndices.map(function(idx) {
        var item = playerQueue[idx];
        var isCurrent = idx === playerIndex;
        var prefix = isCurrent ? '▶ ' : '';
        var queueId = getPlayerQueueId(item, idx);
        var itemId = getPlayerItemId(item, idx);
        var checked = playerEnabledIds.has(queueId) ? ' checked' : '';
        var itemClass = isCurrent ? 'history-item current player-queue-row' : 'history-item player-queue-row';
        var progressSeconds = Number(playerProgressByItemId[itemId] || 0);
        var durationSeconds = getEstimatedTotalDurationSeconds(item, itemId);
        var progressPct = 0;
        if (durationSeconds > 0) {
          progressPct = Math.max(0, Math.min(100, (progressSeconds / durationSeconds) * 100));
        } else if (progressSeconds > 0) {
          progressPct = Math.max(0, Math.min(100, (progressSeconds / 60) * 100));
        }
        return '<div class="swipe-item ' + itemClass + '" data-queue-id="' + escapeHtml(queueId) + '" data-queue-idx="' + idx + '">' +
          '<div class="swipe-bg right">Delete</div>' +
          '<div class="swipe-bg left">Archive</div>' +
          '<div class="article-item swipe-content"' +
          ' onpointerdown="handlePlayerPointerDown(event,this)"' +
          ' onpointermove="handlePlayerPointerMove(event,this)"' +
          ' onpointerup="handlePlayerPointerUp(event,this)"' +
          ' onpointercancel="handlePlayerPointerCancel(event,this)">' +
          '<label class="checkbox-label" style="gap:0.35rem;">' +
          '<input type="checkbox" class="player-queue-check" data-queue-id="' + escapeHtml(queueId) + '"' + checked + '>' +
          '</label>' +
          (item.thumbnail
            ? '<img class="preview-thumb" src="' + escapeHtml(item.thumbnail) + '" alt="" loading="lazy" referrerpolicy="no-referrer">'
            : '<span class="preview-thumb-fallback">No image</span>') +
          '<div class="article-info">' +
          '<div class="title-row">' +
          '<div class="title-left"><span class="webpage-icon" aria-hidden="true">🌐</span>' +
          '<button type="button" class="text-preview-toggle player-queue-jump" data-queue-idx="' + idx + '" style="text-align:left; width:100%;">' + escapeHtml(prefix + (item.title || 'Untitled')) + (isCurrent ? '<span class="now-playing-badge">Now Playing</span>' : '') + '</button>' +
          '</div>' +
          '<span class="article-date-right">Added ' + escapeHtml(formatDate(item.savedAt || '')) + '</span>' +
          '</div>' +
          '<div class="article-meta"><span class="article-site">' + escapeHtml(item.site || '') + '</span>' + (item.author ? ' by ' + escapeHtml(item.author) : '') + '</div>' +
          '<div class="player-row-progress" data-queue-idx="' + idx + '" data-item-id="' + escapeHtml(itemId) + '" title="' + Math.round(progressSeconds) + 's listened / ~' + Math.round(durationSeconds) + 's">' +
          '<div class="player-row-progress-fill" data-item-id="' + escapeHtml(itemId) + '" style="width:' + progressPct.toFixed(1) + '%;"></div>' +
          '</div>' +
          '</div>' +
          '</div>' +
          '</div>';
      }).join('') + '</div>';
      playerQueueEl.querySelectorAll('.player-queue-check').forEach(function(cb) {
        on(cb, 'change', function() {
          var queueId = String(cb.dataset.queueId || '');
          if (!queueId) return;
          if (cb.checked) playerEnabledIds.add(queueId);
          else playerEnabledIds.delete(queueId);
          if (playerEnabledIds.size === 0) {
            cb.checked = true;
            playerEnabledIds.add(queueId);
            showToast('At least one item must remain selected', 'warning');
          }
          renderPlayerQueue();
        });
      });
      playerQueueEl.querySelectorAll('.player-queue-jump').forEach(function(btn) {
        on(btn, 'click', function() {
          var idx = parseInt(btn.dataset.queueIdx, 10);
          if (Number.isFinite(idx)) loadPlayerIndex(idx);
        });
      });
      playerQueueEl.querySelectorAll('.player-queue-row').forEach(function(row) {
        on(row, 'click', function(evt) {
          if (evt.target && evt.target.closest && evt.target.closest('.player-queue-check')) return;
          if (row.dataset.suppressClick === '1') {
            row.dataset.suppressClick = '';
            return;
          }
          var jumpBtn = row.querySelector('.player-queue-jump');
          if (!jumpBtn) return;
          var idx = parseInt(jumpBtn.dataset.queueIdx, 10);
          if (Number.isFinite(idx)) loadPlayerIndex(idx);
        });
      });
      playerQueueEl.querySelectorAll('.player-row-progress').forEach(function(el) {
        on(el, 'click', function(evt) {
          evt.preventDefault();
          evt.stopPropagation();
          if (!el.getBoundingClientRect) return;
          var rect = el.getBoundingClientRect();
          var rel = rect.width > 0 ? (evt.clientX - rect.left) / rect.width : 0;
          var idx = parseInt(el.dataset.queueIdx, 10);
          seekPlayerQueueRowProgress(idx, rel);
        });
      });
      updateRailSelectionBadges();
      schedulePersistAppState();
    }

    function renderPlayerText() {
      if (playerQueue.length === 0) {
        playerCurrentText.style.display = 'none';
        playerCurrentText.textContent = '';
        playerTextToggleBtn.textContent = 'Text';
        schedulePersistAppState();
        return;
      }
      var item = playerQueue[playerIndex] || {};
      playerCurrentText.textContent = item.ttsFullText || item.ttsPreview || 'No extracted text available.';
      playerCurrentText.style.display = playerShowText ? 'block' : 'none';
      playerTextToggleBtn.textContent = playerShowText ? 'Hide text' : 'Text';
      schedulePersistAppState();
    }

    async function loadPlayerIndex(idx, options) {
      if (idx < 0 || idx >= playerQueue.length) return;
      var opts = options || {};
      var loadToken = ++playerLoadToken;

      saveCurrentPlayerProgress();
      playerIndex = idx;
      renderPlayerQueue();
      renderPlayerText();

      var item = playerQueue[playerIndex];
      var itemId = getPlayerItemId(item, playerIndex);
      var chunks = getPlayerItemChunks(item);
      var defaultResume = resolvePlayerResumePoint(itemId, chunks.length);
      var chunkIndex = Number.isFinite(opts.chunkIndex) ? Math.max(0, Math.min(chunks.length - 1, parseInt(opts.chunkIndex, 10))) : defaultResume.chunkIndex;
      var resumeAt = Number.isFinite(opts.seekSeconds) ? Math.max(0, Number(opts.seekSeconds)) : defaultResume.chunkTime;
      var chunkText = chunks[chunkIndex] || '';
      if (!chunkText.trim()) {
        chunkText = (item && item.title) ? String(item.title) : 'Untitled';
      }

      playerLastItemId = itemId;
      playerLoadedItemId = itemId;
      playerLoadedChunkIndex = chunkIndex;
      playerChunkStateByItemId[itemId] = {
        chunkIndex: chunkIndex,
        chunkTime: resumeAt,
      };
      schedulePersistPlayerState();
      schedulePersistAppState();
      setPlayerPlayPauseButtonState();

      try {
        playerStatus.textContent = 'Loading audio chunk ' + (chunkIndex + 1) + ' of ' + chunks.length + '...';
        clearPlayerAudioSource();
        var packet = await fetchPlayerChunkBlob(item, itemId, chunkText, chunkIndex);
        if (loadToken !== playerLoadToken) return;
        if (packet.isMock) {
          playerTtsModeEl.style.display = 'block';
          playerTtsModeEl.textContent = 'TTS mode: mock clip';
          if (!settings.mockTts) {
            showToast('Server returned mock TTS while mock mode is off. Check settings/save state.', 'warning');
          }
        } else {
          playerTtsModeEl.style.display = 'none';
          playerTtsModeEl.textContent = '';
        }
        if (loadToken !== playerLoadToken) return;
        playerAudioObjectUrl = URL.createObjectURL(packet.blob);
        playerAudio.src = playerAudioObjectUrl;
        playerAudio.playbackRate = parseFloat(playerSpeedSelect.value || '1');
        await new Promise(function(resolve) {
          var applySeek = function() {
            var duration = Number(playerAudio.duration || 0);
            if (duration > 0) {
              var durationMap = getChunkDurationMap(itemId);
              durationMap[chunkIndex] = duration;
              playerDurationByItemId[itemId] = Math.max(Number(playerDurationByItemId[itemId] || 0), sumKnownChunkDurations(itemId));
            }
            var target = duration > 0 ? Math.min(resumeAt, Math.max(0, duration - 0.1)) : resumeAt;
            try { playerAudio.currentTime = Math.max(0, target); } catch (e) {}
            resolve();
          };
          if (playerAudio.readyState >= 1) {
            applySeek();
          } else {
            playerAudio.addEventListener('loadedmetadata', applySeek, { once: true });
          }
        });
        if (loadToken !== playerLoadToken) return;
        if (opts.autoplay !== false) {
          await playerAudio.play();
        } else {
          setPlayerPlayPauseButtonState();
        }
        prefetchPlayerChunk(item, itemId, chunks, chunkIndex + 1);
        renderPlayerQueue();
      } catch (err) {
        if (loadToken !== playerLoadToken) return;
        playerStatus.textContent = err.message || 'Audio load failed';
        playerTtsModeEl.style.display = 'block';
        playerTtsModeEl.textContent = 'TTS mode: error';
        setPlayerPlayPauseButtonState();
        showToast(playerStatus.textContent, 'error');
      }
    }

    function startPlayerWithItems(items) {
      if (!Array.isArray(items) || items.length === 0) return;
      playerQueue = items.slice();
      playerEnabledIds = new Set(playerQueue.map(function(item, idx) { return getPlayerQueueId(item, idx); }));
      var restoreId = playerLastItemId || '';
      var restoreIdx = playerQueue.findIndex(function(item, idx) { return getPlayerItemId(item, idx) === restoreId; });
      playerIndex = restoreIdx >= 0 ? restoreIdx : 0;
      playerShowText = false;
      playerSearch = '';
      playerSearchInput.value = '';
      setActiveTab('player', { push: true });
      loadPlayerIndex(playerIndex);
    }

    function getPlayerQueueId(item, idx) {
      return String(item && item.id ? item.id : 'item-' + idx) + ':' + idx;
    }

    function findNextPlayableIndex(fromIdx) {
      for (var i = fromIdx + 1; i < playerQueue.length; i++) {
        if (playerEnabledIds.has(getPlayerQueueId(playerQueue[i], i))) return i;
      }
      return -1;
    }

    function findPreviousPlayableIndex(fromIdx) {
      for (var i = fromIdx - 1; i >= 0; i--) {
        if (playerEnabledIds.has(getPlayerQueueId(playerQueue[i], i))) return i;
      }
      return -1;
    }

    function removePlayerQueueIndex(idx) {
      if (idx < 0 || idx >= playerQueue.length) return;
      playerQueue.splice(idx, 1);
      playerEnabledIds = new Set(playerQueue.map(function(item, qIdx) { return getPlayerQueueId(item, qIdx); }));
      if (playerQueue.length === 0) {
        playerIndex = 0;
        clearPlayerAudioSource();
        playerLoadedItemId = '';
        playerLoadedChunkIndex = 0;
        renderPlayerQueue();
        renderPlayerText();
        return;
      }
      if (idx < playerIndex) playerIndex -= 1;
      if (playerIndex >= playerQueue.length) playerIndex = playerQueue.length - 1;
    }

    async function runPlayerItemAction(idx, action) {
      var item = playerQueue[idx];
      if (!item || !item.id) return false;
      var result = await performCleanup(action, true, [String(item.id)]);
      if (!result || !result.ok) return false;
      syncPlayerQueueAfterProcessedIds(result.processedIds || [String(item.id)]);
      return true;
    }

    on(playerPrevBtn, 'click', function() {
      var prevIdx = findPreviousPlayableIndex(playerIndex);
      if (prevIdx >= 0) loadPlayerIndex(prevIdx);
    });
    on(playerNextBtn, 'click', function() {
      var nextIdx = findNextPlayableIndex(playerIndex);
      if (nextIdx >= 0) loadPlayerIndex(nextIdx);
    });
    on(playerPlayPauseBtn, 'click', function() {
      if (!playerAudio.src) return;
      if (playerAudio.paused) playerAudio.play();
      else playerAudio.pause();
    });
    on(playerBackBtn, 'click', function() {
      playerAudio.currentTime = Math.max(0, playerAudio.currentTime - settings.audioBackSeconds);
    });
    on(playerForwardBtn, 'click', function() {
      playerAudio.currentTime = Math.min(playerAudio.duration || Infinity, playerAudio.currentTime + settings.audioForwardSeconds);
    });
    on(playerSpeedSelect, 'change', function() {
      var speed = parseFloat(playerSpeedSelect.value || '1');
      playerAudio.playbackRate = speed;
      schedulePersistAppState();
    });
    on(playerTextToggleBtn, 'click', function() {
      playerShowText = !playerShowText;
      renderPlayerText();
    });
    on(playerSelectAll, 'change', function() {
      var filteredIndices = getFilteredPlayerIndices();
      if (filteredIndices.length === 0) return;
      var shouldSelectAll = filteredIndices.some(function(idx) {
        return !playerEnabledIds.has(getPlayerQueueId(playerQueue[idx], idx));
      });
      filteredIndices.forEach(function(idx) {
        var queueId = getPlayerQueueId(playerQueue[idx], idx);
        if (shouldSelectAll) playerEnabledIds.add(queueId);
        else playerEnabledIds.delete(queueId);
      });
      if (playerEnabledIds.size === 0) {
        var currentQueueId = getCurrentPlayerQueueId();
        if (currentQueueId) playerEnabledIds.add(currentQueueId);
      }
      renderPlayerQueue();
    });
    on(playerSearchInput, 'input', function() {
      playerSearch = String(playerSearchInput.value || '').trim().toLowerCase();
      renderPlayerQueue();
    });
    on(playerSearchClearBtn, 'click', function() {
      playerSearch = '';
      playerSearchInput.value = '';
      renderPlayerQueue();
      playerSearchInput.focus();
    });
    on(playerAudio, 'ended', async function() {
      saveCurrentPlayerProgress();
      setPlayerPlayPauseButtonState();
      if (playerIndex >= 0 && playerIndex < playerQueue.length) {
        var currentItem = playerQueue[playerIndex];
        var currentItemId = getPlayerItemId(currentItem, playerIndex);
        var chunks = getPlayerItemChunks(currentItem);
        var currentChunkIndex = playerLoadedChunkIndex || 0;
        if (currentChunkIndex + 1 < chunks.length) {
          await loadPlayerIndex(playerIndex, { chunkIndex: currentChunkIndex + 1, seekSeconds: 0, autoplay: true });
          return;
        }
        playerChunkStateByItemId[currentItemId] = { chunkIndex: chunks.length - 1, chunkTime: Number(playerAudio.duration || 0) };
        playerProgressByItemId[currentItemId] = Math.max(
          Number(playerProgressByItemId[currentItemId] || 0),
          sumKnownChunkDurations(currentItemId)
        );
      }
      var action = settings.playerAutoAction || 'none';
      var currentIdx = playerIndex;
      var removedCurrent = false;
      if (action === 'archive' || action === 'delete') {
        removedCurrent = await runPlayerItemAction(currentIdx, action);
      }
      if (!playerAutoNextCheckbox.checked && !settings.playerAutoNext) return;
      if (playerQueue.length === 0) return;
      if (removedCurrent && playerIndex < playerQueue.length) {
        await loadPlayerIndex(playerIndex);
        return;
      }
      var nextIdx = findNextPlayableIndex(playerIndex);
      if (nextIdx >= 0) {
        await loadPlayerIndex(nextIdx);
      }
    });
    on(playerAudio, 'timeupdate', function() {
      saveCurrentPlayerProgress();
    });
    on(playerAudio, 'play', function() {
      setPlayerPlayPauseButtonState();
    });
    on(playerAudio, 'pause', function() {
      setPlayerPlayPauseButtonState();
    });
    on(playerAudio, 'loadedmetadata', function() {
      var itemId = playerLoadedItemId || getCurrentPlayerItemId();
      if (!itemId) return;
      var duration = Number(playerAudio.duration || 0);
      if (duration > 0) {
        var durationMap = getChunkDurationMap(itemId);
        durationMap[playerLoadedChunkIndex || 0] = duration;
        playerDurationByItemId[itemId] = Math.max(
          Number(playerDurationByItemId[itemId] || 0),
          sumKnownChunkDurations(itemId)
        );
        schedulePersistPlayerState();
        updatePlayerRowProgressUI(itemId);
      }
      setPlayerPlayPauseButtonState();
    });
    on(window, 'beforeunload', function() {
      saveCurrentPlayerProgress();
      persistPlayerState();
      persistAppState();
    });
    on(mainPane, 'scroll', function() { schedulePersistAppState(); });
    on(previewList, 'scroll', function() { schedulePersistAppState(); });
    on(deletedList, 'scroll', function() { schedulePersistAppState(); });
    on(playerQueueEl, 'scroll', function() { schedulePersistAppState(); });
    on(playerAutoNextCheckbox, 'change', function() {
      settings.playerAutoNext = !!playerAutoNextCheckbox.checked;
      schedulePersistAppState();
    });

    async function performCleanup(action, skipConfirm, forcedIds) {
      if (cleanupInFlight) {
        showToast('Please wait for the current action to finish', 'warning');
        return { ok: false, reason: 'in_flight' };
      }
      var activeSelectedIds = Array.isArray(forcedIds) && forcedIds.length > 0
        ? Array.from(new Set(forcedIds.map(function(id) { return String(id); })))
        : getActiveSelectedIds();
      var selectedCount = activeSelectedIds.length;
      if (selectedCount === 0) {
        showToast('Select at least one item first', 'warning');
        return { ok: false, reason: 'none_selected' };
      }
      if (settings.confirmActions && !skipConfirm) {
        var confirmed = window.confirm('Confirm ' + action + ' for ' + selectedCount + ' selected items?');
        if (!confirmed) return { ok: false, reason: 'cancelled' };
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
              thumbnail: item.thumbnail || null,
              originalLocation: item.originalLocation || null
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
        var actionPrefix = getActionPastTense(action) + ' ';
        if (data.processed < selectedCount) {
          showToast(actionPrefix + data.processed + ' of ' + selectedCount + ' items', 'warning');
        } else {
          showToast(actionPrefix + data.processed + ' items', 'success');
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
          var removedFromPlayer = syncPlayerQueueAfterProcessedIds(Array.from(successfulIds));
          previewData = previewData.filter(function(item) {
            return !successfulIds.has(String(item.id));
          });
          successfulIds.forEach(function(id) { selectedPreviewIds.delete(String(id)); });
          currentCount = Math.max(0, currentCount - successfulIds.size);
          if (removedFromPlayer) {
            showToast('Stopped playback because current item was ' + action + 'd', 'warning');
          }
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
        return { ok: true, processedIds: Array.from(successfulIds) };
      } catch (err) {
        showToast(err.message, 'error');
        return { ok: false, reason: 'error', error: err };
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
      schedulePersistAppState();
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
        deletedList.innerHTML = '<div class="empty-state-panel"><div class="empty-state-title">No deleted items in history</div><div class="empty-state-subtitle">Deleted stories appear here so they can be restored or permanently cleared.</div></div>';
        updateSelectedButtons();
        schedulePersistAppState();
        return;
      }
      var filtered = getFilteredDeletedItems();
      if (filtered.length === 0) {
        deletedList.innerHTML = '<div class="empty-state-panel"><div class="empty-state-title">No deleted items match this filter</div><div class="empty-state-subtitle">Try a different search phrase or date sort option.</div></div>';
        updateSelectedButtons();
        schedulePersistAppState();
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
      schedulePersistAppState();
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

    function buildSettingsPayloadFromUI() {
      return {
        defaultLocation: settingsDefaultLocation.value,
        defaultDays: parseInt(settingsDefaultDays.value, 10),
        previewLimit: parseInt(settingsPreviewLimit.value, 10),
        confirmActions: !!settingsConfirmActions.checked,
        mockTts: !!settingMockTts.checked,
        ttsVoice: (settingTtsVoice && settingTtsVoice.value) || 'alloy',
        audioBackSeconds: parseInt(settingAudioBackSeconds.value, 10),
        audioForwardSeconds: parseInt(settingAudioForwardSeconds.value, 10),
        maxOpenTabs: parseInt(settingMaxOpenTabs.value, 10),
        playerAutoNext: !!settingPlayerAutoNext.checked,
        playerAutoAction: settingPlayerAutoAction.value
      };
    }

    async function saveSettingsImmediate(options) {
      var opts = options || {};
      if (settingsSaveInFlight) return;
      settingsSaveInFlight = true;
      try {
        var payload = buildSettingsPayloadFromUI();
        var res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        var data = await parseApiJson(res);
        if (data.error) throw new Error(data.error);
        settings = data.settings;
        applySettingsToUI();
        lastQuery = null;
        updatePreviewButtonLabel();
        schedulePersistAppState();
        if (!opts.silent) showToast('Settings saved', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        settingsSaveInFlight = false;
      }
    }

    function scheduleSaveSettingsImmediate() {
      if (settingsSaveTimer) clearTimeout(settingsSaveTimer);
      settingsSaveTimer = setTimeout(function() {
        settingsSaveTimer = null;
        saveSettingsImmediate({ silent: true });
      }, 220);
    }

    function getVoiceLabel(voice) {
      var normalized = String(voice || '').toLowerCase();
      if (normalized === 'alloy') return 'Alloy';
      if (normalized === 'onyx') return 'Onyx';
      if (normalized === 'echo') return 'Echo';
      if (normalized === 'nova') return 'Nova';
      if (normalized === 'shimmer') return 'Shimmer';
      return voice || 'Voice';
    }

    async function previewSelectedVoice() {
      if (!settingTtsVoice) return;
      var voice = settingTtsVoice.value || 'alloy';
      try {
        var res = await fetch('/api/audio/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articleId: 'voice-preview',
            text: 'I am ' + getVoiceLabel(voice) + '.',
            voice: voice,
            speed: 1,
            chunkIndex: 0,
            mock: false,
          }),
        });
        if (!res.ok) {
          var data = await parseApiJson(res);
          throw new Error((data && data.error) || ('Voice preview failed (' + res.status + ')'));
        }
        var blob = await res.blob();
        if (voicePreviewAudio && voicePreviewAudio.pause) {
          try { voicePreviewAudio.pause(); } catch (e) {}
        }
        var url = URL.createObjectURL(blob);
        voicePreviewAudio = new Audio(url);
        voicePreviewAudio.play().catch(function() {});
      } catch (err) {
        showToast(err.message || 'Voice preview unavailable', 'warning');
      }
    }

    on(saveSettingsBtn, 'click', async function() {
      saveSettingsImmediate({ silent: false });
    });

    [
      settingsDefaultLocation,
      settingsDefaultDays,
      settingsPreviewLimit,
      settingsConfirmActions,
      settingMockTts,
      settingTtsVoice,
      settingAudioBackSeconds,
      settingAudioForwardSeconds,
      settingMaxOpenTabs,
      settingPlayerAutoNext,
      settingPlayerAutoAction,
    ].forEach(function(el) {
      on(el, 'change', function() {
        scheduleSaveSettingsImmediate();
      });
    });
    on(settingsDefaultDays, 'input', scheduleSaveSettingsImmediate);
    on(settingsPreviewLimit, 'input', scheduleSaveSettingsImmediate);
    on(settingAudioBackSeconds, 'input', scheduleSaveSettingsImmediate);
    on(settingAudioForwardSeconds, 'input', scheduleSaveSettingsImmediate);
    on(settingMaxOpenTabs, 'input', scheduleSaveSettingsImmediate);
    on(settingTtsVoice, 'change', function() {
      previewSelectedVoice();
    });

    async function loadSettings() {
      try {
        var res = await fetch('/api/settings');
        var data = await parseApiJson(res);
        if (data.settings) settings = data.settings;
      } catch (err) {}
      applySettingsToUI();
      updatePreviewButtonLabel();
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
        var stamp = item.completedAt ? ' <span style="color:var(--text-muted);font-size:0.78rem;">(' + escapeHtml(item.completedAt) + ')</span>' : '';
        return '<div class="history-item"><strong>v' + escapeHtml(item.version) + '</strong>' + stamp + ' - ' + escapeHtml(item.note) + '</div>';
      });
      historyEl.innerHTML = '<div style="font-weight:600;margin-bottom:0.35rem;color:var(--text)">Version History</div>' + lines.join('');
    }

    async function initializeApp() {
      restorePlayerState();
      var restoredState = restoreAppState();
      await loadSettings();
      await loadLocations();
      if (restoredState) {
        applyRestoredAppState(restoredState);
      } else {
        setActiveTab(getTabFromPath(window.location.pathname), { push: false });
        renderPreview();
      }
      updatePreviewButtonLabel();
      loadTokenStatus();
      loadOpenAiKeyStatus();
      renderVersionHistory();
      loadDeletedCount();
      setPlayerPlayPauseButtonState();
      updateRailSelectionBadges();
      syncMainControlsDock();
      syncPlayerControlsDock();
      var deferFrame = (typeof requestAnimationFrame === 'function')
        ? requestAnimationFrame
        : function(cb) { return setTimeout(cb, 0); };
      deferFrame(function() {
        syncMainControlsDock();
        syncPlayerControlsDock();
      });
      setTimeout(function() {
        syncMainControlsDock();
        syncPlayerControlsDock();
      }, 120);
    }

    initializeApp();
  </script>
</body>
</html>`;

  return { HTML_APP, HTML_MOCKUP_V3 };
}

export function getUiHtml(config) {
  return buildUiHtml(config);
}
