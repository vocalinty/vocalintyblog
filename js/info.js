/* ============================================================
   Vocalinty — Info pages (about, contact, privacy, terms)
   Reusable renderer for the info-page layout.
   Each info page calls VocalintyInfo.render({ eyebrow, title, lastUpdated, bodyHtml }).
   ============================================================ */

window.VocalintyInfo = (function () {
  const I = window.VocalintyLayout.ICONS

  function render(opts) {
    const slot = document.getElementById('info-page')
    if (!slot) return

    const updatedHtml = opts.lastUpdated
      ? `<p class="info-page__updated">Last updated: ${opts.lastUpdated}</p>`
      : ''

    slot.innerHTML = `
      <div class="info-page">
        <div class="container">
          <button class="back-link" id="info-back">${I.arrowLeft} Back to home</button>
          <div class="info-page__inner">
            <div class="info-page__header">
              <div class="info-page__eyebrow">${opts.eyebrow || ''}</div>
              <h1 class="info-page__title">${opts.title || ''}</h1>
              ${updatedHtml}
            </div>
            <div class="info-page__body prose">
              ${opts.bodyHtml || ''}
            </div>
          </div>
        </div>
      </div>
    `

    const back = document.getElementById('info-back')
    if (back) back.addEventListener('click', function () { window.location.href = 'index.html' })

    // Run any page-specific init (e.g. contact form handlers)
    if (typeof opts.onMount === 'function') opts.onMount()
  }

  return { render: render }
})()
