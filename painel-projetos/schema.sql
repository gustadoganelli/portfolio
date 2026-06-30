-- =====================================================================
--  PAINEL DE PROJETOS — schema.sql (DEMO)
--  DDL genérico · PostgreSQL / Supabase
-- ---------------------------------------------------------------------
--  Conteúdo:
--    1. Extensões
--    2. Tabelas (setores, autores, ferramentas, projetos,
--                projeto_ferramentas)
--    3. Índices
--    4. Gatilho updated_at
--    5. Seeds de exemplo (dados FICTÍCIOS)
--
--  Observação: este schema é uma versão genérica para portfólio.
--  Todos os dados de exemplo são fictícios.
-- =====================================================================


-- =====================================================================
-- 1. EXTENSÕES
-- =====================================================================
create extension if not exists pgcrypto;  -- gen_random_uuid()


-- =====================================================================
-- 2. TABELAS
-- =====================================================================

-- ----- 2.1 setores ---------------------------------------------------
create table if not exists public.setores (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique,            -- ex.: Financeiro, Operações, Comercial
  created_at  timestamptz not null default now()
);
comment on table public.setores is 'Setores/áreas beneficiadas pelos projetos.';

-- ----- 2.2 autores (quem desenvolve) --------------------------------
create table if not exists public.autores (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique,
  created_at  timestamptz not null default now()
);
comment on table public.autores is 'Pessoas que desenvolvem os projetos.';

-- ----- 2.3 ferramentas (catálogo de tecnologias) --------------------
create table if not exists public.ferramentas (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique,            -- ex.: Automações, BI / Relatórios, Banco de Dados
  created_at  timestamptz not null default now()
);
comment on table public.ferramentas is 'Catálogo de tecnologias usadas nos projetos.';

-- ----- 2.4 projetos (núcleo do catálogo) ----------------------------
create table if not exists public.projetos (
  id                    uuid primary key default gen_random_uuid(),
  titulo                text not null,
  descricao             text,
  setor_id              uuid references public.setores (id) on delete set null,
  autor_id              uuid references public.autores (id) on delete set null,
  categoria             text not null
                          check (categoria in ('automacoes', 'bi', 'apps', 'integracoes', 'web')),
  status                text not null default 'solicitado'
                          check (status in (
                            'solicitado', 'em_avaliacao', 'aprovado',
                            'em_desenvolvimento', 'em_producao', 'pausado', 'cancelado'
                          )),
  prioridade            text not null default 'media'
                          check (prioridade in ('baixa', 'media', 'alta')),
  link_publicado        text,
  prazo_estimado_dias   integer check (prazo_estimado_dias is null or prazo_estimado_dias >= 0),
  data_inicio           timestamptz,
  data_conclusao        timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
comment on table public.projetos is 'Catálogo central de projetos/ferramentas.';

-- ----- 2.5 projeto_ferramentas (N:N projeto <-> ferramenta) ---------
create table if not exists public.projeto_ferramentas (
  projeto_id     uuid not null references public.projetos (id)    on delete cascade,
  ferramenta_id  uuid not null references public.ferramentas (id) on delete cascade,
  primary key (projeto_id, ferramenta_id)
);
comment on table public.projeto_ferramentas is 'Relação N:N — um projeto usa várias tecnologias.';


-- =====================================================================
-- 3. ÍNDICES (apoio aos filtros e ao dashboard)
-- =====================================================================
create index if not exists idx_projetos_setor     on public.projetos (setor_id);
create index if not exists idx_projetos_autor      on public.projetos (autor_id);
create index if not exists idx_projetos_categoria  on public.projetos (categoria);
create index if not exists idx_projetos_status     on public.projetos (status);
create index if not exists idx_pf_ferramenta       on public.projeto_ferramentas (ferramenta_id);


-- =====================================================================
-- 4. GATILHO updated_at
-- =====================================================================
create or replace function public.fn_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_projetos_updated_at on public.projetos;
create trigger trg_projetos_updated_at
  before update on public.projetos
  for each row execute function public.fn_touch_updated_at();


-- =====================================================================
-- 5. SEEDS DE EXEMPLO (DADOS FICTÍCIOS)
-- =====================================================================

insert into public.setores (nome) values
  ('Financeiro'), ('Operações'), ('Comercial'),
  ('Recursos Humanos'), ('Tecnologia'),
  ('Unidade Norte'), ('Unidade Sul')
on conflict (nome) do nothing;

insert into public.autores (nome) values
  ('Joana Demo'), ('Carlos Exemplo'), ('Marina Teste')
on conflict (nome) do nothing;

insert into public.ferramentas (nome) values
  ('Automações'), ('BI / Relatórios'), ('Aplicativos'),
  ('Integrações de API'), ('Banco de Dados'), ('Web (HTML/JS)')
on conflict (nome) do nothing;

-- Alguns projetos de exemplo (fictícios)
insert into public.projetos (titulo, descricao, categoria, status, prioridade, prazo_estimado_dias,
                             setor_id, autor_id)
values
  ('Conciliação automática de extratos',
   'Cruza extratos bancários com o ERP e sinaliza divergências diariamente.',
   'automacoes', 'em_producao', 'alta', 20,
   (select id from public.setores where nome = 'Financeiro'),
   (select id from public.autores where nome = 'Joana Demo')),
  ('Painel de indicadores comerciais',
   'Dashboard de metas, funil e desempenho por vendedor.',
   'bi', 'em_producao', 'media', 15,
   (select id from public.setores where nome = 'Comercial'),
   (select id from public.autores where nome = 'Carlos Exemplo')),
  ('App de registro de ocorrências',
   'Aplicativo para equipes de campo registrarem ocorrências com foto.',
   'apps', 'em_desenvolvimento', 'alta', 30,
   (select id from public.setores where nome = 'Operações'),
   (select id from public.autores where nome = 'Marina Teste'))
on conflict do nothing;


-- =====================================================================
-- FIM DO schema.sql (DEMO)
-- =====================================================================
