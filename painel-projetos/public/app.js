/* =====================================================================
   PAINEL DE PROJETOS — DEMO
   app.js · lógica do front (dados mock + Chart.js)
   ---------------------------------------------------------------------
   Versão de demonstração: usa os dados FICTÍCIOS de data.js (MOCK) e
   mantém tudo em memória. Para conectar a um backend real (ex.: Supabase),
   troque as funções de "API mock" por chamadas HTTP usando as variáveis
   {{SUPABASE_URL}} / {{SUPABASE_KEY}} do seu .env (ver README).
   ===================================================================== */

/* ---------------------------------------------------------------------
   1) CONFIG (placeholders — não há backend nesta demo)
   --------------------------------------------------------------------- */
const SUPABASE_URL = '{{SUPABASE_URL}}'; // ex.: https://demo.exemplo.dev
const SUPABASE_KEY = '{{SUPABASE_KEY}}'; // chave pública (anon) — placeholder

/* ---------------------------------------------------------------------
   2) CONSTANTES / RÓTULOS
   --------------------------------------------------------------------- */
const CATEGORIAS = [
  { key: 'automacoes',   label: 'Automações' },
  { key: 'bi',           label: 'BI / Relatórios' },
  { key: 'apps',         label: 'Aplicativos' },
  { key: 'integracoes',  label: 'Integrações' },
  { key: 'web',          label: 'Web' },
];
const CAT_LABEL = Object.fromEntries(CATEGORIAS.map(c => [c.key, c.label]));

const STATUS = {
  solicitado: 'Solicitado', em_avaliacao: 'Em avaliação', aprovado: 'Aprovado',
  em_desenvolvimento: 'Em desenvolvimento', em_producao: 'Em produção',
  pausado: 'Pausado', cancelado: 'Cancelado',
};
const PRIORIDADE = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };

/* ---------------------------------------------------------------------
   3) ESTADO (cópia em memória dos dados mock)
   --------------------------------------------------------------------- */
const state = {
  setores: structuredClone(MOCK.setores),
  autores: structuredClone(MOCK.autores),
  ferramentas: structuredClone(MOCK.ferramentas),
  projetos: structuredClone(MOCK.projetos),
  viewAtual: 'dashboard',
  modo: 'quadro',
  charts: {},
};

/* ---------------------------------------------------------------------
   4) HELPERS
   --------------------------------------------------------------------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmtData = d => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
const esc = s => (s ?? '').toString().replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const novoId = () => 'x' + Math.random().toString(36).slice(2, 9);

const setorNome = id => state.setores.find(s => s.id === id)?.nome || '—';
const autorNome = id => state.autores.find(a => a.id === id)?.nome || '—';
const ferrNome  = id => state.ferramentas.find(f => f.id === id)?.nome || '';

function toast(msg, tipo = 'ok') {
  const t = $('#toast');
  t.textContent = msg; t.className = 'toast ' + tipo; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 3000);
}
const badgeStatus = s => `<span class="badge ${s}">${STATUS[s] || s}</span>`;
const badgePrio   = p => `<span class="badge-prio ${p}">${PRIORIDADE[p] || p}</span>`;

/* =====================================================================
   5) ROTEADOR DE VIEWS
   ===================================================================== */
function irPara(view) {
  state.viewAtual = view;
  $$('.view').forEach(v => v.classList.remove('on'));
  $('#view-' + view)?.classList.add('on');
  $$('.nav-item').forEach(n => n.classList.toggle('sel', n.dataset.view === view));

  if (view === 'dashboard')   renderDashboard();
  if (view === 'projetos')    renderProjetos();
  if (view === 'ferramentas') renderFerramentas();
}

$$('.nav-item').forEach(el =>
  el.addEventListener('click', () => irPara(el.dataset.view)));

/* =====================================================================
   6) FILTROS
   ===================================================================== */
function popularFiltros() {
  const setSel = (sel, itens, valor = 'id', rotulo = 'nome') => {
    const el = $(sel);
    const atual = el.value;
    const base = el.querySelector('option').outerHTML;
    el.innerHTML = base + itens.map(i =>
      `<option value="${esc(i[valor])}">${esc(i[rotulo])}</option>`).join('');
    el.value = atual;
  };
  setSel('#f-setor', state.setores);
  setSel('#f-ferramenta', state.ferramentas);
  setSel('#f-autor', state.autores);
  const fs = $('#f-status');
  const baseStatus = fs.querySelector('option').outerHTML;
  fs.innerHTML = baseStatus + Object.entries(STATUS)
    .map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
}

