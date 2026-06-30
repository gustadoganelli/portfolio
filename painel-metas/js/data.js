// ===================================================================
// data.js — Dados de demonstração (100% fictícios)
// Nada aqui representa pessoas, empresas ou números reais.
// ===================================================================

// Logo genérico embutido como SVG (data URI) — sem dependência externa.
const LOGO_B64 = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
  '<circle cx="32" cy="32" r="32" fill="#111"/>' +
  '<path d="M18 40 L28 26 L36 36 L46 22" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<circle cx="46" cy="22" r="3.5" fill="#fff"/>' +
  '</svg>'
);

// ── Usuários (fictícios) ──────────────────────────────────────────
// Senha de demonstração para todos: "demo"
const USUARIOS = [
  { email:'admin@exemplo.dev',     senha:'demo', nome:'Administrador Demo', perfil:'Admin',       responsavel:'*',           diretoria:'*',            ativo:true },
  { email:'diretoria@exemplo.dev', senha:'demo', nome:'Diretoria Exemplo',  perfil:'DiretorN1',   responsavel:'Diretoria',   diretoria:'Diretoria',    ativo:true },
  { email:'joao@exemplo.dev',      senha:'demo', nome:'João Silva',         perfil:'Responsavel', responsavel:'João Silva',  diretoria:'Diretoria A',  ativo:true },
  { email:'maria@exemplo.dev',     senha:'demo', nome:'Maria Souza',        perfil:'Responsavel', responsavel:'Maria Souza', diretoria:'Diretoria A',  ativo:true },
  { email:'carlos@exemplo.dev',    senha:'demo', nome:'Carlos Lima',        perfil:'Responsavel', responsavel:'Carlos Lima', diretoria:'Diretoria B',  ativo:true },
];

// ── Indicadores (KPIs) ────────────────────────────────────────────
// 'area' usa código UPPERCASE; areaLabel() converte para exibição.
// 'responsaveis' é array: permite múltiplos responsáveis por indicador.
const KPIS = [
  // ADMINISTRATIVO
  { id:'kpi-101', codigo:'1.01', nome:'KPI Administração', area:'ADMINISTRATIVO', responsaveis:['João Silva'],  diretoria:'Diretoria A', descricao:'Gestão dos custos administrativos', ativo:true },
  { id:'kpi-102', codigo:'1.02', nome:'KPI Pessoas',       area:'ADMINISTRATIVO', responsaveis:['Maria Souza'], diretoria:'Diretoria A', descricao:'Gestão de pessoas, recrutamento e retenção', ativo:true },
  { id:'kpi-103', codigo:'1.03', nome:'KPI Compras',       area:'ADMINISTRATIVO', responsaveis:['Maria Souza'], diretoria:'Diretoria A', descricao:'Eficiência do ciclo de compras e fornecedores', ativo:true },
  // OPERACOES
  { id:'kpi-201', codigo:'2.01', nome:'KPI Produção',      area:'OPERACOES',      responsaveis:['João Silva','Carlos Lima'], diretoria:'Diretoria B', descricao:'Produção e controle de custos operacionais', ativo:true },
  { id:'kpi-202', codigo:'2.02', nome:'KPI Logística',     area:'OPERACOES',      responsaveis:['Carlos Lima'], diretoria:'Diretoria B', descricao:'Gestão da cadeia logística e distribuição', ativo:true },
  // COMERCIAL
  { id:'kpi-301', codigo:'3.01', nome:'KPI Vendas',        area:'COMERCIAL',      responsaveis:['Carlos Lima'], diretoria:'Diretoria B', descricao:'Vendas e relacionamento comercial', ativo:true },
  { id:'kpi-302', codigo:'3.02', nome:'KPI Atendimento',   area:'COMERCIAL',      responsaveis:[],              diretoria:'Diretoria B', descricao:'A definir', ativo:true },
];

