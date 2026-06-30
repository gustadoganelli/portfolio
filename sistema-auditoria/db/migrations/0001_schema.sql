-- =============================================================================
-- 0001 - Schema do Sistema de Auditoria Interna (DEMO)
-- PostgreSQL. Catalogo de referencia + auditorias + respostas + nao conformidades.
--
-- AVISO: Schema de demonstracao. Todos os dados sao ficticios.
-- =============================================================================

-- Funcao utilitaria: atualiza a coluna updated_at em UPDATE.
create or replace function tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- unidades - locais auditados (filiais, plantas, lojas...).
-- -----------------------------------------------------------------------------
create table unidades (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  localizacao  text,                          -- ex. "Regiao Norte"
  ativa        boolean not null default true,
  responsavel  text,
  email_gestor text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- usuarios - quem usa o sistema. Dois perfis:
--   AUDITOR        ve todas as unidades;
--   GESTOR_UNIDADE ve apenas a propria unidade (precisa de unidade_id).
-- -----------------------------------------------------------------------------
create table usuarios (
  id         uuid primary key default gen_random_uuid(),
  nome       text,
  email      text not null unique,
  perfil     text not null check (perfil in ('AUDITOR','GESTOR_UNIDADE')),
  unidade_id uuid references unidades (id),
  ativo      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint usuarios_gestor_tem_unidade
    check (perfil <> 'GESTOR_UNIDADE' or unidade_id is not null)
);

-- -----------------------------------------------------------------------------
-- areas - catalogo GLOBAL de areas a auditar (nao pertence a uma unidade).
-- -----------------------------------------------------------------------------
create table areas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null unique,
  icone      text,                            -- nome do icone na UI (ex. "briefcase")
  cor        text check (cor ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- unidade_areas - N:N. Quais areas cada unidade audita.
-- -----------------------------------------------------------------------------
create table unidade_areas (
  unidade_id uuid not null references unidades (id) on delete cascade,
  area_id    uuid not null references areas (id)    on delete cascade,
  primary key (unidade_id, area_id)
);

-- -----------------------------------------------------------------------------
-- itens_verificacao - banco de perguntas do checklist.
--   SCORE              nota 1..5
--   BOOLEANO           Sim / Nao
--   CLASSIFICACAO      formulario dinamico (schema em JSON)
--   TEXTO_RECOMENDACAO texto livre
--   TEXTO_APONTAMENTO  texto livre (pode virar nao conformidade)
--   TEXTO_ANOTACAO     texto livre (bloco de notas da area)
-- -----------------------------------------------------------------------------
create table itens_verificacao (
  id                   uuid primary key default gen_random_uuid(),
  codigo               text not null,
  area_id              uuid references areas (id),
  titulo               text not null,
  subtitulo            text,
  tipo                 text not null check (tipo in (
                         'SCORE','BOOLEANO','CLASSIFICACAO',
                         'TEXTO_RECOMENDACAO','TEXTO_APONTAMENTO','TEXTO_ANOTACAO')),
  ativa                boolean not null default true,
  versao               int not null default 1,
  schema_classificacao jsonb,                 -- so para tipo CLASSIFICACAO
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create unique index uq_itens_codigo on itens_verificacao (codigo);

-- -----------------------------------------------------------------------------
-- auditorias - escopo = unidade + auditor + periodo. Modelo de duas fases:
-- o app preenche em RASCUNHO (offline) e confirma de uma vez (CONFIRMADA).
-- -----------------------------------------------------------------------------
create table auditorias (
  id               uuid primary key default gen_random_uuid(),
  unidade_id       uuid not null references unidades (id),
  auditor_id       uuid not null references usuarios (id),
  periodo          text not null,                       -- ex. "2026-06"
  data_inicio      date not null default current_date,
  data_confirmacao timestamptz,
  status           text not null default 'RASCUNHO'
                     check (status in ('RASCUNHO','CONFIRMADA','REABERTA')),
  score_total      numeric,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- So UMA auditoria nao-confirmada por unidade + periodo.
create unique index uq_auditoria_aberta
  on auditorias (unidade_id, periodo)
  where status in ('RASCUNHO','REABERTA');

-- -----------------------------------------------------------------------------
-- respostas - uma linha por resposta. Valor tipado por tipo de pergunta +
-- snapshot do titulo/tipo do item (sobrevive a mudancas posteriores).
-- -----------------------------------------------------------------------------
create table respostas (
  id                   uuid primary key default gen_random_uuid(),
  auditoria_id         uuid not null references auditorias (id) on delete cascade,
  area_id              uuid references areas (id),
  item_id              uuid references itens_verificacao (id),
  item_codigo          text,
  item_titulo_snapshot text,
  item_tipo_snapshot   text,
  valor_score          smallint check (valor_score between 1 and 5),
  valor_booleano       boolean,
  valor_classificacao  jsonb,
  valor_texto          text,
  comentario           text,
  criado_por           uuid references usuarios (id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- nao_conformidades - achados de auditoria. Risco pela matriz GUT
-- (Gravidade x Urgencia x Tendencia), cada fator 1..5, score 1..125.
-- -----------------------------------------------------------------------------
create table nao_conformidades (
  id                uuid primary key default gen_random_uuid(),
  auditoria_id      uuid not null references auditorias (id),
  unidade_id        uuid not null references unidades (id),
  area_id           uuid references areas (id),
  item_id           uuid references itens_verificacao (id),
  descricao         text not null,
  categoria         text,                       -- natureza da NC (dimensao separada do risco)
  gut_gravidade     smallint check (gut_gravidade between 1 and 5),
  gut_urgencia      smallint check (gut_urgencia  between 1 and 5),
  gut_tendencia     smallint check (gut_tendencia between 1 and 5),
  gut_score         smallint generated always as
                      ((gut_gravidade::int * gut_urgencia::int * gut_tendencia::int)::smallint) stored,
  status            text not null default 'ABERTA'
                      check (status in ('ABERTA','EM_TRATAMENTO','RESOLVIDA','REJEITADA')),
  responsavel_area  text,
  prazo_conclusao   date,
  data_conclusao    date,
  retorno_gestor    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- No maximo uma NC por (auditoria, item) quando ha item de origem.
create unique index uq_nc_auditoria_item
  on nao_conformidades (auditoria_id, item_id)
  where item_id is not null;

-- -----------------------------------------------------------------------------
-- anexos - evidencias (fotos/arquivos) ligadas a uma resposta.
-- -----------------------------------------------------------------------------
create table anexos (
  id            uuid primary key default gen_random_uuid(),
  resposta_id   uuid not null references respostas (id) on delete cascade,
  tipo          text not null check (tipo in ('imagem','arquivo')),
  storage_path  text not null,
  nome_original text,
  mime_type     text,
  criado_por    uuid references usuarios (id),
  created_at    timestamptz not null default now()
);

-- Indices de apoio aos relatorios do painel.
create index ix_respostas_auditoria on respostas (auditoria_id);
create index ix_nc_unidade_status   on nao_conformidades (unidade_id, status);
create index ix_auditorias_unidade  on auditorias (unidade_id, periodo);

-- Triggers de updated_at.
create trigger set_updated_at before update on unidades          for each row execute function tg_set_updated_at();
create trigger set_updated_at before update on usuarios          for each row execute function tg_set_updated_at();
create trigger set_updated_at before update on areas             for each row execute function tg_set_updated_at();
create trigger set_updated_at before update on itens_verificacao for each row execute function tg_set_updated_at();
create trigger set_updated_at before update on auditorias        for each row execute function tg_set_updated_at();
create trigger set_updated_at before update on respostas         for each row execute function tg_set_updated_at();
create trigger set_updated_at before update on nao_conformidades for each row execute function tg_set_updated_at();
