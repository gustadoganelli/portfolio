// ===================================================================
// engine.js — Cálculos, formatação e permissões
// ===================================================================

// ── Sessão ────────────────────────────────────────────────────────
let SESSION = null;

function login(email, senha) {
  const u = USUARIOS.find(x => x.email.toLowerCase() === email.toLowerCase() && x.senha === senha && x.ativo);
  if (!u) return null;
  SESSION = { ...u, loginAt: new Date().toISOString() };
  return SESSION;
}

function logout() { SESSION = null; }

// ── Rótulos de área para exibição ─────────────────────────────────
const AREA_LABELS = {
  'ADMINISTRATIVO': 'Administrativo',
  'OPERACOES':      'Operações',
  'COMERCIAL':      'Comercial',
};

function areaLabel(area) {
  return AREA_LABELS[area] || area;
}

// Exibe os responsáveis do indicador; "A definir" quando não há nenhum.
function kpiResps(kpi) {
  const arr = kpi.responsaveis || [];
  return arr.length ? arr.join(', ') : 'A definir';
}

// ── Permissões ────────────────────────────────────────────────────
function isAdmin()     { return SESSION && SESSION.perfil === 'Admin'; }
function isDiretorN1() { return SESSION && SESSION.perfil === 'DiretorN1'; }
function canSeeAll()   { return isAdmin() || isDiretorN1(); }

function canSeeKPI(kpi) {
  if (!SESSION) return false;
  if (canSeeAll()) return true;
  return (kpi.responsaveis || []).includes(SESSION.responsavel);
}

function canEditMeta(meta) {
  if (!SESSION) return false;
  if (isAdmin()) return true;
  if (meta.responsavel === SESSION.responsavel) return true;
  const kpi = DB.kpis.find(k => k.id === meta.id_kpi);
  return !!(kpi && (kpi.responsaveis || []).includes(SESSION.responsavel));
}

function allowedKPIs() {
  return DB.kpis.filter(k => k.ativo && canSeeKPI(k));
}

// ── Formatação de números ─────────────────────────────────────────
const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function fmt(valor, tipo) {
  if (valor === null || valor === undefined || valor === '') return '—';
  const n = parseFloat(valor);
  if (isNaN(n)) return String(valor);
  switch (tipo) {
    case 'monetario':
      return 'R$ ' + Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 });
    case 'percentual':
      return (n * 100).toLocaleString('pt-BR', { minimumFractionDigits:1, maximumFractionDigits:1 }) + '%';
    case 'decimal':
      return n.toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 });
    case 'inteiro':
      return Math.round(n).toLocaleString('pt-BR');
    default:
      return n.toLocaleString('pt-BR');
  }
}

function fmtPct(v) {
  if (v === null || v === undefined) return '—';
  return (v * 100).toLocaleString('pt-BR', { minimumFractionDigits:1, maximumFractionDigits:1 }) + '%';
}

