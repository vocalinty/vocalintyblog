/* ============================================================
   Vocalinty — Spotify URL helpers (vanilla JS port)
   ============================================================ */

window.VocalintySpotify = (function () {

  function toSpotifyEmbed(url) {
    if (!url) return null
    const trimmed = String(url).trim()
    if (!trimmed) return null

    // Already an embed URL
    if (trimmed.includes('/embed/')) return trimmed

    // spotify:playlist:ID form
    const uriMatch = trimmed.match(
      /^spotify:(playlist|album|track|show|episode|artist):([a-zA-Z0-9]+)/
    )
    if (uriMatch) {
      return 'https://open.spotify.com/embed/' + uriMatch[1] + '/' + uriMatch[2]
    }

    // open.spotify.com/<type>/<id>
    const urlMatch = trimmed.match(
      /open\.spotify\.com\/(playlist|album|track|show|episode|artist)\/([a-zA-Z0-9]+)/
    )
    if (urlMatch) {
      return 'https://open.spotify.com/embed/' + urlMatch[1] + '/' + urlMatch[2]
    }

    return null
  }

  function spotifyKindLabel(url) {
    if (!url) return ''
    const m =
      String(url).match(/open\.spotify\.com\/(playlist|album|track|show|episode|artist)/) ||
      String(url).match(/^spotify:(playlist|album|track|show|episode|artist):/)
    if (!m) return ''
    return m[1]
  }

  return { toSpotifyEmbed: toSpotifyEmbed, spotifyKindLabel: spotifyKindLabel }
})()
