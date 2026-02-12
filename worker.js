// Readwise Cleanup - Cloudflare Worker with embedded PWA
// Bulk delete/archive old Readwise Reader items with restoration support

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
        return handleClearDeleted(env, corsHeaders);
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
  const limit = parseInt(url.searchParams.get('limit') || '50');

  if (!beforeDate) {
    return new Response(JSON.stringify({ error: 'Missing before date' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const articles = await fetchArticlesOlderThan(env, location, beforeDate);
  const preview = articles.slice(0, limit).map(a => ({
    id: a.id,
    title: a.title || 'Untitled',
    author: a.author || 'Unknown',
    url: a.source_url || a.url,
    savedAt: a.saved_at,
    site: extractDomain(a.source_url || a.url)
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
  const { location, beforeDate, action } = body;

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

  const articles = await fetchArticlesOlderThan(env, location, beforeDate);

  if (articles.length === 0) {
    return new Response(JSON.stringify({
      processed: 0,
      action,
      message: 'No articles to process'
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
        site: extractDomain(article.source_url || article.url)
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

// Clear all deleted items history
async function handleClearDeleted(env, corsHeaders) {
  await env.KV.put('deleted_items', JSON.stringify([]));
  return new Response(JSON.stringify({ cleared: true }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// Helper: Fetch articles older than date from specific location
async function fetchArticlesOlderThan(env, location, beforeDate) {
  const allArticles = [];
  let nextCursor = null;
  const cutoffDate = new Date(beforeDate);

  do {
    const params = new URLSearchParams({
      location,
      pageCursor: nextCursor || '',
    });

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

// Embedded PWA HTML - using single quotes in JS to avoid escaping issues
const HTML_APP = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#4f46e5">
  <title>Readwise Cleanup</title>
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

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      padding: 1.5rem 0;
      margin-bottom: 1.5rem;
    }

    h1 {
      font-size: 1.75rem;
      color: var(--primary);
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .card {
      background: var(--card);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }

    .card h2 {
      font-size: 1.1rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: var(--text-muted);
    }

    select, input[type="date"] {
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
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }

    .btn-primary:hover {
      background: var(--primary-hover);
    }

    .btn-danger {
      background: var(--danger);
      color: white;
    }

    .btn-danger:hover {
      background: var(--danger-hover);
    }

    .btn-outline {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text);
    }

    .btn-outline:hover {
      background: var(--bg);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-group {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

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

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--primary);
    }

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

    .article-item:last-child {
      border-bottom: none;
    }

    .article-item input[type="checkbox"] {
      margin-top: 0.25rem;
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .article-info {
      flex: 1;
      min-width: 0;
    }

    .article-title {
      font-weight: 500;
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .article-meta {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

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
    }

    .tab {
      padding: 0.75rem 1rem;
      background: none;
      border: none;
      font-size: 0.9rem;
      color: var(--text-muted);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }

    .tab.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }

    .tab:hover:not(.active) {
      color: var(--text);
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: var(--text-muted);
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 0.5rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .toast {
      position: fixed;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%);
      padding: 0.75rem 1.5rem;
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
      padding: 2rem;
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
      transition: all 0.2s;
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

    @media (max-width: 600px) {
      .stats { grid-template-columns: repeat(2, 1fr); }
      .btn-group { flex-direction: column; }
      .btn { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🧹 Readwise Cleanup</h1>
      <p class="subtitle">Bulk delete or archive old Reader items</p>
    </header>

    <div class="tabs">
      <button class="tab active" data-tab="cleanup">Cleanup</button>
      <button class="tab" data-tab="deleted">Deleted History <span id="deleted-count" class="badge" style="display:none">0</span></button>
    </div>

    <!-- Cleanup Tab -->
    <div id="cleanup-tab">
      <div class="card">
        <h2>📋 Select Items</h2>

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
          <button class="btn btn-primary" id="count-btn">Count Items</button>
          <button class="btn btn-outline" id="preview-btn" disabled>Preview</button>
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

        <div id="preview-list"></div>

        <div class="btn-group" style="margin-top: 1rem">
          <button class="btn btn-danger" id="delete-btn" disabled>
            🗑️ Delete All
          </button>
          <button class="btn btn-primary" id="archive-btn" disabled>
            📦 Archive All
          </button>
        </div>

        <div class="progress" id="progress" style="display:none">
          <div class="progress-bar" id="progress-bar" style="width: 0%"></div>
        </div>
      </div>
    </div>

    <!-- Deleted History Tab -->
    <div id="deleted-tab" style="display:none">
      <div class="card">
        <h2>📜 Deleted Items History</h2>
        <p style="color: var(--text-muted); margin-bottom: 1rem; font-size: 0.9rem;">
          Select items to restore them to your Readwise Reader.
        </p>

        <div id="deleted-list">
          <div class="loading">Loading...</div>
        </div>

        <div class="btn-group" style="margin-top: 1rem">
          <button class="btn btn-primary" id="restore-btn" disabled>
            ↩️ Restore Selected
          </button>
          <button class="btn btn-outline" id="clear-history-btn">
            Clear History
          </button>
        </div>
      </div>
    </div>
  </div>

  <script>
    // State
    var currentCount = 0;
    var previewData = [];
    var deletedItems = [];
    var selectedForRestore = new Set();

    // Elements
    var locationSelect = document.getElementById('location');
    var beforeDateInput = document.getElementById('before-date');
    var countBtn = document.getElementById('count-btn');
    var previewBtn = document.getElementById('preview-btn');
    var deleteBtn = document.getElementById('delete-btn');
    var archiveBtn = document.getElementById('archive-btn');
    var resultsCard = document.getElementById('results-card');
    var itemCountEl = document.getElementById('item-count');
    var locationDisplay = document.getElementById('location-display');
    var previewList = document.getElementById('preview-list');
    var deletedList = document.getElementById('deleted-list');
    var restoreBtn = document.getElementById('restore-btn');
    var clearHistoryBtn = document.getElementById('clear-history-btn');
    var deletedCountBadge = document.getElementById('deleted-count');

    // Set default date to 1 month ago
    var oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    beforeDateInput.value = oneMonthAgo.toISOString().split('T')[0];

    // Quick date buttons
    document.querySelectorAll('.quick-date').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var days = parseInt(btn.dataset.days);
        var date = new Date();
        date.setDate(date.getDate() - days);
        beforeDateInput.value = date.toISOString().split('T')[0];
      });
    });

    // Tab switching
    document.querySelectorAll('.tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');

        var tabName = tab.dataset.tab;
        document.getElementById('cleanup-tab').style.display = tabName === 'cleanup' ? 'block' : 'none';
        document.getElementById('deleted-tab').style.display = tabName === 'deleted' ? 'block' : 'none';

        if (tabName === 'deleted') {
          loadDeletedItems();
        }
      });
    });

    // Count items
    countBtn.addEventListener('click', async function() {
      var location = locationSelect.value;
      var before = beforeDateInput.value;

      if (!before) {
        showToast('Please select a date', 'warning');
        return;
      }

      countBtn.disabled = true;
      countBtn.innerHTML = '<span class="spinner"></span> Counting...';

      try {
        var res = await fetch('/api/count?location=' + location + '&before=' + before);
        var data = await res.json();

        if (data.error) throw new Error(data.error);

        currentCount = data.count;
        itemCountEl.textContent = currentCount;
        locationDisplay.textContent = location;
        resultsCard.style.display = 'block';
        previewBtn.disabled = currentCount === 0;
        deleteBtn.disabled = currentCount === 0;
        archiveBtn.disabled = currentCount === 0;
        previewList.innerHTML = '';

        if (currentCount === 0) {
          showToast('No items found before that date', 'warning');
        } else {
          showToast('Found ' + currentCount + ' items', 'success');
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        countBtn.disabled = false;
        countBtn.innerHTML = 'Count Items';
      }
    });

    // Preview items
    previewBtn.addEventListener('click', async function() {
      var location = locationSelect.value;
      var before = beforeDateInput.value;

      previewBtn.disabled = true;
      previewBtn.innerHTML = '<span class="spinner"></span> Loading...';

      try {
        var res = await fetch('/api/preview?location=' + location + '&before=' + before + '&limit=100');
        var data = await res.json();

        if (data.error) throw new Error(data.error);

        previewData = data.preview;
        renderPreview();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        previewBtn.disabled = false;
        previewBtn.innerHTML = 'Preview';
      }
    });

    // Render preview list
    function renderPreview() {
      if (previewData.length === 0) {
        previewList.innerHTML = '<div class="empty">No items to preview</div>';
        return;
      }

      var html = '<div class="article-list">';
      previewData.forEach(function(article) {
        html += '<div class="article-item">';
        html += '<div class="article-info">';
        html += '<div class="article-title">' + escapeHtml(article.title) + '</div>';
        html += '<div class="article-meta">';
        html += '<span class="article-site">' + escapeHtml(article.site) + '</span>';
        if (article.author) {
          html += ' by ' + escapeHtml(article.author);
        }
        html += ' · ' + formatDate(article.savedAt);
        html += '</div></div></div>';
      });
      html += '</div>';

      if (currentCount > previewData.length) {
        html += '<p style="text-align:center;color:var(--text-muted);margin-top:0.5rem;font-size:0.85rem">Showing ' + previewData.length + ' of ' + currentCount + ' items</p>';
      }

      previewList.innerHTML = html;
    }

    // Delete all
    deleteBtn.addEventListener('click', function() {
      performCleanup('delete');
    });

    // Archive all
    archiveBtn.addEventListener('click', function() {
      performCleanup('archive');
    });

    // Perform cleanup
    async function performCleanup(action) {
      var location = locationSelect.value;
      var before = beforeDateInput.value;

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
          body: JSON.stringify({ location: location, beforeDate: before, action: action })
        });
        var data = await res.json();

        if (data.error) throw new Error(data.error);

        document.getElementById('progress-bar').style.width = '100%';

        var msg = (action === 'delete' ? 'Deleted' : 'Archived') + ' ' + data.processed + ' items';
        showToast(msg, 'success');

        // Reset UI
        setTimeout(function() {
          currentCount = 0;
          itemCountEl.textContent = '0';
          previewList.innerHTML = '';
          resultsCard.style.display = 'none';
          document.getElementById('progress').style.display = 'none';
          document.getElementById('progress-bar').style.width = '0%';

          // Update deleted count badge
          loadDeletedCount();
        }, 1000);

      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        deleteBtn.disabled = false;
        archiveBtn.disabled = false;
        btn.innerHTML = originalText;
      }
    }

    // Load deleted items
    async function loadDeletedItems() {
      deletedList.innerHTML = '<div class="loading"><span class="spinner"></span> Loading...</div>';

      try {
        var res = await fetch('/api/deleted');
        var data = await res.json();

        deletedItems = data.items || [];
        selectedForRestore.clear();
        renderDeletedItems();
        updateDeletedBadge();
      } catch (err) {
        deletedList.innerHTML = '<div class="empty">Failed to load deleted items</div>';
      }
    }

    // Load deleted count for badge
    async function loadDeletedCount() {
      try {
        var res = await fetch('/api/deleted');
        var data = await res.json();
        deletedItems = data.items || [];
        updateDeletedBadge();
      } catch (err) {}
    }

    // Update badge
    function updateDeletedBadge() {
      if (deletedItems.length > 0) {
        deletedCountBadge.textContent = deletedItems.length;
        deletedCountBadge.style.display = 'inline-block';
      } else {
        deletedCountBadge.style.display = 'none';
      }
    }

    // Render deleted items
    function renderDeletedItems() {
      if (deletedItems.length === 0) {
        deletedList.innerHTML = '<div class="empty">No deleted items in history</div>';
        restoreBtn.disabled = true;
        return;
      }

      var html = '<div class="article-list">';
      deletedItems.forEach(function(item, index) {
        html += '<div class="article-item">';
        html += '<input type="checkbox" data-url="' + escapeHtml(item.url) + '" onchange="toggleRestoreItem(this)"';
        if (selectedForRestore.has(item.url)) {
          html += ' checked';
        }
        html += '>';
        html += '<div class="article-info">';
        html += '<div class="article-title">' + escapeHtml(item.title) + '</div>';
        html += '<div class="article-meta">';
        html += '<span class="article-site">' + escapeHtml(item.site) + '</span>';
        if (item.author) {
          html += ' by ' + escapeHtml(item.author);
        }
        html += ' · Deleted ' + formatDate(item.deletedAt);
        html += '</div></div></div>';
      });
      html += '</div>';

      deletedList.innerHTML = html;
      updateRestoreButton();
    }

    // Toggle item for restore
    function toggleRestoreItem(checkbox) {
      var url = checkbox.dataset.url;
      if (checkbox.checked) {
        selectedForRestore.add(url);
      } else {
        selectedForRestore.delete(url);
      }
      updateRestoreButton();
    }

    // Update restore button
    function updateRestoreButton() {
      restoreBtn.disabled = selectedForRestore.size === 0;
      if (selectedForRestore.size > 0) {
        restoreBtn.innerHTML = '↩️ Restore Selected (' + selectedForRestore.size + ')';
      } else {
        restoreBtn.innerHTML = '↩️ Restore Selected';
      }
    }

    // Restore selected items
    restoreBtn.addEventListener('click', async function() {
      if (selectedForRestore.size === 0) return;

      restoreBtn.disabled = true;
      restoreBtn.innerHTML = '<span class="spinner"></span> Restoring...';

      try {
        var res = await fetch('/api/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: Array.from(selectedForRestore) })
        });
        var data = await res.json();

        if (data.error) throw new Error(data.error);

        showToast('Restored ' + data.restored + ' items', 'success');
        selectedForRestore.clear();
        loadDeletedItems();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        restoreBtn.disabled = false;
        restoreBtn.innerHTML = '↩️ Restore Selected';
      }
    });

    // Clear history
    clearHistoryBtn.addEventListener('click', async function() {
      try {
        await fetch('/api/clear-deleted', { method: 'POST' });
        deletedItems = [];
        renderDeletedItems();
        updateDeletedBadge();
        showToast('History cleared', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // Helpers
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
      if (date.getFullYear() !== new Date().getFullYear()) {
        opts.year = 'numeric';
      }
      return date.toLocaleDateString('en-US', opts);
    }

    // Initial load
    loadDeletedCount();
  </script>
</body>
</html>`;

// Export helpers for testing
export { fetchArticlesOlderThan, extractDomain, getDeletedItems };
