// ===================================================================
// app.js — Renderização, navegação, interações e inicialização
// Demo 100% local — todas as edições ficam só na memória do navegador.
// ===================================================================

const ANO_ATUAL = 2026;
let currentKpiId = null;
let drawerMetaId = null;
let drawerCurrentTab = 'dados';
let editingProjId = null;
let currentView = 'index';   // 'index' | 'kpi' | 'users'
let editingUserEmail = null; // null = novo usuário

// ── Toast ─────────────────────────────────────────────────────────
let toastTimer;
function toast(msg, tipo = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'on ' + tipo;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 3200);
}

// ── initApp — chamado por auth.js após login bem-sucedido ─────────
function initApp() {
  const u = DB.usuario;
  document.getElementById('lo').style.display = 'none';
  document.getElementById('app').classList.add('on');
  document.getElementById('hdr-logo').src = LOGO_B64;
  document.getElementById('hdr-uname').textContent = u.nome;
  const roleLabels = { 'Admin':'Administrador', 'DiretorN1':'Diretoria', 'Responsavel':'Responsável' };
  document.getElementById('hdr-urole').textContent = roleLabels[u.perfil] || 'Responsável';
  document.getElementById('hdr-avatar').textContent = u.nome.charAt(0).toUpperCase();
  renderNav();
  showIndex();
}

// ── Navegação ─────────────────────────────────────────────────────
function renderNav() {
  const kpis = allowedKPIs();
  const areas = {};
  for (const k of kpis) (areas[k.area] = areas[k.area] || []).push(k);

  let html = '';
  for (const [area, list] of Object.entries(areas)) {
    html += `<div class="nav-area open">
      <div class="nav-area-hd" onclick="toggleArea(this)">
        <span>${areaLabel(area)}</span><span class="nav-area-arrow">▶</span>
      </div>
      <div class="nav-area-cnt">`;
    for (const k of list) {
      html += `<div class="nav-kpi${currentKpiId===k.id?' sel':''}" onclick="showKPI('${k.id}')">
        <span class="nav-kpi-code">${k.codigo}</span>
        <span class="nav-kpi-name">${k.nome.replace('KPI ','')}</span>
        <span class="nav-kpi-dot"></span>
      </div>`;
    }
    html += `</div></div>`;
  }
  if (isAdmin()) {
    html += `<div class="nav-admin-sep"></div>
      <div class="nav-kpi nav-admin-link${currentView==='users'?' sel':''}" onclick="showUsersAdmin()">
        <span class="nav-kpi-code" style="font-size:13px">⚙</span>
        <span class="nav-kpi-name">Gerenciar acessos</span>
      </div>`;
  }
  document.getElementById('nav-inner').innerHTML = html;
}

function toggleArea(el) {
  el.parentElement.classList.toggle('open');
}

function highlightNav(kpiId) {
  document.querySelectorAll('.nav-kpi').forEach(el => el.classList.remove('sel'));
  if (kpiId) {
    const active = document.querySelector(`.nav-kpi[onclick*="${kpiId}"]`);
    if (active) active.classList.add('sel');
  }
}

// ── View: Index ───────────────────────────────────────────────────
function showIndex() {
  currentKpiId = null;
  currentView = 'index';
  document.getElementById('view-kpi').classList.remove('on');
  document.getElementById('view-users').classList.remove('on');
  document.getElementById('view-index').classList.add('on');
  highlightNav(null);
  setBreadcrumb([{ label: 'Início' }]);

  const u = SESSION;
  document.getElementById('welcome-msg').textContent =
    canSeeAll() ? 'Painel de Metas Corporativas' : `Olá, ${u.nome.split(' ')[0]}`;
  document.getElementById('welcome-sub').textContent =
    canSeeAll() ? 'Visão consolidada de todos os indicadores.' : 'Seus indicadores e metas de responsabilidade.';

  const kpis = allowedKPIs();
  const areas = {};
  for (const k of kpis) (areas[k.area] = areas[k.area] || []).push(k);

  let html = '';
  for (const [area, list] of Object.entries(areas)) {
    html += `<div class="index-area">
      <div class="index-area-title">${areaLabel(area)}</div>
      <div class="kpi-cards-grid">`;
    for (const k of list) {
      const { totalPontuacao, ultimoMes } = calcKPI(k.id, ANO_ATUAL);
      const cls = scoreClass(totalPontuacao);
      const pctDisplay = (totalPontuacao * 100).toFixed(1) + '%';
      const barWidth = Math.min(100, totalPontuacao * 100).toFixed(1);
      const periodo = ultimoMes > 0 ? `Até ${MESES_ABREV[ultimoMes-1]}/2026` : 'Sem realizado';
      html += `<div class="kpi-index-card" onclick="showKPI('${k.id}')">
        <div class="kic-code">${k.codigo}</div>
        <div class="kic-name">${k.nome}</div>
        <div class="kic-info">
          <div class="kic-resp">Resp.: <strong>${kpiResps(k)}</strong></div>
          <div>${k.diretoria}</div>
        </div>
        <div class="kic-score">
          <div class="kic-score-bar"><div class="kic-score-fill ${cls}" style="width:${barWidth}%"></div></div>
          <div class="kic-score-val ${cls}">${pctDisplay} · ${periodo}</div>
        </div>
      </div>`;
    }
    html += `</div></div>`;
  }
  document.getElementById('index-areas').innerHTML = html;
}

