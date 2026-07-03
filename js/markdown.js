

window.VocalintyMarkdown = (function () {
  function escapeHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function inline(s) {
    // links: [text](url) — url must be http(s) or mailto
    s = s.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,
      function (_m, text, url) {
        return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + text + '</a>'
      }
    )
    // inline code
    s = s.replace(/`([^`]+)`/g, function (_m, code) {
      return '<code>' + code + '</code>'
    })
    // bold (must come before italic)
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>')
    // italic
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>')
    s = s.replace(/_([^_]+)_/g, '<em>$1</em>')
    return s
  }

  function renderMarkdown(src) {
    if (!src) return ''
    const lines = src.replace(/\r\n/g, '\n').split('\n')
    const out = []
    let i = 0
    let inUl = false
    let inOl = false

    function closeLists() {
      if (inUl) { out.push('</ul>'); inUl = false }
      if (inOl) { out.push('</ol>'); inOl = false }
    }

    while (i < lines.length) {
      const raw = lines[i]
      const line = raw.trimEnd()

      // Blank line
      if (line.trim() === '') { closeLists(); i++; continue }

      // Horizontal rule
      if (/^---+$/.test(line.trim())) {
        closeLists()
        out.push('<hr/>')
        i++; continue
      }

      // Headings
      const h = line.match(/^(#{1,6})\s+(.*)$/)
      if (h) {
        closeLists()
        const level = Math.min(h[1].length, 3)
        out.push('<h' + level + '>' + inline(escapeHtml(h[2])) + '</h' + level + '>')
        i++; continue
      }

      // Blockquote
      if (line.startsWith('> ')) {
        closeLists()
        const block = []
        while (i < lines.length && lines[i].trimStart().startsWith('> ')) {
          block.push(lines[i].trimStart().slice(2))
          i++
        }
        out.push('<blockquote>' + inline(escapeHtml(block.join(' '))) + '</blockquote>')
        continue
      }

      // Unordered list
      if (/^\s*[-*]\s+/.test(line)) {
        if (inOl) { out.push('</ol>'); inOl = false }
        if (!inUl) { out.push('<ul>'); inUl = true }
        out.push('<li>' + inline(escapeHtml(line.replace(/^\s*[-*]\s+/, ''))) + '</li>')
        i++; continue
      }

      // Ordered list
      if (/^\s*\d+\.\s+/.test(line)) {
        if (inUl) { out.push('</ul>'); inUl = false }
        if (!inOl) { out.push('<ol>'); inOl = true }
        out.push('<li>' + inline(escapeHtml(line.replace(/^\s*\d+\.\s+/, ''))) + '</li>')
        i++; continue
      }

      // Paragraph (consume until blank or block start)
      closeLists()
      const para = [line]
      i++
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !/^(#{1,6})\s+/.test(lines[i].trim()) &&
        !lines[i].trimStart().startsWith('> ') &&
        !/^\s*[-*]\s+/.test(lines[i]) &&
        !/^\s*\d+\.\s+/.test(lines[i]) &&
        !/^---+$/.test(lines[i].trim())
      ) {
        para.push(lines[i].trimEnd())
        i++
      }
      out.push('<p>' + inline(escapeHtml(para.join(' '))) + '</p>')
    }
    closeLists()
    return out.join('\n')
  }

  return { renderMarkdown: renderMarkdown }
})()
