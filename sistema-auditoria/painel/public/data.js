/* =============================================================================
   Dados de exemplo do painel - 100% FICTICIOS.
   Num backend real, estes objetos viriam de uma API/consulta ao banco.
   ============================================================================= */
window.DEMO = {
  unidades: [
    { id: 'u-norte', nome: 'Unidade Norte', localizacao: 'Regiao Norte' },
    { id: 'u-sul',   nome: 'Unidade Sul',   localizacao: 'Regiao Sul' },
    { id: 'u-leste', nome: 'Unidade Leste', localizacao: 'Regiao Leste' },
    { id: 'u-oeste', nome: 'Unidade Oeste', localizacao: 'Regiao Oeste' },
  ],
  areas: [
    { id: 'a-adm',       nome: 'Administrativo' },
    { id: 'a-estoque',   nome: 'Estoque e Almoxarifado' },
    { id: 'a-seguranca', nome: 'Seguranca do Trabalho' },
    { id: 'a-manut',     nome: 'Manutencao' },
    { id: 'a-limpeza',   nome: 'Limpeza e Higiene' },
  ],

  // Auditorias confirmadas (uma por unidade + periodo).
  auditorias: [
    { id: 'aud-1', unidade_id: 'u-norte', periodo: '2026-05', auditor: 'Auditor Exemplo', nota: 4.2, respostas: 9, ncs: 1, confirmada_em: '2026-05-12' },
    { id: 'aud-2', unidade_id: 'u-norte', periodo: '2026-06', auditor: 'Auditor Exemplo', nota: 4.5, respostas: 9, ncs: 1, confirmada_em: '2026-06-15' },
    { id: 'aud-3', unidade_id: 'u-sul',   periodo: '2026-06', auditor: 'Auditor Exemplo', nota: 3.4, respostas: 7, ncs: 2, confirmada_em: '2026-06-18' },
    { id: 'aud-4', unidade_id: 'u-leste', periodo: '2026-06', auditor: 'Auditor Exemplo', nota: 4.0, respostas: 6, ncs: 0, confirmada_em: '2026-06-20' },
    { id: 'aud-5', unidade_id: 'u-oeste', periodo: '2026-06', auditor: 'Auditor Exemplo', nota: 3.8, respostas: 6, ncs: 1, confirmada_em: '2026-06-22' },
  ],

  // Nota media por (unidade, area) - alimenta o grafico por area.
  notas_area: [
    { unidade_id: 'u-norte', area_id: 'a-adm',       nota: 4.8 },
    { unidade_id: 'u-norte', area_id: 'a-estoque',   nota: 4.2 },
    { unidade_id: 'u-norte', area_id: 'a-seguranca', nota: 3.5 },
    { unidade_id: 'u-norte', area_id: 'a-manut',     nota: 4.6 },
    { unidade_id: 'u-norte', area_id: 'a-limpeza',   nota: 4.7 },
    { unidade_id: 'u-sul',   area_id: 'a-adm',       nota: 3.9 },
    { unidade_id: 'u-sul',   area_id: 'a-estoque',   nota: 2.4 },
    { unidade_id: 'u-sul',   area_id: 'a-seguranca', nota: 3.6 },
    { unidade_id: 'u-sul',   area_id: 'a-limpeza',   nota: 3.7 },
    { unidade_id: 'u-leste', area_id: 'a-adm',       nota: 4.1 },
    { unidade_id: 'u-leste', area_id: 'a-seguranca', nota: 3.8 },
    { unidade_id: 'u-leste', area_id: 'a-manut',     nota: 4.0 },
    { unidade_id: 'u-oeste', area_id: 'a-adm',       nota: 4.3 },
    { unidade_id: 'u-oeste', area_id: 'a-estoque',   nota: 3.3 },
    { unidade_id: 'u-oeste', area_id: 'a-limpeza',   nota: 3.9 },
  ],

  // Nao conformidades. gut = G*U*T (1..125); risco derivado das faixas.
  ncs: [
    { id: 'nc-1', unidade_id: 'u-norte', area_id: 'a-seguranca', descricao: 'Colaboradores operando sem o EPI obrigatorio.', categoria: 'Ocupacional / Seguranca',    gut: 100, status: 'ABERTA',        prazo: '2026-07-15' },
    { id: 'nc-2', unidade_id: 'u-sul',   area_id: 'a-estoque',   descricao: 'Divergencia entre o estoque fisico e o sistema.', categoria: 'Processual / Operacional',  gut: 36,  status: 'EM_TRATAMENTO', prazo: '2026-07-30' },
    { id: 'nc-3', unidade_id: 'u-sul',   area_id: 'a-limpeza',   descricao: 'Banheiros da area comum sem material de limpeza.', categoria: 'Estrutural / Infraestrutura', gut: 8,   status: 'RESOLVIDA',     prazo: '2026-06-25' },
    { id: 'nc-4', unidade_id: 'u-oeste', area_id: 'a-estoque',   descricao: 'Produtos sem identificacao de lote no armazenamento.', categoria: 'Documental / Conformidade', gut: 24, status: 'ABERTA',     prazo: '2026-08-05' },
    { id: 'nc-5', unidade_id: 'u-norte', area_id: 'a-manut',     descricao: 'Equipamento sem registro de manutencao preventiva.', categoria: 'Processual / Operacional',  gut: 45,  status: 'EM_TRATAMENTO', prazo: '2026-07-20' },
  ],
};
