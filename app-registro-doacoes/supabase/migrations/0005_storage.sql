-- ==========================================================================
-- 0005_storage.sql
-- Bucket privado para os documentos comprobatórios + policies de acesso.
-- ==========================================================================

insert into storage.buckets (id, name, public)
values ('doacoes-documentos', 'doacoes-documentos', false)
on conflict (id) do nothing;

-- Upload: captação/admin podem enviar.
drop policy if exists doc_upload on storage.objects;
create policy doc_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'doacoes-documentos'
    and public.tem_perfil(array['captacao', 'admin'])
  );

-- Leitura: qualquer perfil interno autorizado (links assinados pelo app).
drop policy if exists doc_read on storage.objects;
create policy doc_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'doacoes-documentos'
    and public.tem_perfil(array['captacao', 'fiscal', 'admin'])
  );

-- Remoção: usada no rollback do app (captação/admin).
drop policy if exists doc_delete on storage.objects;
create policy doc_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'doacoes-documentos'
    and public.tem_perfil(array['captacao', 'admin'])
  );
