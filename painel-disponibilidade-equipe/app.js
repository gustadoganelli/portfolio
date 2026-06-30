/* ================================================================
   APP — Painel de Disponibilidade da Equipe (DEMO)
   ----------------------------------------------------------------
   Toda a UI roda no navegador, consumindo os dados ficticios de
   dados.js. Onde existiria uma chamada de rede, ha um comentario
   indicando o endpoint que seria usado em producao.
================================================================ */

const CONFIG = {
  // Em producao, troque por seus endpoints reais:
  //   webhookUrl:       "{{WEBHOOK_DISPONIBILIDADE}}",
  //   webhookMesUrl:    "{{WEBHOOK_MES}}",
  //   webhookAgendaUrl: "{{WEBHOOK_AGENDA_DIA}}",
  intervaloAtualizacao: 60000,        // 60s — atualizacao automatica
  usarMock: true                      // demo: sempre usa dados locais
};

/* ================================================================
   RELOGIO
================================================================ */
function atualizarRelogio() {
  const a = new Date();
  const hora = a.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const data = a.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
                .replace(/^\w/, c => c.toUpperCase());
  document.getElementById("relogio").textContent = hora;
  document.getElementById("data-extenso").textContent = data;
}
setInterval(atualizarRelogio, 1000);
atualizarRelogio();

/* ================================================================
   UTILITARIOS
================================================================ */
function iniciais(nome) {
  if (!nome) return "?";
  const p = nome.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}
const PALETA_INICIAIS = ["#1e3a5f","#1e4a3a","#3a1e4a","#4a2a1e","#1e3a4a","#2a3a1e","#3a2a1e","#1e2a3a","#4a1e2a","#2a1e4a"];
function corIniciais(nome) {
  let h = 0;
  for (let i = 0; i < (nome || "").length; i++) h = (h * 31 + nome.charCodeAt(i)) & 0xffff;
  return PALETA_INICIAIS[h % PALETA_INICIAIS.length];
}
function classeStatus(s) {
  return { "Disponivel": "badge-disponivel", "Em Reuniao": "badge-em-reuniao", "Ausente": "badge-ausente", "Desconhecido": "badge-desconhecido" }[s] || "badge-desconhecido";
}
function horaAtual() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function duracaoMin(inicio, fim) {
  if (!inicio || !fim) return "";
  const [hi, mi] = inicio.split(":").map(Number);
  const [hf, mf] = fim.split(":").map(Number);
  const d = (hf * 60 + mf) - (hi * 60 + mi);
  if (d <= 0) return "";
  const h = Math.floor(d / 60), m = d % 60;
  return h > 0 ? (m > 0 ? h + "h " + m + "min" : h + "h") : m + "min";
}
function iconeLocal(local) {
  if (!local) return "";
  const l = local.toLowerCase();
  if (/online|video|remoto|virtual|meet|teams|zoom/.test(l)) return "\u{1F4BB}";
  return "\u{1F4CD}";
}

/* ================================================================
   FILTRO POR CATEGORIA
================================================================ */
const categoriasVisiveis = new Set(ORDEM_CATEGORIAS);