// ── View: KPI Detail ──────────────────────────────────────────────
function showKPI(kpiId) {
  const kpi = DB.kpis.find(k => k.id === kpiId);
  if (!kpi || !canSeeKPI(kpi)) return;

  currentKpiId = kpiId;
  currentView = 'kpi';
  document.getElementById('view-index').classList.remove('on');
  document.getElementById('view-users').classList.remove('on');
  document.getElementById('view-kpi').classList.add('on');
  highlightNav(kpiId);
  setBreadcrumb([
    { label: 'Início', action: 'showIndex()' },
    { label: areaLabel(kpi.area), action: 'showIndex()' },
    { label: kpi.codigo + ' · ' + kpi.nome.replace('KPI ','') },
  ]);

  document.getElementById('kpi-code-hd').textContent = kpi.codigo;
  document.getElementById('kpi-name-hd').textContent = kpi.nome;
  document.getElementById('kpi-resp-hd').textContent = kpiResps(kpi);
  document.getElementById('kpi-dir-hd').textContent  = kpi.diretoria;
  document.getElementById('kpi-area-hd').textContent = areaLabel(kpi.area);
  document.getElementById('btn-edit-kpi').style.display = isAdmin() ? '' : 'none';

  const { totalPontuacao, resultados, ultimoMes } = calcKPI(kpiId, ANO_ATUAL);
  document.getElementById('kpi-periodo-hd').textContent =
    ultimoMes > 0 ? `Jan – ${MESES_ABREV[ultimoMes-1]} 2026 (acumulado)` : 'Jan – Dez 2026';

  renderCards(totalPontuacao, resultados, ultimoMes);
  renderMetasTable(resultados, kpi);
  renderProjTable(kpiId, kpi);
}

// ── Cards ─────────────────────────────────────────────────────────
function renderCards(totalPontuacao, resultados, ultimoMes) {
  const cls = scoreClass(totalPontuacao);
  const pctDisplay = (totalPontuacao * 100).toFixed(1) + '%';
  const barW = Math.min(100, totalPontuacao * 100).toFixed(1);
  const periodo = ultimoMes > 0 ? `Acum. até ${MESES_ABREV[ultimoMes-1]}/2026` : 'Sem realizado apurado';

  let html = `<div class="card-total">
    <div class="ct-label">Pontuação total do indicador</div>
    <div class="ct-pct">${pctDisplay}</div>
    <div class="ct-sub">${periodo}</div>
    <div class="ct-bar"><div class="ct-bar-fill" style="width:${barW}%"></div></div>
  </div>`;

  for (const r of resultados) {
    const cls2 = scoreClass(r.scoringAt);
    const atDisplay = r.atingimento !== null ? fmtPct(r.atingimento) : '—';
    const barW2 = r.scoringAt !== null ? Math.min(100, r.scoringAt * 100).toFixed(1) : 0;
    const pts = (r.pontuacao * 100).toFixed(1) + '%';
    html += `<div class="card-meta" onclick="openDrawer('${r.meta.id}')">
      <div class="cm-num">Meta ${r.meta.seq}</div>
      <div class="cm-name">${r.meta.nome}</div>
      <div class="cm-pct ${cls2}">${atDisplay}</div>
      <div class="cm-bar"><div class="cm-bar-fill ${cls2}" style="width:${barW2}%"></div></div>
      <div class="cm-foot">
        <span>Peso: ${(r.meta.peso * 100).toFixed(0)}%</span>
        <span>${r.meta.bom_quando === 'maior' ? 'Maior' : 'Menor'}</span>
      </div>
      <div class="cm-pts">Pts: ${pts}</div>
    </div>`;
  }

  document.getElementById('kpi-cards-row').innerHTML = html;
  document.getElementById('metas-periodo-sub').textContent =
    ultimoMes > 0 ? `Acumulado Jan – ${MESES_ABREV[ultimoMes-1]}/2026` : 'Sem realizado apurado';
}

