-- Portal de Estudos com IA — schema (PostgreSQL / Supabase)
-- Dados de exemplo são 100% fictícios.

create table if not exists public.provas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  emoji text default '📚',
  materias text,
  data_prova date,
  formato text,                 -- ex.: 'Múltipla escolha', 'Caso clínico', 'Revisão'
  tema text default 'rosa',     -- 'rosa' | 'azul'
  ordem int default 0,
  criado_em timestamptz default now()
);

create table if not exists public.topicos (
  id uuid primary key default gen_random_uuid(),
  prova_id uuid not null references public.provas(id) on delete cascade,
  bloco text default 'Geral',   -- vira uma aba no app
  ordem int default 0,
  num text default '•',
  titulo text not null,
  frase text,                   -- frase-chave
  analogia text,
  conceitos jsonb default '[]'::jsonb,   -- ["bullet","bullet"]
  passos jsonb default '[]'::jsonb,      -- ["passo 1","passo 2"]
  dados jsonb default '[]'::jsonb,       -- [["TAG","valor"],...]
  dados_label text,
  flash jsonb default '[]'::jsonb,       -- [["pergunta","resposta"],...]
  audio_url text,
  video_url text,
  criado_em timestamptz default now()
);
create index if not exists idx_topicos_prova on public.topicos(prova_id);

-- Segurança (RLS): leitura pública (o site), escrita só via service_role (o backend)
alter table public.provas enable row level security;
alter table public.topicos enable row level security;
create policy "leitura publica provas"  on public.provas  for select using (true);
create policy "leitura publica topicos" on public.topicos for select using (true);

-- ===== Dados fictícios de exemplo =====
with p as (
  insert into public.provas (titulo, emoji, materias, formato, tema)
  values ('Sistema Solar (exemplo)', '🪐', 'Astronomia básica', 'Revisão', 'rosa')
  returning id
)
insert into public.topicos (prova_id, bloco, ordem, num, titulo, frase, analogia, conceitos, dados, dados_label, flash)
select p.id, '🪐 Sistema Solar', 0, '1', 'Os planetas',
  'O Sistema Solar tem 8 planetas que orbitam o Sol, divididos em rochosos e gasosos.',
  'É como 8 carros girando em volta de um farol central: o Sol.',
  '["Rochosos: Mercúrio, Vênus, Terra e Marte.","Gasosos: Júpiter, Saturno, Urano e Netuno.","O Sol concentra ~99% da massa do sistema."]'::jsonb,
  '[["PLANETAS","8 no total"],["MAIOR","Júpiter"],["MAIS PRÓXIMO","Mercúrio"]]'::jsonb,
  '📌 Números de exemplo',
  '[["Quantos planetas há no Sistema Solar?","8."],["Qual é o maior planeta?","Júpiter."],["Planeta mais próximo do Sol?","Mercúrio."]]'::jsonb
from p;