function inicializarFiltro() {
  const wrap = document.getElementById("filter-items-categorias");
  ORDEM_CATEGORIAS.forEach(cat => {
    const isSala = cat === "Salas";
    const btn = document.createElement("button");
    btn.className = "filter-item ativo" + (isSala ? " sala" : "");
    btn.dataset.categoria = cat;
    btn.innerHTML = `<span class="filter-item-dot"></span>${cat}`;
    btn.addEventListener("click", e => { e.stopPropagation(); toggleCategoria(cat); });
    wrap.appendChild(btn);
  });
  atualizarContador();
}
function toggleCategoria(cat) {
  if (categoriasVisiveis.has(cat)) categoriasVisiveis.delete(cat); else categoriasVisiveis.add(cat);
  sincronizarChips(); aplicarFiltro();
}
function toggleTodos(ativar) {
  if (ativar) ORDEM_CATEGORIAS.forEach(c => categoriasVisiveis.add(c)); else categoriasVisiveis.clear();
  sincronizarChips(); aplicarFiltro();
}
function sincronizarChips() {
  document.querySelectorAll(".filter-item[data-categoria]").forEach(c =>
    c.classList.toggle("ativo", categoriasVisiveis.has(c.dataset.categoria)));
  atualizarContador();
}
function aplicarFiltro() {
  document.querySelectorAll(".categoria-section").forEach(s =>
    s.classList.toggle("oculta", !categoriasVisiveis.has(s.dataset.categoria)));
}
function atualizarContador() {
  const el = document.getElementById("filter-count");
  if (!el) return;
  el.textContent = categoriasVisiveis.size === ORDEM_CATEGORIAS.length
    ? "Todas as categorias"
    : categoriasVisiveis.size + " de " + ORDEM_CATEGORIAS.length + " categorias";
}
function toggleFiltroDropdown() {
  const t = document.getElementById("filter-trigger");
  const d = document.getElementById("filter-dropdown");
  const open = d.classList.contains("aberto");
  t.classList.toggle("aberto", !open);
  d.classList.toggle("aberto", !open);
}
function fecharFiltroDropdown() {
  document.getElementById("filter-trigger")?.classList.remove("aberto");
  document.getElementById("filter-dropdown")?.classList.remove("aberto");
}
document.addEventListener("click", e => {
  const c = document.getElementById("filter-container");
  if (c && !c.contains(e.target)) fecharFiltroDropdown();
});

/* ================================================================
   CARDS DE DISPONIBILIDADE
================================================================ */
function criarCard(d) {
  const status = d.statusAtual || "Desconhecido";
  const tipo = (USUARIOS.find(x => x.id === d.id) || {}).tipo || "pessoa";

  const card = document.createElement("div");
  card.className = "card" + (tipo === "sala" ? " card-tipo-sala" : "");
  card.setAttribute("data-status", status);
  card.setAttribute("data-tipo", tipo);
  card.addEventListener("click", () => abrirModal(d.id, d.nome));

  const ra = d.reuniaoAtual;
  card.innerHTML = `
    <div class="card-header">
      <div class="foto-wrapper">
        <div class="foto-iniciais" style="background:${corIniciais(d.nome)}">${iniciais(d.nome)}</div>
      </div>
      <div class="card-info">
        <div class="card-nome" title="${d.nome}">${d.nome}</div>
        <span class="badge-status ${classeStatus(status)}"><span class="dot"></span>${status}</span>
      </div>
    </div>
    <div class="card-body">
      <div class="reuniao-atual ${status === 'Em Reuniao' && ra ? 'visivel' : ''}">
        <div class="reuniao-subject">${ra ? ra.subject : ''}</div>
        ${ra && ra.local ? `<div class="reuniao-local">${iconeLocal(ra.local)} ${ra.local}</div>` : ''}
        <div class="reuniao-ate">${ra ? 'ate ' + ra.fim : ''}</div>
      </div>
      <div class="proxima-reuniao">
        ${d.proximaReuniao
          ? `<strong>Proxima:</strong> <span class="proxima-horario">${d.proximaReuniao.horario}</span> — ${d.proximaReuniao.subject}`
          : '<span class="sem-reunioes">Sem mais reunioes hoje</span>'}
      </div>
    </div>
    <div class="card-hint">Ver mes completo &rarr;</div>`;
  return card;
}