// ── Tabela de Metas ───────────────────────────────────────────────
function renderMetasTable(resultados, kpi) {
  const canEdit = isAdmin() || (kpi.responsaveis||[]).includes(SESSION.responsavel);

  document.getElementById('sec-btns-metas').innerHTML = canEdit
    ? `<button class="sec-btn" onclick="openDrawer(null,'${kpi.id}')">+ Nova meta</button>`
    : '';

  if (!resultados.length) {
    document.getElementById('metas-tbody').innerHTML =
      '<tr><td colspan="10"><div class="empty-state"><div class="empty-state-icon">[graf]</div><div class="empty-state-t">Nenhuma meta cadastrada</div></div></td></tr>';
    return;
  }

  let rows = '';
  for (const r of resultados) {
    const m = r.meta;
    const cls = scoreClass(r.scoringAt);
    const atDisplay = r.atingimento !== null ? fmtPct(r.atingimento) : '—';
    const metaFmt = r.metaAc !== null ? fmt(r.metaAc, m.tipo_formato) : '—';
    const realFmt = r.realAc !== null ? fmt(r.realAc, m.tipo_formato) : '—';
    const pts = (r.pontuacao * 100).toFixed(1) + '%';
    const bomHtml = m.bom_quando === 'maior'
      ? `<span class="bom-badge bom-maior">Maior</span>`
      : `<span class="bom-badge bom-menor">Menor</span>`;

    // Dots mensais
    const { registros } = getMesesComRealizado(m.id, ANO_ATUAL);
    const regMap = {};
    for (const reg of registros) regMap[reg.mes] = reg;
    let dots = '<div class="month-dots">';
    for (let mes = 1; mes <= 12; mes++) {
      const reg = regMap[mes];
      let dotCls = 'mdot';
      let title = MESES_ABREV[mes-1];
      if (!reg || reg.valor_meta == null) {
        // sem meta — bolinha neutra
      } else if (reg.valor_realizado != null) {
        dotCls += ' real';
        title += `: ${fmt(reg.valor_realizado, m.tipo_formato)}`;
      } else {
        dotCls += ' meta';
      }
      dots += `<span class="${dotCls}" title="${title}"></span>`;
    }
    dots += '</div>';

    const editBtn = canEdit
      ? `<button class="tbl-btn" onclick="openDrawer('${m.id}')">Editar</button>`
      : '';

    rows += `<tr>
      <td class="tbl-c" style="color:#bbb;font-weight:700">${m.seq}</td>
      <td>
        <div class="tbl-meta-name">${m.nome}</div>
        <div class="tbl-meta-desc">${m.descricao}</div>
      </td>
      <td class="tbl-c">${bomHtml}</td>
      <td class="tbl-peso">${(m.peso * 100).toFixed(0)}%</td>
      <td class="tbl-r">${metaFmt}</td>
      <td class="tbl-r">${realFmt}</td>
      <td class="tbl-pct ${cls}">${atDisplay}</td>
      <td class="tbl-pts">${pts}</td>
      <td>${dots}</td>
      <td class="tbl-c">${editBtn}</td>
    </tr>`;
  }
  document.getElementById('metas-tbody').innerHTML = rows;
}

// ── Tabela de Projetos ────────────────────────────────────────────
function renderProjTable(kpiId, kpi) {
  const canEdit = isAdmin() || (kpi.responsaveis||[]).includes(SESSION.responsavel);
  document.getElementById('sec-btns-proj').innerHTML = canEdit
    ? `<button class="sec-btn primary" onclick="openProjModal(null,'${kpiId}')">+ Novo projeto</button>`
    : '';

  const projs = DB.projetos.filter(p => p.id_kpi === kpiId && p.ativo);
  if (!projs.length) {
    document.getElementById('proj-tbody').innerHTML =
      '<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">[lista]</div><div class="empty-state-t">Nenhum projeto cadastrado</div></div></td></tr>';
    return;
  }

  let rows = '';
  for (const p of projs) {
    const metaVinc = DB.metas.find(m => m.id === p.id_meta);
    const stCls = statusBadgeClass(p.status);
    const prCls = prioBadgeClass(p.prioridade);
    const actionBtns = canEdit
      ? `<button class="tbl-btn" onclick="openProjModal('${p.id}')">Editar</button>
         <button class="tbl-btn-del" onclick="deleteProject('${p.id}')" title="Excluir projeto">x</button>`
      : '';
    rows += `<tr>
      <td>
        <div class="proj-name">${p.nome}</div>
        <div class="proj-meta-link">${p.responsavel}</div>
      </td>
      <td style="font-size:11px;color:#888">${metaVinc ? `Meta ${metaVinc.seq} · ${metaVinc.nome}` : '—'}</td>
      <td class="tbl-c"><span class="status-badge ${stCls}">${p.status}</span></td>
      <td class="tbl-c"><span class="prio-badge ${prCls}">${p.prioridade}</span></td>
      <td class="tbl-c" style="font-size:11px;white-space:nowrap">${fmtPrazo(p.prazo)}</td>
      <td>
        <div class="prog-wrap">
          <div class="prog-val">${p.percentual_evolucao}%</div>
          <div class="prog-bar"><div class="prog-fill" style="width:${p.percentual_evolucao}%"></div></div>
        </div>
      </td>
      <td style="font-size:11px;max-width:200px">${p.proxima_acao || '—'}</td>
      <td class="tbl-c" style="white-space:nowrap">${actionBtns}</td>
    </tr>`;
  }
  document.getElementById('proj-tbody').innerHTML = rows;
}