function projetosFiltrados() {
  const busca = $('#f-busca').value.trim().toLowerCase();
  const setor = $('#f-setor').value;
  const ferr  = $('#f-ferramenta').value;
  const autor = $('#f-autor').value;
  const status = $('#f-status').value;

  return state.projetos.filter(p =>
    (!busca || p.titulo.toLowerCase().includes(busca)) &&
    (!setor || p.setor_id === setor) &&
    (!ferr  || (p.ferramentas || []).includes(ferr)) &&
    (!autor || p.autor_id === autor) &&
    (!status || p.status === status));
}

['#f-busca', '#f-setor', '#f-ferramenta', '#f-autor', '#f-status'].forEach(sel =>
  $(sel).addEventListener('input', renderProjetos));
$('#f-limpar').addEventListener('click', () => {
  ['#f-busca', '#f-setor', '#f-ferramenta', '#f-autor', '#f-status'].forEach(s => ($(s).value = ''));
  renderProjetos();
});

/* =====================================================================
   7) CATÁLOGO DE PROJETOS (Quadro / Grade)
   ===================================================================== */
$('#modo-quadro').addEventListener('click', () => { state.modo = 'quadro'; renderProjetos(); });
$('#modo-grade').addEventListener('click',  () => { state.modo = 'grade';  renderProjetos(); });
$('#btn-novo-projeto').addEventListener('click', () => abrirModalProjeto());

function renderProjetos() {
  popularFiltros();
  $('#modo-quadro').classList.toggle('ativo', state.modo === 'quadro');
  $('#modo-grade').classList.toggle('ativo', state.modo === 'grade');

  const itens = projetosFiltrados();
  const vazio = itens.length === 0;
  $('#projetos-vazio').hidden = !vazio;

  if (state.modo === 'quadro') {
    $('#projetos-colunas').hidden = false;
    $('#projetos-grade').hidden = true;
    renderQuadro(itens);
  } else {
    $('#projetos-colunas').hidden = true;
    $('#projetos-grade').hidden = vazio;
    renderGrade(itens);
  }
}

function cardProjeto(p) {
  const ferrChips = (p.ferramentas || []).slice(0, 3)
    .map(id => `<span class="mini-chip">${esc(ferrNome(id))}</span>`).join('');
  return `
    <article class="proj-card" data-id="${p.id}">
      <div class="proj-card-top">
        ${badgePrio(p.prioridade)}
        ${badgeStatus(p.status)}
      </div>
      <h4>${esc(p.titulo)}</h4>
      <p class="proj-card-desc">${esc(p.descricao || '')}</p>
      <div class="proj-card-meta">
        <span>👥 ${esc(setorNome(p.setor_id))}</span>
        <span>✍ ${esc(autorNome(p.autor_id))}</span>
      </div>
      <div class="proj-card-chips">${ferrChips}</div>
    </article>`;
}

function renderQuadro(itens) {
  const cont = $('#projetos-colunas');
  cont.innerHTML = CATEGORIAS.map(cat => {
    const lista = itens.filter(p => p.categoria === cat.key);
    return `
      <div class="coluna">
        <div class="coluna-head">${esc(cat.label)} <span class="coluna-count">${lista.length}</span></div>
        <div class="coluna-body">
          ${lista.map(cardProjeto).join('') || '<div class="coluna-vazia">—</div>'}
        </div>
      </div>`;
  }).join('');
  $$('.proj-card', cont).forEach(el =>
    el.addEventListener('click', () => abrirDetalhe(el.dataset.id)));
}

function renderGrade(itens) {
  const cont = $('#projetos-grade');
  cont.innerHTML = `
    <table class="grade">
      <thead>
        <tr>
          <th>Título</th><th>Categoria</th><th>Setor</th><th>Autor</th>
          <th>Status</th><th>Prioridade</th><th>Conclusão</th><th></th>
        </tr>
      </thead>
      <tbody>
        ${itens.map(p => `
          <tr data-id="${p.id}">
            <td>${esc(p.titulo)}</td>
            <td>${esc(CAT_LABEL[p.categoria] || p.categoria)}</td>
            <td>${esc(setorNome(p.setor_id))}</td>
            <td>${esc(autorNome(p.autor_id))}</td>
            <td>${badgeStatus(p.status)}</td>
            <td>${badgePrio(p.prioridade)}</td>
            <td>${fmtData(p.data_conclusao)}</td>
            <td><button class="btn-link" data-edit="${p.id}">Editar</button></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
  $$('[data-edit]', cont).forEach(b =>
    b.addEventListener('click', e => { e.stopPropagation(); abrirModalProjeto(b.dataset.edit); }));
  $$('tr[data-id]', cont).forEach(tr =>
    tr.addEventListener('click', () => abrirDetalhe(tr.dataset.id)));
}

/* =====================================================================
   8) DETALHE (somente leitura)
   ===================================================================== */