function renderizarCards(dados) {
  const container = document.getElementById("cards-container");
  const porUser = {};
  dados.forEach(d => porUser[d.id] = d);

  const porCat = {};
  USUARIOS.forEach(u => { (porCat[u.categoria] = porCat[u.categoria] || []).push(u); });

  container.innerHTML = "";
  ORDEM_CATEGORIAS.forEach(cat => {
    if (!porCat[cat]) return;
    const section = document.createElement("div");
    section.className = "categoria-section" + (categoriasVisiveis.has(cat) ? "" : " oculta");
    section.dataset.categoria = cat;
    section.innerHTML = `
      <div class="categoria-header">
        <span class="categoria-titulo">${cat}</span>
        <div class="categoria-linha"></div>
      </div>
      <div class="categoria-grid"></div>`;
    container.appendChild(section);
    const grid = section.querySelector(".categoria-grid");
    porCat[cat].forEach(u => {
      const d = porUser[u.id] || { id: u.id, nome: u.nome, statusAtual: "Desconhecido", reuniaoAtual: null, proximaReuniao: null };
      grid.appendChild(criarCard(d));
    });
  });

  atualizarTicker(dados);
}

function atualizarTicker(dados) {
  const bar = document.getElementById("ticker-bar");
  const inner = document.getElementById("ticker-inner");
  const em = dados.filter(d => d.statusAtual === "Em Reuniao" && d.reuniaoAtual);
  if (!em.length) { bar.classList.remove("visivel"); return; }

  inner.innerHTML = em.map(d => {
    const local = d.reuniaoAtual.local ? ` &nbsp;<span style="color:#94a3b8">${iconeLocal(d.reuniaoAtual.local)} ${d.reuniaoAtual.local}</span>` : "";
    const ate = `<span style="color:#6b7280;font-size:.72rem"> ate ${d.reuniaoAtual.fim}</span>`;
    return `<span style="margin-right:3rem">
      <span style="color:#38bdf8;font-weight:700">${d.nome}</span>
      <span style="color:#6b7280"> — </span>
      <span style="color:#f1f5f9">${d.reuniaoAtual.subject}</span>${local}${ate}
    </span>`;
  }).join('<span style="color:#ef4444;margin-right:3rem;font-size:.7rem">&#9679;</span>');

  inner.style.animationDuration = Math.max(12, inner.textContent.length * 0.10) + "s";
  bar.classList.add("visivel");
}

/* ================================================================
   BUSCA DE DADOS — DISPONIBILIDADE
   Em producao:  fetch(CONFIG.webhookUrl) -> JSON
================================================================ */
async function buscarDados() {
  // --- modo demo (mock local) ---
  const dados = gerarStatusAtual();
  renderizarCards(dados);
  document.getElementById("badge-atualizado").textContent =
    "Atualizado as " + horaAtual() + (CONFIG.usarMock ? " (dados ficticios)" : "");

  /* --- producao (descomentar e remover bloco acima) ---
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    const r = await fetch(CONFIG.webhookUrl, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const dados = await r.json();
    renderizarCards(Array.isArray(dados) ? dados : [dados]);
    document.getElementById("badge-atualizado").textContent = "Atualizado as " + horaAtual();
  } catch (e) { console.error("[Painel]", e); }
  */
}

/* ================================================================
   MODAL MENSAL (calendario por pessoa)
================================================================ */
let modalUserId = null, modalNome = "";
let modalAno = new Date().getFullYear(), modalMes = new Date().getMonth();
let diaSelecionado = null, dadosMesAtual = {};

function abrirModal(userId, nome) {
  modalUserId = userId; modalNome = nome;
  const hoje = new Date();
  modalAno = hoje.getFullYear(); modalMes = hoje.getMonth(); diaSelecionado = hoje.getDate();

  const iEl = document.getElementById("modal-foto-iniciais");
  iEl.textContent = iniciais(nome);
  iEl.style.background = corIniciais(nome);
  document.getElementById("modal-nome").textContent = nome;
  document.getElementById("modal-sub").textContent = "Agenda mensal";
  document.getElementById("modal-overlay").classList.add("aberto");
  renderizarMes();
}
function fecharModal() {
  document.getElementById("modal-overlay").classList.remove("aberto");
  modalUserId = null;
}
function fecharModalFora(e) {
  if (e.target === document.getElementById("modal-overlay")) fecharModal();
}
function navMes(delta) {
  modalMes += delta;
  if (modalMes > 11) { modalMes = 0; modalAno++; }
  if (modalMes < 0) { modalMes = 11; modalAno--; }
  diaSelecionado = null;
  renderizarMes();
}