// ── Drawer de Edição de Meta ──────────────────────────────────────
function openDrawer(metaId, kpiId) {
  let meta = metaId ? DB.metas.find(m => m.id === metaId) : null;

  if (!meta) {
    // Nova meta — cria objeto em memória e 12 registros mensais vazios
    if (!kpiId) return;
    const kpi = DB.kpis.find(k => k.id === kpiId);
    if (!kpi) return;
    const existingSeqs = DB.metas.filter(m => m.id_kpi === kpiId).map(m => m.seq);
    const nextSeq = existingSeqs.length ? Math.max(...existingSeqs) + 1 : 1;
    const newId = uid('m');
    meta = {
      id: newId, id_kpi: kpiId, codigo_kpi: kpi.codigo, seq: nextSeq,
      nome: '', descricao: '', responsavel: (kpi.responsaveis||[])[0] || '',
      diretoria: kpi.diretoria || '', tipo_formato: 'percentual',
      unidade_medida: '%', bom_quando: 'maior', peso: 0.5,
      formula_atingimento: 'real_sobre_meta', tipo_acumulado: 'soma',
      status: 'Ativa', obs: '', ult_at: new Date().toLocaleDateString('pt-BR'),
      ativo: true, _isNew: true,
    };
    DB.metas.push(meta);
    for (let mes = 1; mes <= 12; mes++) {
      DB.metasMensais.push({
        id: `mm-${newId}-${mes}`, id_meta: newId, ano: ANO_ATUAL,
        mes, valor_meta: null, valor_realizado: null,
      });
    }
  }

  drawerMetaId = meta.id;
  document.getElementById('drw-title').textContent = meta._isNew ? 'Nova meta' : 'Editar meta';
  document.getElementById('drw-sub').textContent = meta._isNew
    ? `${meta.codigo_kpi} · Meta ${meta.seq} (nova)`
    : `${meta.codigo_kpi} · Meta ${meta.seq}`;
  document.getElementById('drw-nome').value      = meta.nome;
  document.getElementById('drw-resp').value      = meta.responsavel;
  document.getElementById('drw-desc').value      = meta.descricao || '';
  document.getElementById('drw-formato').value   = meta.tipo_formato;
  document.getElementById('drw-bom').value       = meta.bom_quando;
  document.getElementById('drw-formula').value   = meta.formula_atingimento || 'real_sobre_meta';
  document.getElementById('drw-acumulado').value = meta.tipo_acumulado || 'soma';
  document.getElementById('drw-peso').value      = meta.peso;
  document.getElementById('drw-status').value    = meta.status || 'Ativa';
  document.getElementById('drw-obs').value       = meta.obs || '';
  document.getElementById('drw-ult-at').value    = meta.ult_at || '—';

  buildMonthGrids(meta);
  switchDrawerTab('dados', null);

  const delBtn = document.getElementById('btn-meta-delete');
  delBtn.style.display = (!meta._isNew && canEditMeta(meta)) ? '' : 'none';

  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('on');
}

function buildMonthGrids(meta) {
  const registros = DB.metasMensais.filter(m => m.id_meta === meta.id && m.ano === ANO_ATUAL);
  const regMap = {};
  for (const r of registros) regMap[r.mes] = r;

  let metaHtml = '', realHtml = '';
  for (let mes = 1; mes <= 12; mes++) {
    const r = regMap[mes] || {};
    const mv = r.valor_meta != null ? r.valor_meta : '';
    const rv = r.valor_realizado != null ? r.valor_realizado : '';
    const mvDisplay = mv !== '' ? String(mv).replace('.', ',') : '';
    const rvDisplay = rv !== '' ? String(rv).replace('.', ',') : '';
    metaHtml += `<div class="mi">
      <label>${MESES_ABREV[mes-1]}</label>
      <input type="text" data-mes="${mes}" data-type="meta" value="${mvDisplay}" placeholder="—">
    </div>`;
    realHtml += `<div class="mi">
      <label>${MESES_ABREV[mes-1]}</label>
      <input type="text" data-mes="${mes}" data-type="real" value="${rvDisplay}" class="${rvDisplay?'has-val':''}" placeholder="—"
        oninput="this.classList.toggle('has-val', this.value!='')">
    </div>`;
  }
  document.getElementById('drw-meta-grid').innerHTML = metaHtml;
  document.getElementById('drw-real-grid').innerHTML = realHtml;
  updateDrawerResumo(meta);
}

function updateDrawerResumo(meta) {
  const { metaAc, realAc, atingimento, scoringAt, pontuacao, ultimoMes } = calcMeta(meta, ANO_ATUAL);
  const at = atingimento !== null ? fmtPct(atingimento) : '—';
  const cls = scoreClass(scoringAt);
  const cor = cls === 'ok' ? 'var(--ok)' : cls === 'warn' ? 'var(--warn)' : 'var(--err)';
  document.getElementById('drw-resumo').innerHTML = `
    <b>Meta acumulada:</b> ${fmt(metaAc, meta.tipo_formato)}<br>
    <b>Realizado acumulado:</b> ${fmt(realAc, meta.tipo_formato)}<br>
    <b>Atingimento:</b> <span style="color:${cor}">${at}</span><br>
    <b>Pontuação ponderada:</b> ${(pontuacao*100).toFixed(1)}% (peso ${(meta.peso*100).toFixed(0)}%)<br>
    <b>Último mês apurado:</b> ${ultimoMes > 0 ? MESES_ABREV[ultimoMes-1]+'/2026' : 'Nenhum'}
  `;
}

function switchDrawerTab(tab, btn) {
  drawerCurrentTab = tab;
  document.querySelectorAll('.drw-tab').forEach(b => b.classList.remove('on'));
  if (btn) {
    btn.classList.add('on');
  } else {
    const btns = document.querySelectorAll('.drw-tab');
    const idx = ['dados','realizado','obs'].indexOf(tab);
    if (btns[idx]) btns[idx].classList.add('on');
  }
  document.getElementById('drw-tab-dados').style.display     = tab === 'dados'     ? '' : 'none';
  document.getElementById('drw-tab-realizado').style.display = tab === 'realizado' ? '' : 'none';
  document.getElementById('drw-tab-obs').style.display       = tab === 'obs'       ? '' : 'none';
}

