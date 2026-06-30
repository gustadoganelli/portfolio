-- =============================================================================
-- 0100 - Dados de exemplo (100% ficticios)
-- Roda depois de 0001_schema.sql. Popula o catalogo e algumas auditorias.
-- =============================================================================

-- ---------- Unidades ----------
insert into unidades (id, nome, localizacao, responsavel, email_gestor) values
  ('11111111-1111-1111-1111-111111111111', 'Unidade Norte',  'Regiao Norte',  'Joao da Silva',   'joao@exemplo.com'),
  ('22222222-2222-2222-2222-222222222222', 'Unidade Sul',    'Regiao Sul',    'Maria Oliveira',  'maria@exemplo.com'),
  ('33333333-3333-3333-3333-333333333333', 'Unidade Leste',  'Regiao Leste',  'Carlos Pereira',  'carlos@exemplo.com'),
  ('44444444-4444-4444-4444-444444444444', 'Unidade Oeste',  'Regiao Oeste',  'Ana Souza',       'ana@exemplo.com');

-- ---------- Usuarios ----------
-- Em producao o id viria de auth.users; aqui sao UUIDs fixos para o demo.
insert into usuarios (id, nome, email, perfil, unidade_id) values
  ('a0000000-0000-0000-0000-000000000001', 'Auditor Exemplo',     'auditor@exemplo.com',      'AUDITOR',        null),
  ('b0000000-0000-0000-0000-000000000001', 'Gestor Norte',        'gestor.norte@exemplo.com', 'GESTOR_UNIDADE', '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000002', 'Gestor Sul',          'gestor.sul@exemplo.com',   'GESTOR_UNIDADE', '22222222-2222-2222-2222-222222222222');

-- ---------- Areas ----------
insert into areas (id, nome, icone, cor) values
  ('c0000000-0000-0000-0000-000000000001', 'Administrativo',         'briefcase',    '#2D8CFF'),
  ('c0000000-0000-0000-0000-000000000002', 'Estoque e Almoxarifado', 'package',      '#FF8A3D'),
  ('c0000000-0000-0000-0000-000000000003', 'Seguranca do Trabalho',  'shield',       '#27AE60'),
  ('c0000000-0000-0000-0000-000000000004', 'Manutencao',             'wrench',       '#9B59B6'),
  ('c0000000-0000-0000-0000-000000000005', 'Limpeza e Higiene',      'sparkles',     '#16A085');

-- ---------- Unidade x Areas (todas as unidades auditam todas as areas neste demo) ----------
insert into unidade_areas (unidade_id, area_id)
select u.id, a.id from unidades u cross join areas a;

