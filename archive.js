// ============================================================
// CUTM Campus News — Archive Page (archive.html)
// ============================================================

let ALL_ARTICLES = [];

async function loadAllArticles() {
  let apiArticles = [];
  try {
    const res = await fetch('/api/articles');
    if (res.ok) {
      const raw = await res.json();
      apiArticles = raw.map(a => ({ ...a, timestamp: new Date(a.timestamp) }));
    }
  } catch {
    // static-only fallback
  }
  ALL_ARTICLES = [...apiArticles, ...NEWS_DATA];
}

// ---- Helpers ----
function timeAgo(date) {
  const now  = new Date();
  const diff = Math.floor((now - date) / 1000);
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

function monthKey(date) {
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
}

function dateKey(date) {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

function getAllSorted() {
  return [...ALL_ARTICLES].sort((a, b) => b.timestamp - a.timestamp);
}

// ---- Populate month dropdown ----
function populateMonthFilter() {
  const select = document.getElementById('archive-month');
  const months = [...new Set(getAllSorted().map(a => monthKey(a.timestamp)))];
  months.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    select.appendChild(opt);
  });
}

// ---- Render Archive ----
function renderArchive() {
  const catFilter    = document.getElementById('archive-category').value;
  const monthFilter  = document.getElementById('archive-month').value;
  const searchQuery  = document.getElementById('archive-search').value.toLowerCase().trim();

  let articles = getAllSorted();
  if (catFilter   !== 'All') articles = articles.filter(a => a.category === catFilter);
  if (monthFilter !== 'All') articles = articles.filter(a => monthKey(a.timestamp) === monthFilter);
  if (searchQuery) {
    articles = articles.filter(a =>
      a.title.toLowerCase().includes(searchQuery)   ||
      a.summary.toLowerCase().includes(searchQuery) ||
      a.tags.some(t => t.toLowerCase().includes(searchQuery))
    );
  }

  const container = document.getElementById('archive-grouped');
  container.innerHTML = '';

  if (!articles.length) {
    container.innerHTML = '<p class="no-results">No articles found for the selected filters.</p>';
    return;
  }

  // Group by date
  const groups = {};
  articles.forEach(a => {
    const key = dateKey(a.timestamp);
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  });

  Object.entries(groups).forEach(([date, items]) => {
    const section = document.createElement('div');
    section.className = 'archive-date-group';

    section.innerHTML = `
      <div class="archive-date-header">
        <span class="archive-date-line"></span>
        <span class="archive-date-label">${date}</span>
        <span class="archive-date-line"></span>
      </div>
    `;

    const list = document.createElement('div');
    list.className = 'archive-items';

    items.forEach(a => {
      const item = document.createElement('div');
      item.className = `archive-item ${a.archived ? 'is-archived' : ''}`;
      item.innerHTML = `
        <div class="archive-item-img-wrap">
          <img src="${a.image}" alt="${a.title}" loading="lazy" class="archive-item-img" />
          ${a.archived ? '<span class="archived-badge">Archived</span>' : ''}
        </div>
        <div class="archive-item-body">
          <div class="archive-item-meta">
            <span class="badge badge-${a.category.toLowerCase()}">${a.category}</span>
            <span class="card-time">${a.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            ${a.breaking ? '<span class="breaking-badge">NOTICE</span>' : ''}
          </div>
          <h3 class="archive-item-title" onclick="openArticle(${a.id})">${a.title}</h3>
          <p class="archive-item-summary">${a.summary}</p>
          <div class="archive-item-footer">
            <span>By ${a.author}</span>
            <div class="archive-tags">
              ${a.tags.map(t => `<span class="tag">#${t}</span>`).join('')}
            </div>
          </div>
        </div>
      `;
      list.appendChild(item);
    });

    section.appendChild(list);
    container.appendChild(section);
  });
}

// ---- Article Modal ----
function openArticle(id) {
  const article = ALL_ARTICLES.find(a => a.id === id);
  if (!article) return;
  const modal = document.getElementById('article-modal');
  const body  = document.getElementById('modal-body');

  body.innerHTML = `
    <div class="modal-header">
      <span class="badge badge-${article.category.toLowerCase()}">${article.category}</span>
      ${article.archived ? '<span class="archived-badge">Archived</span>' : ''}
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
      ${article.tags.map(t => `<span class="tag">#${t}</span>`).join('')}
    </div>
  `;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('article-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

function toggleDarkMode() {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
}

function updateDatetime() {
  const el = document.getElementById('current-datetime');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }) + ' | ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

document.addEventListener('DOMContentLoaded', async () => {
  if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark');
  updateDatetime();
  setInterval(updateDatetime, 60000);

  await loadAllArticles();

  populateMonthFilter();
  renderArchive();
});
