-- ============================================================
-- SETUP DO BANCO (OPCIONAL) — Pesquisa de Clima Organizacional
-- ============================================================
-- Este script é apenas um EXEMPLO genérico de como armazenar as
-- respostas em um banco PostgreSQL (compatível com a maioria dos
-- backends self-service). No modo demonstração ele NÃO é usado:
-- as respostas ficam apenas no navegador (localStorage) e os
-- gráficos usam dados fictícios gerados em mock-data.js.
--
-- Substitua {{ }} pelos seus próprios valores caso vá usar de verdade.
-- ============================================================

-- 1. TABELA DE RESPOSTAS
create table if not exists respostas_clima (
  id          bigserial primary key,
  created_at  timestamptz default now() not null,
  unidade     text,   -- ex.: Unidade Norte, Matriz
  setor       text,   -- ex.: Administrativo, Operações
  q1          text,   -- escala: nunca | raramente | as_vezes | frequentemente | sempre
  q2          text,
  q3          text,
  q4          text,
  q5          text,
  q6          text,
  q7          text,
  q8          text,
  q9          text,
  q10         text
);

-- 2. ÍNDICE PARA PERFORMANCE NA LISTAGEM
create index if not exists idx_respostas_clima_created_at
  on respostas_clima (created_at desc);

-- 3. SEGURANÇA DE LINHA (Row Level Security) — exemplo
-- Habilite RLS para proteger os dados.
alter table respostas_clima enable row level security;

-- Permite INSERT anônimo (o formulário envia sem login)
create policy "Insercao publica"
  on respostas_clima
  for insert
  to anon
  with check (true);

-- Permite leitura apenas para usuários autenticados (painel logado)
create policy "Leitura autenticada"
  on respostas_clima
  for select
  to authenticated
  using (true);

-- ============================================================
-- Depois de criar a tabela, configure no front-end:
--   API_URL = '{{API_URL}}'   (ex.: https://demo.exemplo.dev/api)
--   API_KEY = '{{API_KEY}}'   (chave pública / publishable)
-- e troque DEMO_MODE para false em index.html.
-- ============================================================
