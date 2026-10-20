/**
 * Acesso aos dados (Supabase): artigos, páginas, imagens de capa e login do administrador.
 * As telas leem o cache em memória `db`; toda alteração passa por aqui e recarrega o cache.
 */

/** Verdadeiro se js/config.js já foi preenchido. */
const isConfigured = () => !SUPABASE_URL.includes('SEU-PROJETO') && !SUPABASE_ANON_KEY.includes('SUA-CHAVE');

const sb = isConfigured() ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let db = { posts: [], pages: {} }; // cache usado pelas telas
let admin = false; // true se o administrador está logado

/** Artigos que o usuário atual pode ver (admin vê rascunhos), do mais novo ao mais antigo. */
const visible = () => db.posts.filter((p) => admin || p.pub).sort((a, b) => b.date.localeCompare(a.date));

/** Carrega artigos e páginas do banco para o cache. */
async function loadAll() {
  const [p, g] = await Promise.all([
    sb.from('posts').select('*').order('date', { ascending: false }),
    sb.from('pages').select('*'),
  ]);
  if (p.error || g.error) throw p.error || g.error;
  db.posts = p.data;
  db.pages = {};
  g.data.forEach((x) => (db.pages[x.slug] = { title: x.title, body: x.body }));
}

/** Confere se há sessão ativa e se o usuário é administrador. */
async function checkAdmin() {
  admin = false;
  const { data } = await sb.auth.getSession();
  if (data.session) admin = (await sb.rpc('is_admin')).data === true;
}

/** Entra com e-mail e senha. Retorna true só se for um administrador. */
async function login(email, password) {
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return false;
  await checkAdmin();
  if (!admin) {
    await sb.auth.signOut();
    return false;
  }
  await loadAll();
  return true;
}

/** Sai da conta e recarrega os dados públicos. */
async function logout() {
  await sb.auth.signOut();
  admin = false;
  await loadAll();
}

/** Cria (sem id) ou atualiza (com id) um artigo. */
async function savePost({ id, ...fields }) {
  const { error } = id ? await sb.from('posts').update(fields).eq('id', id) : await sb.from('posts').insert(fields);
  if (error) throw error;
  await loadAll();
}

/** Exclui um artigo. */
async function deletePost(id) {
  const { error } = await sb.from('posts').delete().eq('id', id);
  if (error) throw error;
  await loadAll();
}

/** Atualiza uma página fixa (Sobre, Contato). */
async function savePage(slug, title, body) {
  const { error } = await sb.from('pages').update({ title, body }).eq('slug', slug);
  if (error) throw error;
  await loadAll();
}

/** Troca a senha do administrador logado. */
async function changePassword(password) {
  const { error } = await sb.auth.updateUser({ password });
  if (error) throw error;
}

/** Envia a imagem de capa (Blob) para o Storage e devolve o endereço público. */
async function uploadCover(blob) {
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await sb.storage
    .from('covers')
    .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
  if (error) throw error;
  return sb.storage.from('covers').getPublicUrl(path).data.publicUrl;
}

/** Apaga uma capa do Storage (ignora endereços de outros sites). */
async function deleteCover(url) {
  const m = (url || '').match(/\/covers\/([^?]+)$/);
  if (m)
    await sb.storage
      .from('covers')
      .remove([m[1]])
      .catch(() => {});
}