function closeDrawer() {
  // Se era nova meta não salva → remove do estado para não poluir
  if (drawerMetaId) {
    const m = DB.metas.find(x => x.id === drawerMetaId);
    if (m && m._isNew) {
      DB.metas = DB.metas.filter(x => x.id !== drawerMetaId);
      DB.metasMensais = DB.metasMensais.filter(x => x.id_meta !== drawerMetaId);
    }
  }
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('on');
  drawerMetaId = null;
}

function saveDrawer() {
  if (!drawerMetaId) return;
  const meta = DB.metas.find(m => m.id === drawerMetaId);
  if (!meta) return;

  if (!canEditMeta(meta)) { toast('Sem permissão para editar esta meta.', 'err'); return; }

  const isNew = !!meta._isNew;
  const before = JSON.parse(JSON.stringify(meta));

  const novoNome = document.getElementById('drw-nome').value.trim();
  if (isNew && !novoNome) { toast('Preencha o nome da meta antes de salvar.', 'warn'); return; }

  meta.nome                = novoNome || meta.nome;
  meta.responsavel         = document.getElementById('drw-resp').value.trim() || meta.responsavel;
  meta.descricao           = document.getElementById('drw-desc').value.trim();
  meta.tipo_formato        = document.getElementById('drw-formato').value;
  meta.bom_quando          = document.getElementById('drw-bom').value;
  meta.formula_atingimento = document.getElementById('drw-formula').value;
  meta.tipo_acumulado      = document.getElementById('drw-acumulado').value;
  meta.peso                = parseFloat(document.getElementById('drw-peso').value) || meta.peso;
  meta.status              = document.getElementById('drw-status').value;
  meta.obs                 = document.getElementById('drw-obs').value;
  meta.ult_at              = new Date().toLocaleDateString('pt-BR');

  // Salva valores mensais (meta e realizado)
  for (const inp of document.querySelectorAll('#drw-meta-grid input')) {
    const mes = parseInt(inp.dataset.mes);
    const val = parseInput(inp.value);
    const reg = DB.metasMensais.find(r => r.id_meta === meta.id && r.ano === ANO_ATUAL && r.mes === mes);
    if (reg && reg.valor_meta !== val) {
      addLog('UPDATE', 'metas_mensais', reg.id, 'valor_meta', reg.valor_meta, val);
      reg.valor_meta = val;
    }
  }
  for (const inp of document.querySelectorAll('#drw-real-grid input')) {
    const mes = parseInt(inp.dataset.mes);
    const val = parseInput(inp.value);
    const reg = DB.metasMensais.find(r => r.id_meta === meta.id && r.ano === ANO_ATUAL && r.mes === mes);
    if (reg && reg.valor_realizado !== val) {
      addLog('UPDATE', 'metas_mensais', reg.id, 'valor_realizado', reg.valor_realizado, val);
      reg.valor_realizado = val;
    }
  }

  if (before.nome        !== meta.nome)        addLog('UPDATE', 'metas', meta.id, 'nome',        before.nome,        meta.nome);
  if (before.responsavel !== meta.responsavel) addLog('UPDATE', 'metas', meta.id, 'responsavel', before.responsavel, meta.responsavel);
  if (before.peso        !== meta.peso)        addLog('UPDATE', 'metas', meta.id, 'peso',        before.peso,        meta.peso);

  delete meta._isNew;
  closeDrawer();
  toast(isNew ? 'Nova meta criada com sucesso!' : 'Meta salva com sucesso!', 'ok');
  if (currentKpiId) showKPI(currentKpiId);
}

// ── Excluir Meta ──────────────────────────────────────────────────
function deleteMeta(metaId) {
  const meta = DB.metas.find(m => m.id === metaId);
  if (!meta) return;
  if (!canEditMeta(meta)) { toast('Sem permissão para excluir esta meta.', 'err'); return; }

  const projsVinc = DB.projetos.filter(p => p.id_meta === metaId && p.ativo);
  const aviso = projsVinc.length
    ? `\n\nAtenção: ${projsVinc.length} projeto(s) vinculado(s) ficarão sem meta.`
    : '';
  if (!confirm(`Excluir a meta "${meta.nome}"?${aviso}`)) return;

  DB.metas = DB.metas.filter(m => m.id !== metaId);
  DB.metasMensais = DB.metasMensais.filter(mm => mm.id_meta !== metaId);
  addLog('DELETE', 'metas', metaId, 'nome', meta.nome, 'excluída');

  toast('Meta excluída.', '');
  if (currentKpiId) showKPI(currentKpiId);
}

function deleteMetaFromDrawer() {
  if (!drawerMetaId) return;
  const id = drawerMetaId;
  const m = DB.metas.find(x => x.id === id);
  if (m && m._isNew) { closeDrawer(); return; }
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('on');
  drawerMetaId = null;
  deleteMeta(id);
}

