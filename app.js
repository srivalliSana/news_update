// ============================================================
// CUTM Campus News — Main App (index.html)
// Everything is fetched from the server API.
// Falls back to empty arrays if server is not running.
// ============================================================

let ALL_ARTICLES  = [];
let currentCategory = 'All';
let sortOrder       = 'newest';
let visibleCount    = 6;
const PAGE_SIZE     = 6;
let lastSignature   = '';                 // change-detector for live polling
const REFRESH_MS    = 15000;              // how often to check the server for updates
const SECTION_ORDER = ['Campus','Academics','Events','Sports','Placements','Research','Achievements','Alumni'];

// Cheap fingerprint of the article list — changes when anything publish-relevant changes
function articlesSignature(list) {
  return list
    .map(a => `${a.id}:${a.timestamp}:${a.image}:${a.archived ? 1 : 0}:${a.featured ? 1 : 0}`)
    .join('|');
}

// ── Fetch everything from API ──────────────────────────────
async function loadAllData() {
  try {
    const [artRes, tickerRes, linksRes] = await Promise.all([
      fetch('/api/articles'),
      fetch('/api/ticker'),
      fetch('/api/quicklinks'),
    ]);

    if (artRes.ok) {
      const raw = await artRes.json();
      lastSignature = articlesSignature(raw);
      ALL_ARTICLES = raw.map(a => ({ ...a, timestamp: new Date(a.timestamp) }));
    }

    if (tickerRes.ok) {
      const items = await tickerRes.json();
      if (items.length) renderTicker(items);
    }

    if (linksRes.ok) {
      const links = await linksRes.json();
      if (links.length) renderQuickLinks(links);
    }

  } catch {
    // Server not running — UI shows empty state
  }
}

// ── Live refresh — polls the server so Slack updates appear by themselves ──
async function refreshData() {
  try {
    const res = await fetch('/api/articles');
    if (!res.ok) return;
    const raw = await res.json();

    const sig = articlesSignature(raw);
    if (sig === lastSignature) return;            // nothing changed — skip re-render
    lastSignature = sig;
    ALL_ARTICLES  = raw.map(a => ({ ...a, timestamp: new Date(a.timestamp) }));

    // Don't reflow the page out from under an open modal or search
    const modalOpen  = !document.getElementById('article-modal').classList.contains('hidden');
    const searchOpen = !document.getElementById('search-overlay').classList.contains('hidden');
    if (modalOpen || searchOpen) return;

    applyView();             // re-renders the active view (sections or single feed)
    renderTrending();
    renderCategoryCounts();
  } catch {
    // transient network/server hiccup — try again next tick
  }
}

// ── Ticker ────────────────────────────────────────────────
function renderTicker(items) {
  const ticker = document.getElementById('ticker');
  if (!ticker) return;
  const html = items.map(t => `<span class="ticker-item">${t}</span>`).join('');
  ticker.innerHTML = html + html; // double for seamless loop
}

// ── Quick Links (sidebar) ──────────────────────────────────
function renderQuickLinks(links) {
  const ul = document.getElementById('quick-links-list');
  if (!ul) return;
  ul.innerHTML = links.map(l =>
    `<li><a href="${l.url}" ${l.external ? 'target="_blank"' : ''}>${l.label}</a></li>`
  ).join('');
}

// ── Filters ───────────────────────────────────────────────
function getActiveArticles() {
  return ALL_ARTICLES.filter(a => !a.archived);
}

// Active articles, newest first (descending)
function sortedActive() {
  return getActiveArticles().sort((a, b) => b.timestamp - a.timestamp);
}

function getFilteredArticles() {
  let articles = getActiveArticles();
  if (currentCategory !== 'All') {
    articles = articles.filter(a => a.category === currentCategory);
  }
  return articles.sort((a, b) =>
    sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
  );
}