function fmtPrazo(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// Converte string de input do usuário para número (aceita formato pt-BR).
function parseInput(val) {
  if (val === '' || val === null || val === undefined) return null;
  const clean = String(val).replace(/\./g, '').replace(',', '.');
  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}

// ── Cálculos principais ───────────────────────────────────────────

// Retorna os registros mensais de uma meta e o último mês com realizado.
function getMesesComRealizado(idMeta, ano) {
  const registros = DB.metasMensais.filter(m => m.id_meta === idMeta && m.ano === ano);
  registros.sort((a, b) => a.mes - b.mes);
  let ultimoMes = 0;
  for (const r of registros) {
    if (r.valor_realizado !== null && r.valor_realizado !== undefined && r.valor_realizado !== '') {
      ultimoMes = r.mes;
    }
  }
  return { registros, ultimoMes };
}

/**
 * Calcula acumulados e atingimento de uma meta.
 *
 * tipo_acumulado: 'soma' (total) | 'media' (valor médio dos meses)
 * formula_atingimento: define SÓ o valor exibido.
 *   A cor e a pontuação sempre seguem bom_quando (scoringAt: >=1 = bom).
 *
 * Retorna { metaAc, realAc, atingimento, scoringAt, pontuacao, ultimoMes, registros }
 */
function calcMeta(meta, ano) {
  const { registros, ultimoMes } = getMesesComRealizado(meta.id, ano);

  if (ultimoMes === 0) {
    return { metaAc: null, realAc: null, atingimento: null, scoringAt: null, pontuacao: 0, ultimoMes: 0, registros };
  }

  const formula   = meta.formula_atingimento || 'real_sobre_meta';
  const acumulado = meta.tipo_acumulado      || 'soma';

  let metaSum = 0, realSum = 0, nMeta = 0, nReal = 0;
  for (const r of registros) {
    if (r.mes <= ultimoMes) {
      const vm = (r.valor_meta      != null && r.valor_meta      !== '') ? parseFloat(r.valor_meta)      : null;
      const vr = (r.valor_realizado != null && r.valor_realizado !== '') ? parseFloat(r.valor_realizado) : null;
      if (vm !== null) { metaSum += vm; nMeta++; }
      if (vr !== null) { realSum += vr; nReal++; }
    }
  }

  const metaAc = acumulado === 'media' ? (nMeta > 0 ? metaSum / nMeta : 0) : metaSum;
  const realAc = acumulado === 'media' ? (nReal > 0 ? realSum / nReal : 0) : realSum;

  let atingimento = null; // para exibição (fórmula configurável)
  let scoringAt   = null; // para cor/pontuação (bom_quando)

  if (metaAc !== 0 && realAc !== 0) {
    atingimento = formula === 'real_sobre_meta' ? realAc / metaAc : metaAc / realAc;
    scoringAt   = meta.bom_quando === 'maior'   ? realAc / metaAc : metaAc / realAc;
  } else if (metaAc === 0 && realAc === 0) {
    atingimento = 1;
    scoringAt   = 1;
  }

  // Pontuação ponderada: >=100% = peso cheio; 90-100% = linear; <90% = 0
  let pontuacao = 0;
  if (scoringAt !== null) {
    if (scoringAt >= 1.0) {
      pontuacao = meta.peso;
    } else if (scoringAt >= 0.9) {
      pontuacao = meta.peso * ((scoringAt - 0.9) / 0.1);
    }
  }

  return { metaAc, realAc, atingimento, scoringAt, pontuacao, ultimoMes, registros };
}

// Consolidado de um indicador (soma das pontuações ponderadas).
function calcKPI(kpiId, ano) {
  const metas = DB.metas.filter(m => m.id_kpi === kpiId && m.ativo);
  const resultados = metas.map(m => ({ meta: m, ...calcMeta(m, ano) }));
  const totalPontuacao = resultados.reduce((s, r) => s + r.pontuacao, 0);
  const ultimoMes = Math.max(0, ...resultados.map(r => r.ultimoMes));
  return { totalPontuacao, resultados, ultimoMes };
}

// ── Helpers de cor e status ───────────────────────────────────────
function scoreClass(pct) {
  if (pct === null || pct === undefined) return '';
  if (pct >= 1.0) return 'ok';
  if (pct >= 0.9) return 'warn';
  return 'err';
}

function statusBadgeClass(status) {
  const map = {
    'Não iniciado': 'st-nao',
    'Em andamento': 'st-and',
    'Em atraso':    'st-atr',
    'Concluído':    'st-con',
    'Suspenso':     'st-sus',
    'Cancelado':    'st-can',
  };
  return map[status] || 'st-nao';
}

function prioBadgeClass(prio) {
  const map = { 'Alta':'pr-alta', 'Média':'pr-media', 'Baixa':'pr-baixa' };
  return map[prio] || 'pr-baixa';
}

// ── Log de auditoria (apenas em memória) ──────────────────────────
function addLog(acao, tabela, idRegistro, campo, antes, depois) {
  DB.logs.unshift({
    id: 'log-' + Date.now(),
    data_hora: new Date().toLocaleString('pt-BR'),
    usuario: SESSION ? SESSION.email : 'sistema',
    acao, tabela, id_registro: idRegistro,
    campo, antes: String(antes), depois: String(depois), obs: '',
  });
}

// ── Gerador de IDs ────────────────────────────────────────────────
function uid(prefix) {
  return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
