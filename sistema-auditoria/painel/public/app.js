/* =============================================================================
   Painel de Auditoria (Demo) - dashboard de conformidade.
   Le de window.DEMO (data.js). Sem dependencias externas: graficos de barra
   feitos com HTML/CSS para ser 100% offline e auto-contido.
   ============================================================================= */
'use strict';

const D = window.DEMO;
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const PALETA = ['#163e5c', '#e0701b', '#2d8cff', '#27ae60', '#9b59b6', '#16a085'];
const ST_LABEL = { ABERTA: 'Aberta', EM_TRATAMENTO: 'Em tratamento', RESOLVIDA: 'Resolvida', REJEITADA: 'Rejeitada' };

const nomeUnidade = (id) => (D.unidades.find((u) => u.id === id) || {}).nome || '-';
const nomeArea = (id) => (D.areas.find((a) => a.id === id) || {}).nome || '-';
const fmtData = (d) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '-');
const fmtPeriodo = (p) => (/^\d{4}-\d{2}$/.test(p || '') ? p.slice(5) + '/' + p.slice(0, 4) : p || '-');

/* ---------- Risco: 4 niveis derivados do score GUT ---------- */
function riscoFaixa(gut) {
  if (gut >= 80) return { nome: 'Critico', cor: '#c0392b' };
  if (gut >= 40) return { nome: 'Alto', cor: '#c2660c' };
  if (gut >= 12) return { nome: 'Medio', cor: '#b9770a' };
  return { nome: 'Baixo', cor: '#0b69c7' };
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.className = 'on';
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.className = ''), 2400);
}

/* ============================== NAV ============================== */
const VIEWS = [
  { v: 'dashboard',  ico: '#', txt: 'Resultados' },
  { v: 'ncs',        ico: '!', txt: 'Nao conformidades' },
  { v: 'auditorias', ico: '=', txt: 'Auditorias' },
];
function construirNav() {
  $('#sidenav').innerHTML = VIEWS.map((i) =>
    `<div class="nav-item${i.v === 'dashboard' ? ' on' : ''}" data-view="${i.v}">
       <span class="nav-ico">${i.ico}</span><span>${i.txt}</span>
     </div>`).join('');
  $$('.nav-item').forEach((el) => el.addEventListener('click', () => irPara(el.dataset.view)));
}
function irPara(v) {
  $$('.view').forEach((s) => s.classList.toggle('on', s.id === 'view-' + v));
  $$('.nav-item').forEach((el) => el.classList.toggle('on', el.dataset.view === v));
}

/* ============================== FILTROS ============================== */
const state = { unidade: '' };

function construirFiltros() {
  const opts = ['<option value="">Todas as unidades</option>']
    .concat(D.unidades.map((u) => `<option value="${u.id}">${u.nome}</option>`)).join('');
  $('#filtros').innerHTML = `<label>Unidade <select id="f-dash-unidade">${opts}</select></label>`;
  $('#f-dash-unidade').addEventListener('change', (e) => { state.unidade = e.target.value; render(); });

  // tabela de NCs tem filtros proprios
  $('#f-unidade').innerHTML = opts;
  $('#f-status').addEventListener('change', renderNcs);
  $('#f-unidade').addEventListener('change', renderNcs);
}

/* ============================== GRAFICO DE BARRAS ============================== */
function barChart(el, dados, opts = {}) {
  const max = opts.max || Math.max(1, ...dados.map((d) => d.valor));
  el.innerHTML = dados.map((d, i) => {
    const pct = Math.round((d.valor / max) * 100);
    const cor = d.cor || PALETA[i % PALETA.length];
    return `<div class="bar-row">
      <div class="bar-label" title="${d.label}">${d.label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${cor}"></div></div>
      <div class="bar-val">${d.texto != null ? d.texto : d.valor}</div>
    </div>`;
  }).join('') || '<div class="vazio">Sem dados.</div>';
}

/* ============================== RENDER RESULTADOS ============================== */
function auditoriasFiltradas() {
  return D.auditorias.filter((a) => !state.unidade || a.unidade_id === state.unidade);
}
function ncsFiltradasDash() {
  return D.ncs.filter((n) => !state.unidade || n.unidade_id === state.unidade);
}

