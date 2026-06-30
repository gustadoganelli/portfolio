-- =============================================================================
-- 0002 - RPC de fechamento (commit da auditoria)
-- O app preenche em rascunho (offline) e chama esta funcao UMA vez ao confirmar:
-- cria a auditoria CONFIRMADA, grava 1 linha por resposta e gera as NCs, tudo
-- em uma transacao.
--
-- AVISO: codigo de demonstracao. Numa app real, troque p_auditor_id por
-- auth.uid() (Supabase) e proteja a funcao por RLS / SECURITY DEFINER.
-- =============================================================================
create or replace function confirmar_auditoria(p jsonb, p_auditor_id uuid)
returns uuid
language plpgsql
as $$
declare
  v_aud uuid;
  r jsonb;
begin
  if (p->>'unidade_id') is null or (p->>'periodo') is null then
    raise exception 'unidade_id e periodo sao obrigatorios.';
  end if;

  insert into auditorias (unidade_id, auditor_id, periodo, status, data_confirmacao)
  values ((p->>'unidade_id')::uuid, p_auditor_id, p->>'periodo', 'CONFIRMADA', now())
  returning id into v_aud;

  -- respostas (tipadas; uma linha por resposta)
  for r in select * from jsonb_array_elements(coalesce(p->'respostas', '[]'::jsonb)) loop
    insert into respostas (auditoria_id, area_id, item_id, item_codigo,
        item_titulo_snapshot, item_tipo_snapshot,
        valor_score, valor_booleano, valor_classificacao, valor_texto,
        comentario, criado_por)
    values (
      v_aud,
      nullif(r->>'area_id','')::uuid,
      nullif(r->>'item_id','')::uuid,
      nullif(r->>'item_codigo',''),
      nullif(r->>'item_titulo',''),
      r->>'tipo',
      nullif(r->>'valor_score','')::smallint,
      case when jsonb_typeof(r->'valor_booleano')='boolean' then (r->>'valor_booleano')::boolean else null end,
      case when jsonb_typeof(r->'valor_classificacao') in ('object','array') then r->'valor_classificacao' else null end,
      nullif(r->>'valor_texto',''),
      nullif(r->>'comentario',''),
      p_auditor_id);
  end loop;

  -- nao conformidades (GUT; nascem ABERTA)
  for r in select * from jsonb_array_elements(coalesce(p->'ncs', '[]'::jsonb)) loop
    if coalesce(nullif(r->>'descricao',''), '') = '' and (r->>'g') is null then continue; end if;
    insert into nao_conformidades (auditoria_id, unidade_id, area_id, item_id, descricao,
        categoria, gut_gravidade, gut_urgencia, gut_tendencia, status, prazo_conclusao)
    values (
      v_aud, (p->>'unidade_id')::uuid,
      nullif(r->>'area_id','')::uuid,
      nullif(r->>'item_id','')::uuid,
      coalesce(nullif(r->>'descricao',''), '(sem descricao)'),
      nullif(r->>'categoria',''),
      nullif(r->>'g','')::smallint,
      nullif(r->>'u','')::smallint,
      nullif(r->>'t','')::smallint,
      'ABERTA',
      nullif(r->>'prazo','')::date);
  end loop;

  return v_aud;
end;
$$;