function abrirDetalhe(id) {
  const p = state.projetos.find(x => x.id === id);
  if (!p) return;
  $('#det-titulo').textContent = p.titulo;
  const ferr = (p.ferramentas || []).map(fid => `<span class="mini-chip">${esc(ferrNome(fid))}</span>`).join(' ') || '—';
  const link = p.link_publicado
    ? `<a href="${esc(p.link_publicado)}" target="_blank" rel="noopener">${esc(p.link_publicado)}</a>`
    : '—';
  $('#det-body').innerHTML = `
    <p class="det-desc">${esc(p.descricao || '')}</p>
    <dl class="det-grid">
      <dt>Categoria</dt><dd>${esc(CAT_LABEL[p.categoria] || p.categoria)}</dd>
      <dt>Setor</dt><dd>${esc(setorNome(p.setor_id))}</dd>
      <dt>Autor</dt><dd>${esc(autorNome(p.autor_id))}</dd>
      <dt>Status</dt><dd>${badgeStatus(p.status)}</dd>
      <dt>Prioridade</dt><dd>${badgePrio(p.prioridade)}</dd>
      <dt>Tecnologias</dt><dd>${ferr}</dd>
      <dt>Prazo estimado</dt><dd>${p.prazo_estimado_dias != null ? p.prazo_estimado_dias + ' dias' : '—'}</dd>
      <dt>Conclusão</dt><dd>${fmtData(p.data_conclusao)}</dd>
      <dt>Link</dt><dd>${link}</dd>
    </dl>
    <div class="det-foot">
      <button class="btn-primary" id="det-editar">Editar</button>
    </div>`;
  $('#det-editar').addEventListener('click', () => { fecharModal('modal-detalhe'); abrirModalProjeto(id); });
  abrirModal('modal-detalhe');
}

/* =====================================================================
   9) MODAL DE PROJETO (criar / editar / excluir)
   ===================================================================== */
function preencherSelectsModal() {
  $('#p-setor').innerHTML = state.setores.map(s => `<option value="${s.id}">${esc(s.nome)}</option>`).join('');
  $('#p-autor').innerHTML = state.autores.map(a => `<option value="${a.id}">${esc(a.nome)}</option>`).join('');
  $('#p-ferramentas').innerHTML = state.ferramentas.map(f =>
    `<label class="check"><input type="checkbox" value="${f.id}" /> ${esc(f.nome)}</label>`).join('');
}

function abrirModalProjeto(id = null) {
  preencherSelectsModal();
  const editando = !!id;
  const p = editando ? state.projetos.find(x => x.id === id) : null;

  $('#modal-projeto-titulo').textContent = editando ? 'Editar projeto' : 'Novo projeto';
  $('#p-id').value = id || '';
  $('#p-titulo').value = p?.titulo || '';
  $('#p-descricao').value = p?.descricao || '';
  $('#p-categoria').value = p?.categoria || 'automacoes';
  $('#p-setor').value = p?.setor_id || state.setores[0]?.id;
  $('#p-autor').value = p?.autor_id || state.autores[0]?.id;
  $('#p-status').value = p?.status || 'solicitado';
  $('#p-prioridade').value = p?.prioridade || 'media';
  $('#p-link').value = p?.link_publicado || '';
  $('#p-prazo').value = p?.prazo_estimado_dias ?? '';
  $$('#p-ferramentas input').forEach(chk => {
    chk.checked = !!p && (p.ferramentas || []).includes(chk.value);
  });
  $('#btn-excluir-projeto').hidden = !editando;

  abrirModal('modal-projeto');
}

$('#form-projeto').addEventListener('submit', e => {
  e.preventDefault();
  const id = $('#p-id').value;
  const dados = {
    titulo: $('#p-titulo').value.trim(),
    descricao: $('#p-descricao').value.trim(),
    categoria: $('#p-categoria').value,
    setor_id: $('#p-setor').value,
    autor_id: $('#p-autor').value,
    status: $('#p-status').value,
    prioridade: $('#p-prioridade').value,
    link_publicado: $('#p-link').value.trim(),
    prazo_estimado_dias: $('#p-prazo').value ? Number($('#p-prazo').value) : null,
    ferramentas: $$('#p-ferramentas input:checked').map(c => c.value),
  };
  if (!dados.titulo) { toast('Informe o título.', 'err'); return; }

  if (id) {
    const p = state.projetos.find(x => x.id === id);
    Object.assign(p, dados);
    toast('Projeto atualizado.');
  } else {
    state.projetos.push({ id: novoId(), data_conclusao: null, ...dados });
    toast('Projeto criado.');
  }
  fecharModal('modal-projeto');
  renderProjetos();
});

$('#btn-excluir-projeto').addEventListener('click', () => {
  const id = $('#p-id').value;
  if (!id) return;
  if (!confirm('Excluir este projeto?')) return;
  state.projetos = state.projetos.filter(p => p.id !== id);
  fecharModal('modal-projeto');
  renderProjetos();
  toast('Projeto excluído.');
});

