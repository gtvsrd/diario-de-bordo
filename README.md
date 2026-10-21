# Diário de Bordo

Blog em HTML, CSS e JavaScript puros, com **Supabase** como back-end (banco, login e imagens).
Funciona no **GitHub Pages** e continua funcionando quando você trocar para um domínio da Hostinger.

## Estrutura

```
blog/
├── index.html           Esqueleto e ordem dos scripts
├── .nojekyll            Faz o GitHub Pages servir os arquivos como estão
├── supabase/schema.sql  Banco, regras de segurança e bucket de imagens
├── assets/              favicon.svg e favicon.png (ícone da aba)
├── css/                 variables, base, layout, components, responsive
└── js/
    ├── vendor/supabase.js   Cliente Supabase 2.45.4 (arquivo local, sem CDN)
    ├── config.js            URL e chave do SEU projeto  <-- você edita
    ├── data/api.js          Artigos, páginas, capas e login
    ├── utils/               helpers.js, markdown.js
    ├── views/               layout-views.js, post-views.js, editor-views.js
    ├── theme.js, auth.js, router.js, main.js
```

## Passo a passo

### 1. Criar o projeto no Supabase (grátis)
1. Crie uma conta em supabase.com e clique em **New project** (guarde a senha do banco).
2. Aguarde o projeto ficar pronto.

### 2. Criar o banco
1. Menu **SQL Editor > New query**.
2. Cole todo o conteúdo de `supabase/schema.sql` e clique em **Run** (rode só uma vez).

### 3. Ligar o blog ao projeto
1. Em **Project Settings > API**, copie a **Project URL** e a chave **anon / publishable**.
2. Cole os dois valores em `js/config.js`.

A chave anon é pública por natureza e pode ir para o GitHub: quem protege os dados são as regras do banco
(só o administrador consegue escrever). **Nunca** use a chave `service_role` no site.

### 4. Criar o administrador
1. **Authentication > Users > Add user > Create new user**: informe seu e-mail e senha e marque *Auto Confirm User*.
2. No **SQL Editor**, rode (troque o e-mail):
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'seu@email.com';
   ```
3. **Authentication > Sign In / Providers** (ou *Settings*): desligue **Allow new users to sign up**,
   para ninguém mais criar contas.

Pronto: no blog, clique em **Entrar** e use esse e-mail e senha.

### 5. Publicar no GitHub Pages
1. Crie um repositório e envie o conteúdo da pasta `blog/` na raiz (incluindo `.nojekyll`).
2. **Settings > Pages > Build and deployment**: *Deploy from a branch*, branch `main`, pasta `/ (root)`.
3. O site fica em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

Os links do blog usam `#/` (hash), então não há problema com subpasta nem com recarregar a página.

### 6. Depois: domínio da Hostinger
1. No GitHub: **Settings > Pages > Custom domain**, informe o domínio e marque *Enforce HTTPS*.
2. Na Hostinger (**Domínios > DNS / Zona DNS**):
   - 4 registros **A** no domínio raiz: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - 1 registro **CNAME** `www` apontando para `SEU-USUARIO.github.io`
3. Nada muda no código nem no Supabase. Só se algum dia usar e-mail de recuperação de senha,
   adicione o domínio em **Authentication > URL Configuration**.

## Observações
- Tudo o que você escreve fica salvo no Supabase, e as imagens de capa, no Storage (limite de 5 MB por imagem; o blog já as reduz antes de enviar).
- Rascunhos só aparecem para o administrador logado.
- Plano grátis do Supabase: projetos sem uso por cerca de uma semana podem ser pausados; é só reativar no painel.
- Artigos criados na versão anterior (salvos no navegador) não são migrados. Recrie-os pelo painel.
