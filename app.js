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

    renderHero();
    renderNewsList();        // keeps current category / sort / visibleCount
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

// ── Hero ──────────────────────────────────────────────────
function renderHero() {
  const section = document.getElementById('hero-section');
  if (!section) return;

  const featured = getActiveArticles().find(a => a.featured)
    || getActiveArticles().sort((a, b) => b.timestamp - a.timestamp)[0];

  if (!featured) { section.style.display = 'none'; return; }

  section.innerHTML = `
    <div class="hero-card" onclick="openArticle(${featured.id})">
      <img src="${featured.image}" alt="${featured.title}" class="hero-img" loading="lazy" />
      <div class="hero-overlay">
        <span class="badge badge-${featured.category.toLowerCase()}">${featured.category}</span>
        <h2 class="hero-title">${featured.title}</h2>
        <p class="hero-summary">${featured.summary}</p>
        <div class="hero-meta">
          <span>By ${featured.author}</span>
          <span>${timeAgo(featured.timestamp)}</span>
        </div>
      </div>
    </div>`;
}

// ── News Cards ────────────────────────────────────────────
function createCard(article) {
  const card = document.createElement('article');
  card.className = 'news-card';
  card.innerHTML = `
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
        <button class="btn-read" onclick="openArticle(${article.id})">Read More →</button>
      </div>
    </div>`;
  return card;
}

function renderNewsList() {
  const list         = document.getElementById('news-list');
  const loadMoreWrap = document.getElementById('load-more-wrap');
  if (!list) return;

  const articles = getFilteredArticles();
  const toShow   = articles.slice(0, visibleCount);

  list.innerHTML = '';
  if (!toShow.length) {
    list.innerHTML = '<p class="no-results">No updates found in this section.</p>';
    loadMoreWrap.style.display = 'none';
    return;
  }
  toShow.forEach(a => list.appendChild(createCard(a)));
  loadMoreWrap.style.display = visibleCount < articles.length ? 'flex' : 'none';
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
function filterCategory(cat, clickedEl) {
  currentCategory = cat;
  visibleCount    = PAGE_SIZE;
  document.querySelectorAll('.nav-list a').forEach(a => a.classList.remove('active'));
  if (clickedEl) clickedEl.classList.add('active');
  const feedTitle = document.getElementById('feed-title');
  if (feedTitle) feedTitle.textContent = cat === 'All' ? 'Latest Updates' : cat;
  renderNewsList();
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

  renderHero();
  renderNewsList();
  renderTrending();
  renderCategoryCounts();

  setInterval(refreshData, REFRESH_MS);   // keep the feed live
});
