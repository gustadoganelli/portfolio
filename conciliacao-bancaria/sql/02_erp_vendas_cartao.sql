-- ============================================================
-- Consulta ERP: vendas em CARTAO no dia, com NSU e No de autorizacao
-- Usada no workflow 02 (Conciliacao de Vendas Maquininha x ERP)
-- Tabelas/colunas FICTICIAS, apenas para demonstracao.
-- ============================================================

SELECT
    v.id_venda,
    v.cod_loja           AS Loja,
    v.data_emissao       AS Data_Emissao,
    v.numero_documento   AS Numero_Documento,
    v.tipo_documento     AS Tipo_Documento,
    fp.descricao         AS Forma_Pagamento,
    p.valor              AS Valor_Pagamento,
    u.nome               AS Usuario,
    c.numero_autorizacao AS Numero_Autorizacao,
    c.nsu                AS NSU
FROM venda v
LEFT JOIN pagamento         p  ON p.id_venda      = v.id_venda
LEFT JOIN forma_pagamento   fp ON fp.id           = p.id_forma_pagamento
LEFT JOIN usuario           u  ON u.id            = v.id_usuario
LEFT JOIN cartao_autorizacao c ON c.id_pagamento  = p.id_pagamento
WHERE v.data_emissao >= @data_inicio
  AND v.data_emissao <  DATEADD(day, 1, CAST(@data_inicio AS DATE))
  AND v.tipo_operacao = 'VENDA'
  AND fp.categoria    = 'CARTAO'
  AND c.numero_autorizacao IS NOT NULL
ORDER BY v.data_emissao DESC, v.numero_documento DESC;