// ── Metas ─────────────────────────────────────────────────────────
const METAS = [
  // KPI 1.01 — Administração
  { id:'m-101-1', id_kpi:'kpi-101', codigo_kpi:'1.01', seq:1, nome:'Controle de despesas administrativas', descricao:'Manter despesas administrativas dentro do orçamento aprovado', responsavel:'João Silva', diretoria:'Diretoria A', tipo_formato:'monetario', unidade_medida:'R$', bom_quando:'menor', formula_atingimento:'real_sobre_meta', tipo_acumulado:'soma',  peso:0.6, status:'Ativa', obs:'', ult_at:'26/05/2026', ativo:true },
  { id:'m-101-2', id_kpi:'kpi-101', codigo_kpi:'1.01', seq:2, nome:'Índice de satisfação interna',        descricao:'Pesquisa de satisfação com serviços administrativos (NPS interno)', responsavel:'João Silva', diretoria:'Diretoria A', tipo_formato:'decimal', unidade_medida:'pontos', bom_quando:'maior', formula_atingimento:'real_sobre_meta', tipo_acumulado:'media', peso:0.4, status:'Ativa', obs:'', ult_at:'15/03/2026', ativo:true },

  // KPI 1.02 — Pessoas
  { id:'m-102-1', id_kpi:'kpi-102', codigo_kpi:'1.02', seq:1, nome:'Taxa de turnover',       descricao:'Percentual de saídas voluntárias em relação ao quadro total', responsavel:'Maria Souza', diretoria:'Diretoria A', tipo_formato:'percentual', unidade_medida:'%', bom_quando:'menor', formula_atingimento:'real_sobre_meta', tipo_acumulado:'media', peso:0.4, status:'Ativa', obs:'', ult_at:'30/04/2026', ativo:true },
  { id:'m-102-2', id_kpi:'kpi-102', codigo_kpi:'1.02', seq:2, nome:'Posições preenchidas',   descricao:'Percentual de vagas preenchidas em relação ao quadro aprovado', responsavel:'Maria Souza', diretoria:'Diretoria A', tipo_formato:'percentual', unidade_medida:'%', bom_quando:'maior', formula_atingimento:'real_sobre_meta', tipo_acumulado:'media', peso:0.6, status:'Ativa', obs:'Algumas vagas com maior dificuldade de preenchimento', ult_at:'30/04/2026', ativo:true },

  // KPI 2.01 — Produção
  { id:'m-201-1', id_kpi:'kpi-201', codigo_kpi:'2.01', seq:1, nome:'Despesas de produção',   descricao:'Controle total de despesas operacionais da unidade produtiva', responsavel:'João Silva', diretoria:'Diretoria B', tipo_formato:'monetario', unidade_medida:'R$', bom_quando:'menor', formula_atingimento:'real_sobre_meta', tipo_acumulado:'soma',  peso:0.5, status:'Ativa', obs:'Impacto da alta de insumos no 1º trimestre', ult_at:'30/04/2026', ativo:true },
  { id:'m-201-2', id_kpi:'kpi-201', codigo_kpi:'2.01', seq:2, nome:'Custo unitário',         descricao:'Custo unitário médio do produto acabado', responsavel:'João Silva', diretoria:'Diretoria B', tipo_formato:'decimal', unidade_medida:'R$/un', bom_quando:'menor', formula_atingimento:'real_sobre_meta', tipo_acumulado:'media', peso:0.3, status:'Ativa', obs:'', ult_at:'30/04/2026', ativo:true },
  { id:'m-201-3', id_kpi:'kpi-201', codigo_kpi:'2.01', seq:3, nome:'Volume produzido',       descricao:'Volume total produzido no período (meta de produção)', responsavel:'João Silva', diretoria:'Diretoria B', tipo_formato:'inteiro', unidade_medida:'un', bom_quando:'maior', formula_atingimento:'real_sobre_meta', tipo_acumulado:'soma',  peso:0.2, status:'Ativa', obs:'', ult_at:'30/04/2026', ativo:true },

  // KPI 3.01 — Vendas
  { id:'m-301-1', id_kpi:'kpi-301', codigo_kpi:'3.01', seq:1, nome:'Receita de vendas',      descricao:'Receita bruta acumulada no período', responsavel:'Carlos Lima', diretoria:'Diretoria B', tipo_formato:'monetario', unidade_medida:'R$', bom_quando:'maior', formula_atingimento:'real_sobre_meta', tipo_acumulado:'soma', peso:0.7, status:'Ativa', obs:'', ult_at:'30/04/2026', ativo:true },
  { id:'m-301-2', id_kpi:'kpi-301', codigo_kpi:'3.01', seq:2, nome:'Ticket médio',           descricao:'Valor médio por venda no período', responsavel:'Carlos Lima', diretoria:'Diretoria B', tipo_formato:'monetario', unidade_medida:'R$', bom_quando:'maior', formula_atingimento:'real_sobre_meta', tipo_acumulado:'media', peso:0.3, status:'Ativa', obs:'', ult_at:'30/04/2026', ativo:true },
];

