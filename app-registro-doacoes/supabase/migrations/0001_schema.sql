-- ==========================================================================
-- 0001_schema.sql
-- Esquema base do Sistema de Registro de Doações (DEMO) — dados fictícios
--
-- Modelo:
--   doacoes (cabeçalho) 1—N doacao_itens (linhas)
--   + doacao_documentos (comprovante/NF/termo) + doacao_log (auditoria)
--
-- Fila simples: pendente_lancamento -> lancado.
-- ==========================================================================

create extension if not exists pgcrypto;        -- gen_random_uuid()

-- --------------------------------------------------------------------------
-- Perfis de acesso (1:1 com auth.users)
--   captacao  -> registra a doação
--   fiscal    -> efetua o lançamento contábil
--   admin     -> acesso total
-- --------------------------------------------------------------------------
create table if not exists public.perfis_usuario (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  nome       text,
  email      text,
  perfil     text not null check (perfil in ('captacao', 'fiscal', 'admin')),
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now()
);

comment on table public.perfis_usuario is
  'Perfil de acesso. captacao=Captação, fiscal=Fiscal, admin=Administrador.';

-- --------------------------------------------------------------------------
-- Classificação / Aplicação (taxonomia editável pelo negócio)
-- --------------------------------------------------------------------------
create table if not exists public.ref_classificacao (
  codigo  text primary key,
  rotulo  text not null,
  ativo   boolean not null default true,
  ordem   int not null default 0
);

comment on table public.ref_classificacao is
  'Aplicação/destino da doação (categoria exibida no formulário).';

-- --------------------------------------------------------------------------
-- Doações — cabeçalho
-- --------------------------------------------------------------------------
create table if not exists public.doacoes (
  id                       uuid primary key default gen_random_uuid(),

  classificacao            text not null references public.ref_classificacao (codigo) on update cascade,
  recorrencia              text not null default 'sob_demanda'
                             check (recorrencia in ('sob_demanda', 'recorrente')),

  -- doador / fornecedor
  doador_nome              text not null,
  doador_documento         text,
  captador_responsavel     text,
  documento_fiscal_numero  text,
  data_doacao              date not null default current_date,
  empresa                  text not null,                 -- unidade
  estoque                  boolean not null default false,
  observacoes              text,

  -- totais (mantidos pelo trigger a partir dos itens)
  valor                    numeric(15, 2) not null default 0,
  quantidade_itens         numeric(15, 3) not null default 0,

  -- máquina de estados (fila simples)
  status                   text not null default 'pendente_lancamento'
                             check (status in ('pendente_lancamento', 'lancado')),

  -- campos do lançamento contábil
  codigo_fornecedor        text,
  natureza_contabil        text,
  nr_lancamento_erp        text,
  data_lancamento_erp      timestamptz,
  usuario_lancamento_erp   text,

  -- idempotência da notificação (integração externa opcional)
  notificado               boolean not null default false,
  notificado_em            timestamptz,

  -- auditoria de linha
  criado_por               uuid default auth.uid() references auth.users (id),
  criado_em                timestamptz not null default now(),
  atualizado_em            timestamptz not null default now()
);

create index if not exists idx_doacoes_status      on public.doacoes (status);
create index if not exists idx_doacoes_criado_em   on public.doacoes (criado_em desc);
create index if not exists idx_doacoes_doador      on public.doacoes (doador_nome);
create index if not exists idx_doacoes_classif     on public.doacoes (classificacao);
create index if not exists idx_doacoes_notificado  on public.doacoes (notificado) where notificado = false;

-- --------------------------------------------------------------------------
-- Itens da doação — linhas
-- --------------------------------------------------------------------------
create table if not exists public.doacao_itens (
  id              uuid primary key default gen_random_uuid(),
  doacao_id       uuid not null references public.doacoes (id) on delete cascade,
  ordem           int not null default 1,
  descricao       text not null,
  quantidade      numeric(15, 3) not null default 0 check (quantidade >= 0),
  valor_unitario  numeric(15, 4) not null default 0 check (valor_unitario >= 0),
  valor_total     numeric(15, 2) generated always as (round(quantidade * valor_unitario, 2)) stored,
  criado_em       timestamptz not null default now()
);

create index if not exists idx_itens_doacao on public.doacao_itens (doacao_id, ordem);

-- --------------------------------------------------------------------------
-- Documentos comprobatórios
-- --------------------------------------------------------------------------
create table if not exists public.doacao_documentos (
  id              uuid primary key default gen_random_uuid(),
  doacao_id       uuid not null references public.doacoes (id) on delete cascade,
  tipo_documento  text not null
                    check (tipo_documento in ('comprovante', 'nota_fiscal', 'termo', 'outro')),
  storage_path    text not null,
  nome_original   text,
  tamanho_bytes   bigint,
  mime_type       text,
  criado_em       timestamptz not null default now()
);

create index if not exists idx_doc_doacao on public.doacao_documentos (doacao_id);

comment on table public.doacao_documentos is
  'Anexos (evidência da doação). Armazenados no bucket doacoes-documentos.';

-- --------------------------------------------------------------------------
-- Log de auditoria (imutável)
-- --------------------------------------------------------------------------
create table if not exists public.doacao_log (
  id               bigint generated always as identity primary key,
  doacao_id        uuid not null references public.doacoes (id) on delete cascade,
  usuario          uuid,
  acao             text not null,                 -- 'criacao' | 'transicao_status'
  status_anterior  text,
  status_novo      text,
  detalhe          jsonb not null default '{}'::jsonb,
  criado_em        timestamptz not null default now()
);

create index if not exists idx_log_doacao on public.doacao_log (doacao_id, criado_em);