// ── Modal Editar Indicador ────────────────────────────────────────
function openKpiEdit() {
  if (!currentKpiId) return;
  const kpi = DB.kpis.find(k => k.id === currentKpiId);
  if (!kpi) return;
  document.getElementById('kpi-edit-nome').value = kpi.nome;
  document.getElementById('kpi-edit-resp').value = (kpi.responsaveis||[]).join(', ');
  document.getElementById('kpi-edit-dir').value  = kpi.diretoria;
  document.getElementById('kpi-edit-area').value = kpi.area;
  document.getElementById('kpi-edit-modal').classList.add('on');
}

function closeKpiEdit() {
  document.getElementById('kpi-edit-modal').classList.remove('on');
}

function saveKpiEdit() {
  if (!currentKpiId) return;
  const kpi = DB.kpis.find(k => k.id === currentKpiId);
  if (!kpi) return;

  const nome = document.getElementById('kpi-edit-nome').value.trim();
  const resp = document.getElementById('kpi-edit-resp').value.trim();
  const dir  = document.getElementById('kpi-edit-dir').value.trim();
  const area = document.getElementById('kpi-edit-area').value.trim();

  if (!nome) { toast('Nome do indicador é obrigatório.', 'warn'); return; }

  kpi.nome         = nome;
  kpi.responsaveis = resp ? resp.split(',').map(s => s.trim()).filter(Boolean) : [];
  kpi.diretoria    = dir;
  kpi.area         = area;

  closeKpiEdit();
  toast('Indicador atualizado!', 'ok');
  renderNav();
  showKPI(currentKpiId);
}

// ── Modal de Projeto ──────────────────────────────────────────────
function openProjModal(projId, kpiId) {
  editingProjId = projId || null;
  const kpi = DB.kpis.find(k => k.id === (kpiId || currentKpiId));
  const canEdit = isAdmin() || (kpi && (kpi.responsaveis||[]).includes(SESSION.responsavel));

  const metas = DB.metas.filter(m => m.id_kpi === (kpiId || currentKpiId) && m.ativo);
  let metaOpts = '<option value="">— Selecione a meta vinculada —</option>';
  for (const m of metas) metaOpts += `<option value="${m.id}">Meta ${m.seq} · ${m.nome}</option>`;
  document.getElementById('proj-meta-sel').innerHTML = metaOpts;

  if (projId) {
    const p = DB.projetos.find(x => x.id === projId);
    if (!p) return;
    document.getElementById('modal-title').textContent = 'Editar projeto';
    document.getElementById('proj-id').value        = p.id;
    document.getElementById('proj-nome').value      = p.nome;
    document.getElementById('proj-desc').value      = p.descricao;
    document.getElementById('proj-meta-sel').value  = p.id_meta;
    document.getElementById('proj-resp').value      = p.responsavel;
    document.getElementById('proj-status').value    = p.status;
    document.getElementById('proj-prio').value      = p.prioridade;
    document.getElementById('proj-prazo').value     = p.prazo;
    document.getElementById('proj-pct').value       = p.percentual_evolucao;
    document.getElementById('proj-resp-acao').value = p.responsavel_acao || '';
    document.getElementById('proj-prox-acao').value = p.proxima_acao || '';
    document.getElementById('proj-obs').value       = p.obs || '';
  } else {
    document.getElementById('modal-title').textContent = 'Novo projeto';
    document.getElementById('proj-id').value        = '';
    document.getElementById('proj-nome').value      = '';
    document.getElementById('proj-desc').value      = '';
    document.getElementById('proj-resp').value      = kpi ? kpiResps(kpi) : SESSION.nome;
    document.getElementById('proj-status').value    = 'Não iniciado';
    document.getElementById('proj-prio').value      = 'Média';
    document.getElementById('proj-prazo').value     = '';
    document.getElementById('proj-pct').value       = 0;
    document.getElementById('proj-resp-acao').value = '';
    document.getElementById('proj-prox-acao').value = '';
    document.getElementById('proj-obs').value       = '';
  }
  document.getElementById('btn-proj-delete').style.display = (projId && canEdit) ? '' : 'none';
  document.getElementById('proj-modal').classList.add('on');
}

function closeModal() {
  document.getElementById('proj-modal').classList.remove('on');
  editingProjId = null;
}

