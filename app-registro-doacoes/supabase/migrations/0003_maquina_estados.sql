-- ==========================================================================
-- 0003_maquina_estados.sql
-- Transições válidas e RPCs de transição/lançamento.
-- A validação inviolável fica no banco (não confiar só no front).
-- ==========================================================================

create table if not exists public.transicoes_validas (
  status_de   text not null,
  status_para text not null,
  primary key (status_de, status_para)
);

insert into public.transicoes_validas (status_de, status_para) values
  ('pendente_lancamento', 'lancado')
on conflict do nothing;

create or replace function public.transicao_valida(p_de text, p_para text)
returns boolean
language sql stable
as $$
  select exists (
    select 1 from public.transicoes_validas where status_de = p_de and status_para = p_para
  );
$$;

-- --------------------------------------------------------------------------
-- Transição genérica de status (com auditoria)
-- --------------------------------------------------------------------------
create or replace function public.transicionar_status(
  p_doacao_id uuid,
  p_novo_status text,
  p_usuario text default null,
  p_detalhe jsonb default '{}'::jsonb
)
returns public.doacoes
language plpgsql security definer set search_path = public
as $$
declare
  v_atual text;
  v_row public.doacoes;
begin
  if not public.tem_perfil(array['fiscal', 'admin']) then
    raise exception 'Sem permissão para operar a fila.';
  end if;

  select status into v_atual from public.doacoes where id = p_doacao_id for update;
  if v_atual is null then
    raise exception 'Doação não encontrada.';
  end if;
  if not public.transicao_valida(v_atual, p_novo_status) then
    raise exception 'Transição inválida: % -> %', v_atual, p_novo_status;
  end if;

  update public.doacoes
     set status = p_novo_status, atualizado_em = now()
   where id = p_doacao_id
   returning * into v_row;

  insert into public.doacao_log (doacao_id, usuario, acao, status_anterior, status_novo, detalhe)
  values (p_doacao_id, auth.uid(), 'transicao_status', v_atual, p_novo_status,
          coalesce(p_detalhe, '{}'::jsonb) ||
          jsonb_build_object('usuario_email', (select email from public.perfis_usuario where user_id = auth.uid())));

  return v_row;
end;
$$;

-- --------------------------------------------------------------------------
-- Lançar doação (grava nº do lançamento e transiciona atomicamente)
-- --------------------------------------------------------------------------
create or replace function public.lancar_doacao(
  p_doacao_id uuid,
  p_nr_lancamento_erp text,
  p_usuario text default null
)
returns public.doacoes
language plpgsql security definer set search_path = public
as $$
declare
  v_atual text;
  v_row public.doacoes;
  v_email text;
begin
  if not public.tem_perfil(array['fiscal', 'admin']) then
    raise exception 'Sem permissão para lançar.';
  end if;

  select status into v_atual from public.doacoes where id = p_doacao_id for update;
  if v_atual is null then
    raise exception 'Doação não encontrada.';
  end if;
  if not public.transicao_valida(v_atual, 'lancado') then
    raise exception 'Transição inválida: % -> lancado', v_atual;
  end if;

  select email into v_email from public.perfis_usuario where user_id = auth.uid();

  update public.doacoes
     set status = 'lancado',
         nr_lancamento_erp = p_nr_lancamento_erp,
         data_lancamento_erp = now(),
         usuario_lancamento_erp = coalesce(p_usuario, v_email),
         atualizado_em = now()
   where id = p_doacao_id
   returning * into v_row;

  insert into public.doacao_log (doacao_id, usuario, acao, status_anterior, status_novo, detalhe)
  values (p_doacao_id, auth.uid(), 'transicao_status', v_atual, 'lancado',
          jsonb_build_object('usuario_email', v_email, 'nr_lancamento_erp', p_nr_lancamento_erp));

  return v_row;
end;
$$;
