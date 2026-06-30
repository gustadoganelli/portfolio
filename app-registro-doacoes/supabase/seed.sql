-- ==========================================================================
-- seed.sql — Dados FICTÍCIOS de demonstração.
-- Rode após aplicar as migrations. Nada aqui representa dados reais.
-- ==========================================================================

-- Taxonomia de aplicação (categorias fictícias)
insert into public.ref_classificacao (codigo, rotulo, ativo, ordem) values
  ('essencial',   'Item essencial',        true, 1),
  ('complementar','Item complementar',     true, 2),
  ('revenda',     'Destinação para venda', true, 3),
  ('social',      'Ação social',           true, 4)
on conflict (codigo) do nothing;

-- --------------------------------------------------------------------------
-- Exemplo de doação fictícia (descomente e ajuste os UUIDs após criar
-- usuários de teste no Supabase Auth e seus perfis em perfis_usuario).
-- --------------------------------------------------------------------------
-- insert into public.doacoes
--   (id, classificacao, recorrencia, doador_nome, doador_documento,
--    captador_responsavel, documento_fiscal_numero, data_doacao, empresa,
--    estoque, observacoes, codigo_fornecedor, natureza_contabil, status)
-- values
--   ('00000000-0000-0000-0000-000000000001', 'essencial', 'sob_demanda',
--    'Fornecedor Exemplo LTDA', '00.000.000/0001-00',
--    'Ana Souza', 'Sem NF', current_date, '1',
--    true, 'Doação de demonstração com dados fictícios.', 'FORN-0001',
--    '001 - Doações de mercadorias físicas', 'pendente_lancamento');

-- insert into public.doacao_itens (doacao_id, ordem, descricao, quantidade, valor_unitario) values
--   ('00000000-0000-0000-0000-000000000001', 1, 'Material de papelaria', 100, 2.50),
--   ('00000000-0000-0000-0000-000000000001', 2, 'Caixas de transporte',   20, 8.00);

-- --------------------------------------------------------------------------
-- Perfis de teste (preencha o user_id real após criar os usuários no Auth):
-- --------------------------------------------------------------------------
-- insert into public.perfis_usuario (user_id, nome, email, perfil) values
--   ('<uuid-captacao>', 'Ana Souza',     'captacao@exemplo.com', 'captacao'),
--   ('<uuid-fiscal>',   'Diego Rocha',   'fiscal@exemplo.com',   'fiscal'),
--   ('<uuid-admin>',    'Eduarda Alves', 'admin@exemplo.com',    'admin');