function saveProject() {
  const nome = document.getElementById('proj-nome').value.trim();
  const metaId = document.getElementById('proj-meta-sel').value;
  if (!nome) { toast('Informe o nome do projeto.', 'err'); return; }
  if (!metaId) { toast('Selecione a meta vinculada.', 'err'); return; }

  if (editingProjId) {
    const p = DB.projetos.find(x => x.id === editingProjId);
    if (!p) return;
    p.nome                = nome;
    p.descricao           = document.getElementById('proj-desc').value;
    p.id_meta             = metaId;
    p.responsavel         = document.getElementById('proj-resp').value;
    p.status              = document.getElementById('proj-status').value;
    p.prioridade          = document.getElementById('proj-prio').value;
    p.prazo               = document.getElementById('proj-prazo').value;
    p.percentual_evolucao = parseInt(document.getElementById('proj-pct').value) || 0;
    p.responsavel_acao    = document.getElementById('proj-resp-acao').value;
    p.proxima_acao        = document.getElementById('proj-prox-acao').value;
    p.obs                 = document.getElementById('proj-obs').value;
    addLog('UPDATE', 'projetos', p.id, 'status', '', p.status);
    toast('Projeto atualizado!', 'ok');
  } else {
    const newP = {
      id: uid('p'), id_meta: metaId, id_kpi: currentKpiId, nome,
      descricao:           document.getElementById('proj-desc').value,
      responsavel:         document.getElementById('proj-resp').value,
      status:              document.getElementById('proj-status').value,
      prazo:               document.getElementById('proj-prazo').value,
      percentual_evolucao: parseInt(document.getElementById('proj-pct').value) || 0,
      prioridade:          document.getElementById('proj-prio').value,
      proxima_acao:        document.getElementById('proj-prox-acao').value,
      responsavel_acao:    document.getElementById('proj-resp-acao').value,
      obs:                 document.getElementById('proj-obs').value,
      ativo: true,
    };
    DB.projetos.push(newP);
    addLog('INSERT', 'projetos', newP.id, 'nome', '', newP.nome);
    toast('Projeto criado!', 'ok');
  }

  closeModal();
  if (currentKpiId) {
    const kpi = DB.kpis.find(k => k.id === currentKpiId);
    renderProjTable(currentKpiId, kpi);
  }
}

// ── Excluir Projeto ───────────────────────────────────────────────
function deleteProject(projId) {
  const p = DB.projetos.find(x => x.id === projId);
  if (!p) return;
  if (!confirm(`Excluir o projeto "${p.nome}"?`)) return;

  DB.projetos = DB.projetos.filter(x => x.id !== projId);
  addLog('DELETE', 'projetos', projId, 'nome', p.nome, 'excluído');

  toast('Projeto excluído.', '');
  const kpi = DB.kpis.find(k => k.id === currentKpiId);
  if (kpi) renderProjTable(currentKpiId, kpi);
}

function deleteProjectFromModal() {
  const projId = document.getElementById('proj-id').value;
  if (!projId) return;
  closeModal();
  deleteProject(projId);
}

// ── Breadcrumb ────────────────────────────────────────────────────
function setBreadcrumb(items) {
  let html = '';
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (i > 0) html += '<span>›</span>';
    if (it.action) html += `<a onclick="${it.action}">${it.label}</a>`;
    else           html += `<span style="color:#888">${it.label}</span>`;
  }
  document.getElementById('breadcrumb').innerHTML = html;
}

// ── Gerenciamento de Usuários (Admin) ─────────────────────────────
function showUsersAdmin() {
  if (!isAdmin()) return;
  currentView = 'users';
  currentKpiId = null;
  document.getElementById('view-index').classList.remove('on');
  document.getElementById('view-kpi').classList.remove('on');
  document.getElementById('view-users').classList.add('on');
  renderNav();
  setBreadcrumb([{ label: 'Início', action: 'showIndex()' }, { label: 'Gerenciar acessos' }]);
  renderUsersTable(USUARIOS);
}

function renderUsersTable(users) {
  if (!users.length) {
    document.getElementById('users-tbody').innerHTML =
      '<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">[user]</div><div class="empty-state-t">Nenhum usuário cadastrado</div></div></td></tr>';
    return;
  }
  const PERFIL_LABEL = { Admin:'Administrador', DiretorN1:'Diretoria', Responsavel:'Responsável' };
  let rows = '';
  for (const u of users) {
    const perfil = PERFIL_LABEL[u.perfil] || u.perfil || '—';
    const statusBadge = u.ativo
      ? '<span class="usr-badge-on">Ativo</span>'
      : '<span class="usr-badge-off">Inativo</span>';

    let kpisHtml;
    if (u.perfil === 'Admin') {
      kpisHtml = '<span style="color:#888;font-size:11px">Todos (admin)</span>';
    } else if (u.perfil === 'DiretorN1') {
      kpisHtml = '<span style="color:#888;font-size:11px">Todos (leitura)</span>';
    } else {
      const kpisAcesso = DB.kpis.filter(k => (k.responsaveis || []).includes(u.responsavel));
      kpisHtml = kpisAcesso.length
        ? kpisAcesso.map(k => `<span class="usr-kpi-tag">${k.codigo}</span>`).join(' ')
        : '<span style="color:#aaa;font-size:11px">Nenhum</span>';
    }

    rows += `<tr>
      <td><strong>${u.nome}</strong></td>
      <td style="font-size:12px;color:#555">${u.email}</td>
      <td class="tbl-c"><span class="usr-badge-perfil">${perfil}</span></td>
      <td>${kpisHtml}</td>
      <td class="tbl-c">${statusBadge}</td>
      <td class="tbl-c"><button class="tbl-btn" onclick="openUserModal('${u.email}')">Editar</button></td>
    </tr>`;
  }
  document.getElementById('users-tbody').innerHTML = rows;
}

