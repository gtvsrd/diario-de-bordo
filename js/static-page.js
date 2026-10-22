/**
 * Comportamento mínimo das páginas geradas pelo build (artigos e páginas fixas):
 * botão de tema, ano do rodapé e busca (que leva ao app na rota #/busca/...).
 */

const ROOT = document.body.dataset.root || './';

initThemeToggle();
document.getElementById('yr').textContent = new Date().getFullYear();
document.getElementById('q').addEventListener('keydown', (e) => {
  const q = e.target.value.trim();
  if (e.key === 'Enter' && q) location.href = ROOT + '#/busca/' + encodeURIComponent(q);
});