// ── Metas mensais ─────────────────────────────────────────────────
// ano, mes (1-12), valor_meta, valor_realizado (null = não apurado)
const METAS_MENSAIS = [
  // 1.01 Meta 1 (Despesas Adm. — Menor — Moeda)
  ...gerarMensal('m-101-1', 195000, [182000,188000,201000,178000,null,null,null,null,null,null,null,null]),
  // 1.01 Meta 2 (Satisfação Interna — Maior — Decimal)
  ...gerarMensal('m-101-2', 8.0, [null,null,8.1,null,null,null,null,null,null,null,null,null], 7.5),
  // 1.02 Meta 1 (Turnover — Menor — Percentual)
  ...gerarMensal('m-102-1', 0.02, [0.018,0.015,0.023,0.019,null,null,null,null,null,null,null,null]),
  // 1.02 Meta 2 (Posições preenchidas — Maior — Percentual)
  ...gerarMensal('m-102-2', 0.95, [0.88,0.91,0.89,0.92,null,null,null,null,null,null,null,null]),
  // 2.01 Meta 1 (Despesas Produção — Menor — Moeda) com metas mensais variáveis
  ...gerarMensalVar('m-201-1',
    [2700000,2100000,2500000,2200000,2400000,2300000,2400000,2300000,2500000,2600000,2700000,2800000],
    [2876890,2339421,2687405,2349045,null,null,null,null,null,null,null,null]),
  // 2.01 Meta 2 (Custo unitário — Menor — Decimal)
  ...gerarMensalVar('m-201-2',
    [42.6,42.6,42.6,45.0,45.0,45.0,45.0,45.0,45.0,45.0,45.0,45.0],
    [41.1,41.7,42.3,44.9,null,null,null,null,null,null,null,null]),
  // 2.01 Meta 3 (Volume produzido — Maior — Inteiro)
  ...gerarMensalVar('m-201-3',
    [25200,25200,25200,25200,26248,26248,26248,26248,26248,26248,26248,26248],
    [21509,16414,15233,28879,null,null,null,null,null,null,null,null]),
  // 3.01 Meta 1 (Receita — Maior — Moeda)
  ...gerarMensalVar('m-301-1',
    [800000,820000,840000,860000,880000,900000,920000,940000,960000,980000,1000000,1050000],
    [812000,805000,861000,902000,null,null,null,null,null,null,null,null]),
  // 3.01 Meta 2 (Ticket médio — Maior — Moeda)
  ...gerarMensal('m-301-2', 320, [305,312,318,331,null,null,null,null,null,null,null,null]),
];

// Helper: meta mensal constante (mesma meta todo mês)
function gerarMensal(idMeta, valorMeta, realizados, metaInicial) {
  return realizados.map((rv, i) => ({
    id: `mm-${idMeta}-${i+1}`, id_meta: idMeta, ano: 2026, mes: i+1,
    valor_meta: valorMeta, valor_realizado: rv,
  }));
}

// Helper: meta mensal variável (vetor de 12 metas)
function gerarMensalVar(idMeta, metas, realizados) {
  return realizados.map((rv, i) => ({
    id: `mm-${idMeta}-${i+1}`, id_meta: idMeta, ano: 2026, mes: i+1,
    valor_meta: metas[i], valor_realizado: rv,
  }));
}

