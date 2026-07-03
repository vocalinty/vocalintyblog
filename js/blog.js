

window.VocalintyBlog = (function () {
  const I = window.VocalintyLayout.ICONS

  function getBlogId() {
    const params = new URLSearchParams(window.location.search)
    return params.get('id')
  }

  function formatDateLong(iso) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    })
  }
  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit',
    })
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  function renderSkeleton() {
    const main = document.getElementById('blog-main')
    if (!main) return
    main.innerHTML = `
      <div style="max-width:672px;margin:0 auto">
        <div class="skeleton skeleton-line skeleton-line--sm" style="margin-bottom:16px"></div>
        <div class="skeleton skeleton-line" style="height:48px;width:75%;margin-bottom:24px"></div>
        <div class="skeleton skeleton-line skeleton-line--lg" style="margin-bottom:12px"></div>
        <div class="skeleton skeleton-line skeleton-line--lg" style="width:83%;margin-bottom:12px"></div>
        <div class="skeleton skeleton-line skeleton-line--lg" style="margin-bottom:12px"></div>
        <div class="skeleton skeleton-line skeleton-line--lg" style="width:66%"></div>
      </div>
    `
  }

  function renderNotFound() {
    const main = document.getElementById('blog-main')
    if (!main) return
    main.innerHTML = `
      <div style="max-width:672px;margin:96px auto;text-align:center;padding:0 20px">
        <p style="font-family:var(--font-serif);font-size:30px;font-style:italic">Entry not found.</p>
        <a href="index.html" class="btn btn-outline" style="margin-top:24px">
          ${I.arrowLeft} Back to the archive
        </a>
      </div>
    `
  }

  function renderBlog(blog) {
    const main = document.getElementById('blog-main')
    if (!main) return

    const dateStr = formatDateLong(blog.createdAt)
    const timeStr = formatTime(blog.createdAt)
    const tags = (blog.tags || '').split(',').map(t => t.trim()).filter(Boolean)
    const html = window.VocalintyMarkdown.renderMarkdown(blog.content || '')
    const embed = window.VocalintySpotify.toSpotifyEmbed(blog.spotifyUrl)
    const kind = window.VocalintySpotify.spotifyKindLabel(blog.spotifyUrl)

    const coverHtml = blog.coverImage
      ? `<div class="blog-cover"><img src="${escapeHtml(blog.coverImage)}" alt="${escapeHtml(blog.title)}"></div>`
      : ''

    const tagsHtml = tags.map(function (t) {
      return `<span class="blog-tag">${escapeHtml(t)}</span>`
    }).join('')

    const spotifyHtml = embed
      ? `
        <section class="spotify-section">
          <div class="spotify-label">
            ${I.music} ${kind ? 'Listen along — ' + kind : 'Listen along'}
          </div>
          <div class="spotify-embed-wrap">
            <iframe src="${escapeHtml(embed)}" width="100%" height="352"
              frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy" title="Spotify playlist"></iframe>
          </div>
          <div class="spotify-actions">
            <a href="${escapeHtml(blog.spotifyUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
              ${I.music} Visit playlist on Spotify
            </a>
          </div>
        </section>
      `
      : ''

    const ytHtml = blog.youtubeUrl
      ? `
        <section style="max-width:672px;margin:40px auto 0">
          <a href="${escapeHtml(blog.youtubeUrl)}" target="_blank" rel="noopener noreferrer" class="yt-cta">
            <span class="yt-cta__left">${I.youtube} Watch the video this entry came from</span>
            ${I.arrowUpRight}
          </a>
        </section>
      `
      : ''

    main.innerHTML = `
      <article class="blog-detail">
        <div class="container">
          <button class="back-link" id="back-link">${I.arrowLeft} All entries</button>
          ${coverHtml}
          <header class="blog-header">
            <div class="blog-meta">
              <span class="blog-meta-item">${I.calendar} ${dateStr}</span>
              <span class="blog-meta-item">${I.clock} ${timeStr}</span>
              <span class="blog-meta-item">${I.eye} ${(blog.views || 0).toLocaleString()} views</span>
              ${tagsHtml}
            </div>
            <h1 class="blog-title">${escapeHtml(blog.title)}</h1>
            ${blog.excerpt ? `<p class="blog-excerpt">${escapeHtml(blog.excerpt)}</p>` : ''}
          </header>
          <div class="prose">${html}</div>
          ${spotifyHtml}
          ${ytHtml}
          <div class="blog-detail__back-bottom">
            <a href="index.html" class="btn btn-outline btn-block">${I.arrowLeft} Back to the archive</a>
          </div>
        </div>
      </article>
    `

    const backLink = document.getElementById('back-link')
    if (backLink) backLink.addEventListener('click', function () { window.location.href = 'index.html' })
  }

  async function loadBlog(id) {
    // Use the increment_blog_view RPC — atomic view increment + fetch in one call
    const { data, error } = await window.supabaseClient.rpc('increment_blog_view', {
      p_id: id,
    })
    if (error) {
      console.error('increment_blog_view RPC error:', error)
      return null
    }
    return data
  }

  function init() {
    const id = getBlogId()
    if (!id) {
      renderNotFound()
      return
    }
    renderSkeleton()
    loadBlog(id).then(function (blog) {
      if (!blog) {
        renderNotFound()
        return
      }
      renderBlog(blog)
    })
  }

  return { init: init }
})()
