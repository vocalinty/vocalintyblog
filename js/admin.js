

window.VocalintyAdmin = (function () {
  const I = window.VocalintyLayout.ICONS
  const PW_KEY = 'vocalinty_admin_pw'
  const AUTHED_KEY = 'vocalinty_admin_authed'

  // ---------- Toast ----------
  function toast(msg, isError) {
    const slot = document.getElementById('toast-container')
    if (!slot) return
    const el = document.createElement('div')
    el.className = 'toast' + (isError ? ' toast--error' : '')
    el.textContent = msg
    el.style.pointerEvents = 'auto'
    slot.appendChild(el)
    setTimeout(function () {
      el.style.opacity = '0'
      el.style.transition = 'opacity 0.3s ease'
      setTimeout(function () { el.remove() }, 300)
    }, 3500)
  }

  // ---------- Auth helpers ----------
  function isAuthed() {
    try { return sessionStorage.getItem(AUTHED_KEY) === '1' } catch { return false }
  }
  function getPw() {
    try { return sessionStorage.getItem(PW_KEY) || '' } catch { return '' }
  }
  function setAuthed(pw) {
    try {
      sessionStorage.setItem(AUTHED_KEY, '1')
      sessionStorage.setItem(PW_KEY, pw)
    } catch {}
  }
  function clearAuth() {
    try {
      sessionStorage.removeItem(AUTHED_KEY)
      sessionStorage.removeItem(PW_KEY)
    } catch {}
  }

  // ---------- Login screen ----------
  function renderLogin(slot) {
    slot.innerHTML = `
      <div class="admin-login">
        <div class="admin-login__card">
          <div class="admin-login__head">
            <span class="admin-login__icon">${I.lock}</span>
            <div>
              <p class="admin-login__title">Studio</p>
              <p class="admin-login__sub">Author access only</p>
            </div>
          </div>
          <form class="admin-login__form" id="login-form">
            <div class="form-field">
              <label class="form-label" for="login-pw">Password</label>
              <input class="form-input admin-form__input" id="login-pw" type="password" required
                placeholder="••••••••" autocomplete="current-password">
            </div>
            <button type="submit" class="btn btn-primary btn-block" id="login-btn">Enter</button>
          </form>
          <p class="admin-login__note">
            This panel is unlisted. Sign in with the admin password configured
            in your Supabase database. No link to this page appears anywhere
            on the public site — bookmark <code>admin.html</code> for quick
            access.
          </p>
        </div>
      </div>
    `
    const form = document.getElementById('login-form')
    const input = document.getElementById('login-pw')
    if (input) input.focus()
    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault()
        const pw = input.value
        if (!pw) return
        const btn = document.getElementById('login-btn')
        btn.disabled = true
        btn.textContent = 'Verifying…'
        try {
          const { data, error } = await window.supabaseClient.rpc(
            'verify_admin_credentials',
            { p_password: pw }
          )
          if (error) throw error
          if (data === true) {
            setAuthed(pw)
            toast('Welcome back to the studio.')
            renderEditor(slot)
          } else {
            toast('Access denied — incorrect password.', true)
            btn.disabled = false
            btn.textContent = 'Enter'
          }
        } catch (err) {
          console.error('Login error:', err)
          toast('Verification failed. Make sure the SQL has been run.', true)
          btn.disabled = false
          btn.textContent = 'Enter'
        }
      })
    }
  }

  // ---------- Editor state ----------
  const form = {
    title: '', excerpt: '', content: '',
    coverImage: '', spotifyUrl: '', youtubeUrl: '', tags: '',
    published: true,
  }
  let blogs = null
  let saving = false

  // ---------- Load existing blogs (sidebar) ----------
  async function loadBlogs() {
    const { data, error } = await window.supabaseClient
      .from('blogs')
      .select('id, title, excerpt, coverImage, spotifyUrl, youtubeUrl, tags, views, createdAt')
      .order('createdAt', { ascending: false })
    if (error) {
      console.error('Admin list error:', error)
      return []
    }
    return data || []
  }

  function formatDateShort(iso) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric',
    })
  }
  function formatTimeShort(iso) {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit',
    })
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  function renderSidebar() {
    const slot = document.getElementById('admin-entries')
    const countBadge = document.getElementById('admin-count')
    if (countBadge) countBadge.textContent = blogs === null ? '…' : blogs.length
    if (!slot) return

    if (blogs === null) {
      slot.innerHTML = `
        <div style="padding:16px;display:flex;flex-direction:column;gap:12px">
          <div class="skeleton" style="height:56px"></div>
          <div class="skeleton" style="height:56px"></div>
          <div class="skeleton" style="height:56px"></div>
        </div>
      `
      return
    }
    if (blogs.length === 0) {
      slot.innerHTML = `<p style="padding:24px;text-align:center;font-size:13px;color:var(--muted-fg)">Nothing published yet.</p>`
      return
    }
    slot.innerHTML = blogs.map(function (b) {
      const spotifyIcon = b.spotifyUrl ? `<span class="admin-entry__meta-item">${I.music}</span>` : ''
      return `
        <div class="admin-entry">
          <div class="admin-entry__body">
            <p class="admin-entry__title">${escapeHtml(b.title)}</p>
            <div class="admin-entry__meta">
              <span class="admin-entry__meta-item">${I.calendar} ${formatDateShort(b.createdAt)}</span>
              <span class="admin-entry__meta-item">${I.clock} ${formatTimeShort(b.createdAt)}</span>
              <span class="admin-entry__meta-item">${I.eye} ${b.views || 0}</span>
              ${spotifyIcon}
            </div>
          </div>
          <div class="admin-entry__actions">
            <button class="btn btn-ghost btn-icon-sm" data-view-id="${escapeHtml(b.id)}" title="View on site">${I.eye}</button>
            <button class="btn btn-ghost btn-icon-sm" data-delete-id="${escapeHtml(b.id)}" title="Delete entry">${I.trash}</button>
          </div>
        </div>
      `
    }).join('')

    // Attach handlers
    slot.querySelectorAll('[data-view-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.open('blog.html?id=' + encodeURIComponent(btn.getAttribute('data-view-id')), '_blank')
      })
    })
    slot.querySelectorAll('[data-delete-id]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const id = btn.getAttribute('data-delete-id')
        if (!confirm('Delete this entry permanently?')) return
        const { error } = await window.supabaseClient.rpc('delete_blog', {
          p_password: getPw(),
          p_id: id,
        })
        if (error) {
          console.error('Delete error:', error)
          toast('Delete failed: ' + (error.message || 'unknown error'), true)
          return
        }
        toast('Entry deleted.')
        blogs = null
        renderSidebar()
        const fresh = await loadBlogs()
        blogs = fresh
        renderSidebar()
      })
    })
  }

  // ---------- Formatting toolbar ----------
  function applyFormat(type) {
    const ta = document.getElementById('content-input')
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const before = form.content.slice(0, start)
    const sel = form.content.slice(start, end)
    const after = form.content.slice(end)
    let inserted = ''
    let newSelStart = start
    let newSelEnd = start + inserted.length

    function wrap(prefix, suffix) {
      suffix = suffix || prefix
      inserted = prefix + (sel || 'text') + suffix
      newSelStart = start + prefix.length
      newSelEnd = newSelStart + (sel || 'text').length
    }
    function linePrefix(prefix) {
      if (!sel) {
        inserted = prefix + ' item\n'
        newSelStart = start + prefix.length + 1
        newSelEnd = newSelStart
      } else {
        const lines = sel.split('\n')
        inserted = lines.map(function (l) { return prefix + ' ' + l }).join('\n') + '\n'
        newSelStart = start
        newSelEnd = start + inserted.length
      }
    }

    switch (type) {
      case 'bold': wrap('**'); break
      case 'italic': wrap('*'); break
      case 'h1': linePrefix('#'); break
      case 'h2': linePrefix('##'); break
      case 'h3': linePrefix('###'); break
      case 'ul': linePrefix('-'); break
      case 'ol': linePrefix('1.'); break
      case 'quote': linePrefix('>'); break
      case 'link':
        inserted = '[' + (sel || 'link text') + '](https://)'
        newSelStart = start + (sel || 'link text').length + 3
        newSelEnd = newSelStart + 'https://'.length
        break
      case 'code': wrap('`'); break
    }

    form.content = before + inserted + after
    const input = document.getElementById('content-input')
    if (input) {
      input.value = form.content
      // Restore selection after re-render
      requestAnimationFrame(function () {
        input.focus()
        input.setSelectionRange(newSelStart, newSelEnd)
      })
    }
  }

  // ---------- Preview modal ----------
  function openPreview() {
    const overlay = document.getElementById('preview-overlay')
    if (!overlay) return
    const html = window.VocalintyMarkdown.renderMarkdown(form.content)
    const embed = window.VocalintySpotify.toSpotifyEmbed(form.spotifyUrl)
    const coverHtml = form.coverImage
      ? `<div class="modal__preview-cover"><img src="${escapeHtml(form.coverImage)}" alt=""></div>`
      : ''
    const excerptHtml = form.excerpt
      ? `<p class="modal__preview-excerpt">${escapeHtml(form.excerpt)}</p>`
      : ''
    const spotifyHtml = embed
      ? `<div class="modal__preview-spotify">
          <div class="spotify-label">${I.music} Listen along</div>
          <div class="spotify-embed-wrap">
            <iframe src="${escapeHtml(embed)}" width="100%" height="352" frameborder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy" title="Spotify preview"></iframe>
          </div>
          <div class="spotify-actions">
            <a href="${escapeHtml(form.spotifyUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
              ${I.music} Visit playlist on Spotify
            </a>
          </div>
        </div>`
      : ''
    const ytHtml = form.youtubeUrl
      ? `<a href="${escapeHtml(form.youtubeUrl)}" target="_blank" rel="noopener noreferrer" class="modal__preview-yt">
          <span>${I.youtube} Watch the video</span>
          ${I.arrowUpRight}
        </a>`
      : ''

    overlay.innerHTML = `
      <div class="modal-overlay" id="preview-modal">
        <div class="modal">
          <div class="modal__header">${I.eye} Live preview</div>
          ${coverHtml}
          <h1 class="modal__preview-title">${escapeHtml(form.title) || '<span style="color:var(--muted-fg)">Untitled entry</span>'}</h1>
          ${excerptHtml}
          <div class="prose" style="margin-top:24px">${html || '<p style="color:var(--muted-fg);font-style:italic">Nothing to preview yet.</p>'}</div>
          ${spotifyHtml}
          ${ytHtml}
          <div style="margin-top:24px;text-align:right">
            <button class="btn btn-outline" id="preview-close">Close</button>
          </div>
        </div>
      </div>
    `
    document.body.style.overflow = 'hidden'
    const modal = document.getElementById('preview-modal')
    const close = document.getElementById('preview-close')
    if (modal) modal.addEventListener('click', function (e) {
      if (e.target === modal) closePreview()
    })
    if (close) close.addEventListener('click', closePreview)
  }
  function closePreview() {
    const overlay = document.getElementById('preview-overlay')
    if (overlay) overlay.innerHTML = ''
    document.body.style.overflow = ''
  }

  // ---------- Submit ----------
  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.excerpt.trim() || !form.content.trim()) {
      toast('Missing fields — title, excerpt, and content are required.', true)
      return
    }
    if (saving) return
    saving = true
    const btn = document.getElementById('publish-btn')
    btn.disabled = true
    btn.textContent = 'Publishing…'
    try {
      const { data, error } = await window.supabaseClient.rpc('create_blog', {
        p_password: getPw(),
        p_title: form.title.trim(),
        p_excerpt: form.excerpt.trim(),
        p_content: form.content,
        p_cover_image: form.coverImage.trim() || null,
        p_spotify_url: form.spotifyUrl.trim() || null,
        p_youtube_url: form.youtubeUrl.trim() || null,
        p_tags: form.tags.trim(),
        p_published: form.published,
      })
      if (error) throw error
      toast('Entry published.')
      // Reset form
      Object.assign(form, {
        title: '', excerpt: '', content: '',
        coverImage: '', spotifyUrl: '', youtubeUrl: '', tags: '',
        published: true,
      })
      syncFormToInputs()
      // Reload sidebar
      blogs = null
      renderSidebar()
      const fresh = await loadBlogs()
      blogs = fresh
      renderSidebar()
    } catch (err) {
      console.error('Publish error:', err)
      toast('Failed to publish: ' + (err.message || 'unknown error'), true)
    } finally {
      saving = false
      btn.disabled = false
      btn.innerHTML = I.plus + ' Publish entry'
    }
  }

  function syncFormToInputs() {
    const set = function (id, val) {
      const el = document.getElementById(id)
      if (el) el.value = val
    }
    set('title-input', form.title)
    set('excerpt-input', form.excerpt)
    set('content-input', form.content)
    set('cover-input', form.coverImage)
    set('spotify-input', form.spotifyUrl)
    set('yt-input', form.youtubeUrl)
    set('tags-input', form.tags)
    const pub = document.getElementById('published-input')
    if (pub) pub.checked = form.published
  }

  // ---------- Render editor ----------
  function renderEditor(slot) {
    slot.innerHTML = `
      <div class="admin">
        <div class="admin__header">
          <div>
            <div class="admin__eyebrow">${I.lock} Hidden studio</div>
            <h1 class="admin__title">Write a new entry</h1>
          </div>
          <div class="admin__actions">
            <a href="index.html" class="btn btn-outline btn-sm">View site</a>
            <button class="btn btn-ghost btn-sm" id="signout-btn">Sign out</button>
          </div>
        </div>

        <div class="admin-grid">
          <!-- Form -->
          <form class="admin-form" id="admin-form">
            <div class="admin-form__row">
              <label class="admin-form__label" for="title-input">Title</label>
              <input class="admin-form__input admin-form__input--serif" id="title-input" type="text" required
                placeholder="On Minimalism in Storytelling">
            </div>

            <div class="admin-form__row">
              <label class="admin-form__label" for="excerpt-input">Excerpt</label>
              <textarea class="admin-form__textarea" id="excerpt-input" rows="2"
                placeholder="A single-sentence summary shown in the archive list."></textarea>
            </div>

            <div class="admin-form__row">
              <div class="admin-form__content-header">
                <label class="admin-form__label" for="content-input">Content (Markdown)</label>
                <button type="button" class="btn btn-outline btn-sm" id="preview-btn">${I.eye} Preview</button>
              </div>
              <div class="toolbar" id="toolbar">
                <button type="button" class="toolbar-btn" data-fmt="h1" title="Heading 1 (large)">${I.heading1}</button>
                <button type="button" class="toolbar-btn" data-fmt="h2" title="Heading 2 (medium)">${I.heading2}</button>
                <button type="button" class="toolbar-btn" data-fmt="h3" title="Heading 3 (small)">${I.heading3}</button>
                <span class="toolbar-divider"></span>
                <button type="button" class="toolbar-btn" data-fmt="bold" title="Bold">${I.bold}</button>
                <button type="button" class="toolbar-btn" data-fmt="italic" title="Italic">${I.italic}</button>
                <button type="button" class="toolbar-btn" data-fmt="code" title="Inline code">${I.code}</button>
                <button type="button" class="toolbar-btn" data-fmt="link" title="Link">${I.link}</button>
                <span class="toolbar-divider"></span>
                <button type="button" class="toolbar-btn" data-fmt="ul" title="Bulleted list">${I.ul}</button>
                <button type="button" class="toolbar-btn" data-fmt="ol" title="Numbered list">${I.ol}</button>
                <button type="button" class="toolbar-btn" data-fmt="quote" title="Blockquote">${I.quote}</button>
              </div>
              <textarea class="admin-form__textarea admin-form__textarea--mono" id="content-input" rows="14"
                placeholder="# Heading

Paragraph text.

- bullet
- bullet"></textarea>
              <p class="admin-form__hint">
                Toolbar inserts Markdown at the cursor. Supports headings (#, ##, ###),
                **bold**, *italic*, [links](url), \`code\`, &gt; quote, - bullets, 1. numbered lists.
              </p>
            </div>

            <div class="admin-form__row-grid">
              <div class="admin-form__row">
                <label class="admin-form__label" for="cover-input">Cover image URL</label>
                <input class="admin-form__input" id="cover-input" type="url" placeholder="https://…">
              </div>
              <div class="admin-form__row">
                <label class="admin-form__label" for="tags-input">Tags (comma-separated)</label>
                <input class="admin-form__input" id="tags-input" type="text" placeholder="craft, minimalism">
              </div>
            </div>

            <div class="admin-form__row-grid">
              <div class="admin-form__row">
                <label class="admin-form__label" for="spotify-input">Spotify playlist URL</label>
                <input class="admin-form__input" id="spotify-input" type="url"
                  style="font-family:var(--font-mono);font-size:12px"
                  placeholder="https://open.spotify.com/playlist/…">
                <p class="admin-form__hint">Optional. Playlist, album, or track.</p>
              </div>
              <div class="admin-form__row">
                <label class="admin-form__label" for="yt-input">Related YouTube URL</label>
                <input class="admin-form__input" id="yt-input" type="url"
                  style="font-family:var(--font-mono);font-size:12px"
                  placeholder="https://youtube.com/watch?v=…">
              </div>
            </div>

            <div class="admin-publish-row">
              <label class="admin-publish-toggle">
                <span class="switch">
                  <input type="checkbox" id="published-input" checked>
                  <span class="switch__slider"></span>
                </span>
                <span>Published</span>
              </label>
              <button type="submit" class="btn btn-primary" id="publish-btn" style="min-width:128px">
                ${I.plus} Publish entry
              </button>
            </div>
          </form>

          <!-- Sidebar -->
          <aside class="admin-sidebar">
            <div class="admin-sidebar__head">
              <h2 class="admin-sidebar__title">Existing entries</h2>
              <span class="admin-sidebar__count" id="admin-count">…</span>
            </div>
            <div class="admin-entries" id="admin-entries"></div>
            <div class="admin-note">
              <p class="admin-note__title">How you find this panel</p>
              <p>
                This studio is unlisted — there is no link to it anywhere on
                the public site. Bookmark <code>admin.html</code> for quick
                access.
              </p>
            </div>
          </aside>
        </div>
      </div>
      <div id="preview-overlay"></div>
    `

    // Wire up form inputs → state
    const wireInput = function (id, key, isCheckbox) {
      const el = document.getElementById(id)
      if (!el) return
      el.addEventListener('input', function () {
        form[key] = isCheckbox ? el.checked : el.value
      })
    }
    wireInput('title-input', 'title')
    wireInput('excerpt-input', 'excerpt')
    wireInput('content-input', 'content')
    wireInput('cover-input', 'coverImage')
    wireInput('spotify-input', 'spotifyUrl')
    wireInput('yt-input', 'youtubeUrl')
    wireInput('tags-input', 'tags')
    wireInput('published-input', 'published', true)

    // Toolbar
    document.querySelectorAll('[data-fmt]').forEach(function (btn) {
      // Prevent textarea selection loss
      btn.addEventListener('mousedown', function (e) { e.preventDefault() })
      btn.addEventListener('click', function () {
        applyFormat(btn.getAttribute('data-fmt'))
      })
    })

    // Preview
    const previewBtn = document.getElementById('preview-btn')
    if (previewBtn) previewBtn.addEventListener('click', openPreview)

    // Submit
    const adminForm = document.getElementById('admin-form')
    if (adminForm) adminForm.addEventListener('submit', handleSubmit)

    // Sign out
    const signoutBtn = document.getElementById('signout-btn')
    if (signoutBtn) signoutBtn.addEventListener('click', function () {
      clearAuth()
      window.location.href = 'index.html'
    })

    // Load sidebar
    renderSidebar()
    loadBlogs().then(function (fresh) {
      blogs = fresh
      renderSidebar()
    })
  }

  // ---------- Init ----------
  function init() {
    const slot = document.getElementById('admin-root')
    if (!slot) return
    if (isAuthed()) {
      renderEditor(slot)
    } else {
      renderLogin(slot)
    }
  }

  return { init: init }
})()