function openUserModal(emailOrNull) {
  editingUserEmail = emailOrNull;
  const isNew = !emailOrNull;

  document.getElementById('user-modal-title').textContent = isNew ? 'Novo usuário' : 'Editar usuário';
  document.getElementById('usr-pwd-hint').style.display = isNew ? 'none' : '';
  document.getElementById('btn-user-delete').style.display = isNew ? 'none' : '';

  if (isNew) {
    document.getElementById('usr-nome').value   = '';
    document.getElementById('usr-email').value  = '';
    document.getElementById('usr-pwd').value    = '';
    document.getElementById('usr-perfil').value = 'Responsavel';
    document.getElementById('usr-ativo').value  = 'true';
  } else {
    const u = USUARIOS.find(x => x.email === emailOrNull);
    if (!u) { toast('Usuário não encontrado.', 'err'); return; }
    document.getElementById('usr-nome').value   = u.nome  || '';
    document.getElementById('usr-email').value  = u.email || '';
    document.getElementById('usr-pwd').value    = '';
    document.getElementById('usr-perfil').value = u.perfil || 'Responsavel';
    document.getElementById('usr-ativo').value  = String(!!u.ativo);
  }

  onUserPerfilChange();
  document.getElementById('user-modal').classList.add('on');
}

function closeUserModal() {
  document.getElementById('user-modal').classList.remove('on');
  editingUserEmail = null;
}

function onUserPerfilChange() {
  const showKpis = document.getElementById('usr-perfil').value === 'Responsavel';
  document.getElementById('usr-kpis-section').style.display = showKpis ? '' : 'none';
  if (showKpis) buildKpiCheckboxes();
}

function buildKpiCheckboxes() {
  const nome = document.getElementById('usr-nome').value.trim() ||
    (editingUserEmail ? (USUARIOS.find(u=>u.email===editingUserEmail)||{}).responsavel || '' : '');

  const areas = {};
  for (const k of DB.kpis) {
    if (!k.ativo) continue;
    (areas[k.area] = areas[k.area] || []).push(k);
  }
  let html = '';
  for (const [area, list] of Object.entries(areas)) {
    html += `<div class="usr-kpi-area-label">${areaLabel(area)}</div><div class="usr-kpi-checks">`;
    for (const k of list) {
      const checked = nome && (k.responsaveis || []).includes(nome) ? 'checked' : '';
      html += `<label class="usr-kpi-check">
        <input type="checkbox" value="${k.id}" ${checked}>
        <span><strong>${k.codigo}</strong> ${k.nome.replace('KPI ','')}</span>
      </label>`;
    }
    html += '</div>';
  }
  document.getElementById('usr-kpis-list').innerHTML = html;
}

function saveUser() {
  const nome   = document.getElementById('usr-nome').value.trim();
  const email  = document.getElementById('usr-email').value.trim().toLowerCase();
  const senha  = document.getElementById('usr-pwd').value;
  const perfil = document.getElementById('usr-perfil').value;
  const ativo  = document.getElementById('usr-ativo').value === 'true';
  const isNew  = !editingUserEmail;

  if (!nome)  { toast('Informe o nome completo.', 'err'); return; }
  if (!email) { toast('Informe o e-mail.', 'err'); return; }
  if (isNew && !senha) { toast('Defina uma senha para o novo usuário.', 'err'); return; }

  const selectedKpiIds = perfil === 'Responsavel'
    ? [...document.querySelectorAll('#usr-kpis-list input[type=checkbox]:checked')].map(c => c.value)
    : [];

  const oldNome = editingUserEmail
    ? (USUARIOS.find(u => u.email === editingUserEmail) || {}).responsavel || ''
    : '';

  if (isNew) {
    if (USUARIOS.find(u => u.email === email)) { toast('E-mail já cadastrado.', 'err'); return; }
    USUARIOS.push({ email, nome, perfil, responsavel: nome, diretoria: '', senha, ativo });
  } else {
    const u = USUARIOS.find(x => x.email === editingUserEmail);
    if (u) { u.nome = nome; u.perfil = perfil; u.ativo = ativo; if (senha) u.senha = senha; }
  }

  // Atualiza os responsáveis dos indicadores conforme seleção
  for (const k of DB.kpis) {
    const tinha = (k.responsaveis || []).includes(oldNome || nome);
    const quer  = selectedKpiIds.includes(k.id);
    if (quer && !tinha)  k.responsaveis = [...(k.responsaveis||[]), nome];
    if (!quer && tinha)  k.responsaveis = (k.responsaveis||[]).filter(r => r !== (oldNome||nome));
  }

  closeUserModal();
  toast(isNew ? 'Usuário criado!' : 'Usuário atualizado!', 'ok');
  renderUsersTable(USUARIOS);
}

function deleteUserConfirm() {
  const email = editingUserEmail;
  if (!email) return;
  const u = USUARIOS.find(x => x.email === email) || { nome: email };
  if (!confirm(`Excluir o usuário "${u.nome}"?`)) return;

  const idx = USUARIOS.findIndex(x => x.email === email);
  if (idx >= 0) USUARIOS.splice(idx, 1);
  for (const k of DB.kpis) k.responsaveis = (k.responsaveis||[]).filter(r => r !== u.responsavel);

  closeUserModal();
  toast('Usuário removido.', '');
  renderUsersTable(USUARIOS);
}

// ── Inicialização ─────────────────────────────────────────────────
(function init() {
  const logoEl = document.getElementById('logo-img');
  if (logoEl) logoEl.src = LOGO_B64;
  document.getElementById('app').classList.remove('on');
})();