function render() {
  const auds = auditoriasFiltradas();
  const ncs = ncsFiltradasDash();

  // KPIs
  const notaMedia = auds.length ? (auds.reduce((s, a) => s + a.nota, 0) / auds.length) : 0;
  const ncsAbertas = ncs.filter((n) => n.status === 'ABERTA' || n.status === 'EM_TRATAMENTO').length;
  const criticas = ncs.filter((n) => riscoFaixa(n.gut).nome === 'Critico').length;
  $('#kpis').innerHTML = [
    { n: auds.length, l: 'Auditorias' },
    { n: notaMedia.toFixed(1), l: 'Nota media (1-5)' },
    { n: ncsAbertas, l: 'NCs em aberto' },
    { n: criticas, l: 'NCs criticas', danger: true },
  ].map((k) => `<div class="kpi${k.danger ? ' danger' : ''}"><div class="kpi-n">${k.n}</div><div class="kpi-l">${k.l}</div></div>`).join('');

  // Nota media por unidade (media das auditorias da unidade)
  const porUnidade = D.unidades.map((u) => {
    const us = D.auditorias.filter((a) => a.unidade_id === u.id);
    const m = us.length ? us.reduce((s, a) => s + a.nota, 0) / us.length : 0;
    return { label: u.nome, valor: m, texto: m ? m.toFixed(1) : '-' };
  }).filter((x) => (!state.unidade || nomeUnidade(state.unidade) === x.label));
  barChart($('#bars-unidade'), porUnidade, { max: 5 });

  // NCs por risco
  const faixas = ['Critico', 'Alto', 'Medio', 'Baixo'];
  const cores = { Critico: '#c0392b', Alto: '#c2660c', Medio: '#b9770a', Baixo: '#0b69c7' };
  const porRisco = faixas.map((f) => ({
    label: f, cor: cores[f],
    valor: ncs.filter((n) => riscoFaixa(n.gut).nome === f).length,
  }));
  barChart($('#bars-risco'), porRisco);

  // Nota media por area
  const porArea = D.areas.map((a) => {
    const reg = D.notas_area.filter((x) => x.area_id === a.id && (!state.unidade || x.unidade_id === state.unidade));
    const m = reg.length ? reg.reduce((s, x) => s + x.nota, 0) / reg.length : 0;
    return { label: a.nome, valor: m, texto: m ? m.toFixed(1) : '-' };
  }).filter((x) => x.valor > 0);
  barChart($('#bars-area'), porArea, { max: 5 });
}

/* ============================== RENDER NCs ============================== */
function renderNcs() {
  const fStatus = $('#f-status').value;
  const fUnidade = $('#f-unidade').value;
  const linhas = D.ncs
    .filter((n) => (!fStatus || n.status === fStatus) && (!fUnidade || n.unidade_id === fUnidade))
    .sort((a, b) => b.gut - a.gut);

  $('#tab-ncs tbody').innerHTML = linhas.map((n) => {
    const r = riscoFaixa(n.gut);
    return `<tr>
      <td>${n.descricao}</td>
      <td>${nomeUnidade(n.unidade_id)}</td>
      <td>${nomeArea(n.area_id)}</td>
      <td>${n.categoria}</td>
      <td><span class="pill" style="background:${r.cor}1a;color:${r.cor}">${r.nome}</span></td>
      <td>${n.gut}</td>
      <td><span class="status st-${n.status}">${ST_LABEL[n.status]}</span></td>
      <td>${fmtData(n.prazo)}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" class="vazio">Nenhuma nao conformidade para os filtros.</td></tr>';
}

/* ============================== RENDER AUDITORIAS ============================== */
function renderAuditorias() {
  const linhas = [...D.auditorias].sort((a, b) => (b.confirmada_em || '').localeCompare(a.confirmada_em || ''));
  $('#tab-aud tbody').innerHTML = linhas.map((a) => `<tr>
    <td>${nomeUnidade(a.unidade_id)}</td>
    <td>${fmtPeriodo(a.periodo)}</td>
    <td>${a.auditor}</td>
    <td><b>${a.nota.toFixed(1)}</b></td>
    <td>${a.respostas}</td>
    <td>${a.ncs}</td>
    <td>${fmtData(a.confirmada_em)}</td>
  </tr>`).join('');
}

/* ============================== INIT ============================== */
construirNav();
construirFiltros();
render();
renderNcs();
renderAuditorias();
toast('Dados ficticios carregados.');
