/**
 * Conversor de Markdown simplificado para HTML seguro
 */

/** Converte Markdown simples (##, ###, listas, **negrito**, *itálico*, links) em HTML escapado. */
function md(t) {
  const inl = (s) =>
    s
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.+?)\*/g, '<i>$1</i>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return esc(t)
    .split(/\n{2,}/)
    .map((b) => {
      b = b.trim();
      if (!b) return '';
      if (b.startsWith('## ')) return '<h2>' + inl(b.slice(3)) + '</h2>';
      if (b.startsWith('### ')) return '<h3>' + inl(b.slice(4)) + '</h3>';
      const ls = b.split('\n');
      if (ls.every((l) => l.startsWith('- ')))
        return '<ul>' + ls.map((l) => '<li>' + inl(l.slice(2)) + '</li>').join('') + '</ul>';
      return '<p>' + inl(b).replace(/\n/g, '<br>') + '</p>';
    })
    .join('');
}
