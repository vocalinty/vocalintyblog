/* ============================================================
   Vocalinty — Home page logic (blog list, sort, search)
   ============================================================ */

window.VocalintyHome = (function () {
  const I = window.VocalintyLayout.ICONS
  let allBlogs = null
  let currentSort = 'views'
  let currentQuery = ''

  async function loadBlogs(sort) {
    const sortBy = sort === 'latest' ? 'createdAt' : 'views'
    const { data, error } = await window.supabaseClient
      .from('blogs')
      .select(
        'id, title, excerpt, coverImage, spotifyUrl, youtubeUrl, tags, views, createdAt'
      )
      .eq('published', true)
      .order(sortBy, { ascending: false })
      .order(sortBy === 'views' ? 'createdAt' : 'views', { ascending: false })

    if (error) {
      console.error('Supabase list error:', error)
      return null
    }
    return data || []
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric',
    })
  }

  function renderSkeletons() {
    const list = document.getElementById('blog-list')
    if (!list) return
    let html = ''
    for (let i = 0; i < 4; i++) {
      html += `
        <div class="skeleton-list">
          <div class="skeleton skeleton-cover"></div>
          <div class="skeleton-body">
            <div class="skeleton skeleton-line skeleton-line--sm"></div>
            <div class="skeleton skeleton-line skeleton-line--md"></div>
            <div class="skeleton skeleton-line skeleton-line--lg"></div>
            <div class="skeleton skeleton-line skeleton-line--lg" style="width:83%"></div>
          </div>
        </div>
      `
    }
    list.innerHTML = html
  }

  function renderError() {
    const list = document.getElementById('blog-list')
    if (!list) return
    list.innerHTML = `
      <div class="state-box--solid">
        Failed to load posts. Please refresh.
      </div>
    `
  }

  function renderEmpty(hasQuery) {
    const list = document.getElementById('blog-list')
    if (!list) return
    if (hasQuery) {
      list.innerHTML = `
        <div class="state-box">
          <p class="state-box__title">No matches for &ldquo;${escapeHtml(currentQuery)}&rdquo;.</p>
          <p class="state-box__sub">Try a different search term.</p>
        </div>
      `
    } else {
      list.innerHTML = `
        <div class="state-box">
          <p class="state-box__title">The first word has not been written yet.</p>
          <p class="state-box__sub">New entries will appear here.</p>
        </div>
      `
    }
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  function renderRow(blog, rank) {
    const date = formatDate(blog.createdAt)
    const tags = (blog.tags || '').split(',').map(t => t.trim()).filter(Boolean)
    const coverBlock = blog.coverImage
      ? `<img src="${escapeHtml(blog.coverImage)}" alt="" class="blog-row__cover-img">`
      : `<div class="blog-row__cover-placeholder">${String(rank).padStart(2, '0')}</div>`
    const playlistBadge = blog.spotifyUrl
      ? `<span class="blog-row__meta-item">${I.music} Playlist</span>`
      : ''
    const tagBadge = tags[0]
      ? `<span class="blog-row__tag">${escapeHtml(tags[0])}</span>`
      : ''

    return `
      <li>
        <button class="blog-row" data-blog-id="${escapeHtml(blog.id)}">
          <div class="blog-row__inner">
            <div class="blog-row__cover">
              <div class="blog-row__cover-wrap">
                ${coverBlock}
                <span class="blog-row__cover-rank">${String(rank).padStart(2, '0')}</span>
              </div>
            </div>
            <div class="blog-row__body">
              <div class="blog-row__meta">
                <span>${date}</span>
                <span class="blog-row__meta-item">${I.eye} ${(blog.views || 0).toLocaleString()} views</span>
                ${playlistBadge}
                ${tagBadge}
              </div>
              <h3 class="blog-row__title">${escapeHtml(blog.title)}</h3>
              <p class="blog-row__excerpt">${escapeHtml(blog.excerpt)}</p>
              <span class="blog-row__cta">Read entry ${I.arrowUpRight}</span>
            </div>
          </div>
        </button>
      </li>
    `
  }

  function renderList() {
    const list = document.getElementById('blog-list')
    const countBadge = document.getElementById('archive-count')
    if (!list) return
    if (!allBlogs) { renderSkeletons(); return }

    if (countBadge) countBadge.textContent = allBlogs.length

    // Apply search filter
    const q = currentQuery.trim().toLowerCase()
    let filtered = allBlogs
    if (q) {
      filtered = allBlogs.filter(function (b) {
        const tags = (b.tags || '').toLowerCase()
        return (
          (b.title || '').toLowerCase().includes(q) ||
          (b.excerpt || '').toLowerCase().includes(q) ||
          tags.includes(q)
        )
      })
    }

    if (filtered.length === 0) {
      renderEmpty(!!q)
      return
    }

    let html = '<ol class="blog-list">'
    filtered.forEach(function (b, i) {
      html += renderRow(b, i + 1)
    })
    html += '</ol>'
    list.innerHTML = html

    // Attach click handlers
    list.querySelectorAll('[data-blog-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.getAttribute('data-blog-id')
        window.location.href = 'blog.html?id=' + encodeURIComponent(id)
      })
    })
  }

  function setSort(sort) {
    if (sort === currentSort) return
    currentSort = sort
    // Update toggle UI
    document.querySelectorAll('.sort-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-sort') === sort)
    })
    // Reload from server
    allBlogs = null
    renderList()
    loadBlogs(sort).then(function (blogs) {
      allBlogs = blogs
      renderList()
    })
  }

  function init() {
    // Render initial skeleton
    renderSkeletons()

    // Load blogs (default sort: views)
    loadBlogs(currentSort).then(function (blogs) {
      if (blogs === null) {
        renderError()
        return
      }
      allBlogs = blogs
      renderList()
    })

    // Sort toggle
    document.querySelectorAll('.sort-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setSort(btn.getAttribute('data-sort'))
      })
    })

    // Search
    const searchInput = document.getElementById('search-input')
    const searchClear = document.getElementById('search-clear')
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        currentQuery = searchInput.value
        if (searchClear) searchClear.style.display = currentQuery ? 'flex' : 'none'
        renderList()
      })
    }
    if (searchClear) {
      searchClear.addEventListener('click', function () {
        if (searchInput) {
          searchInput.value = ''
          currentQuery = ''
          searchClear.style.display = 'none'
          renderList()
          searchInput.focus()
        }
      })
    }
  }

  return { init: init }
})()