/* Em producao:  fetch(CONFIG.webhookMesUrl, { method:"POST", body:{userId, mes} }) */
function buscarMes(userId, ano, mes) {
  return gerarEventosMes(userId, ano, mes);   // demo: mock local
}

function renderizarMes() {
  document.getElementById("modal-mes-label").textContent =
    new Date(modalAno, modalMes, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).replace(/^\w/, c => c.toUpperCase());

  dadosMesAtual = buscarMes(modalUserId, modalAno, modalMes);

  const ultimoDia = new Date(modalAno, modalMes + 1, 0).getDate();
  const offset = (new Date(modalAno, modalMes, 1).getDay() + 6) % 7;
  const hoje = new Date();

  let html = "";
  for (let i = 0; i < offset; i++) html += '<div class="cal-cell vazio"></div>';
  for (let d = 1; d <= ultimoDia; d++) {
    const ehHoje = d === hoje.getDate() && modalMes === hoje.getMonth() && modalAno === hoje.getFullYear();
    const passado = new Date(modalAno, modalMes, d) < hoje && !ehHoje;
    const temEvt = dadosMesAtual[d] && dadosMesAtual[d].length > 0;
    const cls = ["cal-cell", passado ? "passado" : "", ehHoje ? "hoje" : "", d === diaSelecionado ? "selecionado" : ""].filter(Boolean).join(" ");
    html += `<div class="${cls}" onclick="selecionarDia(${d})" data-dia="${d}">
               <span class="cal-num">${d}</span>${temEvt ? '<span class="cal-dot"></span>' : ''}
             </div>`;
  }
  document.getElementById("cal-grid").innerHTML = html;

  if (diaSelecionado) renderizarDia(diaSelecionado, dadosMesAtual[diaSelecionado] || []);
  else {
    document.getElementById("cal-dia-label").textContent = "Selecione um dia no calendario";
    document.getElementById("modal-lista").innerHTML = '<div class="compromisso-vazio">—</div>';
  }
}
function selecionarDia(dia) {
  diaSelecionado = dia;
  document.querySelectorAll(".cal-cell[data-dia]").forEach(c =>
    c.classList.toggle("selecionado", parseInt(c.dataset.dia) === dia));
  renderizarDia(dia, dadosMesAtual[dia] || []);
}
function renderizarDia(dia, lista) {
  const label = new Date(modalAno, modalMes, dia)
    .toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).replace(/^\w/, c => c.toUpperCase());
  document.getElementById("cal-dia-label").textContent = label;

  const el = document.getElementById("modal-lista");
  if (!lista.length) { el.innerHTML = '<div class="compromisso-vazio">Nenhum compromisso neste dia ✓</div>'; return; }

  const agora = new Date();
  const hhmm = pad(agora.getHours()) + ":" + pad(agora.getMinutes());
  const ehHoje = dia === agora.getDate() && modalMes === agora.getMonth() && modalAno === agora.getFullYear();

  el.innerHTML = lista.map(c => {
    const ativo = ehHoje && c.inicio <= hhmm && (!c.fim || hhmm <= c.fim);
    const passado = ehHoje && c.fim && hhmm > c.fim;
    const dur = duracaoMin(c.inicio, c.fim);
    return `<div class="compromisso-item" style="${passado ? 'opacity:.4' : ''}">
      <div class="compromisso-hora-col">
        <div class="compromisso-inicio">${c.inicio}</div>
        ${c.fim ? `<div class="compromisso-fim">ate ${c.fim}</div>` : ''}
      </div>
      <div class="compromisso-detalhe">
        <div class="compromisso-subject">${c.subject}</div>
        ${c.local ? `<div class="compromisso-local">${iconeLocal(c.local)} ${c.local}</div>` : ''}
        ${dur ? `<div class="compromisso-duracao">${dur}</div>` : ''}
      </div>
      ${ativo ? '<div class="compromisso-ativo" title="Em andamento"></div>' : ''}
    </div>`;
  }).join('');
}

