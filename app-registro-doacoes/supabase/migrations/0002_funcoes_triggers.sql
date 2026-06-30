-- ==========================================================================
-- 0002_funcoes_triggers.sql
-- Funções utilitárias, recálculo de totais, máquina de estados, auditoria.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- Helpers de perfil
-- --------------------------------------------------------------------------
create or replace function public.meu_perfil()
returns text
language sql stable security definer set search_path = public
as $$
  select perfil from public.perfis_usuario where user_id = auth.uid() and ativo;
$$;

create or replace function public.tem_perfil(p_perfis text[])
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.meu_perfil() = any (p_perfis);
$$;

-- --------------------------------------------------------------------------
-- Recálculo de totais do cabeçalho a partir dos itens
-- --------------------------------------------------------------------------
create or replace function public.fn_atualizar_totais()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_doacao_id uuid := coalesce(new.doacao_id, old.doacao_id);
begin
  update public.doacoes d
     set valor = coalesce((select sum(valor_total) from public.doacao_itens where doacao_id = v_doacao_id), 0),
         quantidade_itens = coalesce((select sum(quantidade) from public.doacao_itens where doacao_id = v_doacao_id), 0),
         atualizado_em = now()
   where d.id = v_doacao_id;
  return null;
end;
$$;

drop trigger if exists trg_itens_totais on public.doacao_itens;
create trigger trg_itens_totais
after insert or update or delete on public.doacao_itens
for each row execute function public.fn_atualizar_totais();

-- --------------------------------------------------------------------------
-- Log de criação
-- --------------------------------------------------------------------------
create or replace function public.fn_log_criacao()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.doacao_log (doacao_id, usuario, acao, status_novo, detalhe)
  values (new.id, auth.uid(), 'criacao', new.status,
          jsonb_build_object('usuario_email', (select email from public.perfis_usuario where user_id = auth.uid())));
  return new;
end;
$$;

drop trigger if exists trg_doacao_criacao on public.doacoes;
create trigger trg_doacao_criacao
after insert on public.doacoes
for each row execute function public.fn_log_criacao();

-- --------------------------------------------------------------------------
-- Cancelamento de doação incompleta (usado no rollback do app)
-- --------------------------------------------------------------------------
create or replace function public.cancelar_doacao_incompleta(p_doacao_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  delete from public.doacoes where id = p_doacao_id and status = 'pendente_lancamento';
end;
$$;
