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

const HTML_MOCKUP_IPHONE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mobile Redesign Mockups</title>
  <style>
    :root {
      --bg: #edf4fb;
      --card: #ffffff;
      --line: #d1deee;
      --text: #20334d;
      --muted: #5f7795;
      --neutral: #1b88c9;
      --ok: #1a9a52;
      --warn: #e08e09;
      --danger: #c93333;
      --overlay: rgba(15, 23, 36, 0.5);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: radial-gradient(circle at 10% 0%, #f6fbff 0%, #edf4fb 46%, #e8f1fb 100%);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
    }
    .wrap { max-width: 1240px; margin: 0 auto; padding: 1rem; }
    h1 { margin: 0; font-size: 1.08rem; }
    .intro { margin: 0.2rem 0 0; color: var(--muted); font-size: 0.86rem; }
    .top-bar { margin-top: 0.64rem; display: flex; gap: 0.42rem; flex-wrap: wrap; align-items: center; }
    .chip {
      border: 1px solid #b8cce5;
      border-radius: 999px;
      background: #f4f8ff;
      color: #30567d;
      font-size: 0.74rem;
      font-weight: 700;
      padding: 0.22rem 0.5rem;
      white-space: nowrap;
    }
    .mode-switch {
      margin-left: auto;
      display: inline-grid;
      grid-template-columns: repeat(4, 48px);
      border-radius: 999px;
      border: 1px solid #bfd0e6;
      background: #f6faff;
      padding: 0.22rem;
      gap: 0.2rem;
    }
    .mode-btn {
      width: 44px;
      height: 44px;
      border-radius: 999px;
      border: 0;
      background: transparent;
      color: #5a7694;
      display: grid;
      place-items: center;
      cursor: pointer;
    }
    .mode-btn.active {
      color: #fff;
      background: linear-gradient(180deg, #35bdfa, #119edc);
      box-shadow: 0 2px 6px rgba(0, 100, 154, 0.28);
    }
    .grid { margin-top: 0.72rem; display: grid; grid-template-columns: minmax(0, 460px) minmax(0, 1fr); gap: 0.8rem; }
    .card { border: 1px solid var(--line); border-radius: 18px; background: var(--card); box-shadow: 0 4px 18px rgba(19, 33, 54, 0.08); overflow: hidden; }
    .card-head {
      border-bottom: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.4rem;
      padding: 0.56rem 0.72rem;
      background: linear-gradient(180deg, #f9fcff, #f2f8ff);
      color: #406183;
      font-size: 0.82rem;
      font-weight: 800;
    }
    .phone-shell { width: 100%; max-width: 460px; margin: 0 auto; background: linear-gradient(180deg, #fff, #f5f9ff); }
    .phone-header {
      display: grid;
      grid-template-columns: 44px minmax(0, 1fr) 44px;
      align-items: center;
      gap: 0.4rem;
      padding: 0.62rem 0.66rem 0.4rem;
      border-bottom: 1px solid var(--line);
      background: #f8fbff;
    }
    .circle-btn, .icon-btn {
      width: 44px;
      height: 44px;
      border-radius: 999px;
      border: 1px solid #c1d3e9;
      background: #fff;
      color: #4f6e8f;
      display: grid;
      place-items: center;
      cursor: pointer;
      padding: 0;
    }
    .head-title { min-height: 1px; }
    .tools {
      padding: 0.52rem;
      border-bottom: 1px solid #d5e0ef;
      background: #f8fbff;
      display: grid;
      gap: 0.36rem;
    }
    .tools-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.4rem;
    }
    .tools-title {
      font-size: 0.82rem;
      font-weight: 800;
      color: #214465;
    }
    .count-chips { display: inline-flex; gap: 0.22rem; flex-wrap: wrap; justify-content: flex-end; }
    .count-chip {
      border: 1px solid #b6cbe6;
      border-radius: 999px;
      background: #ecf4ff;
      color: #315982;
      font-size: 0.67rem;
      font-weight: 760;
      padding: 0.16rem 0.42rem;
    }
    .seg-group {
      display: inline-grid;
      grid-auto-flow: column;
      gap: 0.26rem;
      border: 1px solid #c2d3e9;
      border-radius: 999px;
      padding: 0.2rem;
      background: #f7fbff;
      width: 100%;
      overflow-x: auto;
    }
    .seg-btn {
      min-height: 44px;
      border: 0;
      border-radius: 999px;
      padding: 0 0.54rem;
      background: transparent;
      color: #4f6e8e;
      font-size: 0.72rem;
      font-weight: 700;
      white-space: nowrap;
      cursor: pointer;
    }
    .seg-btn.active {
      background: #dff2ff;
      color: #016ea5;
      box-shadow: inset 0 0 0 1px #8cd1f4;
    }
    .tools-row { display: grid; grid-template-columns: minmax(0, 1fr) auto auto auto; gap: 0.3rem; }
    .tools-input {
      min-height: 44px;
      border-radius: 10px;
      border: 1px solid #bdd1e8;
      background: #fff;
      color: #2b4c71;
      font-size: 0.8rem;
      padding: 0 0.54rem;
      width: 100%;
    }
    .tool-btn {
      min-height: 44px;
      min-width: 44px;
      border-radius: 10px;
      border: 1px solid #bed1e8;
      background: #fff;
      color: #2a4c71;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
    }
    .tool-btn.primary { border-color: #7fd0f7; background: #e7f8ff; color: #006ea8; }
    .tool-btn.warn { border-color: #ffd292; background: #fff7ea; color: #96600d; }
    .find-row { display: grid; grid-template-columns: minmax(0, 1fr) 90px; gap: 0.3rem; }
    .run-find {
      min-height: 44px;
      border-radius: 10px;
      border: 1px solid #8ed2f4;
      background: linear-gradient(180deg, #34befa, #139fdd);
      color: #fff;
      font-size: 0.74rem;
      font-weight: 800;
      cursor: pointer;
    }
    .custom-dates { display: none; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.3rem; }
    .custom-dates.show { display: grid; }
    .date-input {
      min-height: 44px;
      border-radius: 10px;
      border: 1px solid #bed1e7;
      background: #fff;
      color: #2b4c71;
      font-size: 0.76rem;
      padding: 0 0.48rem;
    }
    .bulk-row {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.28rem;
    }
    .bulk-btn {
      min-height: 44px;
      border-radius: 10px;
      border: 1px solid #bed1e8;
      background: #fff;
      color: #294b70;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.26rem;
      font-size: 0.72rem;
      font-weight: 780;
      cursor: pointer;
    }
    .bulk-btn.ok { border-color: #9bd7b6; background: #edf9f2; color: #0c7e3d; }
    .bulk-btn.warn { border-color: #ffd399; background: #fff8ec; color: #9a6109; }
    .bulk-btn.danger { border-color: #f0b4b4; background: #fff1f1; color: #a12121; }
    .status-zone {
      border-top: 1px solid #d4dfef;
      border-bottom: 1px solid #d4dfef;
      background: #f4f8ff;
      padding: 0.38rem 0.56rem;
      display: grid;
      gap: 0.3rem;
    }
    .status-line { min-height: 18px; font-size: 0.75rem; color: #426585; }
    .status-line.error { color: var(--danger); font-weight: 760; }
    .find-banner {
      display: none;
      border: 1px solid #9dd7b8;
      background: #effaf4;
      color: #136c3a;
      border-radius: 10px;
      min-height: 44px;
      padding: 0.35rem 0.5rem;
      font-size: 0.72rem;
      font-weight: 760;
      align-items: center;
      justify-content: space-between;
      gap: 0.4rem;
    }
    .find-banner.show { display: flex; }
    .open-player-link {
      border: 0;
      background: transparent;
      color: #0d6fbe;
      font-size: 0.72rem;
      font-weight: 800;
      cursor: pointer;
      text-decoration: underline;
    }
    .toast-wrap { display: grid; gap: 0.26rem; }
    .toast {
      border: 1px solid #bbd0e9;
      border-radius: 10px;
      background: #fff;
      color: #35587e;
      min-height: 44px;
      padding: 0.35rem 0.5rem;
      font-size: 0.72rem;
      font-weight: 730;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.4rem;
    }
    .toast button {
      border: 1px solid #89cff3;
      border-radius: 999px;
      background: #e6f7ff;
      color: #006ca7;
      min-height: 26px;
      padding: 0 0.52rem;
      font-size: 0.7rem;
      font-weight: 800;
      cursor: pointer;
    }
    .list-wrap {
      max-height: 63vh;
      overflow-y: auto;
      padding: 0.45rem;
      display: grid;
      gap: 0.48rem;
      background: #f8fbff;
    }
    .settings-pane {
      display: none;
      padding: 0.54rem;
      background: #f8fbff;
      border-top: 1px solid #d2deef;
    }
    .settings-pane.show { display: grid; gap: 0.38rem; }
    .settings-row {
      border: 1px solid #c7d7eb;
      border-radius: 12px;
      background: #fff;
      padding: 0.5rem;
      display: grid;
      gap: 0.28rem;
    }
    .settings-title { font-size: 0.76rem; font-weight: 800; color: #2d5278; text-transform: uppercase; }
    .settings-options { display: flex; gap: 0.24rem; flex-wrap: wrap; }
    .settings-opt {
      border: 1px solid #bed2e9;
      border-radius: 999px;
      background: #f5faff;
      color: #3c5f85;
      min-height: 30px;
      min-width: 30px;
      padding: 0 0.5rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.2rem;
      font-size: 0.72rem;
      font-weight: 700;
    }
    .entry {
      position: relative;
      border: 1px solid #c8d7eb;
      border-radius: 14px;
      overflow: hidden;
      background: #fff;
      box-shadow: 0 2px 8px rgba(20, 35, 58, 0.08);
    }
    .swipe-track {
      position: absolute;
      inset: 0;
      display: flex;
      justify-content: space-between;
      pointer-events: none;
    }
    .lane {
      width: 44%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #123a5a;
      font-size: 0.68rem;
      font-weight: 800;
      gap: 0.22rem;
    }
    .lane.right { background: linear-gradient(90deg, rgba(26,154,82,0.2), rgba(26,154,82,0.03)); }
    .lane.left { background: linear-gradient(270deg, rgba(224,142,9,0.2), rgba(224,142,9,0.03)); }
    .lane.left.danger { background: linear-gradient(270deg, rgba(201,51,51,0.22), rgba(201,51,51,0.03)); }
    .entry-surface {
      position: relative;
      display: grid;
      grid-template-columns: 44px 58px minmax(0, 1fr) 44px;
      align-items: center;
      gap: 0.52rem;
      padding: 0.56rem;
      background: #f9fcff;
      transform: translateX(0px);
      transition: transform 140ms ease;
      touch-action: pan-y;
      cursor: grab;
    }
    .entry.dragging .entry-surface { transition: none; cursor: grabbing; }
    .entry.selected .entry-surface {
      border-left: 4px solid var(--neutral);
      padding-left: 0.32rem;
      background: linear-gradient(180deg, #ecfbff, #f4fcff);
    }
    .thumb {
      width: 56px;
      height: 56px;
      border-radius: 11px;
      border: 1px solid #bfd1e8;
      background: linear-gradient(150deg, #e2f0ff, #f9fcff);
      display: grid;
      place-items: center;
      color: #6987ab;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
    }
    .entry-title {
      font-size: 0.93rem;
      line-height: 1.2;
      font-weight: 760;
      color: #1f334d;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }
    .entry-meta {
      margin-top: 0.2rem;
      color: #5f7795;
      font-size: 0.76rem;
      font-weight: 700;
    }
    .meta-source {
      border: 1px solid #c1d3e8;
      border-radius: 999px;
      background: #f3f8ff;
      color: #3f6288;
      font-size: 0.67rem;
      padding: 0.1rem 0.34rem;
      margin-right: 0.22rem;
    }
    .entry-open {
      width: 44px;
      height: 44px;
      border-radius: 999px;
      border: 1px solid #a8c1e2;
      background: #f4faff;
      color: #2f6ba4;
      display: grid;
      place-items: center;
      cursor: pointer;
      padding: 0;
    }
    .entry-expanded {
      display: none;
      border-top: 1px solid #d1e0f0;
      background: #fbfdff;
      padding: 0.48rem;
      gap: 0.34rem;
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .entry.expanded .entry-expanded { display: grid; }
    .entry-reveal {
      display: none;
      border-top: 1px solid #d1dff0;
      background: #f5f9ff;
      padding: 0.42rem;
      gap: 0.3rem;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .entry.reveal-right .entry-reveal,
    .entry.reveal-left .entry-reveal { display: grid; }
    .cmd, .tray-btn {
      min-height: 44px;
      border-radius: 10px;
      border: 1px solid #c0d2e9;
      background: #fff;
      color: #294d71;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
    }
    .cmd.ok, .tray-btn.ok { border-color: #9bd8b7; background: #edf9f2; color: #0f7f3f; }
    .cmd.warn, .tray-btn.warn { border-color: #ffd59f; background: #fff7ea; color: #94600d; }
    .cmd.danger, .tray-btn.danger { border-color: #f1bcbc; background: #fff0f0; color: #a12121; }
    .entry.reveal-left .for-right,
    .entry.reveal-right .for-left { display: none; }
    .empty {
      border: 1px dashed #bdd0e8;
      border-radius: 12px;
      background: #f8fbff;
      color: #5b7493;
      padding: 0.82rem;
      font-size: 0.76rem;
      font-weight: 700;
      text-align: center;
    }
    .bottom-mini {
      border-top: 1px solid var(--line);
      padding: 0.5rem 0.54rem 0.58rem;
      background: #f4f8ff;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 56px;
      gap: 0.4rem;
      align-items: center;
      position: sticky;
      bottom: 0;
    }
    .mini-pill {
      border: 1px solid #bdd1ea;
      border-radius: 999px;
      min-height: 46px;
      background: rgba(255,255,255,0.9);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0 0.44rem;
      color: #305174;
      font-size: 0.76rem;
      font-weight: 720;
    }
    .play-btn {
      width: 56px;
      height: 56px;
      border-radius: 999px;
      border: 1px solid #84d0f2;
      background: linear-gradient(180deg, #47c6f9, #0da9e4);
      color: #fff;
      display: grid;
      place-items: center;
      cursor: pointer;
    }
    .panel-body { padding: 0.62rem; display: grid; gap: 0.56rem; }
    .state-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.44rem; }
    .state-card {
      border: 1px solid #cad9ed;
      border-radius: 12px;
      background: #f9fcff;
      padding: 0.5rem;
      display: grid;
      gap: 0.26rem;
    }
    .state-title { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: #345b84; }
    .state-note { font-size: 0.74rem; color: #5c7391; line-height: 1.3; }
    .state-bar {
      border: 1px dashed #afc5e1;
      border-radius: 9px;
      min-height: 44px;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.28rem;
      color: #325a83;
      font-size: 0.7rem;
      font-weight: 760;
      text-align: center;
      padding: 0 0.36rem;
    }
    .popover {
      position: fixed;
      inset: 0;
      background: var(--overlay);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 70;
    }
    .popover.show { display: flex; }
    .sheet {
      width: min(520px, 100%);
      border-radius: 18px;
      border: 1px solid #253f60;
      background: linear-gradient(180deg, #173a5b, #122d47);
      color: #e7f4ff;
      box-shadow: 0 20px 46px rgba(0,0,0,0.34);
      max-height: min(78vh, 660px);
      overflow: auto;
    }
    .sheet-head {
      border-bottom: 1px solid rgba(255,255,255,0.2);
      padding: 0.76rem 0.84rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
      font-weight: 800;
    }
    .sheet-list { padding: 0.44rem 0.58rem 0.75rem; display: grid; gap: 0.28rem; }
    .sheet-btn {
      min-height: 44px;
      border-radius: 11px;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(255,255,255,0.08);
      color: #ecf7ff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 0.64rem;
      font-size: 0.82rem;
      font-weight: 720;
      cursor: pointer;
    }
    .sheet-btn.warn { color: #ffd68f; border-color: rgba(255,201,98,0.45); }
    .sheet-btn.danger { color: #ffacac; border-color: rgba(255,123,123,0.45); }
    .hint-overlay, .confirm-overlay {
      position: fixed;
      inset: 0;
      background: var(--overlay);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 90;
    }
    .hint-overlay.show, .confirm-overlay.show { display: flex; }
    .hint-card, .confirm-card {
      width: min(420px, 100%);
      border: 1px solid #c1d4ea;
      border-radius: 16px;
      background: #fff;
      box-shadow: 0 16px 40px rgba(16, 30, 52, 0.28);
      padding: 0.8rem;
      display: grid;
      gap: 0.44rem;
    }
    .hint-title, .confirm-title { font-size: 0.9rem; font-weight: 800; color: #2a4f76; }
    .hint-note, .confirm-note { font-size: 0.76rem; color: #5b7493; line-height: 1.35; }
    .hint-actions, .confirm-actions { display: flex; justify-content: flex-end; gap: 0.3rem; }
    .confirm-btn {
      min-height: 44px;
      border-radius: 9px;
      border: 1px solid #c0d3e8;
      background: #f9fcff;
      color: #2f4f73;
      font-size: 0.74rem;
      font-weight: 760;
      padding: 0 0.56rem;
      cursor: pointer;
    }
    .confirm-btn.danger {
      border-color: #eeaaaa;
      background: #fff0f0;
      color: #9d1f1f;
    }
    .press-tip {
      position: fixed;
      z-index: 95;
      border: 1px solid #8fb6d9;
      border-radius: 999px;
      background: #102741;
      color: #ecf5ff;
      font-size: 0.7rem;
      font-weight: 760;
      padding: 0.22rem 0.48rem;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transform: translate(-50%, -8px);
      transition: opacity 120ms ease;
    }
    .press-tip.show { opacity: 1; }
    .i {
      width: 17px;
      height: 17px;
      stroke: currentColor;
      stroke-width: 2.1;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .i.sm { width: 14px; height: 14px; }
    .i.lg { width: 20px; height: 20px; }
    .icon-row { display: inline-flex; align-items: center; gap: 0.3rem; }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
      white-space: nowrap;
    }
    .phone-shell .tool-btn,
    .phone-shell .bulk-btn,
    .phone-shell .cmd,
    .phone-shell .tray-btn,
    .phone-shell .mode-btn {
      font-size: 0;
      line-height: 0;
      gap: 0;
      justify-content: center;
    }
    .phone-shell .bulk-btn, .phone-shell .cmd, .phone-shell .tray-btn {
      min-width: 44px;
      width: 44px;
      min-height: 44px;
      height: 44px;
      padding: 0;
    }
    .linkback { margin-top: 0.8rem; color: var(--muted); font-size: 0.8rem; }
    @media (max-width: 1040px) {
      .grid { grid-template-columns: 1fr; }
      .mode-switch { margin-left: 0; }
    }
    @media (max-width: 640px) {
      .wrap { padding: 0.62rem; }
      .mode-switch { width: 100%; justify-content: space-between; }
      .bulk-row { grid-template-columns: repeat(3, 44px); justify-content: flex-start; }
      .tools-row { grid-template-columns: minmax(0, 1fr) repeat(3, 44px); }
    }
  </style>
</head>
<body>
  <svg width="0" height="0" style="position:absolute">
    <symbol id="i-back" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></symbol>
    <symbol id="i-more" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></symbol>
    <symbol id="i-chevron-down" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></symbol>
    <symbol id="i-play" viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></symbol>
    <symbol id="i-pause" viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></symbol>
    <symbol id="i-open" viewBox="0 0 24 24"><path d="M8 16l8-8"/><path d="M9 8h7v7"/><path d="M5 12v7h7"/></symbol>
    <symbol id="i-queue" viewBox="0 0 24 24"><path d="M4 6h11M4 12h11M4 18h8"/><path d="M17 15l3 3 3-3"/><path d="M20 18v-8"/></symbol>
    <symbol id="i-archive" viewBox="0 0 24 24"><path d="M4 7h16v3H4z"/><path d="M6 10v8h12v-8"/><path d="M10 13h4"/></symbol>
    <symbol id="i-trash" viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M7 7l1 12h8l1-12"/><path d="M10 11v6M14 11v6"/></symbol>
    <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></symbol>
    <symbol id="i-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></symbol>
    <symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></symbol>
    <symbol id="i-download" viewBox="0 0 24 24"><path d="M12 4v10"/><path d="M8 10l4 4 4-4"/><path d="M5 18h14"/></symbol>
    <symbol id="i-arrow-right" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></symbol>
    <symbol id="i-text" viewBox="0 0 24 24"><path d="M4 7h16M9 7v10M15 7v10M5 17h14"/></symbol>
    <symbol id="i-sort" viewBox="0 0 24 24"><path d="M7 6h10M7 12h7M7 18h4"/></symbol>
    <symbol id="i-filter" viewBox="0 0 24 24"><path d="M4 6h16l-6 7v5l-4 2v-7z"/></symbol>
    <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/></symbol>
    <symbol id="i-settings" viewBox="0 0 24 24"><path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z"/><path d="M19.4 15a1 1 0 00.2 1.1l.1.1a1.2 1.2 0 010 1.7l-1 1a1.2 1.2 0 01-1.7 0l-.1-.1a1 1 0 00-1.1-.2 1 1 0 00-.6.9V20a1.2 1.2 0 01-1.2 1.2h-1.6A1.2 1.2 0 0111.2 20v-.2a1 1 0 00-.6-.9 1 1 0 00-1.1.2l-.1.1a1.2 1.2 0 01-1.7 0l-1-1a1.2 1.2 0 010-1.7l.1-.1a1 1 0 00.2-1.1 1 1 0 00-.9-.6H4A1.2 1.2 0 012.8 13.6v-1.2A1.2 1.2 0 014 11.2h.2a1 1 0 00.9-.6 1 1 0 00-.2-1.1l-.1-.1a1.2 1.2 0 010-1.7l1-1a1.2 1.2 0 011.7 0l.1.1a1 1 0 001.1.2 1 1 0 00.6-.9V4A1.2 1.2 0 0110.4 2.8h1.2A1.2 1.2 0 0112.8 4v.2a1 1 0 00.6.9 1 1 0 001.1-.2l.1-.1a1.2 1.2 0 011.7 0l1 1a1.2 1.2 0 010 1.7l-.1.1a1 1 0 00-.2 1.1 1 1 0 00.9.6H20a1.2 1.2 0 011.2 1.2v1.2A1.2 1.2 0 0120 14.8h-.2a1 1 0 00-.9.6z"/></symbol>
  </svg>
  <main class="wrap">
    <h1>Mobile Queue Redesign Mockups</h1>
    <p class="intro">Goal flow: Find (source + period) -> auto-add to Playlist -> triage/play/open/archive/delete -> Deleted for restore/re-archive/delete forever.</p>
    <div class="top-bar">
      <span class="chip">Swipe right: mode quick action</span>
      <span class="chip">Swipe left: destructive/secondary</span>
      <span class="chip">Long swipe: more row actions</span>
      <span class="chip">Bulk always uses selected + filtered</span>
      <div class="mode-switch" id="mode-switch">
        <button type="button" class="mode-btn active" data-mode="find" aria-label="Find"><svg class="i sm"><use href="#i-search"/></svg></button>
        <button type="button" class="mode-btn" data-mode="player" aria-label="Player"><svg class="i sm"><use href="#i-play"/></svg></button>
        <button type="button" class="mode-btn" data-mode="deleted" aria-label="Deleted"><svg class="i sm"><use href="#i-trash"/></svg></button>
        <button type="button" class="mode-btn" data-mode="settings" aria-label="Settings"><svg class="i sm"><use href="#i-settings"/></svg></button>
      </div>
    </div>
    <section class="grid">
      <article class="card">
        <div class="card-head">
          <span>iPhone Interaction Mock</span>
          <span id="mode-label">Find</span>
        </div>
        <div class="phone-shell">
          <div class="phone-header">
            <button class="circle-btn" type="button" aria-label="Back"><svg class="i"><use href="#i-back"/></svg></button>
            <div class="head-title"></div>
            <button class="circle-btn" type="button" aria-label="More"><svg class="i"><use href="#i-more"/></svg></button>
          </div>
          <div class="tools">
            <div class="tools-top">
              <span class="tools-title" id="tools-title">Find</span>
              <span class="count-chips" id="count-chips">
                <span class="count-chip" id="count-all">All (filtered): 0</span>
                <span class="count-chip" id="count-selected">Selected: 0</span>
                <span class="count-chip" id="count-context">Auto-queued</span>
              </span>
            </div>
            <div id="find-controls">
              <div class="seg-group" id="source-seg" role="tablist" aria-label="Find source">
                <button type="button" class="seg-btn active" data-source="readwise">Readwise</button>
                <button type="button" class="seg-btn" data-source="gmail">Gmail</button>
              </div>
              <div class="seg-group" id="period-seg" role="tablist" aria-label="Time period">
                <button type="button" class="seg-btn" data-period="24h">24h</button>
                <button type="button" class="seg-btn" data-period="3d">3d</button>
                <button type="button" class="seg-btn active" data-period="7d">7d</button>
                <button type="button" class="seg-btn" data-period="14d">14d</button>
                <button type="button" class="seg-btn" data-period="custom">Custom</button>
              </div>
              <div class="custom-dates" id="custom-dates">
                <input class="date-input" id="find-start-date" type="date" aria-label="Start date" value="2026-02-17">
                <input class="date-input" id="find-end-date" type="date" aria-label="End date" value="2026-02-24">
              </div>
              <div class="find-row">
                <button type="button" class="run-find" id="run-find-btn">Run Find</button>
                <button type="button" class="tool-btn primary" id="open-player-shortcut" aria-label="Open Player"><svg class="i sm"><use href="#i-play"/></svg></button>
              </div>
            </div>
            <div class="tools-row">
              <input id="tools-search" class="tools-input" placeholder="Search title, author, source" />
              <button type="button" class="tool-btn icon-btn" id="sort-btn" data-tip="Sort"><svg class="i sm"><use href="#i-sort"/></svg></button>
              <button type="button" class="tool-btn icon-btn" id="filter-btn" data-tip="Filter"><svg class="i sm"><use href="#i-filter"/></svg></button>
              <button type="button" class="tool-btn primary icon-btn" id="select-btn" data-tip="Select filtered"><svg class="i sm"><use href="#i-check"/></svg></button>
            </div>
            <div class="bulk-row" id="bulk-row">
              <button type="button" class="bulk-btn ok icon-btn" id="bulk-primary" data-tip="Bulk primary"><svg class="i sm"><use href="#i-archive"/></svg></button>
              <button type="button" class="bulk-btn warn icon-btn" id="bulk-secondary" data-tip="Bulk secondary"><svg class="i sm"><use href="#i-queue"/></svg></button>
              <button type="button" class="bulk-btn danger icon-btn" id="bulk-danger" data-tip="Bulk danger"><svg class="i sm"><use href="#i-trash"/></svg></button>
            </div>
          </div>
          <div class="status-zone">
            <div class="status-line" id="status-line" aria-live="polite"></div>
            <div class="find-banner" id="find-banner">
              <span id="find-banner-text">Added 0 to Playlist.</span>
              <button type="button" class="open-player-link" id="find-banner-open-player">Open Player</button>
            </div>
            <div class="toast-wrap" id="toast-wrap"></div>
          </div>
          <div class="settings-pane" id="mock-settings">
            <div class="settings-row">
              <div class="settings-title">Sources</div>
              <div class="settings-options">
                <span class="settings-opt"><svg class="i sm"><use href="#i-check"/></svg>Readwise</span>
                <span class="settings-opt"><svg class="i sm"><use href="#i-check"/></svg>Gmail</span>
              </div>
            </div>
            <div class="settings-row">
              <div class="settings-title">Playback</div>
              <div class="settings-options">
                <span class="settings-opt">1.3x</span>
                <span class="settings-opt"><svg class="i sm"><use href="#i-check"/></svg>Auto next</span>
                <span class="settings-opt">Provider</span>
              </div>
            </div>
            <div class="settings-row">
              <div class="settings-title">Defaults</div>
              <div class="settings-options">
                <span class="settings-opt">Source OR</span>
                <span class="settings-opt">7d</span>
                <span class="settings-opt">Limit 100</span>
              </div>
            </div>
          </div>
          <div class="list-wrap" id="mock-list"></div>
          <div class="bottom-mini" id="bottom-mini">
            <div class="mini-pill">
              <span class="thumb" style="width:34px;height:34px;border-radius:8px;">▶</span>
              <span id="mini-now-playing">Nothing playing</span>
            </div>
            <button type="button" class="play-btn" id="mini-play-btn" aria-label="Play/Pause"><svg class="i lg"><use href="#i-play"/></svg></button>
          </div>
        </div>
      </article>
      <aside class="card">
        <div class="card-head">
          <span>Behavior Contract</span>
          <span>Decision complete</span>
        </div>
        <div class="panel-body">
          <div class="state-grid">
            <div class="state-card">
              <div class="state-title">Find Contract</div>
              <div class="state-note">Find requires source OR and time period. Run Find auto-adds all results into Playlist.</div>
              <div class="state-bar"><svg class="i sm"><use href="#i-search"/></svg>Run Find -> Added N -> Open Player</div>
            </div>
            <div class="state-card">
              <div class="state-title">Player Contract</div>
              <div class="state-note">Text action exists only in Player. Auto-next uses checked items if any are checked, else filtered queue.</div>
              <div class="state-bar"><svg class="i sm"><use href="#i-text"/></svg>Text only in Player</div>
            </div>
            <div class="state-card">
              <div class="state-title">Deleted Contract</div>
              <div class="state-note">Deleted supports Restore, Re-archive, and Delete forever. Delete forever always confirms and has no undo.</div>
              <div class="state-bar"><svg class="i sm"><use href="#i-trash"/></svg>Confirm + no undo</div>
            </div>
            <div class="state-card">
              <div class="state-title">Bulk Guardrail</div>
              <div class="state-note">Bulk actions always use selected + filtered intersection. Action labels show selected count only.</div>
              <div class="state-bar"><svg class="i sm"><use href="#i-check"/></svg>selected ∩ filtered</div>
            </div>
            <div class="state-card">
              <div class="state-title">Discoverability</div>
              <div class="state-note">First-run swipe hint overlay and long-press icon labels reduce icon-only ambiguity on iPhone.</div>
              <div class="state-bar"><svg class="i sm"><use href="#i-info"/></svg>Hint + long-press labels</div>
            </div>
            <div class="state-card">
              <div class="state-title">Undo + Errors</div>
              <div class="state-note">Reversible destructive actions show persistent undo toast. Status/error line is fixed below controls.</div>
              <div class="state-bar"><svg class="i sm"><use href="#i-arrow-right"/></svg>undo 7s</div>
            </div>
          </div>
        </div>
      </aside>
    </section>
    <div class="linkback">Main app: <a href="/">/</a> - Desktop mock: <a href="/mockup-v3">/mockup-v3</a> - Redesign routes: <a href="/mockup-redesign">/mockup-redesign</a>, <a href="/mockup-redesign-v2">/mockup-redesign-v2</a>, <a href="/mockup-iphone-v2">/mockup-iphone-v2</a></div>
  </main>
  <div class="popover" id="more-popover" aria-hidden="true">
    <div class="sheet">
      <div class="sheet-head">
        <span>Row Actions</span>
        <button type="button" class="circle-btn" id="close-popover" aria-label="Close"><svg class="i"><use href="#i-back"/></svg></button>
      </div>
      <div class="sheet-list" id="sheet-list"></div>
    </div>
  </div>
  <div class="hint-overlay" id="hint-overlay" aria-hidden="true">
    <div class="hint-card">
      <div class="hint-title">Swipe Shortcuts</div>
      <div class="hint-note">Swipe right = quick mode action. Swipe left = destructive/secondary action. Long swipe opens row tray with more actions.</div>
      <div class="hint-actions">
        <button type="button" class="confirm-btn" id="hint-dismiss">Got it</button>
      </div>
    </div>
  </div>
  <div class="confirm-overlay" id="confirm-overlay" aria-hidden="true">
    <div class="confirm-card">
      <div class="confirm-title" id="confirm-title">Delete forever?</div>
      <div class="confirm-note" id="confirm-note">This cannot be undone.</div>
      <div class="confirm-actions">
        <button type="button" class="confirm-btn" id="confirm-cancel">Cancel</button>
        <button type="button" class="confirm-btn danger" id="confirm-ok">Delete forever</button>
      </div>
    </div>
  </div>
  <div class="press-tip" id="press-tip"></div>
  <script>
    (function () {
      var REDESIGN_ACTION = {
        RESTORE: 'restore',
        REARCHIVE: 'rearchive',
        DELETE_FOREVER: 'delete_forever',
      };
      var modeConfig = {
        find: {
          showList: true,
          quickRight: 'Archive',
          quickLeft: 'Delete',
          quickRightIcon: '#i-archive',
          quickLeftIcon: '#i-trash',
          quickRightAction: 'archive',
          quickLeftAction: 'delete',
          showTextActions: false,
          scopeContextLabel: 'Auto-queued',
        },
        player: {
          showList: true,
          quickRight: 'Play Next',
          quickLeft: 'Archive',
          quickRightIcon: '#i-queue',
          quickLeftIcon: '#i-archive',
          quickRightAction: 'play_next',
          quickLeftAction: 'archive',
          showTextActions: true,
          scopeContextLabel: 'Playing',
        },
        deleted: {
          showList: true,
          quickRight: 'Restore',
          quickLeft: 'Delete Forever',
          quickRightIcon: '#i-check',
          quickLeftIcon: '#i-trash',
          quickRightAction: REDESIGN_ACTION.RESTORE,
          quickLeftAction: REDESIGN_ACTION.DELETE_FOREVER,
          showTextActions: false,
          scopeContextLabel: 'Trash',
        },
        settings: {
          showList: false,
          quickRight: 'Save',
          quickLeft: 'Reset',
          quickRightIcon: '#i-check',
          quickLeftIcon: '#i-trash',
          quickRightAction: 'save',
          quickLeftAction: 'reset',
          showTextActions: false,
          scopeContextLabel: 'Preferences',
        },
      };

      var seedItems = [
        { id: 'rw-1', title: 'NPR News: 10PM EST', source: 'readwise', sourceLabel: 'Readwise/Inbox', author: 'NPR', addedAt: '2026-02-23', publishedAt: '2026-02-23', durationMin: 4, thumb: 'NPR' },
        { id: 'rw-2', title: 'US-Iran Talks and China AI Race', source: 'readwise', sourceLabel: 'Readwise/Inbox', author: 'NPR', addedAt: '2026-02-22', publishedAt: '2026-02-22', durationMin: 14, thumb: 'UP' },
        { id: 'rw-3', title: 'One Battle For Democracy After Another', source: 'readwise', sourceLabel: 'Readwise/Feed', author: 'Vox', addedAt: '2026-02-21', publishedAt: '2026-02-21', durationMin: 26, thumb: 'VOX' },
        { id: 'gm-1', title: 'DealBook: 6 big tariff questions', source: 'gmail', sourceLabel: 'gmail/Subscription', author: 'Andrew Ross Sorkin', addedAt: '2026-02-23', publishedAt: '2026-02-23', durationMin: 12, thumb: 'NYT' },
        { id: 'gm-2', title: 'Intelligence should be owned, not rented', source: 'gmail', sourceLabel: 'gmail/AI', author: 'The Rundown AI', addedAt: '2026-02-22', publishedAt: '2026-02-22', durationMin: 9, thumb: 'AI' },
        { id: 'gm-3', title: 'Tariff Policy by the Numbers', source: 'gmail', sourceLabel: 'gmail/Finance', author: 'Paul Krugman', addedAt: '2026-02-20', publishedAt: '2026-02-20', durationMin: 16, thumb: 'PK' },
      ];

      var state = {
        mode: 'find',
        findSource: 'readwise',
        findPeriodPreset: '7d',
        findStartDate: '2026-02-17',
        findEndDate: '2026-02-24',
        findResults: [],
        playerQueue: [],
        deletedItems: [],
        selectedByMode: {
          find: new Set(),
          player: new Set(),
          deleted: new Set(),
        },
        searchByMode: { find: '', player: '', deleted: '' },
        sortByMode: { find: 'added', player: 'queue', deleted: 'deleted' },
        filterByMode: { find: 'all', player: 'all', deleted: 'all' },
        nowPlayingId: '',
        toasts: [],
        pendingConfirm: null,
      };

      var nowRef = new Date('2026-02-24T12:00:00Z');
      var modeSwitch = document.getElementById('mode-switch');
      var modeLabel = document.getElementById('mode-label');
      var toolsTitle = document.getElementById('tools-title');
      var countAll = document.getElementById('count-all');
      var countSelected = document.getElementById('count-selected');
      var countContext = document.getElementById('count-context');
      var findControls = document.getElementById('find-controls');
      var sourceSeg = document.getElementById('source-seg');
      var periodSeg = document.getElementById('period-seg');
      var customDates = document.getElementById('custom-dates');
      var findStartDate = document.getElementById('find-start-date');
      var findEndDate = document.getElementById('find-end-date');
      var runFindBtn = document.getElementById('run-find-btn');
      var openPlayerShortcut = document.getElementById('open-player-shortcut');
      var toolsSearch = document.getElementById('tools-search');
      var sortBtn = document.getElementById('sort-btn');
      var filterBtn = document.getElementById('filter-btn');
      var selectBtn = document.getElementById('select-btn');
      var bulkRow = document.getElementById('bulk-row');
      var bulkPrimary = document.getElementById('bulk-primary');
      var bulkSecondary = document.getElementById('bulk-secondary');
      var bulkDanger = document.getElementById('bulk-danger');
      var statusLine = document.getElementById('status-line');
      var findBanner = document.getElementById('find-banner');
      var findBannerText = document.getElementById('find-banner-text');
      var findBannerOpenPlayer = document.getElementById('find-banner-open-player');
      var toastWrap = document.getElementById('toast-wrap');
      var mockSettings = document.getElementById('mock-settings');
      var mockList = document.getElementById('mock-list');
      var bottomMini = document.getElementById('bottom-mini');
      var miniNowPlaying = document.getElementById('mini-now-playing');
      var miniPlayBtn = document.getElementById('mini-play-btn');
      var morePopover = document.getElementById('more-popover');
      var closePopover = document.getElementById('close-popover');
      var sheetList = document.getElementById('sheet-list');
      var hintOverlay = document.getElementById('hint-overlay');
      var hintDismiss = document.getElementById('hint-dismiss');
      var confirmOverlay = document.getElementById('confirm-overlay');
      var confirmTitle = document.getElementById('confirm-title');
      var confirmNote = document.getElementById('confirm-note');
      var confirmCancel = document.getElementById('confirm-cancel');
      var confirmOk = document.getElementById('confirm-ok');
      var pressTip = document.getElementById('press-tip');

      function itemCopy(item) {
        var next = {};
        Object.keys(item || {}).forEach(function(key) { next[key] = item[key]; });
        return next;
      }
      function dateVal(value) {
        if (!value) return 0;
        var t = Date.parse(value + 'T00:00:00Z');
        return Number.isFinite(t) ? t : 0;
      }
      function activeSelection() {
        if (state.mode === 'settings') return new Set();
        return state.selectedByMode[state.mode] || new Set();
      }
      function listForMode(mode) {
        if (mode === 'player') return state.playerQueue;
        if (mode === 'deleted') return state.deletedItems;
        return state.findResults;
      }
      function setListForMode(mode, nextList) {
        if (mode === 'player') state.playerQueue = nextList;
        else if (mode === 'deleted') state.deletedItems = nextList;
        else state.findResults = nextList;
      }
      function getPeriodDays(preset) {
        if (preset === '24h') return 1;
        if (preset === '3d') return 3;
        if (preset === '7d') return 7;
        if (preset === '14d') return 14;
        return 7;
      }
      function inFindWindow(item) {
        if (state.findPeriodPreset === 'custom') {
          var start = dateVal(state.findStartDate);
          var end = dateVal(state.findEndDate);
          var point = dateVal(item.addedAt || item.publishedAt);
          return point >= start && point <= end;
        }
        var days = getPeriodDays(state.findPeriodPreset);
        var cutoff = new Date(nowRef.getTime() - (days * 24 * 60 * 60 * 1000)).getTime();
        return dateVal(item.addedAt || item.publishedAt) >= cutoff;
      }
      function runFind() {
        var found = seedItems
          .filter(function(item) { return item.source === state.findSource; })
          .filter(inFindWindow)
          .map(function(item) {
            var out = itemCopy(item);
            out.from = state.findSource;
            return out;
          });
        state.findResults = found;
        state.selectedByMode.find = new Set();
        var existing = new Set(state.playerQueue.map(function(item) { return item.id; }));
        var added = 0;
        found.forEach(function(item) {
          if (!existing.has(item.id)) {
            state.playerQueue.push(itemCopy(item));
            existing.add(item.id);
            added += 1;
          }
        });
        findBannerText.textContent = 'Added ' + added + ' to Playlist.';
        findBanner.classList.add('show');
        showStatus('info', 'Find complete: source ' + state.findSource + ', period ' + state.findPeriodPreset + '.');
        render();
      }
      function getFiltered(list, mode) {
        var query = (state.searchByMode[mode] || '').toLowerCase().trim();
        var filter = state.filterByMode[mode] || 'all';
        var out = list.filter(function(item) {
          var searchable = (item.title + ' ' + item.author + ' ' + item.sourceLabel).toLowerCase();
          if (query && searchable.indexOf(query) === -1) return false;
          if (filter === 'readwise' && item.source !== 'readwise') return false;
          if (filter === 'gmail' && item.source !== 'gmail') return false;
          if (mode === 'player' && filter === 'downloaded' && !item.downloaded) return false;
          return true;
        });
        var sortMode = state.sortByMode[mode] || 'added';
        out.sort(function(a, b) {
          if (mode === 'player' && sortMode === 'queue') {
            return state.playerQueue.findIndex(function(it) { return it.id === a.id; }) - state.playerQueue.findIndex(function(it) { return it.id === b.id; });
          }
          if (sortMode === 'duration') return (a.durationMin || 0) - (b.durationMin || 0);
          if (sortMode === 'published') return dateVal(b.publishedAt) - dateVal(a.publishedAt);
          if (sortMode === 'deleted') return dateVal(b.deletedAt) - dateVal(a.deletedAt);
          return dateVal(b.addedAt) - dateVal(a.addedAt);
        });
        return out;
      }
      function filteredActiveItems() {
        return getFiltered(listForMode(state.mode), state.mode);
      }
      function selectionPayload() {
        var selected = activeSelection();
        var filtered = filteredActiveItems().map(function(item) { return item.id; });
        var effective = filtered.filter(function(id) { return selected.has(id); });
        return {
          selectedIds: Array.from(selected),
          filteredIds: filtered,
          effectiveIds: effective,
          serverValidated: effective.slice(),
        };
      }
      function showStatus(type, text) {
        statusLine.textContent = text || '';
        statusLine.classList.toggle('error', type === 'error');
      }
      function showUndoToast(text, undoFn) {
        var id = String(Date.now()) + Math.random().toString(16).slice(2);
        var expiresAt = Date.now() + 7000;
        state.toasts.push({ id: id, text: text, undoFn: undoFn, expiresAt: expiresAt });
        renderToasts();
        setTimeout(function() {
          state.toasts = state.toasts.filter(function(t) { return t.id !== id; });
          renderToasts();
        }, 7100);
      }
      function renderToasts() {
        if (!toastWrap) return;
        var html = '';
        var now = Date.now();
        state.toasts = state.toasts.filter(function(t) { return t.expiresAt > now; });
        state.toasts.forEach(function(toast) {
          html += '<div class="toast" data-toast-id="' + toast.id + '">' +
            '<span>' + escapeHtml(toast.text) + '</span>' +
            '<button type="button" data-toast-undo="' + toast.id + '">Undo</button>' +
            '</div>';
        });
        toastWrap.innerHTML = html;
      }
      function snapshotStateLists() {
        return {
          find: state.findResults.map(itemCopy),
          player: state.playerQueue.map(itemCopy),
          deleted: state.deletedItems.map(itemCopy),
        };
      }
      function restoreSnapshot(snapshot) {
        state.findResults = snapshot.find.map(itemCopy);
        state.playerQueue = snapshot.player.map(itemCopy);
        state.deletedItems = snapshot.deleted.map(itemCopy);
      }
      function idsToMap(items) {
        var set = new Set();
        items.forEach(function(item) { set.add(item.id); });
        return set;
      }
      function ensureModeSelectionSet(mode) {
        if (!state.selectedByMode[mode]) state.selectedByMode[mode] = new Set();
      }
      function clearMissingSelections() {
        ['find', 'player', 'deleted'].forEach(function(mode) {
          ensureModeSelectionSet(mode);
          var valid = idsToMap(listForMode(mode));
          state.selectedByMode[mode] = new Set(Array.from(state.selectedByMode[mode]).filter(function(id) {
            return valid.has(id);
          }));
        });
      }
      function removeByIds(list, idsSet) {
        return list.filter(function(item) { return !idsSet.has(item.id); });
      }
      function moveToDeletedByIds(ids, sourceMode) {
        var idsSet = new Set(ids);
        var fromList = listForMode(sourceMode);
        var removed = fromList.filter(function(item) { return idsSet.has(item.id); });
        if (!removed.length) return 0;
        setListForMode(sourceMode, removeByIds(fromList, idsSet));
        if (sourceMode !== 'player') {
          state.playerQueue = removeByIds(state.playerQueue, idsSet);
        }
        removed.forEach(function(item) {
          var out = itemCopy(item);
          out.deletedAt = '2026-02-24';
          state.deletedItems.unshift(out);
        });
        return removed.length;
      }
      function archiveByIds(ids, sourceMode) {
        var idsSet = new Set(ids);
        setListForMode(sourceMode, removeByIds(listForMode(sourceMode), idsSet));
        if (sourceMode === 'find') {
          state.playerQueue = removeByIds(state.playerQueue, idsSet);
        }
      }
      function restoreByIds(ids) {
        var idsSet = new Set(ids);
        var restored = state.deletedItems.filter(function(item) { return idsSet.has(item.id); });
        if (!restored.length) return 0;
        state.deletedItems = removeByIds(state.deletedItems, idsSet);
        var queueIds = idsToMap(state.playerQueue);
        restored.forEach(function(item) {
          if (!queueIds.has(item.id)) {
            state.playerQueue.unshift(itemCopy(item));
            queueIds.add(item.id);
          }
        });
        return restored.length;
      }
      function rearchiveByIds(ids) {
        var idsSet = new Set(ids);
        state.deletedItems = removeByIds(state.deletedItems, idsSet);
      }
      function deleteForeverByIds(ids) {
        var idsSet = new Set(ids);
        state.deletedItems = removeByIds(state.deletedItems, idsSet);
      }
      function nextAutoPlayTarget() {
        var filtered = getFiltered(state.playerQueue, 'player');
        var selected = state.selectedByMode.player || new Set();
        var selectedFiltered = filtered.filter(function(item) { return selected.has(item.id); });
        var pool = selectedFiltered.length ? selectedFiltered : filtered;
        if (!pool.length) return null;
        if (!state.nowPlayingId) return pool[0];
        var idx = pool.findIndex(function(item) { return item.id === state.nowPlayingId; });
        if (idx >= 0 && idx + 1 < pool.length) return pool[idx + 1];
        return null;
      }
      function withUndo(label, mutateFn) {
        var snapshot = snapshotStateLists();
        mutateFn();
        clearMissingSelections();
        showUndoToast(label, function () {
          restoreSnapshot(snapshot);
          clearMissingSelections();
          render();
          showStatus('info', 'Undid "' + label + '".');
        });
      }
      function openConfirm(title, message, onConfirm) {
        state.pendingConfirm = onConfirm;
        confirmTitle.textContent = title;
        confirmNote.textContent = message;
        confirmOverlay.classList.add('show');
        confirmOverlay.setAttribute('aria-hidden', 'false');
      }
      function closeConfirm() {
        if (document.activeElement && confirmOverlay.contains(document.activeElement) && typeof document.activeElement.blur === 'function') {
          document.activeElement.blur();
        }
        state.pendingConfirm = null;
        confirmOverlay.classList.remove('show');
        confirmOverlay.setAttribute('aria-hidden', 'true');
      }
      function actionSetForMode(mode) {
        if (mode === 'player') {
          return {
            expanded: ['play_pause', 'play_next', 'open', 'text', 'download', 'archive', 'delete'],
            trayRight: ['play_next', 'open', 'more'],
            trayLeft: ['archive', 'delete', 'more'],
          };
        }
        if (mode === 'deleted') {
          return {
            expanded: [REDESIGN_ACTION.RESTORE, REDESIGN_ACTION.REARCHIVE, REDESIGN_ACTION.DELETE_FOREVER, 'open', 'select'],
            trayRight: [REDESIGN_ACTION.RESTORE, REDESIGN_ACTION.REARCHIVE, 'more'],
            trayLeft: [REDESIGN_ACTION.DELETE_FOREVER, 'open', 'more'],
          };
        }
        return {
          expanded: ['play', 'open', 'archive', 'delete', 'select'],
          trayRight: ['archive', 'play', 'more'],
          trayLeft: ['delete', 'open', 'more'],
        };
      }
      function actionIcon(action, item) {
        if (action === 'open') return '#i-open';
        if (action === 'play' || action === 'play_next') return '#i-play';
        if (action === 'play_pause') return state.nowPlayingId === item.id ? '#i-pause' : '#i-play';
        if (action === 'text') return '#i-text';
        if (action === 'archive') return '#i-archive';
        if (action === 'delete') return '#i-trash';
        if (action === REDESIGN_ACTION.RESTORE) return '#i-check';
        if (action === REDESIGN_ACTION.REARCHIVE) return '#i-archive';
        if (action === REDESIGN_ACTION.DELETE_FOREVER) return '#i-trash';
        if (action === 'download') return '#i-download';
        if (action === 'select') return '#i-check';
        if (action === 'more') return '#i-more';
        return '#i-info';
      }
      function actionLabel(action, item) {
        if (action === 'open') return 'Open';
        if (action === 'play') return 'Play';
        if (action === 'play_pause') return state.nowPlayingId === item.id ? 'Pause' : 'Play';
        if (action === 'play_next') return 'Play Next';
        if (action === 'text') return 'Text';
        if (action === 'archive') return 'Archive';
        if (action === 'delete') return 'Delete';
        if (action === REDESIGN_ACTION.RESTORE) return 'Restore';
        if (action === REDESIGN_ACTION.REARCHIVE) return 'Re-archive';
        if (action === REDESIGN_ACTION.DELETE_FOREVER) return 'Delete Forever';
        if (action === 'download') return 'Download';
        if (action === 'select') return 'Select';
        if (action === 'more') return 'More';
        return action;
      }
      function actionClass(action) {
        if (action === 'archive' || action === REDESIGN_ACTION.RESTORE || action === REDESIGN_ACTION.REARCHIVE) return 'ok';
        if (action === 'play_next' || action === 'download') return 'warn';
        if (action === 'delete' || action === REDESIGN_ACTION.DELETE_FOREVER) return 'danger';
        return '';
      }
      function escapeHtml(value) {
        return String(value || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }
      function rowHtml(item) {
        var cfg = modeConfig[state.mode];
        var actions = actionSetForMode(state.mode);
        var selected = activeSelection().has(item.id);
        var rowClass = 'entry' + (selected ? ' selected' : '');
        var rightLabel = escapeHtml(cfg.quickRight);
        var leftLabel = escapeHtml(cfg.quickLeft);
        var showText = cfg.showTextActions;
        function buildBtn(action, cls, extraAttr) {
          if (action === 'text' && !showText) return '';
          var icon = actionIcon(action, item);
          var label = actionLabel(action, item);
          var kind = actionClass(action);
          return '<button type="button" class="' + cls + (kind ? ' ' + kind : '') + '" data-row-action="' + action + '" data-id="' + escapeHtml(item.id) + '" data-tip="' + escapeHtml(label) + '"' + (extraAttr || '') + '><svg class="i sm"><use href="' + icon + '"/></svg><span class="sr-only">' + escapeHtml(label) + '</span></button>';
        }
        var expanded = actions.expanded.map(function(action) { return buildBtn(action, 'cmd'); }).join('');
        var trayRight = actions.trayRight.map(function(action) {
          return buildBtn(action, 'tray-btn for-right');
        }).join('');
        var trayLeft = actions.trayLeft.map(function(action) {
          return buildBtn(action, 'tray-btn for-left');
        }).join('');
        return '' +
          '<article class="' + rowClass + '" data-id="' + escapeHtml(item.id) + '">' +
            '<div class="swipe-track">' +
              '<div class="lane right"><svg class="i sm"><use href="' + cfg.quickRightIcon + '"/></svg><span>' + rightLabel + '</span></div>' +
              '<div class="lane left' + (cfg.quickLeftAction === REDESIGN_ACTION.DELETE_FOREVER || cfg.quickLeftAction === 'delete' ? ' danger' : '') + '"><span>' + leftLabel + '</span><svg class="i sm"><use href="' + cfg.quickLeftIcon + '"/></svg></div>' +
            '</div>' +
            '<div class="entry-surface">' +
              '<button type="button" class="icon-btn" data-row-action="toggle-select" data-id="' + escapeHtml(item.id) + '" data-tip="Select">' +
                '<svg class="i sm"><use href="' + (selected ? '#i-check' : '#i-circle') + '"/></svg><span class="sr-only">Toggle selection</span>' +
              '</button>' +
              '<div class="thumb">' + escapeHtml(item.thumb || 'Item') + '</div>' +
              '<div>' +
                '<div class="entry-title">' + escapeHtml(item.title) + '</div>' +
                '<div class="entry-meta"><span class="meta-source">' + escapeHtml(item.sourceLabel) + '</span>' + escapeHtml(item.addedAt) + ' • ' + escapeHtml(String(item.durationMin || 0) + 'm') + '</div>' +
              '</div>' +
              '<button type="button" class="entry-open icon-btn" data-row-action="toggle-expand" data-id="' + escapeHtml(item.id) + '" data-tip="Expand"><svg class="i sm"><use href="#i-chevron-down"/></svg><span class="sr-only">Expand</span></button>' +
            '</div>' +
            '<div class="entry-expanded">' + expanded + '</div>' +
            '<div class="entry-reveal">' + trayRight + trayLeft + '</div>' +
          '</article>';
      }
      function renderRows() {
        if (state.mode === 'settings') {
          mockList.innerHTML = '';
          return;
        }
        var filtered = filteredActiveItems();
        if (!filtered.length) {
          mockList.innerHTML = '<div class="empty">No items for this filter.</div>';
          return;
        }
        mockList.innerHTML = filtered.map(rowHtml).join('');
        bindSwipeHandlers();
        applyIconTitles();
      }
      function applyIconTitles() {
        var buttons = document.querySelectorAll('.phone-shell [data-tip]');
        buttons.forEach(function(btn) {
          var tip = btn.getAttribute('data-tip') || '';
          btn.setAttribute('title', tip);
          btn.setAttribute('aria-label', tip);
        });
      }
      function setActiveMode(mode) {
        state.mode = modeConfig[mode] ? mode : 'find';
        modeLabel.textContent = state.mode.charAt(0).toUpperCase() + state.mode.slice(1);
        toolsTitle.textContent = state.mode === 'settings' ? 'Settings' : state.mode === 'player' ? 'Playlist' : state.mode === 'deleted' ? 'Deleted' : 'Find';
        var cfg = modeConfig[state.mode];
        document.querySelectorAll('.mode-btn').forEach(function(btn) {
          btn.classList.toggle('active', btn.getAttribute('data-mode') === state.mode);
        });
        toolsSearch.placeholder = state.mode === 'settings' ? 'Search settings' : 'Search title, author, source';
        toolsSearch.value = state.searchByMode[state.mode] || '';
        findControls.style.display = state.mode === 'find' ? '' : 'none';
        mockSettings.classList.toggle('show', state.mode === 'settings');
        mockList.style.display = cfg.showList ? '' : 'none';
        bottomMini.style.display = cfg.showList ? '' : 'none';
        bulkRow.style.display = cfg.showList ? 'grid' : 'none';
        sortBtn.style.display = cfg.showList ? '' : 'none';
        filterBtn.style.display = cfg.showList ? '' : 'none';
        selectBtn.style.display = cfg.showList ? '' : 'none';
        render();
        showStatus('info', 'Switched to ' + state.mode + ' mode.');
      }
      function renderCounts() {
        var cfg = modeConfig[state.mode];
        if (!cfg.showList) {
          countAll.textContent = 'All (filtered): 0';
          countSelected.textContent = 'Selected: 0';
          countContext.textContent = cfg.scopeContextLabel;
          return;
        }
        var filtered = filteredActiveItems();
        var selected = activeSelection();
        var selectedFiltered = filtered.filter(function(item) { return selected.has(item.id); }).length;
        countAll.textContent = 'All (filtered): ' + filtered.length;
        countSelected.textContent = 'Selected: ' + selectedFiltered;
        countContext.textContent = cfg.scopeContextLabel;
      }
      function updateBulkButtons() {
        if (!modeConfig[state.mode].showList) return;
        var payload = selectionPayload();
        var count = payload.effectiveIds.length;
        function setBtn(btn, action, icon, cls) {
          btn.className = 'bulk-btn ' + cls + ' icon-btn';
          btn.setAttribute('data-bulk-action', action);
          btn.setAttribute('data-tip', action + ' (' + count + ')');
          btn.innerHTML = '<svg class="i sm"><use href="' + icon + '"/></svg><span class="sr-only">' + action + ' (' + count + ')</span>';
        }
        if (state.mode === 'find') {
          setBtn(bulkPrimary, 'archive', '#i-archive', 'ok');
          setBtn(bulkSecondary, 'open', '#i-open', 'warn');
          setBtn(bulkDanger, 'delete', '#i-trash', 'danger');
        } else if (state.mode === 'player') {
          setBtn(bulkPrimary, 'play_next', '#i-queue', 'ok');
          setBtn(bulkSecondary, 'archive', '#i-archive', 'warn');
          setBtn(bulkDanger, 'delete', '#i-trash', 'danger');
        } else if (state.mode === 'deleted') {
          setBtn(bulkPrimary, REDESIGN_ACTION.RESTORE, '#i-check', 'ok');
          setBtn(bulkSecondary, REDESIGN_ACTION.REARCHIVE, '#i-archive', 'warn');
          setBtn(bulkDanger, REDESIGN_ACTION.DELETE_FOREVER, '#i-trash', 'danger');
        }
      }
      function renderMiniNowPlaying() {
        var current = state.playerQueue.find(function(item) { return item.id === state.nowPlayingId; });
        if (!current) {
          miniNowPlaying.textContent = 'Nothing playing';
          miniPlayBtn.innerHTML = '<svg class="i lg"><use href="#i-play"/></svg>';
          return;
        }
        miniNowPlaying.textContent = current.title;
        miniPlayBtn.innerHTML = '<svg class="i lg"><use href="#i-pause"/></svg>';
      }
      function render() {
        clearMissingSelections();
        renderCounts();
        updateBulkButtons();
        renderRows();
        renderToasts();
        renderMiniNowPlaying();
      }
      function openMoreSheet(itemId) {
        var mode = state.mode;
        var item = listForMode(mode).find(function(it) { return it.id === itemId; });
        if (!item) return;
        var actions = actionSetForMode(mode).expanded;
        var html = '';
        actions.forEach(function(action) {
          if (action === 'text' && !modeConfig[mode].showTextActions) return;
          var label = actionLabel(action, item);
          var icon = actionIcon(action, item);
          var klass = actionClass(action);
          html += '<button class="sheet-btn' + (klass ? ' ' + klass : '') + '" data-row-action="' + action + '" data-id="' + escapeHtml(itemId) + '"><span class="icon-row"><svg class="i sm"><use href="' + icon + '"/></svg>' + escapeHtml(label) + '</span><svg class="i sm"><use href="#i-arrow-right"/></svg></button>';
        });
        sheetList.innerHTML = html || '<div class="empty">No actions.</div>';
        morePopover.classList.add('show');
      }
      function closeMoreSheet() {
        if (document.activeElement && morePopover.contains(document.activeElement) && typeof document.activeElement.blur === 'function') {
          document.activeElement.blur();
        }
        morePopover.classList.remove('show');
      }
      function performAction(action, ids, options) {
        var mode = options && options.mode ? options.mode : state.mode;
        if (!ids || !ids.length) {
          showStatus('error', 'No selected + filtered items for this action.');
          return;
        }
        if (action === 'open') {
          showStatus('info', 'Open requested for ' + ids.length + ' item(s).');
          return;
        }
        if (action === 'play') {
          state.nowPlayingId = ids[0];
          showStatus('info', 'Playing selected item.');
          renderMiniNowPlaying();
          return;
        }
        if (action === 'play_pause') {
          var id = ids[0];
          state.nowPlayingId = state.nowPlayingId === id ? '' : id;
          showStatus('info', state.nowPlayingId ? 'Playback started.' : 'Playback paused.');
          renderMiniNowPlaying();
          return;
        }
        if (action === 'download') {
          var queueIds = new Set(ids);
          state.playerQueue = state.playerQueue.map(function(item) {
            var next = itemCopy(item);
            if (queueIds.has(next.id)) next.downloaded = true;
            return next;
          });
          showStatus('info', 'Marked ' + ids.length + ' item(s) as downloaded.');
          render();
          return;
        }
        if (action === 'play_next') {
          var moveId = ids[0];
          var row = state.playerQueue.find(function(item) { return item.id === moveId; });
          state.playerQueue = state.playerQueue.filter(function(item) { return item.id !== moveId; });
          if (row) state.playerQueue.unshift(row);
          showStatus('info', 'Queued item to play next.');
          render();
          return;
        }
        if (action === 'text') {
          showStatus('info', 'Text preview opened (Player only).');
          return;
        }
        if (action === 'archive') {
          withUndo('Archive ' + ids.length + ' item(s)', function () {
            archiveByIds(ids, mode);
          });
          showStatus('info', 'Archived ' + ids.length + ' item(s).');
          render();
          return;
        }
        if (action === 'delete') {
          withUndo('Delete ' + ids.length + ' item(s)', function () {
            moveToDeletedByIds(ids, mode);
          });
          showStatus('info', 'Moved ' + ids.length + ' item(s) to Deleted.');
          render();
          return;
        }
        if (action === REDESIGN_ACTION.RESTORE) {
          withUndo('Restore ' + ids.length + ' item(s)', function () {
            restoreByIds(ids);
          });
          showStatus('info', 'Restored ' + ids.length + ' item(s).');
          render();
          return;
        }
        if (action === REDESIGN_ACTION.REARCHIVE) {
          withUndo('Re-archive ' + ids.length + ' item(s)', function () {
            rearchiveByIds(ids);
          });
          showStatus('info', 'Re-archived ' + ids.length + ' item(s).');
          render();
          return;
        }
        if (action === REDESIGN_ACTION.DELETE_FOREVER) {
          openConfirm('Delete forever?', 'Delete ' + ids.length + ' selected item(s) forever? This cannot be undone.', function () {
            deleteForeverByIds(ids);
            clearMissingSelections();
            showStatus('info', 'Deleted forever: ' + ids.length + ' item(s).');
            render();
          });
          return;
        }
      }
      function handleRowAction(action, itemId) {
        var mode = state.mode;
        var selected = activeSelection();
        if (action === 'toggle-select') {
          if (selected.has(itemId)) selected.delete(itemId); else selected.add(itemId);
          render();
          return;
        }
        if (action === 'toggle-expand') {
          var row = mockList.querySelector('.entry[data-id="' + itemId + '"]');
          if (row) {
            row.classList.toggle('expanded');
            row.classList.remove('reveal-left');
            row.classList.remove('reveal-right');
            var surface = row.querySelector('.entry-surface');
            if (surface) surface.style.transform = 'translateX(0px)';
          }
          return;
        }
        if (action === 'select') {
          if (selected.has(itemId)) selected.delete(itemId); else selected.add(itemId);
          render();
          return;
        }
        if (action === 'more') {
          openMoreSheet(itemId);
          return;
        }
        performAction(action, [itemId], { mode: mode });
      }
      function bindSwipeHandlers() {
        var rows = mockList.querySelectorAll('.entry');
        rows.forEach(function(row) {
          var surface = row.querySelector('.entry-surface');
          if (!surface) return;
          var pointer = { active: false, startX: 0, deltaX: 0 };
          function resetRow() {
            row.classList.remove('reveal-left');
            row.classList.remove('reveal-right');
            surface.style.transform = 'translateX(0px)';
          }
          surface.addEventListener('pointerdown', function(evt) {
            if (evt.target && evt.target.closest && evt.target.closest('button')) return;
            pointer.active = true;
            pointer.startX = evt.clientX;
            pointer.deltaX = 0;
            row.classList.add('dragging');
            rows.forEach(function(other) {
              if (other !== row) {
                other.classList.remove('reveal-left');
                other.classList.remove('reveal-right');
                var s = other.querySelector('.entry-surface');
                if (s) s.style.transform = 'translateX(0px)';
              }
            });
            surface.setPointerCapture(evt.pointerId);
          });
          surface.addEventListener('pointermove', function(evt) {
            if (!pointer.active) return;
            pointer.deltaX = evt.clientX - pointer.startX;
            if (pointer.deltaX > 160) pointer.deltaX = 160;
            if (pointer.deltaX < -160) pointer.deltaX = -160;
            surface.style.transform = 'translateX(' + pointer.deltaX + 'px)';
          });
          function finishSwipe() {
            if (!pointer.active) return;
            pointer.active = false;
            row.classList.remove('dragging');
            var abs = Math.abs(pointer.deltaX);
            var id = row.getAttribute('data-id');
            var cfg = modeConfig[state.mode];
            if (abs < 50) {
              resetRow();
              return;
            }
            if (abs < 110) {
              resetRow();
              var quick = pointer.deltaX > 0 ? cfg.quickRightAction : cfg.quickLeftAction;
              if (quick === REDESIGN_ACTION.DELETE_FOREVER) {
                handleRowAction(REDESIGN_ACTION.DELETE_FOREVER, id);
              } else {
                handleRowAction(quick, id);
              }
              return;
            }
            if (pointer.deltaX > 0) {
              row.classList.add('reveal-right');
              surface.style.transform = 'translateX(108px)';
            } else {
              row.classList.add('reveal-left');
              surface.style.transform = 'translateX(-108px)';
            }
          }
          surface.addEventListener('pointerup', finishSwipe);
          surface.addEventListener('pointercancel', function() {
            pointer.active = false;
            row.classList.remove('dragging');
            resetRow();
          });
        });
      }
      function cycleSortMode() {
        var mode = state.mode;
        if (mode === 'settings') return;
        var options = mode === 'player' ? ['queue', 'added', 'duration'] : mode === 'deleted' ? ['deleted', 'added', 'published'] : ['added', 'published', 'duration'];
        var current = state.sortByMode[mode] || options[0];
        var idx = options.indexOf(current);
        var next = options[(idx + 1) % options.length];
        state.sortByMode[mode] = next;
        showStatus('info', 'Sort: ' + next + '.');
        render();
      }
      function cycleFilterMode() {
        var mode = state.mode;
        if (mode === 'settings') return;
        var options = mode === 'player' ? ['all', 'downloaded', 'readwise', 'gmail'] : ['all', 'readwise', 'gmail'];
        var current = state.filterByMode[mode] || options[0];
        var idx = options.indexOf(current);
        var next = options[(idx + 1) % options.length];
        state.filterByMode[mode] = next;
        showStatus('info', 'Filter: ' + next + '.');
        render();
      }
      function toggleSelectFiltered() {
        if (!modeConfig[state.mode].showList) return;
        var filtered = filteredActiveItems();
        var selected = activeSelection();
        var allSelected = filtered.length && filtered.every(function(item) { return selected.has(item.id); });
        filtered.forEach(function(item) {
          if (allSelected) selected.delete(item.id);
          else selected.add(item.id);
        });
        showStatus('info', allSelected ? 'Cleared filtered selection.' : 'Selected filtered items.');
        render();
      }
      function handleBulkAction(action) {
        var payload = selectionPayload();
        if (!payload.effectiveIds.length) {
          showStatus('error', 'Select filtered items first. Bulk scope is selected + filtered only.');
          return;
        }
        performAction(action, payload.effectiveIds, { mode: state.mode });
      }
      function initHintOverlay() {
        var key = 'readflow_mobile_redesign_hint_v1';
        var show = true;
        try {
          show = localStorage.getItem(key) !== 'dismissed';
        } catch (err) {}
        if (show) {
          hintOverlay.classList.add('show');
          hintOverlay.setAttribute('aria-hidden', 'false');
        }
        hintDismiss.addEventListener('click', function() {
          if (document.activeElement && hintOverlay.contains(document.activeElement) && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
          }
          try { localStorage.setItem(key, 'dismissed'); } catch (err) {}
          hintOverlay.classList.remove('show');
          hintOverlay.setAttribute('aria-hidden', 'true');
        });
      }
      function initLongPressTips() {
        var timer = null;
        var targetBtn = null;
        function clearTip() {
          if (timer) clearTimeout(timer);
          timer = null;
          targetBtn = null;
          pressTip.classList.remove('show');
        }
        document.addEventListener('pointerdown', function(evt) {
          var btn = evt.target && evt.target.closest ? evt.target.closest('[data-tip]') : null;
          if (!btn) return;
          targetBtn = btn;
          timer = setTimeout(function() {
            if (!targetBtn) return;
            var rect = targetBtn.getBoundingClientRect();
            pressTip.textContent = targetBtn.getAttribute('data-tip') || '';
            pressTip.style.left = String(rect.left + rect.width / 2) + 'px';
            pressTip.style.top = String(rect.top - 10) + 'px';
            pressTip.classList.add('show');
          }, 560);
        });
        document.addEventListener('pointerup', clearTip);
        document.addEventListener('pointercancel', clearTip);
        document.addEventListener('pointerleave', clearTip);
      }
      function initEvents() {
        modeSwitch.addEventListener('click', function(evt) {
          var btn = evt.target && evt.target.closest ? evt.target.closest('.mode-btn') : null;
          if (!btn) return;
          setActiveMode(btn.getAttribute('data-mode'));
        });
        sourceSeg.addEventListener('click', function(evt) {
          var btn = evt.target && evt.target.closest ? evt.target.closest('[data-source]') : null;
          if (!btn) return;
          state.findSource = btn.getAttribute('data-source');
          sourceSeg.querySelectorAll('.seg-btn').forEach(function(node) { node.classList.toggle('active', node === btn); });
        });
        periodSeg.addEventListener('click', function(evt) {
          var btn = evt.target && evt.target.closest ? evt.target.closest('[data-period]') : null;
          if (!btn) return;
          state.findPeriodPreset = btn.getAttribute('data-period');
          periodSeg.querySelectorAll('.seg-btn').forEach(function(node) { node.classList.toggle('active', node === btn); });
          customDates.classList.toggle('show', state.findPeriodPreset === 'custom');
        });
        findStartDate.addEventListener('change', function() {
          state.findStartDate = findStartDate.value || state.findStartDate;
        });
        findEndDate.addEventListener('change', function() {
          state.findEndDate = findEndDate.value || state.findEndDate;
        });
        runFindBtn.addEventListener('click', function() {
          runFind();
        });
        openPlayerShortcut.addEventListener('click', function() {
          setActiveMode('player');
        });
        toolsSearch.addEventListener('input', function() {
          state.searchByMode[state.mode] = toolsSearch.value || '';
          render();
        });
        sortBtn.addEventListener('click', cycleSortMode);
        filterBtn.addEventListener('click', cycleFilterMode);
        selectBtn.addEventListener('click', toggleSelectFiltered);
        bulkPrimary.addEventListener('click', function() { handleBulkAction(bulkPrimary.getAttribute('data-bulk-action')); });
        bulkSecondary.addEventListener('click', function() { handleBulkAction(bulkSecondary.getAttribute('data-bulk-action')); });
        bulkDanger.addEventListener('click', function() { handleBulkAction(bulkDanger.getAttribute('data-bulk-action')); });
        findBannerOpenPlayer.addEventListener('click', function() { setActiveMode('player'); });
        miniPlayBtn.addEventListener('click', function() {
          if (!state.playerQueue.length) {
            showStatus('error', 'Player queue is empty.');
            return;
          }
          var next = state.nowPlayingId ? nextAutoPlayTarget() : state.playerQueue[0];
          if (!next) {
            state.nowPlayingId = '';
            showStatus('info', 'Playback paused.');
          } else {
            state.nowPlayingId = next.id;
            showStatus('info', 'Now playing: ' + next.title);
          }
          renderMiniNowPlaying();
        });
        mockList.addEventListener('click', function(evt) {
          var btn = evt.target && evt.target.closest ? evt.target.closest('[data-row-action]') : null;
          if (!btn) return;
          var action = btn.getAttribute('data-row-action');
          var id = btn.getAttribute('data-id');
          handleRowAction(action, id);
        });
        mockList.addEventListener('click', function(evt) {
          var tray = evt.target && evt.target.closest ? evt.target.closest('.tray-btn') : null;
          if (!tray) return;
          var row = tray.closest('.entry');
          if (row) {
            row.classList.remove('reveal-left');
            row.classList.remove('reveal-right');
            var surface = row.querySelector('.entry-surface');
            if (surface) surface.style.transform = 'translateX(0px)';
          }
        });
        closePopover.addEventListener('click', closeMoreSheet);
        morePopover.addEventListener('click', function(evt) {
          if (evt.target === morePopover) closeMoreSheet();
        });
        sheetList.addEventListener('click', function(evt) {
          var btn = evt.target && evt.target.closest ? evt.target.closest('[data-row-action]') : null;
          if (!btn) return;
          var action = btn.getAttribute('data-row-action');
          var id = btn.getAttribute('data-id');
          closeMoreSheet();
          handleRowAction(action, id);
        });
        toastWrap.addEventListener('click', function(evt) {
          var undoBtn = evt.target && evt.target.closest ? evt.target.closest('[data-toast-undo]') : null;
          if (!undoBtn) return;
          var id = undoBtn.getAttribute('data-toast-undo');
          var toast = state.toasts.find(function(t) { return t.id === id; });
          if (!toast) return;
          state.toasts = state.toasts.filter(function(t) { return t.id !== id; });
          renderToasts();
          if (toast.undoFn) toast.undoFn();
        });
        confirmCancel.addEventListener('click', closeConfirm);
        confirmOk.addEventListener('click', function() {
          if (state.pendingConfirm) state.pendingConfirm();
          closeConfirm();
        });
      }

      runFind();
      initEvents();
      initHintOverlay();
      initLongPressTips();
      setActiveMode('find');
      render();
    })();
  </script>
</body>
</html>`;

const HTML_APP = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="mobile-web-app-capable" content="yes">
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
      grid-template-columns: 332px minmax(0, 1fr);
      min-height: 100vh;
    }
    .player-rail-compact .app-shell {
      grid-template-columns: 316px minmax(0, 1fr);
    }
    .left-rail {
      border-right: 1px solid var(--border);
      background: #eef3fa;
      padding: 0.9rem 0.7rem 0.6rem;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      scrollbar-gutter: stable;
      display: flex;
      flex-direction: column;
    }
    .main-pane {
      min-width: 0;
      padding: 0.7rem 0.95rem 1.2rem;
      height: 100vh;
      overflow-y: auto;
      scrollbar-gutter: stable both-edges;
      background: radial-gradient(circle at 8% 10%, #f9fcff 0%, #f4f8fc 45%, #f3f7fb 100%);
    }
    .main-inner {
      max-width: none;
      margin: 0;
      height: 100%;
      min-height: 0;
    }
    #cleanup-tab {
      height: 100%;
      min-height: 0;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      gap: 0.8rem;
    }
    .rail-brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.45rem;
      font-weight: 700;
      font-size: 1.2rem;
      color: #1f2937;
      padding: 0.35rem 0.5rem 1rem;
    }
    .brand-title {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      min-width: 0;
      flex: 1;
    }
    .brand-version {
      display: inline-flex;
      align-items: center;
      gap: 0.22rem;
      font-size: 0.67rem;
      line-height: 1;
      color: #475569;
      border: 1px solid #c9d8ea;
      background: #f8fbff;
      border-radius: 999px;
      padding: 0.18rem 0.4rem;
      font-weight: 600;
      white-space: nowrap;
      text-decoration: none;
      margin-left: auto;
      cursor: pointer;
    }
    .brand-version:hover {
      border-color: #9db9dc;
      background: #eef6ff;
      color: #0f4f9e;
    }
    .brand-version-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--primary);
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
      overflow: visible;
    }
    .left-rail .rail-docked-control {
      margin-bottom: 0.6rem;
      padding: 0.9rem;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      overflow: visible;
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
      padding: 0.58rem 0.58rem;
      border-radius: 12px;
      border: 1px solid #c8d6e8;
      background: #ffffff;
      color: #0f172a;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      margin-bottom: 0;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.09);
    }
    .rail-item.active {
      background: #0f4f9e;
      border-color: #0f4f9e;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(15, 79, 158, 0.32);
    }
    .rail-item:hover {
      background: #eef5ff;
      border-color: #87a8ce;
    }
    .rail-item.active .badge {
      background: #ffffff;
      color: #0f4f9e;
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
    .field-label-with-icon {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .field-label-icon {
      width: 16px;
      height: 16px;
      border-radius: 5px;
      border: 1px solid #c9d8ea;
      background: #f4f8ff;
      position: relative;
      flex: 0 0 auto;
    }
    .field-label-icon::after {
      content: '';
      position: absolute;
      inset: 0;
      background-color: #0f4f9e;
      mask-repeat: no-repeat;
      mask-position: center;
      mask-size: 11px 11px;
      -webkit-mask-repeat: no-repeat;
      -webkit-mask-position: center;
      -webkit-mask-size: 11px 11px;
    }
    .field-label-icon.source::after {
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='black' d='M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5zM7.2 8.2h9.6v1.6H7.2zm0 3.3h9.6v1.6H7.2zm0 3.3h6.5v1.6H7.2z'/%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='black' d='M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5zM7.2 8.2h9.6v1.6H7.2zm0 3.3h9.6v1.6H7.2zm0 3.3h6.5v1.6H7.2z'/%3E%3C/svg%3E");
    }
    .field-label-icon.calendar::after {
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='black' d='M7 2h2v2h6V2h2v2h1.5A2.5 2.5 0 0 1 21 6.5v12a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-12A2.5 2.5 0 0 1 5.5 4H7zm12 8H5v8.5c0 .55.45 1 1 1h12c.55 0 1-.45 1-1z'/%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='black' d='M7 2h2v2h6V2h2v2h1.5A2.5 2.5 0 0 1 21 6.5v12a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-12A2.5 2.5 0 0 1 5.5 4H7zm12 8H5v8.5c0 .55.45 1 1 1h12c.55 0 1-.45 1-1z'/%3E%3C/svg%3E");
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
    .decor-select {
      background-image: linear-gradient(45deg, transparent 50%, #64748b 50%), linear-gradient(135deg, #64748b 50%, transparent 50%);
      background-position: calc(100% - 18px) calc(50% + 2px), calc(100% - 13px) calc(50% + 2px);
      background-size: 5px 5px, 5px 5px;
      background-repeat: no-repeat;
      padding-right: 2rem;
      appearance: none;
    }
    .decor-date {
      padding-right: 2rem;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='15' height='15' viewBox='0 0 24 24'%3E%3Cpath fill='%2364748b' d='M7 2h2v2h6V2h2v2h1.5A2.5 2.5 0 0 1 21 6.5v12a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-12A2.5 2.5 0 0 1 5.5 4H7zm12 8H5v8.5c0 .55.45 1 1 1h12c.55 0 1-.45 1-1z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: calc(100% - 10px) center;
      background-size: 15px 15px;
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
      height: 100%;
      max-height: none;
      overflow-y: auto;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.25rem;
      background: #fff;
    }
    .player-row-progress {
      position: relative;
      margin-top: 0.35rem;
      height: 4px;
      background: var(--border);
      border-radius: 999px;
      overflow: hidden;
    }
    .player-row-progress-downloaded {
      position: absolute;
      inset: 0 auto 0 0;
      height: 100%;
      width: 0%;
      background: #22c55e;
    }
    .player-row-progress-fill {
      position: absolute;
      inset: 0 auto 0 0;
      height: 100%;
      width: 0%;
      background: var(--primary);
    }
    .player-row-actions {
      display: inline-flex;
      align-items: center;
      gap: 0.28rem;
    }
    .player-row-action-btn {
      margin-left: 0;
      min-width: 1.9rem;
      padding: 0.06rem 0.42rem;
      font-size: 0.78rem;
    }
    .player-row-action-btn.is-done {
      border-color: #22c55e;
      color: #166534;
      background: #ecfdf3;
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
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.16rem;
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
      display: block;
      font-size: 0.66rem;
      line-height: 1;
    }
    #player-controls-right-host .control-icon {
      font-size: 1.58rem;
    }
    #player-controls-right-host .player-icon-btn {
      min-height: 42px;
      padding: 0.36rem 0.24rem;
    }
    #player-controls-right-host .player-title-controls {
      margin-left: auto;
      justify-content: flex-end;
    }
    #player-controls-left-host .player-controls-row {
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 0.32rem;
    }
    #player-controls-left-host .player-icon-btn {
      min-height: 38px;
      padding: 0.22rem 0.16rem;
    }
    #player-controls-left-host .control-icon {
      font-size: 1.08rem;
    }
    #player-controls-left-host .control-text {
      font-size: 0.6rem;
    }
    #player-controls-left-host #player-controls {
      margin-top: 0;
      padding: 0.85rem;
    }
    #player-controls-left-host .player-title-controls {
      width: 100%;
      justify-content: flex-start;
      gap: 0.35rem;
    }
    #player-controls-left-host #player-speed {
      min-width: 72px;
      max-width: 88px;
    }
    #player-controls-left-host #player-audio {
      margin-top: 0.3rem;
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
    .floating-player-hover {
      position: fixed;
      left: 1rem;
      bottom: 1rem;
      z-index: 90;
      display: none;
      align-items: center;
      gap: 0.45rem;
      max-width: min(460px, calc(100vw - 1.4rem));
      padding: 0.38rem 0.45rem 0.38rem 0.52rem;
      border: 1px solid #2f4567;
      border-radius: 999px;
      background: #0f203a;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.34);
      transition: opacity 0.18s ease, transform 0.18s ease;
      opacity: 0;
      transform: translateY(8px);
      pointer-events: none;
    }
    .floating-player-hover.is-visible {
      display: inline-flex;
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
    .floating-player-status {
      display: inline-flex;
      align-items: center;
      gap: 0.42rem;
      min-width: 0;
      font-size: 0.8rem;
      color: #f5f9ff;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .floating-player-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex: 0 0 auto;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.08);
      background: #ef4444;
    }
    .floating-player-dot.is-playing {
      background: #22c55e;
    }
    .floating-player-actions {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      flex: 0 0 auto;
    }
    .floating-player-btn {
      border: 1px solid #3b4f73;
      background: #1a3156;
      color: #fff;
      border-radius: 8px;
      min-width: 30px;
      min-height: 30px;
      line-height: 1;
      padding: 0.2rem 0.45rem;
      cursor: pointer;
    }
    .floating-player-open {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.2rem 0.52rem;
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
    .recent-errors-wrap {
      margin-top: 1rem;
      border-top: 1px solid var(--border);
      padding-top: 0.9rem;
    }
    .recent-errors-list {
      margin-top: 0.6rem;
      max-height: 240px;
      overflow-y: auto;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: #fff;
    }
    .recent-error-item {
      padding: 0.55rem 0.65rem;
      border-bottom: 1px solid var(--border);
      font-size: 0.83rem;
      line-height: 1.35;
    }
    .recent-error-item:last-child { border-bottom: none; }
    .recent-error-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 0.18rem;
      color: var(--text-muted);
      font-size: 0.74rem;
    }
    .recent-error-tag {
      font-weight: 700;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: var(--danger);
    }
    .recent-error-tag.warning { color: #b45309; }
    .recent-errors-empty {
      color: var(--text-muted);
      font-size: 0.82rem;
      padding: 0.75rem 0.2rem 0.1rem;
    }
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
      margin-bottom: 0;
      flex-wrap: wrap;
    }
    #preview-top-toolbar {
      position: sticky;
      top: 0;
      z-index: 8;
      background: var(--card);
      padding: 0.2rem 0 0.55rem;
      margin-bottom: 0.58rem;
      border-bottom: 1px solid var(--border);
      display: grid;
      gap: 0.52rem;
    }
    .preview-top-controls > * {
      min-width: 0;
    }
    .preview-actions {
      display: inline-flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      flex: 1 1 auto;
      min-width: 0;
      justify-content: flex-start;
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
    .results-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.45rem;
    }
    .results-summary {
      display: inline-flex;
      gap: 0.35rem;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .results-pill {
      border: 1px solid #c7d8ec;
      background: #e9f2ff;
      color: #0f4f9e;
      font-size: 0.74rem;
      font-weight: 600;
      border-radius: 999px;
      padding: 0.18rem 0.5rem;
      white-space: nowrap;
    }
    #results-card {
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      margin-bottom: 0;
    }
    #preview-list {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      scrollbar-gutter: stable both-edges;
      padding-right: 0.3rem;
    }
    #deleted-tab {
      min-height: 100%;
      display: grid;
      grid-template-rows: minmax(0, 1fr);
      gap: 0;
    }
    #deleted-controls-main-host {
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
    #deleted-tab .card {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      margin-bottom: 0;
    }
    #deleted-controls-card .history-actions-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.55rem;
      margin-top: 0.5rem;
      margin-bottom: 0;
    }
    #deleted-controls-card .history-actions-grid .btn {
      margin: 0;
    }
    #deleted-controls-card .preview-top-controls {
      margin-top: 0;
      margin-bottom: 0;
    }
    #deleted-top-toolbar {
      position: sticky;
      top: 0;
      z-index: 8;
      background: var(--card);
      padding: 0.2rem 0 0.55rem;
      margin-bottom: 0.58rem;
      border-bottom: 1px solid var(--border);
    }
    #deleted-list {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      scrollbar-gutter: stable both-edges;
      padding-right: 0.3rem;
      margin-top: 0;
      border-top: none;
      padding-top: 0;
    }
    #player-tab {
      min-height: 100%;
      display: grid;
      grid-template-rows: minmax(0, 1fr);
    }
    #player-tab .card {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      margin-bottom: 0;
    }
    #player-queue {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      scrollbar-gutter: stable both-edges;
      padding-right: 0.3rem;
      margin-top: 0.8rem;
    }
    .player-status {
      color: var(--text-muted);
      margin-bottom: 0.6rem;
    }
    .player-status.is-error {
      color: #b91c1c;
      font-weight: 600;
    }
    .player-feedback {
      min-height: 1.1rem;
      margin-top: 0.45rem;
      font-size: 0.82rem;
      color: #b91c1c;
      font-weight: 600;
    }
    .player-current-progress {
      position: relative;
      margin-top: 0.4rem;
      height: 4px;
      background: #dbe7f4;
      border-radius: 999px;
      overflow: hidden;
      cursor: pointer;
    }
    .player-current-progress-downloaded {
      position: absolute;
      inset: 0 auto 0 0;
      height: 100%;
      width: 0%;
      background: #22c55e;
    }
    .player-current-progress-fill {
      position: absolute;
      inset: 0 auto 0 0;
      height: 100%;
      width: 0%;
      background: var(--primary);
      transition: width 0.15s linear;
    }
    .player-download-status {
      color: var(--text-muted);
      font-size: 0.75rem;
      margin-top: 0.3rem;
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
        display: block;
      }
      #deleted-controls-card .history-actions-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      #deleted-controls-card .history-actions-grid .btn:nth-child(3) {
        grid-column: 1 / -1;
      }
      #deleted-top-controls {
        align-items: stretch;
      }
      #deleted-top-controls .preview-search-wrap {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        width: 100%;
        min-width: 0;
        max-width: none;
      }
      #deleted-top-controls .preview-search {
        width: 100%;
        min-width: 0;
        max-width: none;
      }
      #deleted-top-controls .sort-toggle {
        grid-column: 1 / -1;
        width: 100%;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        border-radius: 12px;
      }
      #deleted-top-controls .sort-toggle button {
        min-width: 0;
        text-align: center;
      }
    }
    @media (max-width: 1024px) {
      body {
        overflow-y: auto;
      }
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
        grid-template-columns: repeat(4, minmax(0, 1fr));
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
        font-size: 0.97rem;
        gap: 0.35rem;
        padding: 0.2rem 0.35rem 0.5rem;
      }
      .rail-brand .logo {
        width: 24px;
        height: 24px;
      }
      .brand-version {
        font-size: 0.62rem;
        padding: 0.16rem 0.34rem;
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
      .results-top {
        flex-direction: column;
        align-items: flex-start;
      }
      .results-summary {
        justify-content: flex-start;
      }
      .floating-player-hover {
        left: 0.55rem;
        right: 0.55rem;
        bottom: 0.55rem;
        max-width: none;
        width: auto;
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
          <span class="brand-title">
            <span>Read Flow</span>
          </span>
          <a class="brand-version" id="version-history-link" href="/about" title="Version ${APP_VERSION}"><span class="brand-version-dot"></span>v${APP_VERSION}</a>
        </div>
        <div class="rail-section">
          <a class="rail-item tab active" data-tab="cleanup" href="/">Find <span id="cleanup-selected-count" class="badge" style="display:none">0</span></a>
          <a class="rail-item tab" data-tab="player" href="/player">Player <span id="player-selected-count" class="badge" style="display:none">0</span></a>
          <a class="rail-item tab" data-tab="deleted" href="/deleted">History <span id="deleted-count" class="badge" style="display:none">0</span></a>
          <a class="rail-item tab" data-tab="settings" href="/settings">Settings</a>
        </div>
        <a class="tab" data-tab="about" href="/about" style="display:none" aria-hidden="true">About</a>
        <div id="cleanup-controls-left-host" class="rail-controls-host"></div>
        <div id="cleanup-controls" style="display:none"></div>
        <div id="deleted-controls" style="display:none"></div>
        <div id="player-controls-left-host" class="rail-controls-host" style="display:none">
        <div id="player-controls" class="card" style="display:none;margin-top:0.8rem;">
          <div class="player-title-row">
            <h2 style="margin-bottom:0;">Audio Player</h2>
            <div class="player-title-controls">
              <label for="player-speed" style="margin:0; font-size:0.82rem;">Speed</label>
              <select id="player-speed" style="width:auto; min-width: 84px; padding: 0.32rem 0.5rem;">
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
          <p id="player-status" class="player-status">Queue is empty.</p>
          <p id="player-tts-mode" style="display:none; color: var(--text-muted); margin-bottom: 0.4rem; font-size: 0.82rem;">TTS mode: mock clip</p>
          <div id="player-current-header" class="player-current-header" style="display:none;">
            <img id="player-current-thumb" class="preview-thumb" alt="" loading="lazy" referrerpolicy="no-referrer" style="display:none;">
            <span id="player-current-thumb-fallback" class="preview-thumb-fallback" style="display:none;">No image</span>
            <div class="player-current-meta">
              <div id="player-current-title" style="font-weight:600;"></div>
              <div id="player-current-author" class="article-meta"></div>
              <div id="player-current-progress" class="player-current-progress">
                <div id="player-current-progress-downloaded" class="player-current-progress-downloaded"></div>
                <div id="player-current-progress-fill" class="player-current-progress-fill"></div>
              </div>
              <p id="player-download-status" class="player-download-status"></p>
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
          <audio id="player-audio" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;"></audio>
          <p id="player-feedback" class="player-feedback"></p>
        </div>
        </div>
      </aside>
      <main class="main-pane" id="main-pane">
        <div class="main-inner">
    <div id="cleanup-tab">
      <div id="cleanup-controls-right-host"></div>
      <div id="cleanup-main-controls" class="card">
        <h2>Find</h2>
        <div class="form-group">
          <label for="source-select" class="field-label-with-icon"><span class="field-label-icon source" aria-hidden="true"></span>Source</label>
          <select id="source-select" class="decor-select">
            <option value="readwise">Readwise</option>
            <option value="gmail">Gmail</option>
          </select>
          <label class="checkbox-label" style="margin-top:0.45rem;">
            <input id="include-gmail-toggle" type="checkbox">
            Include Gmail results
          </label>
        </div>
        <div class="form-group">
          <label for="location">Readwise Location</label>
          <select id="location" class="decor-select">
            <option value="new">Inbox (New)</option>
            <option value="later">Later</option>
            <option value="shortlist">Shortlist</option>
            <option value="feed">Feed</option>
            <option value="archive">Archive</option>
          </select>
        </div>
        <div class="form-group">
          <label for="from-date" class="field-label-with-icon"><span class="field-label-icon calendar" aria-hidden="true"></span>Date Range</label>
          <div class="date-row">
            <div id="from-date-wrap">
              <label for="from-date">Start (blank = all time)</label>
              <input type="date" id="from-date" class="decor-date">
            </div>
            <div id="to-date-wrap">
              <label for="to-date">End</label>
              <input type="date" id="to-date" class="decor-date">
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
      </div>
      <div class="card" id="results-card">
        <div class="results-top">
          <h2 style="margin-bottom:0;">Preview Results</h2>
          <div class="results-summary" id="results-summary" style="display:none">
            <span class="results-pill" id="results-summary-filtered">All (filtered): 0</span>
            <span class="results-pill" id="results-summary-selected">Selected: 0</span>
            <span class="results-pill" id="results-summary-queue">Player queue: 0</span>
          </div>
        </div>
        <div id="preview-top-toolbar" style="display:none">
          <div class="preview-top-controls" id="preview-top-controls">
            <label class="checkbox-label"><input id="select-all-preview" type="checkbox"> All (filtered)</label>
            <div class="preview-search-wrap">
              <input class="preview-search" type="text" id="preview-search" placeholder="Search preview (title, author, content)">
              <button type="button" class="search-clear-btn" id="preview-search-clear" title="Clear search">×</button>
              <div class="sort-toggle" aria-label="Sort preview by date">
                <button type="button" id="preview-sort-added" class="active" title="Sort by date added">Added</button>
                <button type="button" id="preview-sort-published" title="Sort by publication date">Published</button>
              </div>
            </div>
          </div>
          <div class="preview-actions">
            <button class="btn btn-outline" id="play-selected-btn" disabled>Play</button>
            <button class="btn btn-outline" id="open-selected-btn" disabled>Open</button>
            <button class="btn btn-danger" id="delete-btn" disabled>Delete</button>
            <button class="btn btn-primary" id="archive-btn" disabled>Archive</button>
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
      <div id="deleted-controls-main-host">
        <div class="card" id="deleted-controls-card">
          <div class="results-top">
            <h2 style="margin-bottom:0;">Deleted Items History</h2>
            <div class="results-summary" id="deleted-results-summary" style="display:none">
              <span class="results-pill" id="deleted-results-summary-filtered">All (filtered): 0</span>
              <span class="results-pill" id="deleted-results-summary-selected">Selected: 0</span>
              <span class="results-pill" id="deleted-results-summary-total">History total: 0</span>
            </div>
          </div>
          <div id="deleted-top-toolbar">
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
            <div class="btn-group history-actions-grid">
              <button class="btn btn-primary" id="restore-btn" disabled>Restore</button>
              <button class="btn btn-danger" id="delete-selected-history-btn" disabled>Delete</button>
              <button class="btn btn-outline" id="clear-history-btn">Clear All</button>
            </div>
          </div>
          <div id="deleted-list"><div class="loading">Loading...</div></div>
        </div>
      </div>
    </div>

    <div id="settings-tab" style="display:none">
      <div class="card">
        <h2>Settings</h2>
        <div id="settings-latest-fix" style="border:1px solid var(--border);border-radius:10px;padding:0.58rem 0.72rem;background:#f8fbff;color:var(--text-muted);font-size:0.82rem;margin-bottom:0.78rem;">Latest fix: loading…</div>
        <div class="form-group">
          <label for="setting-default-source">Default source</label>
          <select id="setting-default-source">
            <option value="readwise">Readwise</option>
            <option value="gmail">Gmail</option>
            <option value="all">Readwise + Gmail</option>
          </select>
        </div>
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
          <label for="setting-tts-provider">TTS provider</label>
          <select id="setting-tts-provider">
            <option value="openai">OpenAI (gpt-4o-mini-tts)</option>
            <option value="aws_polly_standard">AWS Polly Standard (lower cost)</option>
          </select>
        </div>
        <div class="form-group" id="setting-openai-voice-group">
          <label for="setting-tts-voice">TTS voice</label>
          <select id="setting-tts-voice">
            <option value="alloy" selected>Alloy (default)</option>
            <option value="onyx">Onyx (male)</option>
            <option value="echo">Echo (male)</option>
            <option value="nova">Nova (female)</option>
            <option value="shimmer">Shimmer (female)</option>
          </select>
        </div>
        <div class="form-group" id="setting-aws-voice-group">
          <label for="setting-aws-polly-voice">AWS Polly Standard voice</label>
          <select id="setting-aws-polly-voice">
            <option value="Joanna" selected>Joanna</option>
            <option value="Matthew">Matthew</option>
            <option value="Salli">Salli</option>
            <option value="Kimberly">Kimberly</option>
            <option value="Kendra">Kendra</option>
            <option value="Ivy">Ivy</option>
            <option value="Justin">Justin</option>
            <option value="Joey">Joey</option>
            <option value="Ruth">Ruth</option>
            <option value="Stephen">Stephen</option>
            <option value="Kevin">Kevin</option>
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
        <h2 style="font-size:1rem;margin-bottom:0.65rem;">Gmail Source (OAuth)</h2>
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:0.6rem;">
          Connect Gmail, select one or more labels, and use Find to pull matching newsletters into the queue.
        </p>
        <p id="gmail-status" style="color:var(--text-muted);font-size:0.85rem;margin-bottom:0.5rem;">Checking Gmail hook status…</p>
        <div class="btn-group" style="margin-bottom:0.6rem;">
          <button class="btn btn-outline" id="connect-gmail-btn">Connect Gmail</button>
          <button class="btn btn-outline" id="sync-gmail-btn">Sync Gmail</button>
        </div>
        <div class="form-group">
          <label for="setting-gmail-labels">Filter labels (optional)</label>
          <select id="setting-gmail-labels" multiple size="8"></select>
          <p style="color:var(--text-muted);font-size:0.8rem;margin-top:0.35rem;">Select labels to include in Gmail sync and Find.</p>
        </div>
        <div class="btn-group">
          <button class="btn btn-outline" id="save-gmail-labels-btn">Save Gmail Labels</button>
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
        <div class="recent-errors-wrap">
          <details id="recent-errors-details">
            <summary style="cursor:pointer;font-weight:600;">Recent errors and warnings</summary>
            <p style="color:var(--text-muted);font-size:0.8rem;margin:0.45rem 0 0.4rem;">Keeps the latest 12 warning/error messages after toast popups fade.</p>
            <div class="btn-group" style="margin:0.3rem 0 0.2rem;">
              <button class="btn btn-outline" id="clear-recent-errors-btn">Clear Recent</button>
            </div>
            <div class="recent-errors-list" id="recent-errors-list"></div>
            <div class="recent-errors-empty" id="recent-errors-empty" style="display:none;">No recent errors.</div>
          </details>
        </div>
      </div>
    </div>

    <div id="about-tab" style="display:none">
      <div class="card">
        <h2>About</h2>
        <p style="margin-bottom: 0.75rem;">Version <strong id="about-version">${APP_VERSION}</strong></p>
        <p style="margin-bottom: 0.75rem; color: var(--text-muted);">
          Read Flow is for managing queues of saved stories and newsletters, then listening with TTS while you triage, archive, restore, or delete items.
        </p>
        <p style="margin-bottom: 0.5rem;">Features:</p>
        <ul class="about-list">
          <li>Build and manage a playback queue from filtered saved items.</li>
          <li>Play full-text TTS with progress, seek, and queue controls.</li>
          <li>Triage items with archive/delete/restore workflows and history.</li>
          <li>Save defaults and playback behavior in Settings.</li>
        </ul>
        <p style="margin-top: 0.9rem; color: var(--text-muted);">
          Privacy: this app stores settings and deleted-item history in your Cloudflare KV namespace only.
        </p>
        <div class="history-list" id="version-history"></div>
      </div>
    </div>

    <div id="player-tab" style="display:none">
      <div id="player-controls-right-host" style="display:none"></div>
      <div class="card">
        <div class="results-top">
          <h2 style="margin-bottom:0;">Playlist</h2>
          <div class="results-summary" id="player-results-summary" style="display:none">
            <span class="results-pill" id="player-results-summary-filtered">All (filtered): 0</span>
            <span class="results-pill" id="player-results-summary-selected">Selected: 0</span>
            <span class="results-pill" id="player-results-summary-total">Player queue: 0</span>
          </div>
        </div>
        <div class="preview-top-controls" style="margin-top:0.7rem;">
          <label class="checkbox-label" style="font-size:0.85rem; margin:0;">
            <input id="player-select-all" type="checkbox">
            All
          </label>
          <div class="preview-search-wrap" style="max-width:none;">
            <input type="text" id="player-search" class="preview-search" placeholder="Search player queue...">
            <button type="button" id="player-search-clear" class="search-clear-btn" title="Clear player search" aria-label="Clear player search">×</button>
            <div class="sort-toggle" aria-label="Sort player queue by date">
              <button type="button" id="player-sort-added" class="active" title="Sort by date added">Added</button>
              <button type="button" id="player-sort-published" title="Sort by publication date">Published</button>
            </div>
          </div>
        </div>
        <div id="player-queue" class="history-list"></div>
      </div>
    </div>
        </div>
      </main>
    </div>
    </div>
    <div id="floating-player-hover" class="floating-player-hover" aria-live="polite" aria-hidden="true" hidden>
      <div class="floating-player-status" id="floating-player-status"><span id="floating-player-dot" class="floating-player-dot" aria-hidden="true"></span><span id="floating-player-status-text">Playing while browsing</span></div>
      <div class="floating-player-actions">
        <button type="button" id="floating-player-back" class="floating-player-btn" title="Back 15s" aria-label="Back 15s">⏪</button>
        <button type="button" id="floating-player-toggle" class="floating-player-btn" title="Play/Pause" aria-label="Play/Pause">⏸</button>
        <button type="button" id="floating-player-next" class="floating-player-btn" title="Next" aria-label="Next">⏭</button>
        <button type="button" id="floating-player-open" class="floating-player-btn floating-player-open" title="Open Player">Player</button>
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
      defaultSource: 'readwise',
      defaultLocation: 'new',
      defaultDays: 30,
      previewLimit: 100,
      confirmActions: true,
      mockTts: true,
      ttsProvider: 'openai',
      ttsVoice: 'alloy',
      awsPollyVoice: 'Joanna',
      audioBackSeconds: 15,
      audioForwardSeconds: 30,
      maxOpenTabs: 5,
      playerAutoNext: true,
      playerAutoAction: 'none',
      gmailSelectedLabels: []
    };
    var gmailConnected = false;
    var gmailOauthReady = false;
    var gmailKnownLabels = [];
    var lastGmailSyncAt = 0;
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
    var playerDownloadQueue = [];
    var playerDownloadInFlight = false;
    var playerDownloadPaused = false;
    var playerDownloadCurrentItemId = '';
    var playerDownloadProgressByItemId = {};
    var playerDownloadedManifestByItemId = {};
    var playerDownloadHydratedByItemId = {};
    var playerResolvedDownloadProfileByItemId = {};
    var playerSearch = '';
    var playerSortMode = 'added';
    var currentTabName = 'cleanup';
    var playerStatePersistTimer = null;
    var playerAudioObjectUrl = '';
    var playerLoadToken = 0;
    var playerChunkFetchByKey = {};
    var playerChunkBlobByKey = {};
    var isIosLikeDevice = false;
    var PLAYER_STATE_STORAGE_KEY = 'readwise_cleanup_player_state_v1';
    var APP_STATE_STORAGE_KEY = 'readwise_cleanup_app_state_v1';
    var RECENT_ERROR_LOG_STORAGE_KEY = 'readwise_cleanup_recent_errors_v1';
    var RECENT_ERROR_LOG_MAX = 12;
    var appStatePersistTimer = null;
    var settingsSaveTimer = null;
    var settingsSaveInFlight = false;
    var voicePreviewAudio = null;
    var recentErrorLog = [];

    var sourceSelect = document.getElementById('source-select');
    var includeGmailToggle = document.getElementById('include-gmail-toggle');
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
    var previewTopToolbar = document.getElementById('preview-top-toolbar');
    var previewBottomControls = document.getElementById('preview-bottom-controls');
    var selectAllPreview = document.getElementById('select-all-preview');
    var previewPrevBtn = document.getElementById('preview-prev-btn');
    var previewNextBtn = document.getElementById('preview-next-btn');
    var previewPageLabel = document.getElementById('preview-page-label');
    var deletedList = document.getElementById('deleted-list');
    var restoreBtn = document.getElementById('restore-btn');
    var deleteSelectedHistoryBtn = document.getElementById('delete-selected-history-btn');
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
    var deletedControlsMainHost = document.getElementById('deleted-controls-main-host');
    var cleanupControlsLeftHost = document.getElementById('cleanup-controls-left-host');
    var cleanupControlsRightHost = document.getElementById('cleanup-controls-right-host');
    var playerControlsCard = document.getElementById('player-controls');
    var playerControlsLeftHost = document.getElementById('player-controls-left-host');
    var playerControlsRightHost = document.getElementById('player-controls-right-host');
    var leftRailEl = document.querySelector('.left-rail');
    var resultsSummary = document.getElementById('results-summary');
    var resultsSummaryFiltered = document.getElementById('results-summary-filtered');
    var resultsSummarySelected = document.getElementById('results-summary-selected');
    var resultsSummaryQueue = document.getElementById('results-summary-queue');
    var deletedResultsSummary = document.getElementById('deleted-results-summary');
    var deletedResultsSummaryFiltered = document.getElementById('deleted-results-summary-filtered');
    var deletedResultsSummarySelected = document.getElementById('deleted-results-summary-selected');
    var deletedResultsSummaryTotal = document.getElementById('deleted-results-summary-total');
    var playerResultsSummary = document.getElementById('player-results-summary');
    var playerResultsSummaryFiltered = document.getElementById('player-results-summary-filtered');
    var playerResultsSummarySelected = document.getElementById('player-results-summary-selected');
    var playerResultsSummaryTotal = document.getElementById('player-results-summary-total');
    var floatingPlayerHover = document.getElementById('floating-player-hover');
    var floatingPlayerStatus = document.getElementById('floating-player-status');
    var floatingPlayerDot = document.getElementById('floating-player-dot');
    var floatingPlayerStatusText = document.getElementById('floating-player-status-text');
    var floatingPlayerBackBtn = document.getElementById('floating-player-back');
    var floatingPlayerToggleBtn = document.getElementById('floating-player-toggle');
    var floatingPlayerNextBtn = document.getElementById('floating-player-next');
    var floatingPlayerOpenBtn = document.getElementById('floating-player-open');
    var versionHistoryLink = document.getElementById('version-history-link');
    var saveTokenBtn = document.getElementById('save-token-btn');
    var tokenStatusEl = document.getElementById('token-status');
    var settingsTokenInput = document.getElementById('setting-readwise-token');
    var gmailStatusEl = document.getElementById('gmail-status');
    var saveGmailLabelsBtn = document.getElementById('save-gmail-labels-btn');
    var settingsGmailLabelsSelect = document.getElementById('setting-gmail-labels');
    var connectGmailBtn = document.getElementById('connect-gmail-btn');
    var syncGmailBtn = document.getElementById('sync-gmail-btn');
    var settingMockTts = document.getElementById('setting-mock-tts');
    var settingTtsProvider = document.getElementById('setting-tts-provider');
    var settingTtsVoice = document.getElementById('setting-tts-voice');
    var settingAwsPollyVoice = document.getElementById('setting-aws-polly-voice');
    var settingOpenAiVoiceGroup = document.getElementById('setting-openai-voice-group');
    var settingAwsVoiceGroup = document.getElementById('setting-aws-voice-group');
    var settingAudioBackSeconds = document.getElementById('setting-audio-back-seconds');
    var settingAudioForwardSeconds = document.getElementById('setting-audio-forward-seconds');
    var settingMaxOpenTabs = document.getElementById('setting-max-open-tabs');
    var settingPlayerAutoNext = document.getElementById('setting-player-auto-next');
    var settingPlayerAutoAction = document.getElementById('setting-player-auto-action');
    var openAiKeyStatusEl = document.getElementById('openai-key-status');
    var saveOpenAiKeyBtn = document.getElementById('save-openai-key-btn');
    var settingsOpenAiKeyInput = document.getElementById('setting-openai-key');
    var recentErrorsDetails = document.getElementById('recent-errors-details');
    var clearRecentErrorsBtn = document.getElementById('clear-recent-errors-btn');
    var recentErrorsListEl = document.getElementById('recent-errors-list');
    var recentErrorsEmptyEl = document.getElementById('recent-errors-empty');
    var playerAudio = document.getElementById('player-audio');
    var playerStatus = document.getElementById('player-status');
    var playerFeedback = document.getElementById('player-feedback');
    var playerTtsModeEl = document.getElementById('player-tts-mode');
    var playerCurrentHeader = document.getElementById('player-current-header');
    var playerCurrentThumb = document.getElementById('player-current-thumb');
    var playerCurrentThumbFallback = document.getElementById('player-current-thumb-fallback');
    var playerCurrentTitle = document.getElementById('player-current-title');
    var playerCurrentAuthor = document.getElementById('player-current-author');
    var playerCurrentProgress = document.getElementById('player-current-progress');
    var playerCurrentProgressDownloaded = document.getElementById('player-current-progress-downloaded');
    var playerCurrentProgressFill = document.getElementById('player-current-progress-fill');
    var playerDownloadStatus = document.getElementById('player-download-status');
    var playerTextToggleBtn = document.getElementById('player-text-toggle');
    var playerCurrentText = document.getElementById('player-current-text');
    var playerQueueEl = document.getElementById('player-queue');
    var playerSelectAll = document.getElementById('player-select-all');
    var playerSearchInput = document.getElementById('player-search');
    var playerSearchClearBtn = document.getElementById('player-search-clear');
    var playerSortAddedBtn = document.getElementById('player-sort-added');
    var playerSortPublishedBtn = document.getElementById('player-sort-published');
    var playerPrevBtn = document.getElementById('player-prev-btn');
    var playerPlayPauseBtn = document.getElementById('player-playpause-btn');
    var playerNextBtn = document.getElementById('player-next-btn');
    var playerBackBtn = document.getElementById('player-back-btn');
    var playerForwardBtn = document.getElementById('player-forward-btn');
    var playerSpeedSelect = document.getElementById('player-speed');
    var playerShowText = false;

    var settingsDefaultSource = document.getElementById('setting-default-source');
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

    function detectIosLikeDevice() {
      if (typeof navigator === 'undefined') return false;
      var ua = String(navigator.userAgent || '');
      if (/iPad|iPhone|iPod/i.test(ua)) return true;
      var isTouchMac = /\bMacintosh\b/i.test(ua) && typeof document !== 'undefined' && ('ontouchend' in document);
      return !!isTouchMac;
    }

    function normalizeMimeType(value) {
      return String(value || '')
        .split(';')[0]
        .trim()
        .toLowerCase();
    }

    function isAutoplayBlockedError(err) {
      var name = String(err && err.name || '');
      var msg = String(err && err.message || '').toLowerCase();
      return name === 'NotAllowedError'
        || msg.indexOf('notallowederror') >= 0
        || msg.indexOf('user gesture') >= 0
        || msg.indexOf('gesture') >= 0
        || msg.indexOf('autoplay') >= 0;
    }

    function getPreferredAudioMime(packet) {
      var hinted = normalizeMimeType((packet && packet.contentType) || (packet && packet.blob && packet.blob.type) || '');
      if (hinted === 'audio/mpeg' || hinted === 'audio/mp3') return 'audio/mpeg';
      if (hinted === 'audio/wav' || hinted === 'audio/wave' || hinted === 'audio/x-wav') return 'audio/wav';
      if (hinted === 'audio/mp4' || hinted === 'audio/aac' || hinted === 'audio/x-m4a') return 'audio/mp4';
      if (hinted === 'audio/ogg') return 'audio/ogg';
      return (packet && packet.isMock) ? 'audio/wav' : 'audio/mpeg';
    }

    async function ensurePlayableAudioBlob(packet) {
      if (!packet || !packet.blob) return null;
      var blob = packet.blob;
      var currentType = normalizeMimeType(blob.type || packet.contentType || '');
      var preferredType = getPreferredAudioMime(packet);
      var needsWrap = !currentType
        || currentType === 'application/octet-stream'
        || (isIosLikeDevice && currentType !== preferredType);
      if (!needsWrap) return blob;
      try {
        var bytes = await blob.arrayBuffer();
        return new Blob([bytes], { type: preferredType });
      } catch (err) {
        return blob;
      }
    }

    function waitForAudioReady(element, timeoutMs) {
      return new Promise(function(resolve, reject) {
        if (!element) return reject(new Error('Audio element unavailable'));
        var settled = false;
        var timeout = null;
        var events = ['loadedmetadata', 'canplay', 'canplaythrough', 'error', 'abort', 'emptied', 'stalled'];
        var cleanup = function() {
          events.forEach(function(evt) {
            element.removeEventListener(evt, onEvent);
          });
          if (timeout) clearTimeout(timeout);
        };
        var finish = function(err) {
          if (settled) return;
          settled = true;
          cleanup();
          if (err) reject(err);
          else resolve();
        };
        var onEvent = function(evt) {
          if (!evt) return;
          if (evt.type === 'loadedmetadata' || evt.type === 'canplay' || evt.type === 'canplaythrough') {
            finish();
            return;
          }
          if (evt.type === 'stalled') return;
          var err = new Error('Audio could not be decoded on this device. Re-download this story or switch voice and retry.');
          err.code = 'audio_not_decodable';
          finish(err);
        };
        events.forEach(function(evt) {
          element.addEventListener(evt, onEvent);
        });
        if (element.readyState >= 1) {
          finish();
          return;
        }
        timeout = setTimeout(function() {
          var err = new Error('Audio load timed out while preparing playback. This can happen on iPhone when the chunk format is invalid.');
          err.code = 'audio_ready_timeout';
          finish(err);
        }, Math.max(3000, Number(timeoutMs) || 9000));
      });
    }
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
      var today = new Date();
      var fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - safeDays);
      fromDateInput.value = formatInputDate(fromDate);
      toDateInput.value = formatInputDate(today);
      syncDateInputBounds();
    }

    function setDateShortcutTarget(target) {
      activeDateShortcutTarget = target === 'from' ? 'from' : 'to';
    }

    function syncDateInputBounds() {
      // iOS/Safari segmented date entry can mis-handle typed day digits when min/max
      // constraints are present; keep native picker UX but validate range on Find submit.
      return;
    }

    function getEffectiveSource() {
      var base = sourceSelect ? String(sourceSelect.value || 'readwise') : 'readwise';
      if (base === 'gmail') return 'gmail';
      return includeGmailToggle && includeGmailToggle.checked ? 'all' : 'readwise';
    }

    function setSourceControlsFromValue(value) {
      var normalized = (value === 'gmail' || value === 'all') ? value : 'readwise';
      if (!sourceSelect) return;
      if (normalized === 'gmail') {
        sourceSelect.value = 'gmail';
        if (includeGmailToggle) {
          includeGmailToggle.checked = false;
          includeGmailToggle.disabled = true;
        }
        return;
      }
      sourceSelect.value = 'readwise';
      if (includeGmailToggle) {
        includeGmailToggle.disabled = false;
        includeGmailToggle.checked = normalized === 'all';
      }
    }

    function renderGmailLabelOptions() {
      if (!settingsGmailLabelsSelect) return;
      if (typeof settingsGmailLabelsSelect.appendChild !== 'function' || typeof document === 'undefined' || !document.createElement) {
        settingsGmailLabelsSelect.value = Array.isArray(settings.gmailSelectedLabels) ? settings.gmailSelectedLabels.join(', ') : '';
        return;
      }
      var selected = new Set(Array.isArray(settings.gmailSelectedLabels) ? settings.gmailSelectedLabels : []);
      settingsGmailLabelsSelect.innerHTML = '';
      var labels = Array.isArray(gmailKnownLabels) ? gmailKnownLabels.slice() : [];
      if (!labels.length) {
        var emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = gmailConnected ? 'No labels available' : 'Connect Gmail to load labels';
        emptyOption.disabled = true;
        settingsGmailLabelsSelect.appendChild(emptyOption);
        return;
      }
      labels.forEach(function(label) {
        var opt = document.createElement('option');
        opt.value = label;
        opt.textContent = label;
        if (selected.has(label)) opt.selected = true;
        settingsGmailLabelsSelect.appendChild(opt);
      });
    }

    function getEffectiveTtsProvider() {
      return settings && settings.ttsProvider === 'aws_polly_standard'
        ? 'aws_polly_standard'
        : 'openai';
    }

    function getEffectiveTtsRequestVoice() {
      if (getEffectiveTtsProvider() === 'aws_polly_standard') {
        return (settings && settings.awsPollyVoice) || 'Joanna';
      }
      return (settings && settings.ttsVoice) || 'alloy';
    }

    function syncTtsProviderUi() {
      var provider = getEffectiveTtsProvider();
      if (settingTtsProvider) settingTtsProvider.value = provider;
      if (settingOpenAiVoiceGroup) settingOpenAiVoiceGroup.style.display = provider === 'openai' ? '' : 'none';
      if (settingAwsVoiceGroup) settingAwsVoiceGroup.style.display = provider === 'aws_polly_standard' ? '' : 'none';
    }

    function applySettingsToUI() {
      var effectiveSource = settings.defaultSource || 'readwise';
      setSourceControlsFromValue(effectiveSource);
      if (settingsDefaultSource) settingsDefaultSource.value = effectiveSource;
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
      syncDateInputBounds();
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
      if (settingTtsProvider) settingTtsProvider.value = settings.ttsProvider || 'openai';
      if (settingTtsVoice) settingTtsVoice.value = settings.ttsVoice || 'alloy';
      if (settingAwsPollyVoice) settingAwsPollyVoice.value = settings.awsPollyVoice || 'Joanna';
      settingAudioBackSeconds.value = settings.audioBackSeconds;
      settingAudioForwardSeconds.value = settings.audioForwardSeconds;
      settingMaxOpenTabs.value = settings.maxOpenTabs;
      settingPlayerAutoNext.checked = !!settings.playerAutoNext;
      settingPlayerAutoAction.value = settings.playerAutoAction || 'none';
      renderGmailLabelOptions();
      var backTextEl = playerBackBtn && playerBackBtn.querySelector ? playerBackBtn.querySelector('.control-text') : null;
      var fwdTextEl = playerForwardBtn && playerForwardBtn.querySelector ? playerForwardBtn.querySelector('.control-text') : null;
      if (backTextEl) backTextEl.textContent = settings.audioBackSeconds + 's';
      if (fwdTextEl) fwdTextEl.textContent = settings.audioForwardSeconds + 's';
      syncSourceUi();
      syncTtsProviderUi();
    }

    function syncSourceUi() {
      var src = sourceSelect ? String(sourceSelect.value || 'readwise') : 'readwise';
      var readwiseOnly = src === 'readwise';
      if (includeGmailToggle) includeGmailToggle.disabled = src === 'gmail';
      if (locationSelect) {
        locationSelect.disabled = !readwiseOnly;
      }
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
      syncSourceUi();
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
        getEffectiveSource(),
        locationSelect.value,
        fromDateInput.value || '',
        toDateInput.value || '',
        settings.previewLimit
      ].join('|');
    }

    function setFindMeta(count, location) {
      if (itemCountEl) itemCountEl.textContent = String(count || 0);
      if (locationDisplay) locationDisplay.textContent = location || '-';
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

    function handleImageLoadError(evt) {
      var img = evt && evt.target ? evt.target : null;
      if (!img || img.dataset.broken === '1') return;
      img.dataset.broken = '1';
      img.removeAttribute('src');
      img.style.display = 'none';
      var sibling = img.nextElementSibling;
      if (sibling && sibling.classList && sibling.classList.contains('preview-thumb-fallback')) {
        sibling.style.display = 'inline-flex';
      }
    }
    window.handleImageLoadError = handleImageLoadError;

    on(toDateWrap, 'pointerdown', function() { setDateShortcutTarget('to'); });
    on(fromDateWrap, 'pointerdown', function() { setDateShortcutTarget('from'); });
    ['change', 'blur'].forEach(function(evtName) {
      on(toDateInput, evtName, syncDateInputBounds);
      on(fromDateInput, evtName, syncDateInputBounds);
    });

    document.querySelectorAll('.quick-date').forEach(function(btn) {
      on(btn, 'click', function() {
        if (btn.dataset.action === 'today') {
          var today = formatInputDate(new Date());
          fromDateInput.value = today;
          toDateInput.value = today;
          syncDateInputBounds();
          return;
        }
        if (btn.dataset.action === 'all-time') {
          fromDateInput.value = '';
          toDateInput.value = formatInputDate(new Date());
          syncDateInputBounds();
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
      return window.innerWidth <= 1024;
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
      if (deletedMainControlsCard && deletedControlsMainHost && deletedMainControlsCard.parentElement !== deletedControlsMainHost && typeof deletedControlsMainHost.appendChild === 'function') {
        deletedControlsMainHost.appendChild(deletedMainControlsCard);
      }
      if (deletedMainControlsCard) deletedMainControlsCard.classList.remove('rail-docked-control');
      if (cleanupControlsLeftHost) {
        cleanupControlsLeftHost.style.display = currentTabName === 'cleanup' && dockLeft ? 'block' : 'none';
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
      }
      document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.tab[data-tab="' + tabName + '"]').forEach(function(activeTabEl) {
        activeTabEl.classList.add('active');
      });

      document.getElementById('cleanup-tab').style.display = tabName === 'cleanup' ? '' : 'none';
      document.getElementById('deleted-tab').style.display = tabName === 'deleted' ? '' : 'none';
      document.getElementById('settings-tab').style.display = tabName === 'settings' ? '' : 'none';
      document.getElementById('about-tab').style.display = tabName === 'about' ? '' : 'none';
      document.getElementById('player-tab').style.display = tabName === 'player' ? '' : 'none';
      cleanupControlsCard.style.display = tabName === 'cleanup' ? 'block' : 'none';
      if (deletedControlsCard) deletedControlsCard.style.display = tabName === 'deleted' ? 'block' : 'none';
      if (playerControlsCard) playerControlsCard.style.display = tabName === 'player' ? 'block' : 'none';
      mainPane.style.overflowY = tabName === 'cleanup' ? 'hidden' : 'auto';

      if (tabName === 'deleted') {
        loadDeletedItems();
      }
      if (tabName === 'player' && syncPlayerFromSelection) {
        refreshPlayerQueueFromPreviewSelection({ autoplay: false });
      }

      var targetPath = TAB_ROUTES[tabName] || '/';
      if (shouldPush && normalizePath(window.location.pathname) !== targetPath) {
        history.pushState({ tab: tabName }, '', targetPath);
      }
      currentTabName = tabName;
      syncMainControlsDock();
      syncPlayerControlsDock();
      updateFloatingPlayerHover();
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
    on(window, 'message', function(evt) {
      if (!evt || !evt.data || evt.origin !== window.location.origin) return;
      var payload = evt.data;
      if (payload.type !== 'gmail-oauth-result') return;
      if (payload.status === 'connected') {
        showToast('Gmail connected', 'success');
      } else {
        var reason = payload.reason ? (': ' + String(payload.reason)) : '';
        showToast('Gmail OAuth ' + String(payload.status || 'error') + reason, 'warning');
      }
      loadGmailStatus();
    });

    on(floatingPlayerToggleBtn, 'click', function() {
      if (!playerAudio || !playerAudio.src) {
        setPlayerStatus('No audio loaded. Queue a story and press Play.', true);
        showToast('No audio loaded', 'error');
        return;
      }
      if (playerAudio.paused) {
        applySelectedPlaybackRate();
        playerAudio.play().catch(function(err) {
          var msg = isAutoplayBlockedError(err)
            ? 'iPhone blocked playback. Tap Play again after interacting with the page.'
            : ((err && err.message) || 'Unable to start audio');
          setPlayerStatus(msg, true);
          showToast(msg, 'error');
        });
      }
      else playerAudio.pause();
    });
    on(floatingPlayerBackBtn, 'click', function() {
      if (!playerAudio || !playerAudio.src) return;
      playerAudio.currentTime = Math.max(0, playerAudio.currentTime - settings.audioBackSeconds);
    });
    on(floatingPlayerNextBtn, 'click', function() {
      var nextIdx = findNextPlayableIndex(playerIndex);
      if (nextIdx >= 0) loadPlayerIndex(nextIdx);
    });
    on(floatingPlayerOpenBtn, 'click', function() {
      setActiveTab('player', { push: true, syncPlayerFromSelection: false });
    });
    on(versionHistoryLink, 'click', function(evt) {
      evt.preventDefault();
      setActiveTab('about', { push: true, syncPlayerFromSelection: false });
    });

    on(previewBtn, 'click', async function() {
      var fromDate = fromDateInput.value || '';
      var toDate = toDateInput.value || '';
      if (!toDate) toDate = formatInputDate(new Date());
      if (fromDate && toDate && fromDate > toDate) {
        showToast('Start date must be on or before end date', 'warning');
        return;
      }

      var queryKey = buildQueryKey();

      previewBtn.disabled = true;
      previewBtn.innerHTML = '<span class="spinner"></span> Loading...';

      try {
        var selectedSource = getEffectiveSource();
        if (selectedSource === 'gmail' || selectedSource === 'all') {
          try {
            await runGmailSync({ force: false });
            loadGmailStatus();
          } catch (syncErr) {
            showToast('Gmail sync failed, using cached Gmail items: ' + syncErr.message, 'warning');
          }
        }
        var params = new URLSearchParams({
          source: selectedSource,
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
        updateResultsSummary();

        setFindMeta(currentCount, selectedSource);
        if (previewTopToolbar) previewTopToolbar.style.display = previewData.length > 0 ? 'grid' : 'none';
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

      var playerCount = playerQueue.length;
      if (playerSelectedCountBadge) {
        if (playerCount > 0) {
          playerSelectedCountBadge.textContent = String(playerCount);
          playerSelectedCountBadge.style.display = 'inline-block';
        } else {
          playerSelectedCountBadge.style.display = 'none';
        }
      }
    }

    function updateResultsSummary() {
      if (!resultsSummary || !resultsSummaryFiltered || !resultsSummarySelected || !resultsSummaryQueue) return;
      if (previewData.length === 0) {
        resultsSummary.style.display = 'none';
        return;
      }
      var filteredCount = getFilteredPreviewItems().length;
      var selectedCount = getActiveSelectedIds().length;
      var queueCount = playerQueue.length;
      resultsSummaryFiltered.textContent = 'All (filtered): ' + filteredCount;
      resultsSummarySelected.textContent = 'Selected: ' + selectedCount;
      resultsSummaryQueue.textContent = 'Player queue: ' + queueCount;
      resultsSummary.style.display = 'inline-flex';
    }

    function updateDeletedResultsSummary() {
      if (!deletedResultsSummary || !deletedResultsSummaryFiltered || !deletedResultsSummarySelected || !deletedResultsSummaryTotal) return;
      if (deletedItems.length === 0) {
        deletedResultsSummary.style.display = 'none';
        return;
      }
      var filtered = getFilteredDeletedItems();
      var selected = getActiveSelectedDeletedItems().length;
      deletedResultsSummaryFiltered.textContent = 'All (filtered): ' + filtered.length;
      deletedResultsSummarySelected.textContent = 'Selected: ' + selected;
      deletedResultsSummaryTotal.textContent = 'History total: ' + deletedItems.length;
      deletedResultsSummary.style.display = 'inline-flex';
    }

    function updatePlayerResultsSummary(filteredCount, selectedCount) {
      if (!playerResultsSummary || !playerResultsSummaryFiltered || !playerResultsSummarySelected || !playerResultsSummaryTotal) return;
      if (playerQueue.length === 0) {
        playerResultsSummary.style.display = 'none';
        return;
      }
      var filtered = Number.isFinite(filteredCount) ? filteredCount : getFilteredPlayerIndices().length;
      var selected;
      if (Number.isFinite(selectedCount)) {
        selected = selectedCount;
      } else {
        var filteredIndices = getFilteredPlayerIndices();
        selected = filteredIndices.filter(function(idx) {
          return playerEnabledIds.has(getPlayerQueueId(playerQueue[idx], idx));
        }).length;
      }
      playerResultsSummaryFiltered.textContent = 'All (filtered): ' + filtered;
      playerResultsSummarySelected.textContent = 'Selected: ' + selected;
      playerResultsSummaryTotal.textContent = 'Player queue: ' + playerQueue.length;
      playerResultsSummary.style.display = 'inline-flex';
    }

    function updateFloatingPlayerHover() {
      if (!floatingPlayerHover || !floatingPlayerStatus) return;
      var isPlaying = !!(playerAudio && playerAudio.src && !playerAudio.paused);
      var hasAudioLoaded = !!(playerAudio && playerAudio.src);
      var shouldShow = hasAudioLoaded && currentTabName !== 'player';
      floatingPlayerHover.classList.toggle('is-visible', shouldShow);
      floatingPlayerHover.hidden = !shouldShow;
      if (floatingPlayerHover.setAttribute) {
        floatingPlayerHover.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
      }
      if (!shouldShow) return;
      var item = playerQueue[playerIndex] || {};
      var stateLabel = isPlaying ? 'Playing' : 'Paused';
      var itemLabel = item && item.title ? item.title : 'Player';
      var statusText = stateLabel + ': ' + itemLabel;
      if (floatingPlayerStatusText) floatingPlayerStatusText.textContent = statusText;
      else floatingPlayerStatus.textContent = statusText;
      if (floatingPlayerDot && floatingPlayerDot.classList) {
        floatingPlayerDot.classList.toggle('is-playing', isPlaying);
      }
      if (floatingPlayerToggleBtn) floatingPlayerToggleBtn.textContent = isPlaying ? '⏸' : '▶';
    }

    function isArchiveSourceSelected() {
      var src = getEffectiveSource();
      return src === 'readwise' && String(locationSelect.value || '') === 'archive';
    }

    function getSecondaryCleanupAction() {
      return isArchiveSourceSelected() ? 'restore' : 'archive';
    }

    function getSecondaryActionLabel() {
      return getSecondaryCleanupAction() === 'restore' ? 'Restore' : 'Archive';
    }

    function getActionPastTense(action) {
      if (action === 'delete') return 'Deleted';
      if (action === 'restore') return 'Restored';
      return 'Archived';
    }

    function setPlayerStatus(message, isError) {
      if (!playerStatus) return;
      if (isError) {
        playerStatus.textContent = '';
        playerStatus.classList.remove('is-error');
        if (playerFeedback) playerFeedback.textContent = message || '';
        return;
      }
      playerStatus.textContent = message || '';
      playerStatus.classList.remove('is-error');
      if (playerFeedback) playerFeedback.textContent = '';
    }

    function getPreviewSourceLabel(article) {
      if (!article) return '';
      var isGmail = String(article.kind || '').toLowerCase() === 'gmail' || String(article.site || '').toLowerCase() === 'gmail';
      if (!isGmail) return String(article.site || '');
      var labels = Array.isArray(article.labels) ? article.labels : [];
      var firstLabel = labels.length > 0 ? String(labels[0] || '').trim() : '';
      return firstLabel ? ('gmail/' + firstLabel) : 'gmail';
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
        updateResultsSummary();
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
        var openUrl = getItemOpenUrl(article);
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
          html += '<img class="preview-thumb" src="' + escapeHtml(article.thumbnail) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="handleImageLoadError(event)">';
        } else {
          html += '<span class="preview-thumb-fallback">No image</span>';
        }
        html += '<div class="article-info">';
        var activeDateValue = previewSortMode === 'published' ? article.publishedAt : article.savedAt;
        var activeDateLabel = previewSortMode === 'published' ? 'Published' : 'Added';
        html += '<div class="title-row">';
        html += '<div class="title-left"><span class="webpage-icon" aria-hidden="true">🌐</span><a class="article-link preview-open-link" href="' + escapeHtml(openUrl || '#') + '" target="_blank" rel="noopener" data-open-url="' + escapeHtml(openUrl || '') + '"><div class="article-title">' + escapeHtml(article.title) + '</div></a></div>';
        html += '<span class="article-date-right">' + escapeHtml(activeDateLabel) + ' ' + escapeHtml(formatDate(activeDateValue || article.savedAt)) + '</span>';
        html += '</div>';
        html += '<div class="article-meta"><span class="article-site">' + escapeHtml(getPreviewSourceLabel(article)) + '</span>';
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
      updateResultsSummary();
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
        playSelectedBtn.textContent = 'Play';
        openSelectedBtn.textContent = 'Open';
        deleteBtn.textContent = 'Delete';
        archiveBtn.textContent = getSecondaryActionLabel();
        updateRailSelectionBadges();
        return;
      }
      var filteredIds = new Set(filtered.map(function(item) { return String(item.id); }));
      var filteredSelected = [...selectedPreviewIds].filter(function(id) { return filteredIds.has(id); }).length;
      var displayCount = filteredSelected;
      selectAllPreview.checked = filteredSelected > 0 && filteredSelected === filtered.length;
      selectAllPreview.indeterminate = filteredSelected > 0 && filteredSelected < filtered.length;
      var maxTabs = Number(settings.maxOpenTabs || 5);
      var canOpenFew = displayCount > 0 && displayCount <= maxTabs;
      openSelectedBtn.style.display = canOpenFew ? 'inline-flex' : 'none';
      openSelectedBtn.disabled = !canOpenFew;
      playSelectedBtn.disabled = displayCount === 0;
      playSelectedBtn.textContent = displayCount > 0 ? 'Play (' + displayCount + ')' : 'Play';
      deleteBtn.disabled = displayCount === 0;
      archiveBtn.disabled = displayCount === 0;
      openSelectedBtn.textContent = displayCount > 0 ? 'Open (' + displayCount + ')' : 'Open';
      deleteBtn.textContent = displayCount > 0 ? 'Delete (' + displayCount + ')' : 'Delete';
      var secondaryLabel = getSecondaryActionLabel();
      archiveBtn.textContent = displayCount > 0 ? (secondaryLabel + ' (' + displayCount + ')') : secondaryLabel;
      updateRailSelectionBadges();
      updateResultsSummary();
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
    on(sourceSelect, 'change', function() {
      syncSourceUi();
      syncPreviewSelectionUI();
      if (previewData.length > 0) renderPreview();
      updatePreviewButtonLabel();
      schedulePersistAppState();
    });
    on(includeGmailToggle, 'change', function() {
      syncSourceUi();
      syncPreviewSelectionUI();
      if (previewData.length > 0) renderPreview();
      updatePreviewButtonLabel();
      schedulePersistAppState();
    });
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
    window.v2RunPreviewAction = runSwipeAction;
    window.v2RunPlayerAction = runPlayerSwipeAction;

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
      swipeStateById[articleId] = { startX: evt.clientX, startY: evt.clientY, deltaX: 0, pointerId: evt.pointerId, captured: false };
      element.style.transition = 'none';
    }
    window.handlePreviewPointerDown = handlePreviewPointerDown;

    function handlePreviewPointerMove(evt, element) {
      var parent = element.parentElement;
      var articleId = parent.dataset.articleId;
      var state = swipeStateById[articleId];
      if (!state) return;
      if (state.pointerId !== evt.pointerId) return;
      var dx = evt.clientX - state.startX;
      var dy = evt.clientY - state.startY;
      if (!state.captured) {
        if (Math.abs(dy) > Math.abs(dx) + 4) {
          delete swipeStateById[articleId];
          element.style.transform = 'translateX(0px)';
          return;
        }
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) + 2) {
          state.captured = true;
          if (element.setPointerCapture) {
            element.setPointerCapture(evt.pointerId);
          }
        } else {
          return;
        }
      }
      state.deltaX = dx;
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
        (evt.target.closest('.player-queue-jump') || evt.target.closest('.player-queue-check') || evt.target.closest('.player-row-progress') || evt.target.closest('input[type="checkbox"]') || evt.target.closest('button'))
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

    function getItemOpenUrl(item) {
      if (!item) return '';
      if (item.openUrl) return String(item.openUrl);
      if (item.url) return String(item.url);
      if (item.gmailUrl) return String(item.gmailUrl);
      return '';
    }

    async function parseApiJson(res) {
      var text = await res.text();
      var contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (contentType.indexOf('application/json') === -1) {
        var compact = String(text || '').replace(/\s+/g, ' ').trim();
        if (
          res.status === 503
          && (
            compact.toLowerCase().indexOf('worker exceeded resource limits') >= 0
            || compact.toLowerCase().indexOf('error code 1102') >= 0
          )
        ) {
          throw new Error('Find hit Worker CPU limit (Cloudflare 1102). Narrow date range or reduce result limit, then retry.');
        }
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
        var openUrl = getItemOpenUrl(item);
        if (openUrl) {
          window.open(openUrl, '_blank');
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
      playerLoadToken += 1;
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

      playerLoadToken += 1;
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
      else loadPlayerIndex(playerIndex, { autoplay: false });
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

    function getSelectedPlaybackRate() {
      var rate = parseFloat(playerSpeedSelect && playerSpeedSelect.value || '1');
      if (!(Number.isFinite(rate) && rate > 0)) return 1;
      return Math.max(0.5, Math.min(2, rate));
    }

    function applySelectedPlaybackRate() {
      if (!playerAudio) return;
      var rate = getSelectedPlaybackRate();
      playerAudio.defaultPlaybackRate = rate;
      playerAudio.playbackRate = rate;
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
      if (floatingPlayerToggleBtn) floatingPlayerToggleBtn.textContent = isPlaying ? '⏸' : '▶';
      updateFloatingPlayerHover();
    }

    function syncPlayerQueueAfterProcessedIds(processedIds, opts) {
      if (!Array.isArray(processedIds) || processedIds.length === 0) return false;
      var options = opts || {};
      var removedSet = new Set(processedIds.map(function(id) { return String(id); }));
      var enabledBudget = buildEnabledItemBudget(playerQueue, playerEnabledIds);
      var currentPlayingId = String(playerLoadedItemId || getCurrentPlayerItemId() || '');
      var removedCurrent = currentPlayingId && removedSet.has(currentPlayingId);
      if (removedCurrent) {
        playerLoadToken += 1;
        clearPlayerAudioSource();
        playerLoadedItemId = '';
        playerLoadedChunkIndex = 0;
      }
      if (!playerQueue.length) {
        setPlayerPlayPauseButtonState();
        return removedCurrent;
      }
      playerQueue = playerQueue.filter(function(item) {
        return !removedSet.has(String(item && item.id ? item.id : ''));
      });
      playerEnabledIds = buildEnabledIdsFromBudget(playerQueue, enabledBudget);
      if (playerQueue.length === 0) {
        playerIndex = 0;
        renderPlayerQueue();
        renderPlayerText();
        schedulePersistAppState();
        return removedCurrent;
      }
      if (playerEnabledIds.size === 0) {
        var currentQueueId = getCurrentPlayerQueueId();
        if (currentQueueId) playerEnabledIds.add(currentQueueId);
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

    function getDownloadProfileKey(itemId) {
      return String(itemId || '') + '|' + (settings.mockTts ? 'mock' : 'real') + '|' + String(settings.ttsVoice || 'alloy');
    }

    function openAudioCacheDb() {
      if (typeof indexedDB === 'undefined') return Promise.resolve(null);
      if (openAudioCacheDb._promise) return openAudioCacheDb._promise;
      openAudioCacheDb._promise = new Promise(function(resolve) {
        try {
          var request = indexedDB.open('readflow_audio_cache_v1', 1);
          request.onupgradeneeded = function(evt) {
            var db = evt.target.result;
            if (!db.objectStoreNames.contains('chunks')) db.createObjectStore('chunks', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('manifests')) db.createObjectStore('manifests', { keyPath: 'id' });
          };
          request.onsuccess = function() { resolve(request.result); };
          request.onerror = function() { resolve(null); };
        } catch (err) {
          resolve(null);
        }
      });
      return openAudioCacheDb._promise;
    }

    async function idbPut(storeName, value) {
      var db = await openAudioCacheDb();
      if (!db) return;
      await new Promise(function(resolve) {
        try {
          var tx = db.transaction(storeName, 'readwrite');
          tx.objectStore(storeName).put(value);
          tx.oncomplete = function() { resolve(); };
          tx.onerror = function() { resolve(); };
        } catch (err) {
          resolve();
        }
      });
    }

    async function idbGet(storeName, key) {
      var db = await openAudioCacheDb();
      if (!db) return null;
      return await new Promise(function(resolve) {
        try {
          var tx = db.transaction(storeName, 'readonly');
          var req = tx.objectStore(storeName).get(key);
          req.onsuccess = function() { resolve(req.result || null); };
          req.onerror = function() { resolve(null); };
        } catch (err) {
          resolve(null);
        }
      });
    }

    async function idbFindLatestManifestForItem(itemId) {
      var db = await openAudioCacheDb();
      if (!db) return null;
      var wanted = String(itemId || '');
      return await new Promise(function(resolve) {
        try {
          var tx = db.transaction('manifests', 'readonly');
          var store = tx.objectStore('manifests');
          var best = null;
          var req = store.openCursor();
          req.onsuccess = function() {
            var cursor = req.result;
            if (!cursor) return resolve(best);
            var row = cursor.value;
            var rowItemId = String(row && row.itemId || '');
            if (rowItemId === wanted) {
              if (!best || Number(row.downloadedAt || 0) > Number(best.downloadedAt || 0)) {
                best = row;
              }
            }
            cursor.continue();
          };
          req.onerror = function() { resolve(best); };
        } catch (err) {
          resolve(null);
        }
      });
    }

    async function idbFindLatestChunkForItemIndex(itemId, chunkIndex) {
      var db = await openAudioCacheDb();
      if (!db) return null;
      var wanted = String(itemId || '');
      var wantedChunk = Number(chunkIndex || 0);
      return await new Promise(function(resolve) {
        try {
          var tx = db.transaction('chunks', 'readonly');
          var store = tx.objectStore('chunks');
          var best = null;
          var req = store.openCursor();
          req.onsuccess = function() {
            var cursor = req.result;
            if (!cursor) return resolve(best);
            var row = cursor.value;
            if (String(row && row.itemId || '') === wanted && Number(row.chunkIndex || 0) === wantedChunk) {
              if (!best || Number(row.savedAt || 0) > Number(best.savedAt || 0)) best = row;
            }
            cursor.continue();
          };
          req.onerror = function() { resolve(best); };
        } catch (err) {
          resolve(null);
        }
      });
    }

    async function idbCountDistinctChunksForItem(itemId) {
      var db = await openAudioCacheDb();
      if (!db) return 0;
      var wanted = String(itemId || '');
      return await new Promise(function(resolve) {
        try {
          var tx = db.transaction('chunks', 'readonly');
          var store = tx.objectStore('chunks');
          var indices = {};
          var req = store.openCursor();
          req.onsuccess = function() {
            var cursor = req.result;
            if (!cursor) return resolve(Object.keys(indices).length);
            var row = cursor.value;
            if (String(row && row.itemId || '') === wanted) {
              indices[String(Number(row.chunkIndex || 0))] = true;
            }
            cursor.continue();
          };
          req.onerror = function() { resolve(Object.keys(indices).length); };
        } catch (err) {
          resolve(0);
        }
      });
    }

    async function idbCountChunksForProfile(profileKey) {
      var db = await openAudioCacheDb();
      if (!db) return 0;
      return await new Promise(function(resolve) {
        try {
          var tx = db.transaction('chunks', 'readonly');
          var store = tx.objectStore('chunks');
          var count = 0;
          var req = store.openCursor();
          req.onsuccess = function() {
            var cursor = req.result;
            if (!cursor) return resolve(count);
            var row = cursor.value;
            if (row && typeof row.id === 'string' && row.id.indexOf(profileKey + '|') === 0) {
              count += 1;
            }
            cursor.continue();
          };
          req.onerror = function() { resolve(count); };
        } catch (err) {
          resolve(0);
        }
      });
    }

    async function getDownloadedChunkPacket(itemId, chunkIndex) {
      var keyItemId = String(itemId || '');
      var profileKey = playerResolvedDownloadProfileByItemId[keyItemId] || getDownloadProfileKey(itemId);
      var row = await idbGet('chunks', profileKey + '|' + String(chunkIndex));
      if (!row && profileKey !== getDownloadProfileKey(itemId)) {
        var currentProfileKey = getDownloadProfileKey(itemId);
        row = await idbGet('chunks', currentProfileKey + '|' + String(chunkIndex));
        if (row) {
          profileKey = currentProfileKey;
          playerResolvedDownloadProfileByItemId[keyItemId] = currentProfileKey;
        }
      }
      if (!row) {
        var fallbackRow = await idbFindLatestChunkForItemIndex(itemId, chunkIndex);
        if (fallbackRow) {
          row = fallbackRow;
          profileKey = String(fallbackRow.profileKey || profileKey || '');
          if (profileKey) playerResolvedDownloadProfileByItemId[keyItemId] = profileKey;
        }
      }
      if (!row || !row.blob) return null;
      var contentType = normalizeMimeType(row.contentType || (row.blob && row.blob.type) || '');
      return {
        blob: row.blob,
        contentType: contentType || (row.isMock ? 'audio/wav' : 'audio/mpeg'),
        isMock: !!row.isMock,
        isReal: !row.isMock,
        key: 'downloaded:' + profileKey + '|' + String(chunkIndex),
      };
    }

    async function saveDownloadedChunkPacket(itemId, chunkIndex, packet) {
      if (!packet || !packet.blob) return;
      var profileKey = getDownloadProfileKey(itemId);
      playerResolvedDownloadProfileByItemId[String(itemId || '')] = profileKey;
      await idbPut('chunks', {
        id: profileKey + '|' + String(chunkIndex),
        profileKey: profileKey,
        itemId: String(itemId || ''),
        chunkIndex: Number(chunkIndex || 0),
        blob: packet.blob,
        contentType: normalizeMimeType(packet.contentType || (packet.blob && packet.blob.type) || ''),
        isMock: !!packet.isMock,
        savedAt: Date.now(),
      });
    }

    async function loadDownloadedManifest(itemId) {
      var keyItemId = String(itemId || '');
      var profileKey = playerResolvedDownloadProfileByItemId[keyItemId] || getDownloadProfileKey(itemId);
      var manifest = await idbGet('manifests', profileKey);
      if (!manifest && profileKey !== getDownloadProfileKey(itemId)) {
        var currentProfileKey = getDownloadProfileKey(itemId);
        manifest = await idbGet('manifests', currentProfileKey);
        if (manifest) {
          profileKey = currentProfileKey;
          playerResolvedDownloadProfileByItemId[keyItemId] = currentProfileKey;
        }
      }
      if (!manifest) {
        var fallback = await idbFindLatestManifestForItem(itemId);
        if (fallback) {
          manifest = fallback;
          profileKey = String(fallback.profileKey || fallback.id || profileKey || '');
          if (profileKey) playerResolvedDownloadProfileByItemId[keyItemId] = profileKey;
        }
      }
      if (manifest) playerDownloadedManifestByItemId[String(itemId)] = manifest;
      return manifest;
    }

    async function hydrateDownloadedProgressForItem(item) {
      if (!item || !item.id) return;
      var itemId = String(item.id);
      if (playerDownloadHydratedByItemId[itemId]) return;
      var profileKey = getDownloadProfileKey(itemId);
      var totalChunks = Math.max(1, getPlayerItemChunks(item).length);
      var manifest = playerDownloadedManifestByItemId[itemId] || await loadDownloadedManifest(itemId);
      if (manifest) {
        playerDownloadProgressByItemId[itemId] = 100;
        playerDownloadHydratedByItemId[itemId] = true;
        return;
      }
      var downloadedChunks = await idbCountChunksForProfile(profileKey);
      if (downloadedChunks <= 0) {
        downloadedChunks = await idbCountDistinctChunksForItem(itemId);
      }
      if (downloadedChunks > 0) {
        playerDownloadProgressByItemId[itemId] = Math.max(
          Number(playerDownloadProgressByItemId[itemId] || 0),
          Math.min(99, Math.round((downloadedChunks / totalChunks) * 100))
        );
      }
      playerDownloadHydratedByItemId[itemId] = true;
    }

    async function saveDownloadedManifest(itemId, chunkCount) {
      var profileKey = getDownloadProfileKey(itemId);
      playerResolvedDownloadProfileByItemId[String(itemId || '')] = profileKey;
      var manifest = {
        id: profileKey,
        profileKey: profileKey,
        itemId: String(itemId || ''),
        chunkCount: Number(chunkCount || 0),
        downloadedAt: Date.now(),
      };
      playerDownloadedManifestByItemId[String(itemId)] = manifest;
      await idbPut('manifests', manifest);
    }

    async function isItemFullyDownloaded(item) {
      if (!item) return false;
      var itemId = String(item.id || '');
      if (!itemId) return false;
      var manifest = playerDownloadedManifestByItemId[itemId] || await loadDownloadedManifest(itemId);
      var expected = getPlayerItemChunks(item).length;
      if (manifest) return Number(manifest.chunkCount || 0) >= expected;
      var downloadedChunks = await idbCountDistinctChunksForItem(itemId);
      return downloadedChunks >= expected;
    }

    async function fetchPlayerChunkBlob(item, itemId, chunkText, chunkIndex) {
      var downloadedPacket = await getDownloadedChunkPacket(itemId, chunkIndex);
      if (downloadedPacket) return downloadedPacket;
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
            voice: getEffectiveTtsRequestVoice(),
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
          if (typeof errMsg === 'string') {
            errMsg = errMsg.replace(/\s+/g, ' ').trim();
          }
          throw new Error(errMsg);
        }
        var blob = await res.blob();
        var contentType = normalizeMimeType(res.headers.get('content-type') || blob.type || '');
        var packet = {
          blob: blob,
          contentType: contentType || (ttsMockHeader === '1' ? 'audio/wav' : 'audio/mpeg'),
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

    function queueDownloadsForItems(items) {
      if (!Array.isArray(items) || !items.length) return;
      items.forEach(function(item) {
        if (!item || !item.id) return;
        var itemId = String(item.id);
        if (playerDownloadQueue.indexOf(itemId) === -1) playerDownloadQueue.push(itemId);
      });
      runDownloadQueue();
      updatePlayerDownloadStatus();
      renderPlayerQueue();
    }

    async function downloadItemAudio(item) {
      if (!item || !item.id) return;
      var itemId = String(item.id);
      var chunks = getPlayerItemChunks(item);
      if (!chunks.length) return;
      playerDownloadProgressByItemId[itemId] = 0;
      updatePlayerDownloadStatus();
      renderPlayerQueue();
      for (var i = 0; i < chunks.length; i++) {
        while (playerDownloadPaused) {
          await new Promise(function(resolve) { setTimeout(resolve, 160); });
        }
        var text = chunks[i] || '';
        if (!text.trim()) text = item.title || 'Untitled';
        var packet = await fetchPlayerChunkBlob(item, itemId, text, i);
        await saveDownloadedChunkPacket(itemId, i, packet);
        var pct = Math.round(((i + 1) / chunks.length) * 100);
        playerDownloadProgressByItemId[itemId] = pct;
        updatePlayerDownloadStatus();
        renderPlayerQueue();
      }
      await saveDownloadedManifest(itemId, chunks.length);
      playerDownloadProgressByItemId[itemId] = 100;
      updatePlayerDownloadStatus();
      renderPlayerQueue();
    }

    async function runDownloadQueue() {
      if (playerDownloadInFlight) return;
      if (!playerDownloadQueue.length) {
        playerDownloadCurrentItemId = '';
        updatePlayerDownloadStatus();
        return;
      }
      playerDownloadInFlight = true;
      while (playerDownloadQueue.length > 0) {
        while (playerDownloadPaused) {
          await new Promise(function(resolve) { setTimeout(resolve, 160); });
        }
        var nextId = playerDownloadQueue.shift();
        playerDownloadCurrentItemId = String(nextId || '');
        updatePlayerDownloadStatus();
        var item = playerQueue.find(function(it) { return String(it && it.id || '') === String(nextId); });
        if (!item) continue;
        try {
          await downloadItemAudio(item);
        } catch (err) {
          var reason = (err && err.message) ? String(err.message) : 'Unknown error';
          reason = reason.replace(/\s+/g, ' ').trim();
          setPlayerStatus('Download failed: ' + reason, true);
          showToast('Download failed for "' + (item.title || 'Untitled') + '": ' + reason, 'warning');
        }
      }
      playerDownloadInFlight = false;
      playerDownloadPaused = false;
      playerDownloadCurrentItemId = '';
      updatePlayerDownloadStatus();
      renderPlayerQueue();
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
          openUrl: item && item.openUrl ? String(item.openUrl) : '',
          gmailUrl: item && item.gmailUrl ? String(item.gmailUrl) : '',
          thumbnail: item && item.thumbnail ? String(item.thumbnail) : '',
          savedAt: item && item.savedAt ? String(item.savedAt) : '',
          publishedAt: item && item.publishedAt ? String(item.publishedAt) : '',
          searchable: item && item.searchable ? String(item.searchable) : '',
          ttsPreview: item && item.ttsPreview ? String(item.ttsPreview) : '',
          ttsFullText: item && item.ttsFullText ? String(item.ttsFullText).slice(0, 48000) : '',
          kind: item && item.kind ? String(item.kind) : '',
          labels: item && Array.isArray(item.labels) ? item.labels.map(function(label) { return String(label || ''); }).filter(Boolean) : [],
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
          openUrl: item && item.openUrl ? String(item.openUrl) : '',
          gmailUrl: item && item.gmailUrl ? String(item.gmailUrl) : '',
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
          source: getEffectiveSource(),
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
          playerSortMode: playerSortMode || 'added',
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
      if (state.source === 'readwise' || state.source === 'gmail' || state.source === 'all') {
        setSourceControlsFromValue(state.source);
      }
      var hasLocation = Array.from(locationSelect.options || []).some(function(opt) {
        return opt && opt.value === state.location;
      });
      if (hasLocation) locationSelect.value = state.location;
      syncSourceUi();
      if (typeof state.fromDate === 'string') fromDateInput.value = state.fromDate;
      if (typeof state.toDate === 'string') toDateInput.value = state.toDate;
      syncDateInputBounds();
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
      if (state.playerSortMode === 'added' || state.playerSortMode === 'published') {
        playerSortMode = state.playerSortMode;
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
      setFindMeta(currentCount, getEffectiveSource());
      if (previewTopToolbar) previewTopToolbar.style.display = previewData.length > 0 ? 'grid' : 'none';
      previewBottomControls.style.display = previewData.length > previewPageSize ? 'flex' : 'none';
      renderPreview();
      updateResultsSummary();
      updateDeletedBadge();
      renderDeletedItems();
      renderPlayerQueue();
      renderPlayerText();
      updatePlayerSortButtons();

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
      var downloadPct = Number(playerDownloadProgressByItemId[item] || 0);
      if (!downloadPct && playerDownloadedManifestByItemId[item]) downloadPct = 100;
      var progressPct = 0;
      if (durationSeconds > 0) {
        progressPct = Math.max(0, Math.min(100, (progressSeconds / durationSeconds) * 100));
      } else if (progressSeconds > 0) {
        progressPct = Math.max(0, Math.min(100, (progressSeconds / 60) * 100));
      }
      var visibleDownloadPct = downloadPct > 0 && downloadPct < 1 ? 1 : downloadPct;
      var visibleProgressPct = progressPct > 0 && progressPct < 1 ? 1 : progressPct;
      playerQueueEl.querySelectorAll('.player-row-progress-fill').forEach(function(el) {
        if (String(el.dataset.itemId || '') === item) {
          el.style.width = visibleProgressPct.toFixed(1) + '%';
        }
      });
      playerQueueEl.querySelectorAll('.player-row-progress-downloaded').forEach(function(el) {
        if (String(el.dataset.itemId || '') === item) {
          el.style.width = Math.max(0, Math.min(100, visibleDownloadPct)).toFixed(1) + '%';
        }
      });
      if (playerCurrentProgressFill && item === String(playerLoadedItemId || getCurrentPlayerItemId() || '')) {
        playerCurrentProgressFill.style.width = visibleProgressPct.toFixed(1) + '%';
      }
      if (playerCurrentProgressDownloaded && item === String(playerLoadedItemId || getCurrentPlayerItemId() || '')) {
        playerCurrentProgressDownloaded.style.width = Math.max(0, Math.min(100, visibleDownloadPct)).toFixed(1) + '%';
      }
    }

    function updatePlayerDownloadStatus() {
      if (!playerDownloadStatus) return;
      var currentItem = playerQueue[playerIndex] || null;
      var currentId = currentItem && currentItem.id ? String(currentItem.id) : '';
      var queuedCount = playerDownloadQueue.length + (playerDownloadInFlight ? 1 : 0);
      if (!currentId) {
        playerDownloadStatus.textContent = queuedCount > 0 ? ('Downloads queued: ' + queuedCount) : '';
        return;
      }
      var pct = Number(playerDownloadProgressByItemId[currentId] || 0);
      var done = !!playerDownloadedManifestByItemId[currentId] || pct >= 100;
      if (done) {
        playerDownloadStatus.textContent = 'Downloaded for offline playback';
        return;
      }
      var isCurrent = playerDownloadInFlight && playerDownloadCurrentItemId === currentId;
      if (isCurrent && playerDownloadPaused) {
        playerDownloadStatus.textContent = 'Download paused';
        return;
      }
      if (isCurrent) {
        playerDownloadStatus.textContent = 'Downloading audio: ' + Math.max(0, Math.min(100, pct)).toFixed(0) + '%';
        return;
      }
      if (queuedCount > 0) {
        playerDownloadStatus.textContent = 'Downloads queued: ' + queuedCount;
      } else {
        playerDownloadStatus.textContent = '';
      }
    }

    function buildPlayerSearchText(item) {
      return [
        item && item.title ? item.title : '',
        item && item.author ? item.author : '',
        item && item.site ? item.site : '',
        item && item.url ? item.url : '',
      ].join(' ').toLowerCase();
    }

    function getPlayerSortTimestamp(item) {
      var rawDate = playerSortMode === 'published'
        ? (item && (item.publishedAt || item.savedAt))
        : (item && item.savedAt);
      var ts = Date.parse(rawDate || '');
      return Number.isFinite(ts) ? ts : 0;
    }

    function updatePlayerSortButtons() {
      if (playerSortAddedBtn) playerSortAddedBtn.classList.toggle('active', playerSortMode === 'added');
      if (playerSortPublishedBtn) playerSortPublishedBtn.classList.toggle('active', playerSortMode === 'published');
    }

    function getFilteredPlayerIndices() {
      var term = (playerSearch || '').trim().toLowerCase();
      var indices = [];
      for (var i = 0; i < playerQueue.length; i++) {
        if (!term || buildPlayerSearchText(playerQueue[i]).includes(term)) {
          indices.push(i);
        }
      }
      indices.sort(function(a, b) {
        return getPlayerSortTimestamp(playerQueue[b]) - getPlayerSortTimestamp(playerQueue[a]);
      });
      return indices;
    }

    async function preloadDownloadedManifestsForQueue() {
      if (!playerQueue || !playerQueue.length) return;
      var changed = false;
      for (var i = 0; i < playerQueue.length; i++) {
        var item = playerQueue[i];
        var itemId = String(item && item.id || '');
        if (!itemId) continue;
        var before = Number(playerDownloadProgressByItemId[itemId] || 0);
        await hydrateDownloadedProgressForItem(item);
        var after = Number(playerDownloadProgressByItemId[itemId] || 0);
        if (after !== before) changed = true;
      }
      if (changed) renderPlayerQueue();
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

    async function seekPlayerQueueRowProgress(queueIdx, ratio) {
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
      var isCurrent = idx === playerIndex;
      var shouldAutoplay = !!(playerAudio && playerAudio.src && !playerAudio.paused);

      // Fast-path seeks inside the currently loaded chunk to avoid a needless reload/status flash.
      if (isCurrent && playerAudio && playerAudio.src && playerLoadedItemId === itemId && Number(playerLoadedChunkIndex || 0) === Number(seekPoint.chunkIndex || 0)) {
        var duration = Number(playerAudio.duration || 0);
        var target = duration > 0
          ? Math.max(0, Math.min(duration - 0.1, Number(seekPoint.chunkTime || 0)))
          : Math.max(0, Number(seekPoint.chunkTime || 0));
        try { playerAudio.currentTime = target; } catch (e) {}
        renderPlayerQueue();
        schedulePersistAppState();
        return;
      }

      var downloadedPacket = await getDownloadedChunkPacket(itemId, seekPoint.chunkIndex);
      var suppressLoadingStatus = !!downloadedPacket;
      loadPlayerIndex(idx, {
        chunkIndex: seekPoint.chunkIndex,
        seekSeconds: seekPoint.chunkTime,
        autoplay: shouldAutoplay,
        skipSaveCurrentProgress: isCurrent,
        suppressLoadingStatus: suppressLoadingStatus,
      });
      schedulePersistAppState();
    }

    function renderPlayerQueue() {
      preloadDownloadedManifestsForQueue();
      if (playerQueue.length === 0) {
        playerQueueEl.innerHTML = '<div class="history-item">No queued items.</div>';
        playerCurrentHeader.style.display = 'none';
        playerCurrentTitle.textContent = '';
        playerCurrentAuthor.textContent = '';
        setPlayerStatus('Queue is empty.', false);
        playerTtsModeEl.style.display = settings.mockTts ? 'block' : 'none';
        playerTtsModeEl.textContent = settings.mockTts ? 'TTS mode: mock clip' : '';
        playerLoadedItemId = '';
        playerCurrentText.style.display = 'none';
        playerCurrentText.textContent = '';
        playerTextToggleBtn.textContent = 'Text';
        if (playerCurrentProgressFill) playerCurrentProgressFill.style.width = '0%';
        playerSelectAll.checked = false;
        playerSelectAll.indeterminate = false;
        playerSelectAll.disabled = true;
        updateRailSelectionBadges();
        updateResultsSummary();
        updatePlayerResultsSummary(0, 0);
        updatePlayerDownloadStatus();
        schedulePersistAppState();
        return;
      }
      playerSelectAll.disabled = false;
      setPlayerStatus('', false);
      var currentItem = playerQueue[playerIndex] || {};
      var currentItemId = getPlayerItemId(currentItem, playerIndex);
      playerCurrentHeader.style.display = 'flex';
      playerCurrentTitle.textContent = currentItem.title || 'Untitled';
      playerCurrentAuthor.textContent = currentItem.author ? ('By ' + currentItem.author) : (currentItem.site || '');
      if (currentItem.thumbnail) {
        playerCurrentThumb.src = currentItem.thumbnail;
        playerCurrentThumb.onerror = handleImageLoadError;
        playerCurrentThumb.dataset.broken = '';
        playerCurrentThumb.style.display = 'inline-flex';
        playerCurrentThumbFallback.style.display = 'none';
      } else {
        playerCurrentThumb.removeAttribute('src');
        playerCurrentThumb.style.display = 'none';
        playerCurrentThumbFallback.style.display = 'inline-flex';
      }
      updatePlayerRowProgressUI(currentItemId);
      var filteredIndices = getFilteredPlayerIndices();
      if (filteredIndices.length === 0) {
        playerQueueEl.innerHTML = '<div class="history-item">No queued items match this filter.</div>';
        playerSelectAll.checked = false;
        playerSelectAll.indeterminate = false;
        updateRailSelectionBadges();
        updateResultsSummary();
        updatePlayerResultsSummary(0, 0);
        updatePlayerDownloadStatus();
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
        var dlPct = Number(playerDownloadProgressByItemId[itemId] || 0);
        var hasManifest = !!playerDownloadedManifestByItemId[itemId];
        var inQueue = playerDownloadQueue.indexOf(itemId) >= 0;
        var isCurrentDownload = playerDownloadInFlight && playerDownloadCurrentItemId === itemId;
        var isDownloading = isCurrentDownload && !playerDownloadPaused;
        var dlDone = hasManifest || dlPct >= 100;
        var downloadSymbol = dlDone ? '✓' : (isCurrentDownload ? (playerDownloadPaused ? '▶' : '⏸') : (inQueue ? '⏳' : '⬇'));
        var downloadClass = dlDone ? ' is-done' : '';
        var progressPct = 0;
        if (durationSeconds > 0) {
          progressPct = Math.max(0, Math.min(100, (progressSeconds / durationSeconds) * 100));
        } else if (progressSeconds > 0) {
          progressPct = Math.max(0, Math.min(100, (progressSeconds / 60) * 100));
        }
        var visibleDownloadPct = dlPct > 0 && dlPct < 1 ? 1 : dlPct;
        var visibleProgressPct = progressPct > 0 && progressPct < 1 ? 1 : progressPct;
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
            ? '<img class="preview-thumb" src="' + escapeHtml(item.thumbnail) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="handleImageLoadError(event)">'
            : '<span class="preview-thumb-fallback">No image</span>') +
          '<div class="article-info">' +
          '<div class="title-row">' +
          '<div class="title-left"><span class="webpage-icon" aria-hidden="true">🌐</span>' +
          '<button type="button" class="text-preview-toggle player-queue-jump" data-queue-idx="' + idx + '" style="text-align:left; width:100%;">' + escapeHtml(prefix + (item.title || 'Untitled')) + (isCurrent ? '<span class="now-playing-badge">Now Playing</span>' : '') + '</button>' +
          '<div class="player-row-actions">' +
          '<button type="button" class="text-preview-toggle icon-btn player-row-action-btn player-queue-open" data-open-url="' + escapeHtml(getItemOpenUrl(item) || '') + '" title="Open story" aria-label="Open story">↗</button>' +
          '<button type="button" class="text-preview-toggle icon-btn player-row-action-btn player-queue-download' + downloadClass + '" data-queue-idx="' + idx + '" title="Download audio" aria-label="Download audio">' + downloadSymbol + '</button>' +
          '</div>' +
          '</div>' +
          '<span class="article-date-right">Added ' + escapeHtml(formatDate(item.savedAt || '')) + '</span>' +
          '</div>' +
          '<div class="article-meta"><span class="article-site">' + escapeHtml(item.site || '') + '</span>' + (item.author ? ' by ' + escapeHtml(item.author) : '') + '</div>' +
          '<div class="player-row-progress" data-queue-idx="' + idx + '" data-item-id="' + escapeHtml(itemId) + '" title="' + Math.round(progressSeconds) + 's listened / ~' + Math.round(durationSeconds) + 's">' +
          '<div class="player-row-progress-downloaded" data-item-id="' + escapeHtml(itemId) + '" style="width:' + Math.max(0, Math.min(100, visibleDownloadPct)).toFixed(1) + '%;"></div>' +
          '<div class="player-row-progress-fill" data-item-id="' + escapeHtml(itemId) + '" style="width:' + visibleProgressPct.toFixed(1) + '%;"></div>' +
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
      playerQueueEl.querySelectorAll('.player-queue-open').forEach(function(btn) {
        on(btn, 'click', function(evt) {
          openPreviewUrl(evt, btn.dataset.openUrl || '');
        });
      });
      playerQueueEl.querySelectorAll('.player-queue-download').forEach(function(btn) {
        on(btn, 'click', function(evt) {
          evt.preventDefault();
          evt.stopPropagation();
          var idx = parseInt(btn.dataset.queueIdx, 10);
          if (!Number.isFinite(idx) || idx < 0 || idx >= playerQueue.length) return;
          var item = playerQueue[idx];
          var itemId = String(item && item.id || '');
          if (!itemId) return;
          var isCurrent = playerDownloadInFlight && playerDownloadCurrentItemId === itemId;
          if (isCurrent) {
            playerDownloadPaused = !playerDownloadPaused;
            renderPlayerQueue();
            return;
          }
          var queuedIdx = playerDownloadQueue.indexOf(itemId);
          if (queuedIdx >= 0) {
            playerDownloadQueue.splice(queuedIdx, 1);
            renderPlayerQueue();
            return;
          }
          queueDownloadsForItems([item]);
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
      updateResultsSummary();
      updatePlayerResultsSummary(filteredIndices.length, filteredSelected);
      updatePlayerDownloadStatus();
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

      if (!opts.skipSaveCurrentProgress) {
        saveCurrentPlayerProgress();
      }
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
        if (!opts.suppressLoadingStatus) {
          setPlayerStatus('Loading audio chunk ' + (chunkIndex + 1) + ' of ' + chunks.length + '...', true);
        }
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
        var playableBlob = await ensurePlayableAudioBlob(packet);
        if (!playableBlob || !playableBlob.size) {
          throw new Error('Audio chunk is empty or unreadable on this device.');
        }
        playerAudioObjectUrl = URL.createObjectURL(playableBlob);
        playerAudio.src = playerAudioObjectUrl;
        applySelectedPlaybackRate();
        await waitForAudioReady(playerAudio, isIosLikeDevice ? 12000 : 9000);
        applySelectedPlaybackRate();
        var duration = Number(playerAudio.duration || 0);
        if (duration > 0) {
          var durationMap = getChunkDurationMap(itemId);
          durationMap[chunkIndex] = duration;
          playerDurationByItemId[itemId] = Math.max(Number(playerDurationByItemId[itemId] || 0), sumKnownChunkDurations(itemId));
        }
        var target = duration > 0 ? Math.min(resumeAt, Math.max(0, duration - 0.1)) : resumeAt;
        try { playerAudio.currentTime = Math.max(0, target); } catch (e) {}
        if (loadToken !== playerLoadToken) return;
        if (opts.autoplay !== false) {
          try {
            await playerAudio.play();
          } catch (playErr) {
            if (isAutoplayBlockedError(playErr)) {
              setPlayerStatus('iPhone blocked autoplay after loading. Tap Play to start audio.', true);
              setPlayerPlayPauseButtonState();
              renderPlayerQueue();
              return;
            }
            throw playErr;
          }
        } else {
          setPlayerPlayPauseButtonState();
        }
        prefetchPlayerChunk(item, itemId, chunks, chunkIndex + 1);
        renderPlayerQueue();
      } catch (err) {
        if (loadToken !== playerLoadToken) return;
        if (typeof navigator !== 'undefined' && navigator && navigator.onLine === false) {
          var nextDownloadedIdx = await findNextDownloadedPlayableIndex(idx);
          if (nextDownloadedIdx >= 0) {
            setPlayerStatus('Offline: skipping undownloaded story.', true);
            loadPlayerIndex(nextDownloadedIdx, { autoplay: true });
            return;
          }
        }
        setPlayerStatus(err.message || 'Audio load failed', true);
        playerTtsModeEl.style.display = 'block';
        playerTtsModeEl.textContent = 'TTS mode: error';
        setPlayerPlayPauseButtonState();
        showToast((err && err.message) || 'Audio load failed', 'error');
      }
    }

    function startPlayerWithItems(items) {
      if (!Array.isArray(items) || items.length === 0) return;
      playerLoadToken += 1;
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

    function buildEnabledItemBudget(queue, enabledIds) {
      var budget = {};
      if (!Array.isArray(queue) || !queue.length || !enabledIds || typeof enabledIds.has !== 'function') return budget;
      for (var i = 0; i < queue.length; i++) {
        var queueId = getPlayerQueueId(queue[i], i);
        if (!enabledIds.has(queueId)) continue;
        var itemId = getPlayerItemId(queue[i], i);
        budget[itemId] = (budget[itemId] || 0) + 1;
      }
      return budget;
    }

    function buildEnabledIdsFromBudget(queue, budget) {
      var out = new Set();
      if (!Array.isArray(queue) || !queue.length) return out;
      var mutableBudget = {};
      if (budget && typeof budget === 'object') {
        Object.keys(budget).forEach(function(key) {
          var count = parseInt(budget[key], 10);
          if (Number.isFinite(count) && count > 0) mutableBudget[key] = count;
        });
      }
      for (var i = 0; i < queue.length; i++) {
        var itemId = getPlayerItemId(queue[i], i);
        if (!mutableBudget[itemId]) continue;
        out.add(getPlayerQueueId(queue[i], i));
        mutableBudget[itemId] -= 1;
      }
      return out;
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

    async function findNextDownloadedPlayableIndex(fromIdx) {
      for (var i = fromIdx + 1; i < playerQueue.length; i++) {
        if (!playerEnabledIds.has(getPlayerQueueId(playerQueue[i], i))) continue;
        if (await isItemFullyDownloaded(playerQueue[i])) return i;
      }
      return -1;
    }

    function removePlayerQueueIndex(idx) {
      if (idx < 0 || idx >= playerQueue.length) return;
      if (idx === playerIndex) playerLoadToken += 1;
      var enabledBudget = buildEnabledItemBudget(playerQueue, playerEnabledIds);
      var removedItemId = getPlayerItemId(playerQueue[idx], idx);
      if (removedItemId && enabledBudget[removedItemId]) {
        enabledBudget[removedItemId] = Math.max(0, enabledBudget[removedItemId] - 1);
      }
      playerQueue.splice(idx, 1);
      playerEnabledIds = buildEnabledIdsFromBudget(playerQueue, enabledBudget);
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
      if (playerEnabledIds.size === 0) {
        var currentQueueId = getCurrentPlayerQueueId();
        if (currentQueueId) playerEnabledIds.add(currentQueueId);
      }
    }

    function buildCleanupItemPayload(item) {
      if (!item) return null;
      return {
        id: item.id !== undefined && item.id !== null ? String(item.id) : '',
        title: item.title || '',
        author: item.author || '',
        url: item.url || '',
        savedAt: item.savedAt || '',
        publishedAt: item.publishedAt || null,
        thumbnail: item.thumbnail || null,
        originalLocation: item.originalLocation || null,
        kind: item.kind || '',
        site: item.site || '',
      };
    }

    async function runPlayerItemAction(idx, action) {
      var item = playerQueue[idx];
      if (!item || !item.id) return false;
      var payloadItem = buildCleanupItemPayload(item);
      var result = await performCleanup(action, true, [String(item.id)], payloadItem ? [payloadItem] : [], 'all');
      if (!result || !result.ok) return false;
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
      if (!playerAudio.src) {
        setPlayerStatus('No audio loaded. Queue a story and press Play.', true);
        showToast('No audio loaded', 'error');
        return;
      }
      if (playerAudio.paused) {
        applySelectedPlaybackRate();
        playerAudio.play().catch(function(err) {
          var msg = isAutoplayBlockedError(err)
            ? 'iPhone blocked playback. Tap Play again after interacting with the page.'
            : ((err && err.message) || 'Unable to start audio');
          setPlayerStatus(msg, true);
          showToast(msg, 'error');
        });
      }
      else playerAudio.pause();
    });
    on(playerBackBtn, 'click', function() {
      playerAudio.currentTime = Math.max(0, playerAudio.currentTime - settings.audioBackSeconds);
    });
    on(playerForwardBtn, 'click', function() {
      playerAudio.currentTime = Math.min(playerAudio.duration || Infinity, playerAudio.currentTime + settings.audioForwardSeconds);
    });
    on(playerCurrentProgress, 'click', function(evt) {
      if (!playerCurrentProgress || !playerCurrentProgress.getBoundingClientRect) return;
      var rect = playerCurrentProgress.getBoundingClientRect();
      var rel = rect.width > 0 ? (evt.clientX - rect.left) / rect.width : 0;
      seekPlayerQueueRowProgress(playerIndex, rel);
    });
    on(playerSpeedSelect, 'change', function() {
      applySelectedPlaybackRate();
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
    on(playerSortAddedBtn, 'click', function() {
      playerSortMode = 'added';
      updatePlayerSortButtons();
      renderPlayerQueue();
    });
    on(playerSortPublishedBtn, 'click', function() {
      playerSortMode = 'published';
      updatePlayerSortButtons();
      renderPlayerQueue();
    });
    updatePlayerSortButtons();
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
      if (!settings.playerAutoNext) return;
      if (playerQueue.length === 0) return;
      var nextSearchStartIdx = removedCurrent ? Math.max(-1, playerIndex - 1) : playerIndex;
      var nextIdx = findNextPlayableIndex(nextSearchStartIdx);
      if (nextIdx >= 0) {
        await loadPlayerIndex(nextIdx);
      }
    });
    on(playerAudio, 'timeupdate', function() {
      saveCurrentPlayerProgress();
    });
    on(playerAudio, 'play', function() {
      applySelectedPlaybackRate();
      setPlayerPlayPauseButtonState();
    });
    on(playerAudio, 'pause', function() {
      setPlayerPlayPauseButtonState();
    });
    on(playerAudio, 'loadedmetadata', function() {
      applySelectedPlaybackRate();
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

    async function performCleanup(action, skipConfirm, forcedIds, forcedItems, forcedSource) {
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
        var selectedItems = [];
        if (Array.isArray(forcedItems) && forcedItems.length > 0) {
          selectedItems = forcedItems
            .filter(function(item) { return item && item.id !== undefined && item.id !== null; })
            .map(function(item) {
              return {
                id: String(item.id),
                title: item.title || '',
                author: item.author || '',
                url: item.url || '',
                savedAt: item.savedAt || '',
                publishedAt: item.publishedAt || null,
                thumbnail: item.thumbnail || null,
                originalLocation: item.originalLocation || null,
                kind: item.kind || '',
                site: item.site || '',
              };
            });
        } else {
          selectedItems = previewData
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
                originalLocation: item.originalLocation || null,
                kind: item.kind || '',
                site: item.site || '',
              };
            });
        }

        var processedTotal = 0;
        var allErrors = [];
        var allProcessedIds = [];
        var requestSource = String(forcedSource || getEffectiveSource() || 'readwise').toLowerCase();
        if (requestSource !== 'gmail' && requestSource !== 'all' && requestSource !== 'readwise') {
          requestSource = 'readwise';
        }
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
              source: requestSource,
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
          Array.isArray(data.processedIds)
            ? data.processedIds.map(function(id) { return String(id); })
            : []
        );
        if (
          successfulIds.size === 0 &&
          Number(data.processed || 0) === activeSelectedIds.length &&
          (!Array.isArray(data.errors) || data.errors.length === 0)
        ) {
          activeSelectedIds.forEach(function(id) { successfulIds.add(String(id)); });
        }
        if (Array.isArray(data.errors)) {
          data.errors.forEach(function(err) {
            if (err && err.id !== undefined && err.id !== null) {
              successfulIds.delete(String(err.id));
            }
          });
        }

        if (successfulIds.size > 0) {
          syncPlayerQueueAfterProcessedIds(Array.from(successfulIds));
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
          setFindMeta(0, getEffectiveSource());
          renderPreview();
          if (previewTopToolbar) previewTopToolbar.style.display = 'none';
          previewBottomControls.style.display = 'none';
        } else {
          var totalPages = Math.max(1, Math.ceil(getFilteredPreviewItems().length / previewPageSize));
          if (previewPage > totalPages) previewPage = totalPages;
          setFindMeta(currentCount, getEffectiveSource());
          renderPreview();
          if (previewTopToolbar) previewTopToolbar.style.display = 'grid';
          previewBottomControls.style.display = totalPages > 1 ? 'flex' : 'none';
        }
        updateResultsSummary();

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
      var filteredIdSet = new Set(filtered.map(function(item) { return getDeletedItemKey(item); }));
      var filteredSelected = Array.from(selectedDeletedIds).filter(function(id) { return filteredIdSet.has(id); }).length;
      var displayCount = filteredSelected;

      restoreBtn.disabled = activeSelectedItems.length === 0;
      if (deleteSelectedHistoryBtn) deleteSelectedHistoryBtn.disabled = activeSelectedItems.length === 0;
      restoreBtn.textContent = displayCount > 0 ? 'Restore (' + displayCount + ')' : 'Restore';
      if (deleteSelectedHistoryBtn) {
        deleteSelectedHistoryBtn.textContent = displayCount > 0 ? 'Delete (' + displayCount + ')' : 'Delete';
      }

      if (deletedItems.length === 0 || filtered.length === 0) {
        selectAllDeleted.checked = false;
        selectAllDeleted.indeterminate = false;
        updateDeletedResultsSummary();
        return;
      }
      selectAllDeleted.checked = filteredSelected > 0 && filteredSelected === filtered.length;
      selectAllDeleted.indeterminate = filteredSelected > 0 && filteredSelected < filtered.length;
      updateDeletedResultsSummary();
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
      return [
        item && item.id !== undefined && item.id !== null ? String(item.id) : '',
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
        updateDeletedResultsSummary();
        schedulePersistAppState();
        return;
      }
      var filtered = getFilteredDeletedItems();
      if (filtered.length === 0) {
        deletedList.innerHTML = '<div class="empty-state-panel"><div class="empty-state-title">No deleted items match this filter</div><div class="empty-state-subtitle">Try a different search phrase or date sort option.</div></div>';
        updateSelectedButtons();
        updateDeletedResultsSummary();
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
          html += '<img class="preview-thumb" src="' + escapeHtml(item.thumbnail) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="handleImageLoadError(event)">';
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
      updateDeletedResultsSummary();
      schedulePersistAppState();
    }

    on(restoreBtn, 'click', async function() {
      var activeSelectedItems = getActiveSelectedDeletedItems();
      if (activeSelectedItems.length === 0) return;
      var activeSelectedUrls = activeSelectedItems.map(function(item) { return item.url; }).filter(Boolean);
      var activeSelectedKeys = activeSelectedItems.map(function(item) { return getDeletedItemKey(item); }).filter(Boolean);
      restoreBtn.disabled = true;
      restoreBtn.innerHTML = '<span class="spinner"></span> Restoring...';
      try {
        var res = await fetch('/api/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: activeSelectedUrls, keys: activeSelectedKeys })
        });
        var data = await res.json();
        if (data.error) throw new Error(data.error);
        showToast('Restored ' + data.restored + ' items', 'success');
        activeSelectedItems.forEach(function(item) { selectedDeletedIds.delete(getDeletedItemKey(item)); });
        loadDeletedItems();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        restoreBtn.innerHTML = 'Restore';
      }
    });

    on(deleteSelectedHistoryBtn, 'click', async function() {
      var activeSelectedItems = getActiveSelectedDeletedItems();
      if (activeSelectedItems.length === 0) return;
      if (!window.confirm('Delete ' + activeSelectedItems.length + ' items from history? This cannot be undone.')) return;
      var activeSelectedUrls = activeSelectedItems.map(function(item) { return item.url; }).filter(Boolean);
      var activeSelectedKeys = activeSelectedItems.map(function(item) { return getDeletedItemKey(item); }).filter(Boolean);
      try {
        var res = await fetch('/api/clear-deleted', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: activeSelectedUrls, keys: activeSelectedKeys })
        });
        var data = await res.json();
        if (data.error) throw new Error(data.error);
        showToast('Deleted ' + data.removed + ' from history', 'success');
        activeSelectedItems.forEach(function(item) { selectedDeletedIds.delete(getDeletedItemKey(item)); });
        loadDeletedItems();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    on(clearHistoryBtn, 'click', async function() {
      if (!window.confirm('Clear all deleted-item history? This cannot be undone.')) return;
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
      var gmailLabels = [];
      if (settingsGmailLabelsSelect && settingsGmailLabelsSelect.selectedOptions) {
        gmailLabels = Array.from(settingsGmailLabelsSelect.selectedOptions)
          .map(function(opt) { return String(opt && opt.value || '').trim(); })
          .filter(Boolean);
      } else if (settingsGmailLabelsSelect && settingsGmailLabelsSelect.value) {
        gmailLabels = String(settingsGmailLabelsSelect.value)
          .split(',')
          .map(function(v) { return String(v || '').trim(); })
          .filter(Boolean);
      }
      return {
        defaultSource: settingsDefaultSource.value || 'readwise',
        defaultLocation: settingsDefaultLocation.value,
        defaultDays: parseInt(settingsDefaultDays.value, 10),
        previewLimit: parseInt(settingsPreviewLimit.value, 10),
        confirmActions: !!settingsConfirmActions.checked,
        mockTts: !!settingMockTts.checked,
        ttsProvider: (settingTtsProvider && settingTtsProvider.value) || 'openai',
        ttsVoice: (settingTtsVoice && settingTtsVoice.value) || 'alloy',
        awsPollyVoice: (settingAwsPollyVoice && settingAwsPollyVoice.value) || 'Joanna',
        audioBackSeconds: parseInt(settingAudioBackSeconds.value, 10),
        audioForwardSeconds: parseInt(settingAudioForwardSeconds.value, 10),
        maxOpenTabs: parseInt(settingMaxOpenTabs.value, 10),
        playerAutoNext: !!settingPlayerAutoNext.checked,
        playerAutoAction: settingPlayerAutoAction.value,
        gmailSelectedLabels: gmailLabels,
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
      if (getEffectiveTtsProvider() === 'aws_polly_standard') {
        voice = (settingAwsPollyVoice && settingAwsPollyVoice.value) || 'Joanna';
      }
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
      settingsDefaultSource,
      settingsDefaultLocation,
      settingsDefaultDays,
      settingsPreviewLimit,
      settingsConfirmActions,
      settingMockTts,
      settingTtsProvider,
      settingTtsVoice,
      settingAwsPollyVoice,
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
    on(settingAwsPollyVoice, 'change', function() {
      previewSelectedVoice();
    });
    on(settingTtsProvider, 'change', function() {
      settings.ttsProvider = (settingTtsProvider && settingTtsProvider.value) || 'openai';
      syncTtsProviderUi();
      scheduleSaveSettingsImmediate();
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

    async function loadGmailStatus() {
      if (!gmailStatusEl) return;
      try {
        var res = await fetch('/api/gmail/status');
        var data = await parseApiJson(res);
        var mode = data.mode ? String(data.mode) : 'hook';
        var count = Number(data.itemCount || 0);
        var labels = Array.isArray(data.selectedLabels) ? data.selectedLabels : [];
        var availableLabels = Array.isArray(data.labels) ? data.labels : [];
        var connected = !!data.connected;
        var oauthReady = !!data.oauthConfigReady;
        gmailConnected = connected;
        gmailOauthReady = oauthReady;
        gmailKnownLabels = availableLabels.slice();
        var oauthHint = oauthReady ? '' : ' · OAuth not configured (set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in Worker env)';
        gmailStatusEl.textContent = 'Mode: ' + mode + ' · Connected: ' + (connected ? 'yes' : 'no') + ' · Synced items: ' + count + (labels.length ? ' · Active labels: ' + labels.join(', ') : '') + oauthHint;
        if (connectGmailBtn) {
          connectGmailBtn.disabled = connected ? false : !oauthReady;
          connectGmailBtn.textContent = connected ? 'Disconnect Gmail' : 'Connect Gmail';
        }
        if (syncGmailBtn) syncGmailBtn.disabled = !connected;
        renderGmailLabelOptions();
      } catch (err) {
        gmailConnected = false;
        gmailOauthReady = false;
        gmailKnownLabels = [];
        gmailStatusEl.textContent = 'Unable to read Gmail status.';
        if (connectGmailBtn) {
          connectGmailBtn.disabled = false;
          connectGmailBtn.textContent = 'Connect Gmail';
        }
        if (syncGmailBtn) syncGmailBtn.disabled = true;
        renderGmailLabelOptions();
      }
    }

    async function runGmailSync(opts) {
      opts = opts || {};
      if (!gmailConnected) return { skipped: true, reason: 'disconnected' };
      if (!opts.force) {
        var elapsed = Date.now() - lastGmailSyncAt;
        if (elapsed >= 0 && elapsed < 45000) return { skipped: true, reason: 'throttled' };
      }
      var res = await fetch('/api/gmail/sync', { method: 'POST' });
      var data = await parseApiJson(res);
      if (data.error) throw new Error(data.error);
      lastGmailSyncAt = Date.now();
      return data;
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

    on(saveGmailLabelsBtn, 'click', async function() {
      var labels = [];
      if (settingsGmailLabelsSelect && settingsGmailLabelsSelect.selectedOptions) {
        labels = Array.from(settingsGmailLabelsSelect.selectedOptions).map(function(opt) {
          return String(opt && opt.value || '').trim();
        }).filter(Boolean);
      } else if (settingsGmailLabelsSelect && settingsGmailLabelsSelect.value) {
        labels = String(settingsGmailLabelsSelect.value)
          .split(',')
          .map(function(v) { return String(v || '').trim(); })
          .filter(Boolean);
      }
      saveGmailLabelsBtn.disabled = true;
      var originalText = saveGmailLabelsBtn.textContent;
      saveGmailLabelsBtn.innerHTML = '<span class="spinner"></span> Saving...';
      try {
        var res = await fetch('/api/gmail/labels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ labels: labels }),
        });
        var data = await parseApiJson(res);
        if (data.error) throw new Error(data.error);
        settings.gmailSelectedLabels = Array.isArray(data.selectedLabels) ? data.selectedLabels : [];
        renderGmailLabelOptions();
        showToast('Gmail labels saved', 'success');
        loadGmailStatus();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        saveGmailLabelsBtn.disabled = false;
        saveGmailLabelsBtn.textContent = originalText;
      }
    });

    on(connectGmailBtn, 'click', function() {
      if (gmailConnected) {
        if (!window.confirm('Disconnect Gmail and remove stored OAuth token?')) return;
        connectGmailBtn.disabled = true;
        var disconnectText = connectGmailBtn.textContent;
        connectGmailBtn.innerHTML = '<span class="spinner"></span> Disconnecting...';
        (async function() {
          try {
            var disconnectRes = await fetch('/api/gmail/disconnect', { method: 'POST' });
            var disconnectData = await parseApiJson(disconnectRes);
            if (disconnectData.error) throw new Error(disconnectData.error);
            showToast('Gmail disconnected', 'success');
            loadGmailStatus();
          } catch (disconnectErr) {
            showToast(disconnectErr.message, 'error');
          } finally {
            connectGmailBtn.disabled = false;
            connectGmailBtn.textContent = disconnectText;
          }
        })();
        return;
      }
      var popup = null;
      try {
        popup = window.open('/api/gmail/connect?popup=1', 'gmail_oauth_popup', 'popup=yes,width=560,height=720');
      } catch (err) {}
      if (!popup) {
        window.location.href = '/api/gmail/connect';
        return;
      }
      var popupPoll = setInterval(function() {
        if (!popup || popup.closed) {
          clearInterval(popupPoll);
          loadGmailStatus();
        }
      }, 350);
    });

    on(syncGmailBtn, 'click', async function() {
      syncGmailBtn.disabled = true;
      var originalText = syncGmailBtn.textContent;
      syncGmailBtn.innerHTML = '<span class="spinner"></span> Syncing...';
      try {
        var data = await runGmailSync({ force: true });
        showToast('Gmail sync complete (' + Number(data.synced || 0) + ' updates)', 'success');
        loadGmailStatus();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        syncGmailBtn.disabled = false;
        syncGmailBtn.textContent = originalText;
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
      if (type === 'warning' || type === 'error') {
        addRecentErrorLog(message, type);
      }
      var existing = document.querySelector('.toast');
      if (existing) existing.remove();
      var toast = document.createElement('div');
      toast.className = 'toast ' + type;
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(function() { toast.remove(); }, 3000);
    }

    function persistRecentErrorLog() {
      try {
        localStorage.setItem(RECENT_ERROR_LOG_STORAGE_KEY, JSON.stringify(recentErrorLog));
      } catch (err) {}
    }

    function renderRecentErrorLog() {
      if (!recentErrorsListEl || !recentErrorsEmptyEl) return;
      if (!recentErrorLog.length) {
        recentErrorsListEl.innerHTML = '';
        recentErrorsEmptyEl.style.display = 'block';
        return;
      }
      recentErrorsEmptyEl.style.display = 'none';
      recentErrorsListEl.innerHTML = recentErrorLog.map(function(entry) {
        var when = Number(entry && entry.ts || 0);
        var stamp = when > 0
          ? new Date(when).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' })
          : '';
        var level = String(entry && entry.level || 'error');
        return '<div class="recent-error-item">' +
          '<div class="recent-error-meta"><span class="recent-error-tag ' + escapeHtml(level) + '">' + escapeHtml(level) + '</span><span>' + escapeHtml(stamp) + '</span></div>' +
          '<div>' + escapeHtml(String(entry && entry.message || '')) + '</div>' +
          '</div>';
      }).join('');
    }

    function loadRecentErrorLog() {
      try {
        var raw = localStorage.getItem(RECENT_ERROR_LOG_STORAGE_KEY);
        if (!raw) {
          recentErrorLog = [];
          renderRecentErrorLog();
          return;
        }
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          recentErrorLog = parsed
            .filter(function(entry) { return entry && typeof entry.message === 'string' && entry.message.trim(); })
            .map(function(entry) {
              return {
                message: String(entry.message || '').slice(0, 1200),
                level: String(entry.level || 'error') === 'warning' ? 'warning' : 'error',
                ts: Number(entry.ts || 0) || Date.now(),
              };
            })
            .slice(0, RECENT_ERROR_LOG_MAX);
        } else {
          recentErrorLog = [];
        }
      } catch (err) {
        recentErrorLog = [];
      }
      renderRecentErrorLog();
    }

    function addRecentErrorLog(message, level) {
      var msg = String(message || '').replace(/\s+/g, ' ').trim();
      if (!msg) return;
      var normalizedLevel = String(level || 'error') === 'warning' ? 'warning' : 'error';
      var now = Date.now();
      var latest = recentErrorLog[0];
      if (latest && latest.message === msg && latest.level === normalizedLevel && (now - Number(latest.ts || 0)) < 10000) {
        latest.ts = now;
      } else {
        recentErrorLog.unshift({
          message: msg.slice(0, 1200),
          level: normalizedLevel,
          ts: now,
        });
      }
      if (recentErrorLog.length > RECENT_ERROR_LOG_MAX) recentErrorLog = recentErrorLog.slice(0, RECENT_ERROR_LOG_MAX);
      persistRecentErrorLog();
      renderRecentErrorLog();
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
      historyEl.innerHTML = '<div style="font-weight:600;margin-bottom:0.35rem;color:var(--text)">Fix & Version History</div>' + lines.join('');
    }

    function renderLatestFixInSettings() {
      var target = document.getElementById('settings-latest-fix');
      if (!target) return;
      var latest = Array.isArray(VERSION_HISTORY) && VERSION_HISTORY.length ? VERSION_HISTORY[0] : null;
      if (!latest) {
        target.textContent = 'Latest fix: unavailable';
        return;
      }
      var stamp = latest.completedAt ? (' (' + latest.completedAt + ')') : '';
      target.textContent = 'Latest fix (v' + String(latest.version || '') + stamp + '): ' + String(latest.note || '');
    }

    function handleOauthFlashFromQuery() {
      try {
        var params = new URLSearchParams(window.location.search || '');
        var status = params.get('gmail_oauth');
        if (!status) return;
        if (status === 'connected') showToast('Gmail connected', 'success');
        else if (status === 'missing_config') showToast('Gmail OAuth is missing configuration', 'error');
        else showToast('Gmail OAuth: ' + status, 'warning');
        params.delete('gmail_oauth');
        params.delete('reason');
        var next = window.location.pathname + (params.toString() ? ('?' + params.toString()) : '');
        history.replaceState({}, '', next);
      } catch (err) {}
    }

    async function initializeApp() {
      isIosLikeDevice = detectIosLikeDevice();
      if (playerAudio) {
        playerAudio.preload = 'auto';
        if (typeof playerAudio.setAttribute === 'function') {
          playerAudio.setAttribute('playsinline', '');
          playerAudio.setAttribute('webkit-playsinline', 'true');
        } else {
          playerAudio.playsInline = true;
          playerAudio.webkitPlaysInline = true;
        }
      }
      restorePlayerState();
      loadRecentErrorLog();
      var restoredState = restoreAppState();
      await loadSettings();
      await loadLocations();
      if (restoredState) {
        applyRestoredAppState(restoredState);
        var routeTab = getTabFromPath(window.location.pathname);
        if (routeTab && routeTab !== currentTabName) {
          setActiveTab(routeTab, { push: false });
        }
      } else {
        setActiveTab(getTabFromPath(window.location.pathname), { push: false });
        renderPreview();
        updateResultsSummary();
      }
      updatePreviewButtonLabel();
      loadTokenStatus();
      loadGmailStatus();
      loadOpenAiKeyStatus();
      renderVersionHistory();
      renderLatestFixInSettings();
      loadDeletedCount();
      setPlayerPlayPauseButtonState();
      updateResultsSummary();
      updateFloatingPlayerHover();
      updateRailSelectionBadges();
      handleOauthFlashFromQuery();
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

    on(clearRecentErrorsBtn, 'click', function() {
      recentErrorLog = [];
      persistRecentErrorLog();
      renderRecentErrorLog();
      if (recentErrorsDetails && recentErrorsDetails.open) {
        showToast('Recent error log cleared', 'success');
      }
    });
  </script>
</body>
</html>`;

  const V2_CSS = `
  <style id="v2-style-overrides">
    body.v2-mode .v2-top-actions {
      display: none;
    }
    body.v2-mode .v2-icon {
      width: 1em;
      height: 1em;
      stroke: currentColor;
      fill: none;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      vertical-align: middle;
      flex: 0 0 auto;
      pointer-events: none;
    }
    body.v2-mode .webpage-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #3f6f9c;
      font-size: 0.95rem;
    }
    body.v2-mode .player-row-action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #345f88;
    }
    body.v2-mode .player-row-action-btn.is-done {
      color: #1d8a50;
    }
    body.v2-mode .play-preview-btn,
    body.v2-mode .player-queue-open,
    body.v2-mode .player-queue-download {
      font-size: 0;
    }
    body.v2-mode .play-preview-btn .v2-icon,
    body.v2-mode .player-queue-open .v2-icon,
    body.v2-mode .player-queue-download .v2-icon {
      width: 0.98rem;
      height: 0.98rem;
    }
    body.v2-mode .player-icon-btn .control-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0;
      line-height: 1;
    }
    body.v2-mode .player-icon-btn .control-icon .v2-icon {
      width: 1.28rem;
      height: 1.28rem;
    }
    body.v2-mode .player-current-progress,
    body.v2-mode .player-row-progress {
      height: 7px;
      border-radius: 999px;
      background: #d6deea;
      overflow: hidden;
    }
    body.v2-mode .player-current-progress-downloaded,
    body.v2-mode .player-row-progress-downloaded {
      background: #27b35f;
      opacity: 0.95;
    }
    body.v2-mode .player-current-progress-fill,
    body.v2-mode .player-row-progress-fill {
      background: #1b88e8;
      top: 1px;
      bottom: 1px;
      height: auto;
      border-radius: 999px;
    }
    body.v2-mode .v2-row-tray {
      display: none;
      gap: 0.34rem;
      margin-top: 0.46rem;
      align-items: center;
      flex-wrap: nowrap;
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 0.1rem;
    }
    body.v2-mode .v2-row-tray-btn {
      width: 2.02rem;
      height: 2.02rem;
      border-radius: 999px;
      border: 1px solid #bdd1e6;
      background: #f6fbff;
      color: #345d82;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      cursor: pointer;
      flex: 0 0 auto;
    }
    body.v2-mode .v2-row-tray-btn.danger {
      border-color: #efb9b9;
      background: #fff0f0;
      color: #b53a3a;
    }
    body.v2-mode .v2-row-tray-btn.warn {
      border-color: #f2d09d;
      background: #fff8ec;
      color: #9d6207;
    }
    body.v2-mode .v2-row-tray-btn .v2-icon {
      width: 0.95rem;
      height: 0.95rem;
    }
    body.v2-mode .v2-action-glyph {
      display: none;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      line-height: 1;
      pointer-events: none;
      flex: 0 0 auto;
    }
    body.v2-mode .v2-storage-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-right: 0.26rem;
      color: #4f6f92;
      vertical-align: middle;
    }
    body.v2-mode .v2-storage-icon.is-downloaded {
      color: #1d8a50;
    }
    body.v2-mode .v2-storage-icon .v2-icon {
      width: 0.84rem;
      height: 0.84rem;
    }
    body.v2-mode .v2-row-date-inline {
      display: inline-flex;
      align-items: center;
      margin-left: 0.34rem;
      color: #5d7695;
      font-size: 0.72rem;
      white-space: nowrap;
    }
    body.v2-mode .v2-row-date-inline::before {
      content: "·";
      margin-right: 0.25rem;
      color: #7a8fa8;
    }
    body.v2-mode .v2-hover-progress {
      display: none;
      width: 100%;
      height: 5px;
      border-radius: 999px;
      background: rgba(184, 201, 222, 0.88);
      overflow: hidden;
      margin-top: 0.25rem;
      position: relative;
    }
    body.v2-mode .v2-hover-progress-dl {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 0%;
      background: #27b35f;
      opacity: 0.95;
    }
    body.v2-mode .v2-hover-progress-played {
      position: absolute;
      left: 0;
      top: 1px;
      bottom: 1px;
      width: 0%;
      background: #1b88e8;
      border-radius: 999px;
    }
    body.v2-mode .floating-player-hover.is-visible .v2-hover-progress {
      display: block;
    }
    @media (max-width: 900px) {
      body.v2-mode .results-top {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        align-items: start;
        gap: 0.32rem;
      }
      body.v2-mode .results-summary {
        display: flex;
        flex-wrap: nowrap;
        justify-content: flex-start;
        gap: 0.28rem;
        max-width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 0.1rem;
      }
      body.v2-mode .results-pill {
        flex: 0 0 auto;
      }
      body.v2-mode .preview-top-controls {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        gap: 0.26rem;
      }
      body.v2-mode .preview-top-controls .preview-search-wrap {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 36px auto;
        align-items: center;
        gap: 0.24rem;
        min-width: 0;
        max-width: 100%;
        width: 100%;
      }
      body.v2-mode .preview-top-controls .preview-search {
        min-width: 0;
        width: 100%;
      }
      body.v2-mode .preview-top-controls .sort-toggle {
        max-width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      body.v2-mode .preview-top-controls .sort-toggle button {
        white-space: nowrap;
      }
      body.v2-mode #preview-top-toolbar,
      body.v2-mode #deleted-top-toolbar {
        padding-top: 0.08rem;
        gap: 0.34rem;
      }
      body.v2-mode .preview-actions {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.28rem;
        width: 100%;
      }
      body.v2-mode .preview-actions .btn {
        flex: 1 1 auto;
        min-height: 42px;
      }
      body.v2-mode #deleted-controls-card .history-actions-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.28rem;
      }
      body.v2-mode .v2-mobile-icon-btn {
        min-width: 42px;
        min-height: 42px;
        border-radius: 11px;
        padding: 0;
        font-size: 0;
        line-height: 0;
        justify-content: center;
      }
      body.v2-mode .v2-mobile-icon-btn .v2-action-glyph {
        display: inline-flex;
      }
      body.v2-mode .v2-mobile-icon-btn .v2-action-glyph .v2-icon {
        width: 1.06rem;
        height: 1.06rem;
      }
      body.v2-mode #player-tab .preview-top-controls {
        margin-top: 0.34rem !important;
      }
      body.v2-mode .swipe-item.has-expand-toggle .swipe-content {
        position: relative;
        display: grid;
        grid-template-columns: 24px 64px minmax(0, 1fr);
        column-gap: 0.52rem;
        row-gap: 0.34rem;
        align-items: start;
        padding-right: 2.5rem;
      }
      body.v2-mode .swipe-item.has-expand-toggle .play-preview-btn,
      body.v2-mode .swipe-item.has-expand-toggle .player-row-actions {
        display: none !important;
      }
      body.v2-mode .swipe-item.has-expand-toggle .swipe-content > input[type="checkbox"],
      body.v2-mode .swipe-item.has-expand-toggle .swipe-content > .checkbox-label {
        grid-column: 1;
        grid-row: 1;
        align-self: start;
        justify-self: center;
        margin-top: 0.14rem;
      }
      body.v2-mode .swipe-item.has-expand-toggle .swipe-content > .preview-thumb,
      body.v2-mode .swipe-item.has-expand-toggle .swipe-content > .preview-thumb-fallback {
        grid-column: 2;
        grid-row: 1;
        width: 64px;
        height: 64px;
        flex-basis: 64px;
      }
      body.v2-mode .v2-row-expand-btn {
        position: absolute;
        top: 0.38rem;
        right: 0.42rem;
        width: 1.82rem;
        height: 1.82rem;
        border-radius: 999px;
        border: 1px solid #bed0e7;
        background: #f5faff;
        color: #3f6388;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        cursor: pointer;
      }
      body.v2-mode .v2-row-expand-btn .v2-icon {
        width: 0.92rem;
        height: 0.92rem;
        transition: transform 160ms ease;
      }
      body.v2-mode .swipe-item.has-expand-toggle:not(.v2-row-expanded) .play-preview-btn,
      body.v2-mode .swipe-item.has-expand-toggle:not(.v2-row-expanded) .player-row-actions {
        display: none;
      }
      body.v2-mode .swipe-item.has-expand-toggle.v2-row-expanded .swipe-content {
        background: #fff4e6;
        border-left: 4px solid #ff9800;
      }
      body.v2-mode .swipe-item.has-expand-toggle.v2-row-expanded .v2-row-tray {
        display: flex;
      }
      body.v2-mode .swipe-item.has-expand-toggle.v2-row-expanded .v2-row-expand-btn .v2-icon {
        transform: rotate(180deg);
      }
      body.v2-mode .swipe-item.has-expand-toggle .article-info {
        display: contents;
      }
      body.v2-mode .swipe-item.has-expand-toggle .article-meta {
        grid-column: 3;
        grid-row: 1;
        margin-top: 0;
        font-size: 0.78rem;
        line-height: 1.24;
        min-width: 0;
      }
      body.v2-mode .swipe-item.has-expand-toggle .title-row {
        grid-column: 2 / -1;
        grid-row: 2;
        display: block;
        margin-top: 0;
        min-width: 0;
      }
      body.v2-mode .swipe-item.has-expand-toggle .title-left {
        display: inline-flex;
        align-items: flex-start;
        gap: 0.26rem;
        min-width: 0;
        width: 100%;
      }
      body.v2-mode .swipe-item.has-expand-toggle .title-left .article-link,
      body.v2-mode .swipe-item.has-expand-toggle .title-left .player-queue-jump {
        width: 100% !important;
        min-width: 0;
      }
      body.v2-mode .swipe-item.has-expand-toggle .article-title {
        white-space: normal;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        line-height: 1.22;
      }
      body.v2-mode .swipe-item.has-expand-toggle .article-date-right {
        display: none;
      }
      body.v2-mode .swipe-item.has-expand-toggle .player-row-progress {
        display: none;
        grid-column: 2 / -1;
        grid-row: 3;
        margin-top: 0.18rem;
      }
      body.v2-mode .swipe-item.has-expand-toggle .v2-row-tray {
        grid-column: 2 / -1;
        grid-row: 3;
        margin-top: 0.2rem;
        padding-top: 0.22rem;
        border-top: 1px solid #d9e4f2;
      }
      body.v2-mode .swipe-item.has-expand-toggle.v2-row-expanded .player-row-progress {
        display: block;
      }
      body.v2-mode .swipe-item.has-expand-toggle.v2-row-expanded .v2-row-tray {
        grid-row: 4;
      }
      body.v2-mode .left-rail {
        position: sticky;
        top: 0;
        z-index: 45;
        background: #f5f9ff;
        box-shadow: 0 1px 0 rgba(15, 79, 158, 0.12);
        border-bottom: 1px solid #d8e6f7;
      }
      body.v2-mode .rail-brand {
        padding: 0.3rem 0.2rem 0.42rem;
        gap: 0.34rem;
      }
      body.v2-mode .rail-brand .brand-title {
        display: none;
      }
      body.v2-mode .brand-version {
        margin-left: 0;
      }
      body.v2-mode .v2-top-actions {
        display: inline-flex;
        margin-left: auto;
      }
      body.v2-mode .v2-top-menu-btn {
        border: 1px solid #b9cfe9;
        border-radius: 999px;
        background: #ffffff;
        color: #114d95;
        padding: 0.24rem 0.62rem;
        font-size: 0.76rem;
        line-height: 1.1;
        font-weight: 700;
        cursor: pointer;
      }
      body.v2-mode .v2-top-menu-btn:hover {
        background: #eef6ff;
        border-color: #9ebce0;
      }
      body.v2-mode .rail-section {
        margin-top: 0;
        border-top: none;
        background: #e7f1fe;
        border: 1px solid #d0e3fb;
        border-radius: 999px;
        padding: 0.16rem;
        gap: 0.16rem;
      }
      body.v2-mode .rail-item {
        border: none;
        background: transparent;
        box-shadow: none;
        border-radius: 999px;
        font-size: 0.82rem;
        padding: 0.44rem 0.24rem;
      }
      body.v2-mode .rail-item:hover {
        background: #d9e9fb;
        border-color: transparent;
      }
      body.v2-mode .rail-item.active {
        background: #0f4f9e;
        color: #ffffff;
        box-shadow: 0 2px 5px rgba(15, 79, 158, 0.32);
      }
      body.v2-mode .main-pane {
        padding: 0.48rem 0.56rem 5.2rem;
      }
      body.v2-mode .player-controls-row {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 0.35rem;
      }
      body.v2-mode .player-controls-row .btn {
        width: 100%;
        min-height: 58px;
        padding: 0.36rem 0.16rem;
      }
      body.v2-mode .player-icon-btn .control-icon {
        font-size: 1.34rem;
        line-height: 1;
      }
      body.v2-mode .player-icon-btn .control-text {
        display: block;
        font-size: 0.72rem;
        line-height: 1;
        margin-top: 0.1rem;
      }
      body.v2-mode .player-current-progress,
      body.v2-mode .player-row-progress {
        height: 8px;
        border-radius: 999px;
      }
      body.v2-mode .player-current-progress {
        margin-top: 0.5rem;
      }
      body.v2-mode .player-row-progress {
        margin-top: 0.52rem;
      }
      body.v2-mode .player-row-action-btn {
        min-width: 2.1rem;
        padding: 0.12rem 0.42rem;
      }
      body.v2-mode .player-queue-row .title-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: start;
        gap: 0.36rem;
      }
      body.v2-mode .player-queue-row .title-left {
        align-items: flex-start;
        gap: 0.28rem;
        min-width: 0;
      }
      body.v2-mode .player-queue-jump {
        margin-left: 0;
        padding: 0;
        border: none;
        border-radius: 0;
        background: transparent;
        color: #1f2f47;
        font-size: 1.02rem;
        font-weight: 700;
        line-height: 1.2;
        text-align: left;
        white-space: normal;
        width: 100% !important;
      }
      body.v2-mode .player-queue-jump:hover {
        background: transparent;
        color: #0f4f9e;
      }
      body.v2-mode .player-queue-row .player-row-actions {
        display: inline-flex;
        align-items: center;
        gap: 0.26rem;
        margin-top: 0.02rem;
        flex: 0 0 auto;
      }
      body.v2-mode .player-queue-row .player-row-action-btn {
        margin-left: 0;
        min-width: 2rem;
        width: 2rem;
        height: 2rem;
        padding: 0;
        border-radius: 999px;
        font-size: 1rem;
        line-height: 1;
      }
      body.v2-mode .player-queue-row .article-meta {
        margin-top: 0.2rem;
        line-height: 1.28;
      }
      body.v2-mode .player-queue-row .article-date-right {
        margin-left: 0.35rem;
      }
      body.v2-mode .player-queue-row .article-item {
        display: grid;
        grid-template-columns: 24px 56px minmax(0, 1fr);
        align-items: flex-start;
        gap: 0.56rem;
      }
      body.v2-mode .player-queue-row .article-item > .checkbox-label {
        width: 24px;
        justify-content: center;
        align-self: start;
      }
      body.v2-mode .player-queue-row .article-info {
        width: 100%;
        min-width: 0;
      }
      body.v2-mode .swipe-item.has-expand-toggle.player-queue-row .swipe-content {
        grid-template-columns: 24px 64px minmax(0, 1fr);
        align-items: start;
      }
      body.v2-mode .swipe-item.has-expand-toggle.player-queue-row .title-row {
        display: block;
        grid-column: 2 / -1;
      }
      body.v2-mode .swipe-item.has-expand-toggle.player-queue-row .title-left {
        display: inline-flex;
        width: 100%;
        min-width: 0;
      }
      body.v2-mode .swipe-item.has-expand-toggle.player-queue-row .article-meta {
        grid-column: 3;
        grid-row: 1;
      }
      body.v2-mode .swipe-item.has-expand-toggle.player-queue-row .player-row-progress {
        grid-column: 2 / -1;
      }
      body.v2-mode .swipe-item.has-expand-toggle.player-queue-row .v2-row-tray {
        grid-column: 2 / -1;
      }
    }
  </style>`;

  const V2_SCRIPT = `
  <script id="v2-behavior-script">
  (function () {
    if (!document || !document.body) return;
    document.body.classList.add('v2-mode');
    var spriteId = 'v2-icon-sprite';

    function ensureIconSprite() {
      if (document.getElementById(spriteId)) return;
      var sprite = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      sprite.setAttribute('id', spriteId);
      sprite.setAttribute('aria-hidden', 'true');
      sprite.setAttribute('width', '0');
      sprite.setAttribute('height', '0');
      sprite.style.position = 'absolute';
      sprite.style.width = '0';
      sprite.style.height = '0';
      sprite.style.overflow = 'hidden';
      sprite.innerHTML = ''
        + '<symbol id="v2i-play" viewBox="0 0 24 24"><path d="M8 6l10 6-10 6z" fill="currentColor" stroke="none"/></symbol>'
        + '<symbol id="v2i-pause" viewBox="0 0 24 24"><path d="M9 6h2.5v12H9zM12.5 6H15v12h-2.5z" fill="currentColor" stroke="none"/></symbol>'
        + '<symbol id="v2i-prev" viewBox="0 0 24 24"><path d="M7 6v12"/><path d="M18 6l-8 6 8 6z"/></symbol>'
        + '<symbol id="v2i-next" viewBox="0 0 24 24"><path d="M17 6v12"/><path d="M6 6l8 6-8 6z"/></symbol>'
        + '<symbol id="v2i-back" viewBox="0 0 24 24"><path d="M8 6v12"/><path d="M17 6l-7 6 7 6"/></symbol>'
        + '<symbol id="v2i-forward" viewBox="0 0 24 24"><path d="M16 6v12"/><path d="M7 6l7 6-7 6"/></symbol>'
        + '<symbol id="v2i-open" viewBox="0 0 24 24"><path d="M14 5h5v5"/><path d="M19 5l-8 8"/><path d="M5 10v9h9"/></symbol>'
        + '<symbol id="v2i-download" viewBox="0 0 24 24"><path d="M12 4v10"/><path d="M8 10l4 4 4-4"/><path d="M5 20h14"/></symbol>'
        + '<symbol id="v2i-check" viewBox="0 0 24 24"><path d="M5 13l4 4 10-10"/></symbol>'
        + '<symbol id="v2i-archive" viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M5 7l1 12h12l1-12"/><path d="M10 11h4"/></symbol>'
        + '<symbol id="v2i-trash" viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M7 7l1 12h8l1-12"/><path d="M10 11v6M14 11v6"/></symbol>'
        + '<symbol id="v2i-text" viewBox="0 0 24 24"><path d="M4 6h16"/><path d="M9 6v12"/><path d="M15 6v12"/><path d="M4 18h16"/></symbol>'
        + '<symbol id="v2i-cloud" viewBox="0 0 24 24"><path d="M7 18h10a4 4 0 0 0 .2-8 6 6 0 0 0-11.4 1.4A3.4 3.4 0 0 0 7 18z"/></symbol>'
        + '<symbol id="v2i-cloud-check" viewBox="0 0 24 24"><path d="M7 18h10a4 4 0 0 0 .2-8 6 6 0 0 0-11.4 1.4A3.4 3.4 0 0 0 7 18z"/><path d="M9.2 12.8l2 2 3.8-4"/></symbol>'
        + '<symbol id="v2i-chevron-down" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></symbol>'
        + '<symbol id="v2i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 010 18"/><path d="M12 3a14 14 0 000 18"/></symbol>'
        + '<symbol id="v2i-gear" viewBox="0 0 24 24"><path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5Z"/><path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.2 1.2 0 0 1 0 1.7l-1 1a1.2 1.2 0 0 1-1.7 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1.2 1.2 0 0 1-1.2 1.2h-1.6A1.2 1.2 0 0 1 11.2 20v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1.2 1.2 0 0 1-1.7 0l-1-1a1.2 1.2 0 0 1 0-1.7l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4A1.2 1.2 0 0 1 2.8 13.6v-1.2A1.2 1.2 0 0 1 4 11.2h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1.2 1.2 0 0 1 0-1.7l1-1a1.2 1.2 0 0 1 1.7 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4A1.2 1.2 0 0 1 10.4 2.8h1.2A1.2 1.2 0 0 1 12.8 4v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1.2 1.2 0 0 1 1.7 0l1 1a1.2 1.2 0 0 1 0 1.7l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a1.2 1.2 0 0 1 1.2 1.2v1.2A1.2 1.2 0 0 1 20 14.8h-.2a1 1 0 0 0-.9.6z"/></symbol>';
      document.body.insertBefore(sprite, document.body.firstChild);
    }

    function icon(name) {
      return '<svg class="v2-icon" viewBox="0 0 24 24" aria-hidden="true"><use href="#v2i-' + String(name || '') + '"></use></svg>';
    }

    function applyToolbarIcons() {
      var iconMap = {
        'play-selected-btn': 'play',
        'open-selected-btn': 'open',
        'delete-btn': 'trash',
        'archive-btn': 'archive',
        'restore-btn': 'check',
        'delete-selected-history-btn': 'trash',
        'clear-history-btn': 'trash'
      };
      Object.keys(iconMap).forEach(function(id) {
        var btn = document.getElementById(id);
        if (!btn) return;
        btn.classList.add('v2-mobile-icon-btn');
        var glyph = btn.querySelector('.v2-action-glyph');
        if (!glyph) {
          glyph = document.createElement('span');
          glyph.className = 'v2-action-glyph';
          glyph.setAttribute('aria-hidden', 'true');
          glyph.innerHTML = icon(iconMap[id]);
          btn.insertBefore(glyph, btn.firstChild);
        }
        var raw = String(btn.textContent || '').replace(/\s+/g, ' ').trim();
        if (raw) {
          btn.setAttribute('title', raw);
          btn.setAttribute('aria-label', raw);
        }
      });
    }

    var routeMap = {
      cleanup: '/v2',
      player: '/v2/player',
      deleted: '/v2/deleted',
      settings: '/v2/settings',
      about: '/v2/about'
    };
    document.querySelectorAll('.tab[data-tab]').forEach(function (tab) {
      var key = tab.getAttribute('data-tab');
      if (routeMap[key]) tab.setAttribute('href', routeMap[key]);
      if (key === 'deleted') {
        var badge = tab.querySelector('.badge');
        tab.textContent = 'Deleted';
        if (badge) {
          tab.appendChild(document.createTextNode(' '));
          tab.appendChild(badge);
        }
      }
    });
    var versionLink = document.getElementById('version-history-link');
    if (versionLink) versionLink.setAttribute('href', '/v2/about');
    var railBrand = document.querySelector('.rail-brand');
    if (railBrand && !railBrand.querySelector('.v2-top-menu-btn')) {
      var actions = document.createElement('div');
      actions.className = 'v2-top-actions';
      var menuBtn = document.createElement('button');
      menuBtn.type = 'button';
      menuBtn.className = 'v2-top-menu-btn';
      menuBtn.innerHTML = icon('gear') + ' Settings';
      menuBtn.setAttribute('aria-label', 'Open settings');
      menuBtn.addEventListener('click', function () {
        var settingsTab = document.querySelector('.tab[data-tab="settings"]');
        if (settingsTab && typeof settingsTab.click === 'function') settingsTab.click();
      });
      actions.appendChild(menuBtn);
      railBrand.appendChild(actions);
    }

    function ensureControlText(btnId, label) {
      var btn = document.getElementById(btnId);
      if (!btn) return;
      var txt = btn.querySelector('.control-text');
      if (txt) {
        if (!txt.textContent || !txt.textContent.trim()) txt.textContent = label;
        return;
      }
      var span = document.createElement('span');
      span.className = 'control-text';
      span.textContent = label;
      btn.appendChild(span);
    }

    function setControlIcon(btnId, iconName) {
      var btn = document.getElementById(btnId);
      if (!btn || !btn.querySelector) return;
      var iconSlot = btn.querySelector('.control-icon');
      if (!iconSlot) return;
      var state = 'control:' + String(iconName || '');
      if (iconSlot.dataset.v2IconState === state) return;
      iconSlot.dataset.v2IconState = state;
      iconSlot.innerHTML = icon(iconName);
    }

    function syncPlayPauseIcon() {
      var btn = document.getElementById('player-playpause-btn');
      if (!btn || !btn.querySelector) return;
      var iconSlot = btn.querySelector('.control-icon');
      if (!iconSlot) return;
      var isPlaying = !!btn.classList.contains('is-playing');
      var iconName = isPlaying ? 'pause' : 'play';
      var state = 'playpause:' + iconName;
      if (iconSlot.dataset.v2IconState === state) return;
      iconSlot.dataset.v2IconState = state;
      iconSlot.innerHTML = icon(iconName);
    }

    function setElementIconState(el, iconName, stateKey) {
      if (!el) return;
      var state = String(stateKey || iconName || '');
      if (el.dataset.v2IconState === state) return;
      el.dataset.v2IconState = state;
      el.innerHTML = icon(iconName);
    }

    function applyInlineRowMeta(root) {
      var scope = root && root.querySelectorAll ? root : document;
      scope.querySelectorAll('.swipe-item.has-expand-toggle').forEach(function(row) {
        var meta = row.querySelector('.article-meta');
        if (!meta) return;
        var dateNode = row.querySelector('.article-date-right');
        var dateText = dateNode ? String(dateNode.textContent || '').replace(/\s+/g, ' ').trim() : '';
        var dateInline = meta.querySelector('.v2-row-date-inline');
        if (!dateInline) {
          dateInline = document.createElement('span');
          dateInline.className = 'v2-row-date-inline';
          meta.appendChild(dateInline);
        }
        dateInline.textContent = dateText;
        dateInline.style.display = dateText ? 'inline-flex' : 'none';
      });
      scope.querySelectorAll('.player-queue-row').forEach(function(row) {
        var meta = row.querySelector('.article-meta');
        if (!meta) return;
        var downloadBtn = row.querySelector('.player-queue-download');
        var downloaded = !!(downloadBtn && downloadBtn.classList && downloadBtn.classList.contains('is-done'));
        var storage = meta.querySelector('.v2-storage-icon');
        if (!storage) {
          storage = document.createElement('span');
          storage.className = 'v2-storage-icon';
          meta.insertBefore(storage, meta.firstChild);
        }
        storage.classList.toggle('is-downloaded', downloaded);
        storage.title = downloaded ? 'Downloaded for offline playback' : 'Cloud stream';
        storage.setAttribute('aria-label', storage.title);
        setElementIconState(storage, downloaded ? 'cloud-check' : 'cloud', downloaded ? 'meta:cloud:downloaded' : 'meta:cloud');
      });
    }

    function ensureFloatingProgressBar() {
      var hover = document.getElementById('floating-player-hover');
      if (!hover || !hover.querySelector) return null;
      var bar = hover.querySelector('.v2-hover-progress');
      if (!bar) {
        bar = document.createElement('div');
        bar.className = 'v2-hover-progress';
        bar.innerHTML = '<div class="v2-hover-progress-dl"></div><div class="v2-hover-progress-played"></div>';
        hover.appendChild(bar);
      }
      return bar;
    }

    function syncFloatingProgressBar() {
      var bar = ensureFloatingProgressBar();
      if (!bar) return;
      var dl = bar.querySelector('.v2-hover-progress-dl');
      var played = bar.querySelector('.v2-hover-progress-played');
      var srcDl = document.getElementById('player-current-progress-downloaded');
      var srcPlayed = document.getElementById('player-current-progress-fill');
      if (!dl || !played || !srcDl || !srcPlayed) return;
      dl.style.width = String(srcDl.style.width || '0%');
      played.style.width = String(srcPlayed.style.width || '0%');
    }

    function setRowExpanded(row, expanded) {
      if (!row || !row.classList) return;
      row.classList.toggle('v2-row-expanded', !!expanded);
      var btn = row.querySelector('.v2-row-expand-btn');
      if (btn) {
        btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        btn.setAttribute('aria-label', expanded ? 'Collapse row actions' : 'Expand row actions');
      }
    }

    function collapseSiblingRows(row) {
      if (!row || !row.parentElement || !row.parentElement.querySelectorAll) return;
      row.parentElement.querySelectorAll('.swipe-item.v2-row-expanded').forEach(function(sibling) {
        if (sibling !== row) setRowExpanded(sibling, false);
      });
    }

    function createTrayButton(action, iconName, label, tone) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'v2-row-tray-btn' + (tone ? (' ' + tone) : '');
      btn.dataset.v2RowAction = action;
      btn.setAttribute('title', label);
      btn.setAttribute('aria-label', label);
      btn.innerHTML = icon(iconName);
      return btn;
    }

    function ensureRowActionTray(row) {
      if (!row || !row.querySelector) return;
      var content = row.querySelector('.swipe-content');
      if (!content) return;
      var isPreviewRow = !!row.dataset.articleId;
      var isPlayerRow = !!row.dataset.queueId;
      if (!isPreviewRow && !isPlayerRow) return;
      var tray = row.querySelector('.v2-row-tray');
      if (!tray) {
        tray = document.createElement('div');
        tray.className = 'v2-row-tray';
        content.appendChild(tray);
      }
      var trayMode = isPreviewRow ? 'preview' : 'player';
      if (tray.dataset.v2TrayMode === trayMode) return;
      tray.dataset.v2TrayMode = trayMode;
      tray.innerHTML = '';
      if (isPreviewRow) {
        tray.appendChild(createTrayButton('play', 'play', 'Play in Player'));
        tray.appendChild(createTrayButton('open', 'open', 'Open story'));
        tray.appendChild(createTrayButton('archive', 'archive', 'Archive', 'warn'));
        tray.appendChild(createTrayButton('delete', 'trash', 'Delete', 'danger'));
      } else {
        tray.appendChild(createTrayButton('play', 'play', 'Jump to this item'));
        tray.appendChild(createTrayButton('open', 'open', 'Open story'));
        tray.appendChild(createTrayButton('download', 'download', 'Download audio'));
        tray.appendChild(createTrayButton('text', 'text', 'Show text'));
        tray.appendChild(createTrayButton('archive', 'archive', 'Archive', 'warn'));
        tray.appendChild(createTrayButton('delete', 'trash', 'Delete', 'danger'));
      }
    }

    function ensureRowExpandButtons(scope) {
      var root = scope && scope.querySelectorAll ? scope : document;
      root.querySelectorAll('.swipe-item').forEach(function(row) {
        if (!row || !row.querySelector) return;
        var supportsExpand = !!(row.dataset.articleId || row.dataset.queueId);
        if (!supportsExpand) return;
        row.classList.add('has-expand-toggle');
        ensureRowActionTray(row);
        var content = row.querySelector('.swipe-content');
        if (!content) return;
        var existing = row.querySelector('.v2-row-expand-btn');
        if (existing) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'v2-row-expand-btn';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Expand row actions');
        btn.innerHTML = icon('chevron-down');
        btn.addEventListener('click', function(evt) {
          evt.preventDefault();
          evt.stopPropagation();
          var next = !row.classList.contains('v2-row-expanded');
          collapseSiblingRows(row);
          setRowExpanded(row, next);
          syncPlayPauseIcon();
        });
        content.appendChild(btn);
      });
    }

    document.addEventListener('click', function(evt) {
      var btn = evt.target && evt.target.closest ? evt.target.closest('.v2-row-tray-btn') : null;
      if (!btn) return;
      evt.preventDefault();
      evt.stopPropagation();
      var row = btn.closest('.swipe-item');
      if (!row) return;
      var action = String(btn.dataset.v2RowAction || '');
      if (!action) return;
      if (row.dataset.articleId) {
        if (action === 'play') {
          var playBtn = row.querySelector('.play-preview-btn');
          if (playBtn && typeof playBtn.click === 'function') playBtn.click();
          return;
        }
        if (action === 'open') {
          var openLink = row.querySelector('.preview-open-link');
          if (openLink && typeof openLink.click === 'function') openLink.click();
          return;
        }
        if ((action === 'archive' || action === 'delete') && typeof window.v2RunPreviewAction === 'function') {
          window.v2RunPreviewAction(String(row.dataset.articleId || ''), action);
        }
        return;
      }
      if (row.dataset.queueId) {
        if (action === 'play') {
          var jumpBtn = row.querySelector('.player-queue-jump');
          if (jumpBtn && typeof jumpBtn.click === 'function') jumpBtn.click();
          return;
        }
        if (action === 'open') {
          var openBtn = row.querySelector('.player-queue-open');
          if (openBtn && typeof openBtn.click === 'function') openBtn.click();
          return;
        }
        if (action === 'download') {
          var dlBtn = row.querySelector('.player-queue-download');
          if (dlBtn && typeof dlBtn.click === 'function') dlBtn.click();
          return;
        }
        if (action === 'text') {
          var jump = row.querySelector('.player-queue-jump');
          if (jump && typeof jump.click === 'function') jump.click();
          var textBtn = document.getElementById('player-text-toggle');
          if (textBtn && textBtn.textContent && textBtn.textContent.trim() === 'Text' && typeof textBtn.click === 'function') {
            textBtn.click();
          }
          return;
        }
        if ((action === 'archive' || action === 'delete') && typeof window.v2RunPlayerAction === 'function') {
          window.v2RunPlayerAction(String(row.dataset.queueId || ''), action);
        }
      }
    });

    function applyRowIcons(scope) {
      var root = scope && scope.querySelectorAll ? scope : document;
      ensureRowExpandButtons(root);
      applyToolbarIcons();
      applyInlineRowMeta(root);
      syncFloatingProgressBar();
      root.querySelectorAll('.webpage-icon').forEach(function(el) {
        setElementIconState(el, 'globe', 'row:globe');
      });
      root.querySelectorAll('.play-preview-btn').forEach(function(btn) {
        setElementIconState(btn, 'play', 'row:play-preview');
      });
      root.querySelectorAll('.player-queue-open').forEach(function(btn) {
        setElementIconState(btn, 'open', 'row:open');
      });
      root.querySelectorAll('.player-queue-download').forEach(function(btn) {
        var txt = (btn.textContent || '').trim();
        if (txt) btn.dataset.v2DownloadRaw = txt;
        var raw = String(btn.dataset.v2DownloadRaw || '');
        var iconName = 'download';
        if (btn.classList.contains('is-done') || raw.indexOf('✓') >= 0) iconName = 'check';
        else if (raw.indexOf('⏸') >= 0) iconName = 'pause';
        setElementIconState(btn, iconName, 'row:download:' + iconName);
      });
      root.querySelectorAll('.v2-row-expand-btn').forEach(function(btn) {
        var row = btn.closest('.swipe-item');
        var expanded = !!(row && row.classList && row.classList.contains('v2-row-expanded'));
        setElementIconState(btn, 'chevron-down', expanded ? 'row:expand:open' : 'row:expand:closed');
      });
    }

    function wireObserver(id) {
      var el = document.getElementById(id);
      if (!el || !window.MutationObserver) return;
      applyRowIcons(el);
      var scheduled = false;
      var scheduleFrame = (typeof window.requestAnimationFrame === 'function')
        ? window.requestAnimationFrame.bind(window)
        : function(cb) { return setTimeout(cb, 16); };
      function flushIcons() {
        scheduled = false;
        applyRowIcons(el);
        syncPlayPauseIcon();
      }
      function scheduleIcons() {
        if (scheduled) return;
        scheduled = true;
        scheduleFrame(flushIcons);
      }
      var obs = new MutationObserver(function() {
        scheduleIcons();
      });
      obs.observe(el, { childList: true, subtree: true });
    }

    function wireToolbarObserver(id) {
      var el = document.getElementById(id);
      if (!el || !window.MutationObserver) return;
      var obs = new MutationObserver(function() {
        applyToolbarIcons();
      });
      obs.observe(el, { childList: true, subtree: true, characterData: true });
    }

    ensureIconSprite();
    ensureControlText('player-prev-btn', 'Prev');
    ensureControlText('player-next-btn', 'Next');
    setControlIcon('player-prev-btn', 'prev');
    setControlIcon('player-back-btn', 'back');
    setControlIcon('player-forward-btn', 'forward');
    setControlIcon('player-next-btn', 'next');
    setControlIcon('player-playpause-btn', 'play');
    applyRowIcons(document);
    syncPlayPauseIcon();
    wireObserver('preview-list');
    wireObserver('player-queue');
    wireObserver('deleted-list');
    wireToolbarObserver('preview-top-toolbar');
    wireToolbarObserver('deleted-top-toolbar');
    wireToolbarObserver('player-tab');
    wireToolbarObserver('floating-player-hover');
    var playerBtn = document.getElementById('player-playpause-btn');
    if (playerBtn && window.MutationObserver) {
      var playObs = new MutationObserver(syncPlayPauseIcon);
      playObs.observe(playerBtn, { attributes: true, attributeFilter: ['class'] });
    }
    var currentProgressFill = document.getElementById('player-current-progress-fill');
    if (currentProgressFill && window.MutationObserver) {
      var fillObs = new MutationObserver(syncFloatingProgressBar);
      fillObs.observe(currentProgressFill, { attributes: true, attributeFilter: ['style'] });
    }
    var currentProgressDownloaded = document.getElementById('player-current-progress-downloaded');
    if (currentProgressDownloaded && window.MutationObserver) {
      var dlObs = new MutationObserver(syncFloatingProgressBar);
      dlObs.observe(currentProgressDownloaded, { attributes: true, attributeFilter: ['style'] });
    }

    // In v2 routes, explicit URL should win over restored tab state.
    var routeToTab = {
      '/v2': 'cleanup',
      '/v2/player': 'player',
      '/v2/deleted': 'deleted',
      '/v2/settings': 'settings',
      '/v2/about': 'about'
    };
    var normalizedPath = location.pathname.length > 1 && location.pathname.endsWith('/')
      ? location.pathname.slice(0, -1)
      : location.pathname;
    var forcedTab = routeToTab[normalizedPath];
    if (forcedTab) {
      setTimeout(function() {
        var tabEl = document.querySelector('.tab[data-tab="' + forcedTab + '"]');
        if (tabEl && !tabEl.classList.contains('active') && typeof tabEl.click === 'function') {
          tabEl.click();
        }
      }, 0);
    }
  })();
  </script>`;

  const V2_TAB_ROUTES_REPLACEMENT = `var TAB_ROUTES = {
      cleanup: '/v2',
      deleted: '/v2/deleted',
      settings: '/v2/settings',
      about: '/v2/about',
      player: '/v2/player',
    };`;

  const V2_ROUTE_TABS_REPLACEMENT = `var ROUTE_TABS = {
      '/v2': 'cleanup',
      '/v2/deleted': 'deleted',
      '/v2/settings': 'settings',
      '/v2/about': 'about',
      '/v2/player': 'player',
      '/': 'cleanup',
      '/deleted': 'deleted',
      '/settings': 'settings',
      '/about': 'about',
      '/player': 'player',
    };`;

  const HTML_APP_V2_BASE = HTML_APP
    .replace(/var TAB_ROUTES = \{[\s\S]*?player: '\/player',[\s\S]*?\};/, V2_TAB_ROUTES_REPLACEMENT)
    .replace(/var ROUTE_TABS = \{[\s\S]*?'\/player': 'player',[\s\S]*?\};/, V2_ROUTE_TABS_REPLACEMENT);

  const HTML_APP_V2 = HTML_APP_V2_BASE
    .replace('</head>', `${V2_CSS}\n</head>`)
    .replace('</body>', `${V2_SCRIPT}\n</body>`);

  const V4_CSS = `
  <style id="v4-style-overrides">
    @media (max-width: 900px) {
      body.v4-mode .main-pane { padding: 0.45rem 0.45rem 5rem; }
      body.v4-mode #cleanup-main-controls { margin-bottom: 0.55rem; }
      body.v4-mode #cleanup-main-controls .btn { min-height: 44px; font-size: 0.95rem; }
      body.v4-mode .article-item { min-height: 86px; align-items: center; }
      body.v4-mode .preview-thumb,
      body.v4-mode .preview-thumb-fallback { width: 68px; height: 68px; flex-basis: 68px; border-radius: 12px; }
      body.v4-mode .article-title { font-size: 1.08rem; line-height: 1.25; white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
      body.v4-mode .article-meta { font-size: 0.9rem; opacity: 0.92; }
      body.v4-mode #preview-list .play-preview-btn,
      body.v4-mode .player-row-actions { display: none; }
      body.v4-mode #preview-list .swipe-item.v4-active .play-preview-btn,
      body.v4-mode .swipe-item.v4-active .player-row-actions { display: inline-flex; }
      body.v4-mode #preview-list .swipe-item.v4-active .swipe-content,
      body.v4-mode #player-queue .swipe-item.v4-active .swipe-content {
        background: #fff4e6;
        border-left: 4px solid #ff9800;
      }
      body.v4-mode #preview-list .swipe-item.v4-active .article-meta::after {
        content: "  •  swipe \u2190 delete, \u2192 archive";
        color: #9a5a00;
        font-weight: 600;
      }
      body.v4-mode .player-controls-row .btn { min-height: 56px; }
      body.v4-mode .player-icon-btn .control-icon { font-size: 1.4rem; }
      body.v4-mode .player-icon-btn .control-text { font-size: 0.82rem; }
      body.v4-mode .player-row-action-btn { min-width: 2.3rem; min-height: 2rem; font-size: 0.94rem; }
    }
  </style>`;

  const V4_SCRIPT = `
  <script id="v4-behavior-script">
  (function () {
    document.body.classList.add('v4-mode');
    function shouldIgnoreActivate(evt) {
      var t = evt && evt.target;
      if (!t || !t.closest) return false;
      return !!(t.closest('a') || t.closest('button') || t.closest('input') || t.closest('label'));
    }
    function wireActiveRows(containerId) {
      var root = document.getElementById(containerId);
      if (!root || !root.addEventListener) return;
      root.addEventListener('click', function (evt) {
        if (shouldIgnoreActivate(evt)) return;
        var row = evt.target && evt.target.closest ? evt.target.closest('.swipe-item') : null;
        if (!row || !root.contains(row)) return;
        root.querySelectorAll('.swipe-item.v4-active').forEach(function (n) {
          if (n !== row) n.classList.remove('v4-active');
        });
        row.classList.toggle('v4-active');
      });
    }
    wireActiveRows('preview-list');
    wireActiveRows('player-queue');
  })();
  </script>`;

  const HTML_APP_V4 = HTML_APP
    .replace('</head>', `${V4_CSS}\n</head>`)
    .replace('</body>', `${V4_SCRIPT}\n</body>`);

  return { HTML_APP, HTML_APP_V2, HTML_APP_V4, HTML_MOCKUP_V3, HTML_MOCKUP_IPHONE };
}

export function getUiHtml(config) {
  return buildUiHtml(config);
}
