-- ============================================================
-- Consulta ERP: titulos a pagar BAIXADOS no periodo
-- Usada no workflow 01 (Conciliacao de Pagamentos Banco x ERP)
-- Tabelas/colunas FICTICIAS, apenas para demonstracao.
-- ============================================================

SELECT
    doc.numero_documento,
    doc.valor,
    doc.data_vencimento,
    doc.data_baixa,
    doc.historico,
    ap.fornecedor,
    ap.status,
    mov.conta,
    mov.saldo_apos
FROM movimento_caixa mov
INNER JOIN contas_pagar ap  ON mov.id_titulo    = ap.id
INNER JOIN documento     doc ON ap.id_documento = doc.id
WHERE mov.conta = @conta_alvo          -- ex.: '0000-0'
  AND doc.data_baixa >= @data_inicio   -- ex.: '2026-06-29'
  AND doc.data_baixa <  @data_fim      -- ex.: '2026-06-30'
  AND ap.status IN ('PAGO', 'BAIXADO')
ORDER BY doc.numero_documento;