// ── Time helpers ──────────────────────────────────────────
function timeAgo(date) {
  const diff = Math.floor((new Date() - date) / 1000);
  if (diff < 60)     return `${diff}s ago`;
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatFull(date) {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ── Datetime display ──────────────────────────────────────
function updateDatetime() {
  const el = document.getElementById('current-datetime');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }) + ' | ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// ── Hero (lead story + secondary headline list, TOI/NDTV style) ──
function renderHero() {
  const section = document.getElementById('hero-section');
  if (!section) return;

  const active = sortedActive();
  if (!active.length) { section.style.display = 'none'; return; }
  section.style.display = '';

  const lead = active.find(a => a.featured) || active[0];
  const rest = active.filter(a => a.id !== lead.id).slice(0, 4);

  section.innerHTML = `
    <div class="hero-grid">
      <div class="hero-card" onclick="openArticle(${lead.id})">
        <img src="${lead.image}" alt="${lead.title}" class="hero-img" loading="lazy" />
        <div class="hero-overlay">
          <span class="badge badge-${lead.category.toLowerCase()}">${lead.category}</span>
          ${lead.breaking ? '<span class="breaking-badge" style="position:static;margin-left:6px">NOTICE</span>' : ''}
          <h2 class="hero-title">${lead.title}</h2>
          <p class="hero-summary">${lead.summary}</p>
          <div class="hero-meta">
            <span>By ${lead.author}</span>
            <span>${timeAgo(lead.timestamp)}</span>
          </div>
        </div>
      </div>
      <div class="hero-side">
        ${rest.map(a => `
          <div class="hero-side-item" onclick="openArticle(${a.id})">
            <img src="${a.image}" alt="${a.title}" class="hs-img" loading="lazy" />
            <div class="hs-body">
              <span class="badge badge-${a.category.toLowerCase()}">${a.category}</span>
              <p class="hs-title">${a.title}</p>
              <span class="hs-time">${timeAgo(a.timestamp)}</span>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

// ── News Card (string template, reused by sections + single feed) ──
function cardHTML(article) {
  return `
    <article class="news-card" onclick="openArticle(${article.id})">
      <div class="card-img-wrap">
        <img src="${article.image}" alt="${article.title}" loading="lazy" class="card-img" />
        ${article.breaking ? '<span class="breaking-badge">NOTICE</span>' : ''}
      </div>
      <div class="card-body">
        <div class="card-meta-top">
          <span class="badge badge-${article.category.toLowerCase()}">${article.category}</span>
          <span class="card-time">${timeAgo(article.timestamp)}</span>
        </div>
        <h3 class="card-title">${article.title}</h3>
        <p class="card-summary">${article.summary}</p>
        <div class="card-footer">
          <span class="card-author">${article.author}</span>
          <span class="btn-read">Read More →</span>
        </div>
      </div>
    </article>`;
}

// ── ALL view: one block per category, newest-first ────────
function renderSections() {
  const wrap = document.getElementById('sections');
  if (!wrap) return;
  const active = sortedActive();

  const blocks = SECTION_ORDER.map(cat => {
    const items = active.filter(a => a.category === cat).slice(0, 4);
    if (!items.length) return '';
    return `
      <section class="news-section">
        <div class="section-head">
          <h2 class="section-title" onclick="filterCategory('${cat}', null)">${cat}</h2>
          <span class="section-more" onclick="filterCategory('${cat}', null)">View all →</span>
        </div>
        <div class="section-grid">${items.map(cardHTML).join('')}</div>
      </section>`;
  }).filter(Boolean).join('');

  wrap.innerHTML = blocks || '<p class="no-results">No updates yet.</p>';
}

// ── SINGLE-CATEGORY view: full grid + load more ───────────
function renderNewsList() {
  const list         = document.getElementById('news-list');
  const loadMoreWrap = document.getElementById('load-more-wrap');
  if (!list) return;

  const articles = getFilteredArticles();
  const toShow   = articles.slice(0, visibleCount);

  if (!toShow.length) {
    list.innerHTML = '<p class="no-results">No updates found in this section.</p>';
    loadMoreWrap.style.display = 'none';
    return;
  }
  list.innerHTML = toShow.map(cardHTML).join('');
  loadMoreWrap.style.display = visibleCount < articles.length ? 'flex' : 'none';
}

// ── Switch between the All (sectioned) view and a single category ──
function applyView() {
  const isAll      = currentCategory === 'All';
  const hero       = document.getElementById('hero-section');
  const sections   = document.getElementById('sections');
  const singleFeed = document.getElementById('single-feed');

  if (hero) hero.style.display = isAll ? '' : 'none';
  if (sections)   sections.classList.toggle('hidden', !isAll);
  if (singleFeed) singleFeed.classList.toggle('hidden', isAll);

  if (isAll) {
    renderHero();
    renderSections();
  } else {
    const feedTitle = document.getElementById('feed-title');
    if (feedTitle) feedTitle.textContent = currentCategory;
    renderNewsList();
  }
}

// ── Sidebar — Recent Updates ──────────────────────────────
function renderTrending() {
  const list = document.getElementById('trending-list');
  if (!list) return;
  const top5 = [...getActiveArticles()]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  list.innerHTML = top5.map(a => `
    <li onclick="openArticle(${a.id})">
      <span class="trend-title">${a.title}</span>
      <span class="trend-meta">${a.category} · ${timeAgo(a.timestamp)}</span>
    </li>`).join('');
}

// ── Sidebar — Section Counts ──────────────────────────────
function renderCategoryCounts() {
  const el = document.getElementById('category-counts');
  if (!el) return;
  const counts = {};
  getActiveArticles().forEach(a => { counts[a.category] = (counts[a.category] || 0) + 1; });
  el.innerHTML = Object.entries(counts).map(([cat, count]) => `
    <div class="cat-item" onclick="filterCategory('${cat}', null)">
      <span class="cat-name">${cat}</span>
      <span class="cat-count">${count}</span>
    </div>`).join('');
}

// ── Filter / Sort ─────────────────────────────────────────
function filterCategory(cat, _clickedEl) {
  currentCategory = cat;
  visibleCount    = PAGE_SIZE;
  // Highlight the matching nav link (works whether the click came from the nav,
  // a section header, or the footer)
  document.querySelectorAll('.nav-list a').forEach(a => {
    a.classList.toggle('active', a.textContent.trim() === cat);
  });
  const navList = document.getElementById('nav-list');
  if (navList) navList.classList.remove('open');
  applyView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setSortOrder(order, btn) {
  sortOrder    = order;
  visibleCount = PAGE_SIZE;
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderNewsList();
}

function loadMore() {
  visibleCount += PAGE_SIZE;
  renderNewsList();
}

// ── Article Modal ─────────────────────────────────────────
function openArticle(id) {
  const article = ALL_ARTICLES.find(a => a.id === id);
  if (!article) return;
  const modal = document.getElementById('article-modal');
  const body  = document.getElementById('modal-body');

  body.innerHTML = `
    <div class="modal-header">
      <span class="badge badge-${article.category.toLowerCase()}">${article.category}</span>
      ${article.breaking ? '<span class="breaking-badge">NOTICE</span>' : ''}
    </div>
    <h2 class="modal-title">${article.title}</h2>
    <div class="modal-meta">
      <span>By <strong>${article.author}</strong></span>
      <span>${formatFull(article.timestamp)}</span>
    </div>
    <img src="${article.image}" alt="${article.title}" class="modal-img" />
    <div class="modal-content-body">${article.content}</div>
    <div class="modal-tags">
      ${(article.tags || []).map(t => `<span class="tag">#${t}</span>`).join('')}
    </div>`;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('article-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Search ────────────────────────────────────────────────
function openSearch() {
  document.getElementById('search-overlay').classList.remove('hidden');
  document.getElementById('search-input').focus();
  document.body.style.overflow = 'hidden';
}

function closeSearch() {
  document.getElementById('search-overlay').classList.add('hidden');
  document.getElementById('search-results').innerHTML = '';
  document.getElementById('search-input').value = '';
  document.body.style.overflow = '';
}

function searchNews() {
  const query   = document.getElementById('search-input').value.toLowerCase().trim();
  const results = document.getElementById('search-results');
  if (!query) { results.innerHTML = ''; return; }

  const matches = ALL_ARTICLES.filter(a =>
    a.title.toLowerCase().includes(query)    ||
    a.summary.toLowerCase().includes(query)  ||
    a.category.toLowerCase().includes(query) ||
    (a.tags || []).some(t => t.toLowerCase().includes(query))
  );

  results.innerHTML = matches.length
    ? matches.map(a => `
        <div class="search-result-item" onclick="closeSearch(); openArticle(${a.id})">
          <img src="${a.image}" alt="" class="sr-img" />
          <div class="sr-body">
            <span class="badge badge-${a.category.toLowerCase()}">${a.category}</span>
            <p class="sr-title">${a.title}</p>
            <span class="sr-time">${timeAgo(a.timestamp)}</span>
          </div>
        </div>`).join('')
    : '<p class="no-results" style="color:#fff">No results found.</p>';
}

// ── Dark Mode ─────────────────────────────────────────────
function toggleDarkMode() {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
}

// ── Nav (mobile) ──────────────────────────────────────────
function toggleNav() {
  document.getElementById('nav-list').classList.toggle('open');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeSearch(); }
});

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark');
  updateDatetime();
  setInterval(updateDatetime, 60000);

  await loadAllData();    // articles + ticker + quick links from server

  applyView();             // renders hero + category sections (All view by default)
  renderTrending();
  renderCategoryCounts();

  setInterval(refreshData, REFRESH_MS);   // keep the feed live
});