/* ================================================================
   ABA AGENDA DO DIA
================================================================ */
let agendaDataAtual = null;
let agendaViewMode = "horario";   // "horario" | "pessoa"
const agendaCache = {};

function mostrarAba(aba) {
  const vD = document.getElementById("view-disponibilidade");
  const vA = document.getElementById("view-agenda");
  const tD = document.getElementById("tab-disp");
  const tA = document.getElementById("tab-agenda");
  if (aba === "disponibilidade") {
    vD.style.display = ""; vA.style.display = "none";
    tD.classList.add("ativo"); tA.classList.remove("ativo");
  } else {
    vD.style.display = "none"; vA.style.display = "";
    tD.classList.remove("ativo"); tA.classList.add("ativo");
    fecharFiltroDropdown();
    if (!agendaDataAtual) agendaDataAtual = new Date().toISOString().slice(0, 10);
    carregarAgenda();
  }
}
function navDiaAgenda(delta) {
  if (!agendaDataAtual) return;
  const d = new Date(agendaDataAtual + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  agendaDataAtual = d.toISOString().slice(0, 10);
  carregarAgenda();
}

/* Em producao:  fetch(CONFIG.webhookAgendaUrl + "?data=" + agendaDataAtual) */
function carregarAgenda() {
  if (agendaCache[agendaDataAtual]) { renderizarAgenda(agendaCache[agendaDataAtual]); return; }
  const dados = gerarAgendaDia(agendaDataAtual);   // demo: mock local
  agendaCache[agendaDataAtual] = dados;
  renderizarAgenda(dados);
}
function setAgendaView(modo) {
  agendaViewMode = modo;
  document.getElementById("av-horario")?.classList.toggle("ativo", modo === "horario");
  document.getElementById("av-pessoa")?.classList.toggle("ativo", modo === "pessoa");
  const dados = agendaCache[agendaDataAtual];
  if (dados) renderizarAgenda(dados);
}

function renderizarAgenda(dados) {
  const lista = document.getElementById("agenda-lista");
  document.getElementById("agenda-data-label").textContent = dados.dayLabel || agendaDataAtual;

  if (!dados.eventos || !dados.eventos.length) {
    lista.innerHTML = '<div class="agenda-vazio">Nenhum compromisso para este dia ✓</div>';
    return;
  }

  // Deduplica: mesma reuniao (subject + hora) agrupa participantes
  const dedup = {};
  dados.eventos.forEach(e => {
    const key = e.hora + "|" + e.subject.trim().toLowerCase();
    if (!dedup[key]) dedup[key] = { ...e, pessoas: [e.nome] };
    else if (!dedup[key].pessoas.includes(e.nome)) dedup[key].pessoas.push(e.nome);
  });

  let html = "";
  if (agendaViewMode === "horario") {
    const grupos = {};
    Object.values(dedup).forEach(e => { (grupos[e.hora] = grupos[e.hora] || []).push(e); });
    for (const hora of Object.keys(grupos).sort()) {
      html += `<div class="agenda-hora-block"><div class="agenda-hora-header">${hora}h</div>`;
      for (const ev of grupos[hora]) {
        const local = ev.local ? `<div class="agenda-evento-local">${iconeLocal(ev.local)} ${ev.local}</div>` : "";
        const pessoas = ev.pessoas.map(p => `<span class="agenda-evento-pessoa">${p}</span>`).join("");
        html += `<div class="agenda-evento">
          <div class="agenda-evento-pessoas">${pessoas}</div>
          <div class="agenda-evento-info">
            <div class="agenda-evento-subject">${ev.subject}</div>
            ${local}<div class="agenda-evento-fim">ate ${ev.fim}</div>
          </div></div>`;
      }
      html += "</div>";
    }
  } else {
    const porPessoa = {};
    dados.eventos.forEach(e => {
      porPessoa[e.nome] = porPessoa[e.nome] || {};
      porPessoa[e.nome][e.hora + "|" + e.subject.toLowerCase().trim()] = e;
    });
    const ordem = USUARIOS.map(u => u.nome);
    Object.keys(porPessoa)
      .sort((a, b) => (ordem.indexOf(a) === -1 ? 999 : ordem.indexOf(a)) - (ordem.indexOf(b) === -1 ? 999 : ordem.indexOf(b)))
      .forEach(nome => {
        const evs = Object.values(porPessoa[nome]).sort((a, b) => a.hora.localeCompare(b.hora));
        html += `<div class="agenda-hora-block">
          <div class="agenda-hora-header" style="color:#94a3b8;font-size:.85rem;font-family:inherit;letter-spacing:.02em">${nome}</div>`;
        evs.forEach(ev => {
          const local = ev.local ? `<div class="agenda-evento-local">${iconeLocal(ev.local)} ${ev.local}</div>` : "";
          html += `<div class="agenda-evento">
            <div style="flex-shrink:0;min-width:52px;font-family:'Courier New',monospace;font-size:.8rem;color:#38bdf8;font-weight:700;align-self:center">${ev.hora}h</div>
            <div class="agenda-evento-info">
              <div class="agenda-evento-subject">${ev.subject}</div>
              ${local}<div class="agenda-evento-fim">ate ${ev.fim}</div>
            </div></div>`;
        });
        html += "</div>";
      });
  }
  lista.innerHTML = html;
}

async function copiarAgenda() {
  const dados = agendaCache[agendaDataAtual];
  if (!dados || !dados.eventos) return;
  const porPessoa = {};
  dados.eventos.forEach(e => {
    porPessoa[e.nome] = porPessoa[e.nome] || {};
    porPessoa[e.nome][e.hora + "|" + e.subject.toLowerCase().trim()] = e;
  });
  const ordem = USUARIOS.map(u => u.nome);
  const pessoas = Object.keys(porPessoa)
    .sort((a, b) => (ordem.indexOf(a) === -1 ? 999 : ordem.indexOf(a)) - (ordem.indexOf(b) === -1 ? 999 : ordem.indexOf(b)));
  let texto = dados.dayLabel + "\n\n";
  pessoas.forEach(nome => {
    const evs = Object.values(porPessoa[nome]).sort((a, b) => a.hora.localeCompare(b.hora));
    texto += nome + "\n";
    evs.forEach(e => { texto += e.hora + "h – " + e.subject + "\n"; });
    texto += "\n";
  });
  try {
    await navigator.clipboard.writeText(texto.trim());
    const btn = document.getElementById("btn-copiar");
    if (btn) { btn.textContent = "✓ Copiado!"; setTimeout(() => btn.innerHTML = "&#128203; Copiar", 2000); }
  } catch (e) { console.error(e); }
}

function imprimirAgenda() {
  const label = document.getElementById("agenda-data-label");
  const printLabel = document.getElementById("print-data-label");
  if (printLabel && label) printLabel.textContent = label.textContent;
  window.print();
}

/* ================================================================
   INIT
================================================================ */
(function init() {
  inicializarFiltro();
  buscarDados();
  setInterval(buscarDados, CONFIG.intervaloAtualizacao);
})();

document.addEventListener("keydown", e => {
  if (e.key === "Escape") { fecharModal(); fecharFiltroDropdown(); }
});