/* =====================================================================
   10) TECNOLOGIAS (catálogo)
   ===================================================================== */
function renderFerramentas() {
  const cont = $('#ferramentas-lista');
  cont.innerHTML = state.ferramentas.map(f => {
    const usos = state.projetos.filter(p => (p.ferramentas || []).includes(f.id)).length;
    return `<span class="chip">${esc(f.nome)} <span class="chip-count">${usos}</span>
            <button class="chip-x" data-del="${f.id}" title="Remover">×</button></span>`;
  }).join('') || '<div class="vazio">Nenhuma tecnologia cadastrada.</div>';
  $$('[data-del]', cont).forEach(b =>
    b.addEventListener('click', () => {
      state.ferramentas = state.ferramentas.filter(f => f.id !== b.dataset.del);
      state.projetos.forEach(p => { p.ferramentas = (p.ferramentas || []).filter(x => x !== b.dataset.del); });
      renderFerramentas();
      toast('Tecnologia removida.');
    }));
}

$('#form-ferramenta').addEventListener('submit', e => {
  e.preventDefault();
  const nome = $('#nova-ferramenta').value.trim();
  if (!nome) return;
  if (state.ferramentas.some(f => f.nome.toLowerCase() === nome.toLowerCase())) {
    toast('Essa tecnologia já existe.', 'err'); return;
  }
  state.ferramentas.push({ id: novoId(), nome });
  $('#nova-ferramenta').value = '';
  renderFerramentas();
  toast('Tecnologia adicionada.');
});

/* =====================================================================
   11) DASHBOARD (cards + gráficos)
   ===================================================================== */
const CORES = ['#3b6df0', '#0aa676', '#f0a020', '#8b5cf6', '#e0556b', '#14b8c4', '#94a3b8'];

function renderDashboard() {
  const ps = state.projetos;
  const emProducao = ps.filter(p => p.status === 'em_producao').length;
  const emAndamento = ps.filter(p => ['aprovado', 'em_desenvolvimento'].includes(p.status)).length;
  const naFila = ps.filter(p => ['solicitado', 'em_avaliacao'].includes(p.status)).length;

  $('#dash-cards').innerHTML = [
    { t: 'Total de projetos', v: ps.length },
    { t: 'Em produção', v: emProducao },
    { t: 'Em andamento', v: emAndamento },
    { t: 'Na fila', v: naFila },
  ].map(c => `<div class="card"><div class="card-v">${c.v}</div><div class="card-t">${c.t}</div></div>`).join('');

  const contar = (chave, dict) => {
    const m = {};
    ps.forEach(p => { const k = p[chave]; m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).map(([k, v]) => [dict ? (dict[k] || k) : k, v]);
  };

  const porCategoria = CATEGORIAS.map(c => [c.label, ps.filter(p => p.categoria === c.key).length]);
  const porSetor = state.setores
    .map(s => [s.nome, ps.filter(p => p.setor_id === s.id).length])
    .filter(([, v]) => v > 0);
  const porStatus = Object.entries(STATUS)
    .map(([k, v]) => [v, ps.filter(p => p.status === k).length])
    .filter(([, v]) => v > 0);
  const porAutor = state.autores.map(a => [a.nome, ps.filter(p => p.autor_id === a.id).length]);

  desenharGrafico('chart-categoria', 'bar', porCategoria);
  desenharGrafico('chart-setor', 'doughnut', porSetor);
  desenharGrafico('chart-status', 'doughnut', porStatus);
  desenharGrafico('chart-autor', 'bar', porAutor);
}

function desenharGrafico(canvasId, tipo, pares) {
  const ctx = $('#' + canvasId);
  if (!ctx) return;
  state.charts[canvasId]?.destroy();
  const labels = pares.map(p => p[0]);
  const dados = pares.map(p => p[1]);
  const isPie = tipo === 'doughnut';
  state.charts[canvasId] = new Chart(ctx, {
    type: tipo,
    data: {
      labels,
      datasets: [{
        data: dados,
        backgroundColor: isPie ? CORES : CORES[0],
        borderRadius: isPie ? 0 : 6,
        borderWidth: isPie ? 0 : 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: isPie, position: 'bottom' } },
      scales: isPie ? {} : { y: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });
}

/* =====================================================================
   12) MODAIS (helpers genéricos)
   ===================================================================== */
function abrirModal(id) { $('#' + id).hidden = false; }
function fecharModal(id) { $('#' + id).hidden = true; }
$$('[data-fechar-modal]').forEach(b =>
  b.addEventListener('click', () => fecharModal(b.dataset.fecharModal)));
$$('.modal').forEach(m =>
  m.addEventListener('click', e => { if (e.target === m) fecharModal(m.id); }));

/* =====================================================================
   13) BOOT
   ===================================================================== */
irPara('dashboard');
