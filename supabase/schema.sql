-- Diário de Bordo: banco e regras de segurança. Rode UMA vez no Supabase (SQL Editor > New query > Run).

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  cat text not null,
  excerpt text not null default '',
  body text not null default '',
  img text not null default '',
  pub boolean not null default true,
  date timestamptz not null default now()
);
create table public.pages (slug text primary key, title text not null, body text not null default '');
create table public.admins (user_id uuid primary key references auth.users (id) on delete cascade);

-- Pergunta usada pelas regras: o usuário logado é administrador?
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

alter table public.posts enable row level security;
alter table public.pages enable row level security;
alter table public.admins enable row level security; -- sem políticas: ninguém lê pela API

create policy "posts: leitura" on public.posts for select using (pub or public.is_admin());
create policy "posts: admin escreve" on public.posts for all using (public.is_admin()) with check (public.is_admin());
create policy "pages: leitura" on public.pages for select using (true);
create policy "pages: admin escreve" on public.pages for all using (public.is_admin()) with check (public.is_admin());

-- Imagens de capa (bucket público; só admin envia/altera/apaga; máx. 5 MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif']);
create policy "capas: leitura" on storage.objects for select using (bucket_id = 'covers');
create policy "capas: admin envia" on storage.objects for insert with check (bucket_id = 'covers' and public.is_admin());
create policy "capas: admin altera" on storage.objects for update using (bucket_id = 'covers' and public.is_admin());
create policy "capas: admin apaga" on storage.objects for delete using (bucket_id = 'covers' and public.is_admin());

-- Conteúdo inicial
insert into public.pages (slug, title, body) values
('sobre', 'Sobre', $$## Sobre o blog

O **Diário de Bordo** é um blog pessoal sobre escrita, viagens e curiosidades.$$),
('contato', 'Contato', $$## Fale comigo

Sugestões, críticas e parcerias são bem-vindas.

E-mail: contato@exemplo.com$$);
insert into public.posts (title, cat, excerpt, body) values
('Bem-vindo ao Diário de Bordo', 'Novidades', 'Um espaço para registrar ideias, projetos e aprendizados.', $$## Olá!

Este é o primeiro artigo. Entre como administrador para criar, editar e excluir artigos.$$);

-- DEPOIS de criar seu usuário em Authentication > Users, torne-o administrador (troque o e-mail):
-- insert into public.admins (user_id) select id from auth.users where email = 'seu@email.com';
