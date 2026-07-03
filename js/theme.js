

window.VocalintyTheme = (function () {
  const STORAGE_KEY = 'vocalinty-theme'

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY) } catch { return null }
  }
  function setStored(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme) } catch {}
  }

  function applyTheme(theme) {
    const html = document.documentElement
    if (theme === 'dark') html.classList.add('dark')
    else html.classList.remove('dark')
  }

  // Apply on load — read from storage, default to light
  function init() {
    const stored = getStored() || 'light'
    applyTheme(stored)
    updateToggleIcons(stored)
  }

  function toggle() {
    const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    const next = current === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setStored(next)
    updateToggleIcons(next)
  }

  function updateToggleIcons(theme) {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      const sunIcon = btn.querySelector('[data-icon="sun"]')
      const moonIcon = btn.querySelector('[data-icon="moon"]')
      if (sunIcon && moonIcon) {
        sunIcon.style.display = theme === 'dark' ? 'block' : 'none'
        moonIcon.style.display = theme === 'dark' ? 'none' : 'block'
      }
      btn.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      )
    })
  }

  return { init: init, toggle: toggle }
})()

// Apply theme ASAP to avoid flash — runs as soon as this script loads
window.VocalintyTheme.init()
