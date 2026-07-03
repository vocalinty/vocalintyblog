/* ============================================================
   Vocalinty — Blog detail page logic
   Uses the increment_blog_view RPC (atomic view increment)
   and renders Markdown content + Spotify embed + YouTube CTA.
   Includes Adsterra Native Banner ad placement.
   ============================================================ */

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
        <a href="/" class="btn btn-outline" style="margin-top:24px">
          ${I.arrowLeft} Back to the archive
        </a>
      </div>
    `
  }

  // Adsterra Native Banner ad block
  // Shown after blog content, before Spotify embed
  const ADSTERRA_NATIVE_AD = `
    <div class="adsterra-ad" style="max-width:672px;margin:40px auto 0;padding:0 20px">
      <p style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:var(--muted-fg);margin-bottom:8px;text-align:center">Advertisement</p>
      <div style="text-align:center">
        <script async="async" data-cfasync="false" src="https://pl30188056.effectivecpmnetwork.com/054d6b8fc4d6249f8d67f75e129e17e1/invoke.js"><\/script>
        <div id="container-054d6b8fc4d6249f8d67f75e129e17e1"></div>
      </div>
    </div>
  `

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

    // Build the article HTML — the Adsterra ad block is inserted
    // AFTER the prose content but BEFORE the Spotify/YouTube sections.
    // We use a placeholder div + inject the script after innerHTML is set,
    // because innerHTML doesn't execute <script> tags.
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
        </div>

        <!-- Adsterra Native Banner — inserted here so it loads after content -->
        <div id="adsterra-ad-slot"></div>

        <div class="container">
          ${spotifyHtml}
          ${ytHtml}
          <div class="blog-detail__back-bottom">
            <a href="/" class="btn btn-outline btn-block">${I.arrowLeft} Back to the archive</a>
          </div>
        </div>
      </article>
    `

    // Inject the Adsterra Native Banner ad into the placeholder.
    // We can't use innerHTML for scripts (browsers don't execute them),
    // so we create the script element manually.
    const adSlot = document.getElementById('adsterra-ad-slot')
    if (adSlot) {
      adSlot.innerHTML = `
        <p style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:var(--muted-fg);margin-bottom:8px;text-align:center">Advertisement</p>
        <div style="text-align:center">
          <div id="container-054d6b8fc4d6249f8d67f75e129e17e1"></div>
        </div>
      `
      // Create and append the Adsterra invoke.js script
      const adScript = document.createElement('script')
      adScript.async = true
      adScript.setAttribute('data-cfasync', 'false')
      adScript.src = 'https://pl30188056.effectivecpmnetwork.com/054d6b8fc4d6249f8d67f75e129e17e1/invoke.js'
      adSlot.querySelector('div').appendChild(adScript)
    }

    // After the ad loads, clone it into the sidebar (desktop only)
    setTimeout(function () {
      var main = document.getElementById('container-054d6b8fc4d6249f8d67f75e129e17e1')
      var side = document.getElementById('sidebar-ad-container')
      if (main && side && main.innerHTML) {
        side.innerHTML = main.innerHTML
      }
    }, 2500)

    const backLink = document.getElementById('back-link')
    if (backLink) backLink.addEventListener('click', function () { window.location.href = '/' })
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
