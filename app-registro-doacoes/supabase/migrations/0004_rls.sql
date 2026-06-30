-- ==========================================================================
-- 0004_rls.sql
-- Row Level Security: cada query respeita o perfil do usuário autenticado.
-- ==========================================================================

alter table public.perfis_usuario   enable row level security;
alter table public.ref_classificacao enable row level security;
alter table public.doacoes           enable row level security;
alter table public.doacao_itens      enable row level security;
alter table public.doacao_documentos enable row level security;
alter table public.doacao_log        enable row level security;

-- Perfis: cada um lê o próprio; admin lê todos.
drop policy if exists perfil_self on public.perfis_usuario;
create policy perfil_self on public.perfis_usuario
  for select using (user_id = auth.uid() or public.tem_perfil(array['admin']));

-- Classificação: leitura para qualquer usuário autenticado.
drop policy if exists classif_read on public.ref_classificacao;
create policy classif_read on public.ref_classificacao
  for select to authenticated using (true);

-- Doações: captação/fiscal/admin leem; captação/admin inserem;
--          fiscal/admin atualizam (via RPC security definer).
drop policy if exists doacoes_read on public.doacoes;
create policy doacoes_read on public.doacoes
  for select to authenticated
  using (public.tem_perfil(array['captacao', 'fiscal', 'admin']));

drop policy if exists doacoes_insert on public.doacoes;
create policy doacoes_insert on public.doacoes
  for insert to authenticated
  with check (public.tem_perfil(array['captacao', 'admin']));

drop policy if exists doacoes_update on public.doacoes;
create policy doacoes_update on public.doacoes
  for update to authenticated
  using (public.tem_perfil(array['fiscal', 'admin']));

-- Itens: leitura geral; inserção por captação/admin.
drop policy if exists itens_read on public.doacao_itens;
create policy itens_read on public.doacao_itens
  for select to authenticated
  using (public.tem_perfil(array['captacao', 'fiscal', 'admin']));

drop policy if exists itens_insert on public.doacao_itens;
create policy itens_insert on public.doacao_itens
  for insert to authenticated
  with check (public.tem_perfil(array['captacao', 'admin']));

-- Documentos: leitura geral; inserção por captação/admin.
drop policy if exists docs_read on public.doacao_documentos;
create policy docs_read on public.doacao_documentos
  for select to authenticated
  using (public.tem_perfil(array['captacao', 'fiscal', 'admin']));

drop policy if exists docs_insert on public.doacao_documentos;
create policy docs_insert on public.doacao_documentos
  for insert to authenticated
  with check (public.tem_perfil(array['captacao', 'admin']));

-- Log: somente leitura (escrita acontece via triggers/RPC security definer).
drop policy if exists log_read on public.doacao_log;
create policy log_read on public.doacao_log
  for select to authenticated
  using (public.tem_perfil(array['captacao', 'fiscal', 'admin']));