// ── Projetos ──────────────────────────────────────────────────────
const PROJETOS = [
  { id:'p-1', id_meta:'m-201-1', id_kpi:'kpi-201', nome:'Redução de custos operacionais — Fase 1', descricao:'Mapeamento e eliminação de desperdícios na linha de produção; revisão de contratos de insumos.', responsavel:'João Silva',  status:'Em andamento', prazo:'2026-06-30', percentual_evolucao:45,  prioridade:'Alta',  proxima_acao:'Reunião de alinhamento com a equipe de produção', responsavel_acao:'Maria Souza', obs:'Negociação com fornecedor em andamento',          ativo:true },
  { id:'p-2', id_meta:'m-201-3', id_kpi:'kpi-201', nome:'Expansão da capacidade produtiva',         descricao:'Implantação de novo módulo para aumentar a capacidade de processamento.',                       responsavel:'João Silva',  status:'Não iniciado', prazo:'2026-09-30', percentual_evolucao:0,   prioridade:'Média', proxima_acao:'Elaborar projeto executivo e solicitar orçamentos', responsavel_acao:'João Silva', obs:'Aguardando aprovação orçamentária',               ativo:true },
  { id:'p-3', id_meta:'m-201-2', id_kpi:'kpi-201', nome:'Otimização do processo',                   descricao:'Revisão do fluxo de produção para reduzir perdas e custo unitário.',                            responsavel:'Carlos Lima', status:'Em andamento', prazo:'2026-07-31', percentual_evolucao:70,  prioridade:'Alta',  proxima_acao:'Validar novo layout com a engenharia',             responsavel_acao:'Carlos Lima', obs:'Fase de testes concluída com resultado positivo', ativo:true },
  { id:'p-4', id_meta:'m-101-1', id_kpi:'kpi-101', nome:'Revisão de contratos de fornecedores',     descricao:'Renegociação dos principais contratos de serviços administrativos.',                            responsavel:'João Silva',  status:'Concluído',    prazo:'2026-03-31', percentual_evolucao:100, prioridade:'Alta',  proxima_acao:'Monitorar execução dos novos contratos',           responsavel_acao:'Maria Souza', obs:'Economia estimada de R$ 48 mil/ano',              ativo:true },
  { id:'p-5', id_meta:'m-102-2', id_kpi:'kpi-102', nome:'Banco de talentos',                        descricao:'Criação de banco de talentos para agilizar o preenchimento de vagas.',                          responsavel:'Maria Souza', status:'Em andamento', prazo:'2026-08-31', percentual_evolucao:30,  prioridade:'Média', proxima_acao:'Publicar vagas nos canais parceiros',              responsavel_acao:'Maria Souza', obs:'Parceria em negociação',                          ativo:true },
  { id:'p-6', id_meta:'m-301-1', id_kpi:'kpi-301', nome:'Campanha de aquisição',                    descricao:'Campanha para ampliar a base de clientes e a receita do trimestre.',                            responsavel:'Carlos Lima', status:'Em atraso',    prazo:'2026-05-31', percentual_evolucao:55,  prioridade:'Alta',  proxima_acao:'Revisar mix de canais de aquisição',               responsavel_acao:'Carlos Lima', obs:'Custo de aquisição acima do previsto',            ativo:true },
];

// ── Log de auditoria (mock inicial) ───────────────────────────────
const LOGS = [
  { id:'log-1', data_hora:'2026-04-30 14:22', usuario:'joao@exemplo.dev',  acao:'UPDATE', tabela:'metas_mensais', id_registro:'mm-m-201-3-4', campo:'valor_realizado', antes:'null', depois:'28879',   obs:'' },
  { id:'log-2', data_hora:'2026-04-30 14:20', usuario:'joao@exemplo.dev',  acao:'UPDATE', tabela:'metas_mensais', id_registro:'mm-m-201-1-4', campo:'valor_realizado', antes:'null', depois:'2349045', obs:'' },
  { id:'log-3', data_hora:'2026-03-28 09:15', usuario:'joao@exemplo.dev',  acao:'UPDATE', tabela:'projetos',      id_registro:'p-4',          campo:'status',          antes:'Em andamento', depois:'Concluído', obs:'' },
];

// ── Estado mutável (em memória durante a sessão) ──────────────────
// Esta demo é 100% local. Todas as edições ficam apenas na memória
// do navegador e se perdem ao recarregar a página.
let DB = {
  usuario:      null,
  kpis:         JSON.parse(JSON.stringify(KPIS)),
  metas:        JSON.parse(JSON.stringify(METAS)),
  metasMensais: JSON.parse(JSON.stringify(METAS_MENSAIS)),
  projetos:     JSON.parse(JSON.stringify(PROJETOS)),
  logs:         JSON.parse(JSON.stringify(LOGS)),
};
