/**
 * Telas do administrador: editor de artigo/página e troca de senha
 */

/** Formulário de criação/edição de artigo ou página. */
function editor(kind, id) {
  const isPage = kind === 'page';
  const it = isPage
    ? db.pages[id]
    : id
      ? db.posts.find((p) => p.id === id)
      : { title: '', cat: '', excerpt: '', body: '', pub: true };
  if (!it) {
    location.hash = '#/';
    return;
  }
  $('#main').innerHTML = `<div class="art"><h1>${isPage ? 'Editar página' : id ? 'Editar artigo' : 'Novo artigo'}</h1>
  <form id="f">
   <label for="t">Título</label><input type="text" id="t" required value="${esc(it.title)}">
   ${
     isPage
       ? ''
       : `<label for="c">Categoria</label><input type="text" id="c" required value="${esc(it.cat)}" list="cl"><datalist id="cl">${[...new Set(db.posts.map((p) => p.cat))].map((c) => `<option value="${esc(c)}">`).join('')}</datalist>
   <label for="e">Resumo (aparece no card)</label><input type="text" id="e" maxlength="160" value="${esc(it.excerpt)}">
   <label for="imgfile">Imagem de capa (opcional)</label>
   <div class="img-field">
     <div class="img-row"><input type="file" id="imgfile" accept="image/*"><button type="button" class="btn sm del" id="imgrm" hidden>Remover imagem</button></div>
     <label for="imgurl" class="sub">ou cole o endereço (URL) da imagem</label>
     <input type="text" id="imgurl" placeholder="https://exemplo.com/foto.jpg" value="${esc(/^https?:/.test(it.img || '') ? it.img : '')}">
     <img class="img-prev" id="imgprev" alt="Prévia da imagem de capa" hidden>
     <div class="hint">Aparece no topo do card e do artigo. Imagens enviadas são reduzidas automaticamente.</div>
   </div>`
   }
   <label for="b">Conteúdo</label>
   <div class="tb"><button type="button" class="btn sm alt" data-w="**|**">Negrito</button><button type="button" class="btn sm alt" data-w="*|*">Itálico</button><button type="button" class="btn sm alt" data-w="\n\n## |\n\n">Título</button><button type="button" class="btn sm alt" data-w="\n- |">Lista</button><button type="button" class="btn sm alt" data-w="[|](https://)">Link</button></div>
   <textarea id="b" required>${esc(it.body)}</textarea>
   ${isPage ? '' : `<label><input type="checkbox" id="pub" ${it.pub ? 'checked' : ''}> Publicado (desmarque para salvar como rascunho)</label>`}
   <div class="acts" style="margin-top:18px"><button class="btn" type="submit">${isPage ? 'Salvar página' : 'Salvar artigo'}</button><a class="btn alt" href="#/">Cancelar</a></div>
  </form></div>`;
  const ta = $('#b');
  let img = it.img || ''; // capa atual (endereço da imagem)
  let pending = null; // novo arquivo escolhido, ainda não enviado
  if (!isPage) {
    const prev = $('#imgprev'),
      url = $('#imgurl'),
      file = $('#imgfile'),
      rm = $('#imgrm');
    const showPreview = () => {
      prev.hidden = rm.hidden = !(img || pending);
      if (pending) prev.src = URL.createObjectURL(pending);
      else if (img) prev.src = img;
    };
    prev.onerror = () => toast('Não foi possível carregar essa imagem');
    url.oninput = () => {
      const v = url.value.trim();
      img = /^https?:\/\//i.test(v) ? v : '';
      if (img) {
        file.value = '';
        pending = null;
      }
      showPreview();
    };
    file.onchange = () => {
      const f = file.files[0];
      if (!f) return;
      if (!f.type.startsWith('image/')) return toast('Escolha um arquivo de imagem');
      resizeImage(f)
        .then((blob) => {
          pending = blob;
          img = '';
          url.value = '';
          showPreview();
        })
        .catch(() => toast('Não foi possível ler essa imagem'));
    };
    rm.onclick = () => {
      img = '';
      pending = null;
      url.value = file.value = '';
      showPreview();
    };
    showPreview();
  }
  document.querySelectorAll('[data-w]').forEach(
    (b) =>
      (b.onclick = () => {
        const [a, z] = b.dataset.w.replace(/\\n/g, '\n').split('|'),
          s = ta.selectionStart,
          e = ta.selectionEnd;
        ta.setRangeText(a + (ta.value.slice(s, e) || 'texto') + z, s, e, 'end');
        ta.focus();
      }),
  );
  $('#f').onsubmit = async (ev) => {
    ev.preventDefault();
    const btn = $('#f button[type=submit]');
    btn.disabled = true;
    let uploaded = '';
    try {
      if (isPage) {
        await savePage(id, $('#t').value.trim(), ta.value);
        toast('Página salva');
        location.hash = '#/pagina/' + id;
        return;
      }
      const d = {
        title: $('#t').value.trim(),
        cat: $('#c').value.trim(),
        excerpt:
          $('#e').value.trim() ||
          ta.value
            .replace(/[#*\[\]\-]/g, '')
            .slice(0, 130)
            .trim() + '…',
        body: ta.value,
        pub: $('#pub').checked,
        img,
      };
      if (pending) d.img = uploaded = await uploadCover(pending);
      await savePost(id ? { id, ...d } : d);
      if (it.img && it.img !== d.img) deleteCover(it.img); // capa antiga trocada/removida
      toast(d.pub ? 'Artigo publicado' : 'Rascunho salvo');
      location.hash = '#/';
    } catch (err) {
      if (uploaded) deleteCover(uploaded);
      toast('Não foi possível salvar: ' + (err.message || 'erro desconhecido'));
    } finally {
      btn.disabled = false;
    }
  };
}
/** Formulário de troca de senha do admin. */
function account() {
  $('#main').innerHTML =
    `<div class="art"><h1>Alterar senha</h1><form id="f"><label for="np">Nova senha (mínimo 6 caracteres)</label><input type="password" id="np" minlength="6" required autocomplete="new-password"><div class="acts" style="margin-top:18px"><button class="btn" type="submit">Salvar senha</button><a class="btn alt" href="#/">Cancelar</a></div></form></div>`;
  $('#f').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await changePassword($('#np').value);
      toast('Senha alterada');
      location.hash = '#/';
    } catch (err) {
      toast('Não foi possível alterar a senha: ' + err.message);
    }
  };
}