-- ---------- Itens de verificacao (checklist) ----------
insert into itens_verificacao (id, codigo, area_id, titulo, subtitulo, tipo, schema_classificacao) values
  ('d0000000-0000-0000-0000-000000000001', 'ITM-001', 'c0000000-0000-0000-0000-000000000001',
     'Organizacao geral do ambiente', 'Avalie limpeza, ordem e identificacao dos espacos.', 'SCORE', null),
  ('d0000000-0000-0000-0000-000000000002', 'ITM-002', 'c0000000-0000-0000-0000-000000000001',
     'Documentos obrigatorios disponiveis', 'Contratos, licencas e registros em dia.', 'BOOLEANO', null),
  ('d0000000-0000-0000-0000-000000000003', 'ITM-003', 'c0000000-0000-0000-0000-000000000001',
     'Apontamentos do auditor', 'Registre qualquer nao conformidade observada.', 'TEXTO_APONTAMENTO', null),

  ('d0000000-0000-0000-0000-000000000004', 'ITM-004', 'c0000000-0000-0000-0000-000000000002',
     'Conferencia de inventario', 'Itens identificados e quantidades batem com o sistema.', 'SCORE', null),
  ('d0000000-0000-0000-0000-000000000005', 'ITM-005', 'c0000000-0000-0000-0000-000000000002',
     'Controle de validade dos produtos',
     'Liste lotes proximos do vencimento ou vencidos.', 'CLASSIFICACAO',
     '{"multiplo": true, "item_label": "Produto",
       "campos": [
         {"chave": "produto",  "label": "Produto",   "tipo": "text",   "obrigatorio": true},
         {"chave": "lote",     "label": "Lote",      "tipo": "text"},
         {"chave": "situacao", "label": "Situacao",  "tipo": "select", "obrigatorio": true,
            "opcoes": ["Atualizado", "Proximo do vencimento", "Vencido", "Nao se aplica"]},
         {"chave": "validade", "label": "Validade",  "tipo": "date"}
       ]}'::jsonb),

  ('d0000000-0000-0000-0000-000000000006', 'ITM-006', 'c0000000-0000-0000-0000-000000000003',
     'Uso de EPIs pela equipe', 'Equipe utilizando equipamentos de protecao adequados.', 'BOOLEANO', null),
  ('d0000000-0000-0000-0000-000000000007', 'ITM-007', 'c0000000-0000-0000-0000-000000000003',
     'Sinalizacao de seguranca', 'Extintores, rotas de fuga e placas visiveis e validas.', 'SCORE', null),

  ('d0000000-0000-0000-0000-000000000008', 'ITM-008', 'c0000000-0000-0000-0000-000000000004',
     'Estado de conservacao dos equipamentos', 'Avalie funcionamento e manutencao preventiva.', 'SCORE', null),
  ('d0000000-0000-0000-0000-000000000009', 'ITM-009', 'c0000000-0000-0000-0000-000000000004',
     'Recomendacoes de melhoria', 'Sugestoes nao obrigatorias para o gestor.', 'TEXTO_RECOMENDACAO', null),

  ('d0000000-0000-0000-0000-000000000010', 'ITM-010', 'c0000000-0000-0000-0000-000000000005',
     'Limpeza dos ambientes comuns', 'Banheiros, copa e areas de circulacao.', 'SCORE', null),
  ('d0000000-0000-0000-0000-000000000011', 'ITM-011', 'c0000000-0000-0000-0000-000000000005',
     'Bloco de notas da area', 'Anotacoes livres do auditor.', 'TEXTO_ANOTACAO', null);

-- ---------- Auditorias confirmadas (historico de exemplo) ----------
insert into auditorias (id, unidade_id, auditor_id, periodo, status, data_confirmacao, score_total) values
  ('e0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
     'a0000000-0000-0000-0000-000000000001', '2026-05', 'CONFIRMADA', '2026-05-12 14:00-03', 4.2),
  ('e0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
     'a0000000-0000-0000-0000-000000000001', '2026-06', 'CONFIRMADA', '2026-06-15 10:30-03', 4.5),
  ('e0000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222',
     'a0000000-0000-0000-0000-000000000001', '2026-06', 'CONFIRMADA', '2026-06-18 09:00-03', 3.4);

-- ---------- Respostas de exemplo ----------
insert into respostas (auditoria_id, area_id, item_id, item_codigo, item_titulo_snapshot, item_tipo_snapshot,
    valor_score, valor_booleano, valor_texto, comentario, criado_por) values
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
     'ITM-001', 'Organizacao geral do ambiente', 'SCORE', 5, null, null, 'Ambiente bem organizado.', 'a0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
     'ITM-002', 'Documentos obrigatorios disponiveis', 'BOOLEANO', null, true, null, null, 'a0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000006',
     'ITM-006', 'Uso de EPIs pela equipe', 'BOOLEANO', null, false, null, 'Dois colaboradores sem capacete.', 'a0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004',
     'ITM-004', 'Conferencia de inventario', 'SCORE', 2, null, null, 'Divergencias relevantes no inventario.', 'a0000000-0000-0000-0000-000000000001');

-- ---------- Nao conformidades de exemplo ----------
insert into nao_conformidades (auditoria_id, unidade_id, area_id, item_id, descricao, categoria,
    gut_gravidade, gut_urgencia, gut_tendencia, status, prazo_conclusao) values
  ('e0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
     'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000006',
     'Colaboradores operando sem o EPI obrigatorio.', 'Ocupacional / Seguranca',
     5, 5, 4, 'ABERTA', '2026-07-15'),
  ('e0000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222',
     'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004',
     'Divergencia entre o estoque fisico e o sistema.', 'Processual / Operacional',
     4, 3, 3, 'EM_TRATAMENTO', '2026-07-30'),
  ('e0000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222',
     'c0000000-0000-0000-0000-000000000005', null,
     'Banheiros da area comum sem material de limpeza.', 'Estrutural / Infraestrutura',
     2, 2, 2, 'RESOLVIDA', '2026-06-25');
