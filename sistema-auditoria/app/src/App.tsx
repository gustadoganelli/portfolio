import { useEffect, useMemo, useState } from 'react'
import seedRaw from './data/seed.json'
import { iconComp } from './icons'
import {
  AlertTriangle, BookOpen, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight,
  ClipboardCheck, History, Info, Loader2, LogOut, MapPin, NotebookPen, Paperclip, Plus,
  RotateCcw, Star, User, X,
} from 'lucide-react'
import {
  carregarCatalogo, catalogoCache, confirmarAuditoria, entrar, getSessionUser,
  removerAnexoTmp, sair, uploadAnexo, type AnexoTmp, type Perfil,
} from './db'

// DADOS = catalogo (cache offline) com fallback no bundle (seed.json).
let DADOS: any = catalogoCache() || seedRaw

const COMPARAVEIS = ['SCORE', 'BOOLEANO', 'CLASSIFICACAO']
const STORAGE_KEY = 'auditoria_rascunho_v1'

const TIPO_LABEL: Record<string, string> = {
  SCORE: 'Nota', BOOLEANO: 'Sim / Nao', CLASSIFICACAO: 'Classificacao',
  TEXTO_RECOMENDACAO: 'Recomendacao', TEXTO_APONTAMENTO: 'Apontamento', TEXTO_ANOTACAO: 'Anotacao',
}
const SCORE_LEGEND: [string, string][] = [
  ['1', 'Critico'], ['2', 'Ruim'], ['3', 'Regular'], ['4', 'Bom'], ['5', 'Otimo'],
]
const CATEGORIAS = [
  'Ocupacional / Seguranca', 'Processual / Operacional', 'Financeiro / Patrimonial',
  'Documental / Conformidade', 'Estrutural / Infraestrutura', 'Ambiental', 'Outros',
]
const COR_RISCO: Record<string, string> = {
  'Critico': '#c0392b', 'Alto': '#c2660c', 'Medio': '#b9770a', 'Baixo': '#0b69c7',
}
const NC_VALUES = ['Vencido', 'Ausente', 'Nao conforme', 'Divergente']

// Sugestoes de comentario por nota (regua textual).
const SCORE_SUGESTOES: Record<number, string[]> = {
  1: ['Falhas graves; intervencao imediata necessaria.', 'Diversos problemas criticos comprometem o funcionamento.'],
  2: ['Varias falhas; melhorias significativas necessarias.', 'Nao atende ao padrao esperado.'],
  3: ['Atende parcialmente, com oportunidades claras de melhoria.', 'Condicoes razoaveis, mas com ajustes necessarios.'],
  4: ['Organizado e funcional, com pequenos ajustes pontuais.', 'Atende bem ao esperado.'],
  5: ['Em conformidade total, sem falhas.', 'Condicoes ideais, padrao plenamente atendido.'],
}

// ---------- helpers ----------
function lerStore(): any {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') } catch { return null }
}
const objFilled = (o: any) =>
  o && typeof o === 'object' &&
  Object.values(o).some((x: any) => x !== '' && x != null && !(Array.isArray(x) && x.length === 0))

function isAnswered(item: any, v: any): boolean {
  if (v == null) return false
  switch (item.tipo) {
    case 'SCORE': return typeof v === 'number'
    case 'BOOLEANO': return typeof v === 'boolean'
    case 'CLASSIFICACAO': return Array.isArray(v) ? v.some(objFilled) : objFilled(v)
    default: return typeof v === 'string' && v.trim().length > 0
  }
}
function sugereNC(item: any, v: any): boolean {
  if (!isAnswered(item, v)) return false
  if (item.tipo === 'SCORE') return v <= 2
  if (item.tipo === 'BOOLEANO') return v === false
  if (item.tipo === 'CLASSIFICACAO') {
    const arr = Array.isArray(v) ? v : [v]
    return arr.some((e: any) => e && [e.situacao, e.status].some((x: string) => NC_VALUES.includes(x)))
  }
  if (item.tipo === 'TEXTO_APONTAMENTO') return true
  return false
}
function gutLabel(s: number): string {
  if (s >= 80) return 'Critico'
  if (s >= 40) return 'Alto'
  if (s >= 12) return 'Medio'
  return 'Baixo'
}
function fmtData(d: any): string {
  if (!d) return ''
  const s = String(d)
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  m = /^(\d{4})-(\d{2})$/.exec(s)
  if (m) return `${m[2]}/${m[1]}`
  return s.slice(0, 10)
}
// Ordem das perguntas: Classificacao -> Sim/Nao -> Apontamentos -> resto.
function tipoPrioridade(tipo: string): number {
  if (tipo === 'CLASSIFICACAO') return 1
  if (tipo === 'BOOLEANO') return 2
  if (tipo === 'TEXTO_APONTAMENTO') return 3
  return 99
}

// ===================== COMPONENTES DE CAMPO =====================
function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} aria-label={`${n} estrela(s)`}>
          <Star size={34} fill={value >= n ? 'currentColor' : 'none'} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  )
}

function CampoFields({ campos, val, onChange }: any) {
  const set = (k: string, x: any) => onChange({ ...val, [k]: x })
  return (
    <>
      {campos.map((c: any) => (
        <div className="field" key={c.chave}>
          <label>{c.label}{c.obrigatorio ? ' *' : ''}</label>
          {c.tipo === 'select' && (
            <select value={val[c.chave] ?? ''} onChange={(e) => set(c.chave, e.target.value)}>
              <option value="">- selecione -</option>
              {c.opcoes.map((o: string) => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
          {c.tipo === 'text' && <input type="text" value={val[c.chave] ?? ''} onChange={(e) => set(c.chave, e.target.value)} />}
          {c.tipo === 'number' && <input type="number" value={val[c.chave] ?? ''} onChange={(e) => set(c.chave, e.target.value === '' ? '' : Number(e.target.value))} />}
          {c.tipo === 'date' && <input type="date" value={val[c.chave] ?? ''} onChange={(e) => set(c.chave, e.target.value)} />}
        </div>
      ))}
    </>
  )
}

function ClassificacaoForm({ schema, value, onChange }: any) {
  if (schema.multiplo) {
    const entries: any[] = Array.isArray(value) ? value : value ? [value] : [{}]
    const label = schema.item_label || 'Item'
    const setEntry = (i: number, obj: any) => { const next = entries.slice(); next[i] = obj; onChange(next) }
    return (
      <div style={{ marginTop: 4 }}>
        {entries.map((ent, i) => (
          <div className="multi-entry" key={i}>
            <div className="multi-head">
              <span>{label} {i + 1}</span>
              {entries.length > 1 && (
                <button className="multi-rm" aria-label="Remover" onClick={() => onChange(entries.filter((_, k) => k !== i))}><X size={14} /></button>
              )}
            </div>
            <CampoFields campos={schema.campos} val={ent || {}} onChange={(o: any) => setEntry(i, o)} />
          </div>
        ))}
        <button className="multi-add" onClick={() => onChange([...entries, {}])}><Plus size={14} /> Adicionar {label.toLowerCase()}</button>
      </div>
    )
  }
  return <div style={{ marginTop: 4 }}><CampoFields campos={schema.campos} val={value || {}} onChange={onChange} /></div>
}

function GutPicker({ nc, onChange }: any) {
  const g = nc.g || 0, u = nc.u || 0, t = nc.t || 0
  const score = g && u && t ? g * u * t : 0
  const Row = ({ k, label, hint }: any) => (
    <div className="field">
      <label>{label}</label>
      <div className="gut-hint">{hint}</div>
      <div className="chips">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} className={nc[k] === n ? 'sel' : ''} onClick={() => onChange({ ...nc, [k]: n })}>{n}</button>
        ))}
      </div>
    </div>
  )
  return (
    <div>
      <div className="gut-intro">Risco pela matriz <b>GUT</b> (Gravidade x Urgencia x Tendencia):</div>
      <Row k="g" label="Gravidade" hint="Impacto se nao tratado (1 = baixo, 5 = muito alto)" />
      <Row k="u" label="Urgencia" hint="Prazo para atuar (1 = pode aguardar, 5 = imediato)" />
      <Row k="t" label="Tendencia" hint="Evolucao se nao tratado (1 = estavel, 5 = piora rapida)" />
      <div className="muted-note" style={{ marginTop: 8 }}>
        Risco GUT = G x U x T = <b style={{ color: 'var(--navy)' }}>{score || '-'}</b>
        {score ? <> ({gutLabel(score)})</> : null}
      </div>
    </div>
  )
}

// ===================== APP INTERNO =====================
function AppInterno({ perfil, onSair }: { perfil: Perfil; onSair: () => void }) {
  const STORE = lerStore() || {}
  const auditor = perfil.nome || perfil.email
  const [step, setStep] = useState<'inicio' | 'painel' | 'area'>(STORE.step ?? 'inicio')
  const [unidadeId, setUnidadeId] = useState(STORE.unidadeId ?? DADOS.unidades[0].id)
  const [periodo, setPeriodo] = useState(STORE.periodo ?? '2026-06')
  const [areaAtual, setAreaAtual] = useState<string | null>(STORE.areaAtual ?? null)

  const chaveInicial = `${STORE.unidadeId ?? DADOS.unidades[0].id}|${STORE.periodo ?? '2026-06'}`
  const DRAFT0 = (STORE.drafts && STORE.drafts[chaveInicial]) || {}
  const [resp, setResp] = useState<Record<string, any>>(DRAFT0.resp ?? {})
  const [coment, setComent] = useState<Record<string, string>>(DRAFT0.coment ?? {})
  const [ncs, setNcs] = useState<Record<string, any[]>>(DRAFT0.ncs ?? {})
  const [notas, setNotas] = useState<Record<string, string>>(DRAFT0.notas ?? {})
  const [respAnexos, setRespAnexos] = useState<Record<string, AnexoTmp[]>>(DRAFT0.respAnexos ?? {})
  const [upResp, setUpResp] = useState<string | null>(null)

  const [confirmar, setConfirmar] = useState(false)
  const [confirmado, setConfirmado] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erroCommit, setErroCommit] = useState('')
  const [verHist, setVerHist] = useState<any>(null)
  const [ncAberto, setNcAberto] = useState(false)
  const [guiaAberto, setGuiaAberto] = useState(false)

  const chaveDraft = `${unidadeId}|${periodo}`

  // Persistencia local do rascunho (offline-first), por (unidade + periodo).
  useEffect(() => {
    const store = lerStore() || {}
    store.unidadeId = unidadeId; store.periodo = periodo; store.step = step; store.areaAtual = areaAtual
    store.drafts = store.drafts || {}
    store.drafts[chaveDraft] = { resp, coment, ncs, notas, respAnexos }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  }, [unidadeId, periodo, step, areaAtual, resp, coment, ncs, notas, respAnexos])

  function carregarDraft(novaUnidade: string, novoPeriodo: string) {
    const store = lerStore() || {}
    const d = (store.drafts && store.drafts[`${novaUnidade}|${novoPeriodo}`]) || {}
    setResp(d.resp || {}); setComent(d.coment || {}); setNcs(d.ncs || {})
    setNotas(d.notas || {}); setRespAnexos(d.respAnexos || {}); setAreaAtual(null)
  }
  const trocarUnidade = (nova: string) => { carregarDraft(nova, periodo); setUnidadeId(nova) }
  const trocarPeriodo = (novo: string) => { carregarDraft(unidadeId, novo); setPeriodo(novo) }

  const unidade = DADOS.unidades.find((u: any) => u.id === unidadeId)
  const areas = useMemo(() => {
    const ids = new Set(DADOS.unidade_areas.filter((x: any) => x.unidade_id === unidadeId).map((x: any) => x.area_id))
    return DADOS.areas.filter((a: any) => ids.has(a.id)).sort((a: any, b: any) => a.nome.localeCompare(b.nome))
  }, [unidadeId])

  const itensDaArea = (areaId: string) =>
    DADOS.itens
      .filter((i: any) => i.area_id === areaId && i.tipo !== 'TEXTO_ANOTACAO')
      .sort((a: any, b: any) => tipoPrioridade(a.tipo) - tipoPrioridade(b.tipo))
  const itensDaUnidade = useMemo(
    () => DADOS.itens.filter((i: any) => i.tipo !== 'TEXTO_ANOTACAO' && areas.some((a: any) => a.id === i.area_id)),
    [areas],
  )

  const totalItens = itensDaUnidade.length
  const respondidas = itensDaUnidade.filter((i: any) => isAnswered(i, resp[i.id])).length
  const ncValida = (n: any) => n && (n.descricao || (n.g && n.u && n.t))
  const ncCount = Object.values(ncs).flat().filter(ncValida).length

  const getHist = (itemId: string) => (DADOS.historico || {})[`${itemId}|${unidadeId}`] || []
  const ncsPendentes = (areaId: string) =>
    (DADOS.ncs_pendentes || []).filter((n: any) => n.unidade_id === unidadeId && n.area_id === areaId)

  // ---------- NCs ----------
  const addNC = (areaId: string) =>
    setNcs((s) => ({ ...s, [areaId]: [...(s[areaId] || []), { descricao: '', categoria: '', g: 0, u: 0, t: 0, prazo: '' }] }))
  const addNCFromItem = (areaId: string, item: any) =>
    setNcs((s) => ({ ...s, [areaId]: [...(s[areaId] || []), { descricao: '', categoria: '', item_id: item.id, origem: item.titulo, g: 0, u: 0, t: 0, prazo: '' }] }))
  const temNCdoItem = (areaId: string, itemId: string) => (ncs[areaId] || []).some((n: any) => n.item_id === itemId)
  const updNC = (areaId: string, i: number, nc: any) => setNcs((s) => { const arr = [...(s[areaId] || [])]; arr[i] = nc; return { ...s, [areaId]: arr } })
  const rmNC = (areaId: string, i: number) => setNcs((s) => ({ ...s, [areaId]: (s[areaId] || []).filter((_: any, k: number) => k !== i) }))

  // ---------- Anexos ----------
  async function anexarResp(itemId: string, files: FileList | null) {
    const arr = Array.from(files || []); if (!arr.length) return
    setUpResp(itemId)
    for (const f of arr) {
      try { const a = await uploadAnexo(f); setRespAnexos((s) => ({ ...s, [itemId]: [...(s[itemId] || []), a] })) }
      catch { alert('Nao foi possivel anexar "' + f.name + '".') }
    }
    setUpResp(null)
  }
  function removerAnexoResp(itemId: string, idx: number) {
    setRespAnexos((s) => {
      const arr = [...(s[itemId] || [])]; const [rm] = arr.splice(idx, 1)
      if (rm?.path) removerAnexoTmp(rm.path)
      return { ...s, [itemId]: arr }
    })
  }

  // ---------- resumo / revisao ----------
  const resumoAreas = areas.map((a: any) => {
    const its = itensDaArea(a.id)
    return {
      area: a,
      resp: its.filter((i: any) => isAnswered(i, resp[i.id])).length,
      total: its.length,
      nc: (ncs[a.id] || []).filter(ncValida).length,
    }
  }).filter((x: any) => x.resp > 0 || x.nc > 0)

  const ncsParaGerar = areas.flatMap((a: any) =>
    (ncs[a.id] || [])
      .map((n: any, idx: number) => ({ n, idx, area: a }))
      .filter((x: any) => ncValida(x.n))
      .map((x: any) => {
        const score = x.n.g && x.n.u && x.n.t ? x.n.g * x.n.u * x.n.t : null
        return { areaId: a.id, idx: x.idx, area: a.nome, descricao: x.n.descricao, score, risco: score ? gutLabel(score) : null, prazo: x.n.prazo || null, categoria: x.n.categoria || null }
      }))

  const removerNcRevisao = (areaId: string, idx: number) =>
    setNcs((prev) => { const arr = (prev[areaId] || []).slice(); arr.splice(idx, 1); return { ...prev, [areaId]: arr } })

  function resetTudo() {
    const store = lerStore() || {}
    if (store.drafts) delete store.drafts[chaveDraft]
    store.step = 'inicio'; store.areaAtual = null
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    setStep('inicio'); setResp({}); setComent({}); setNcs({}); setNotas({}); setRespAnexos({})
    setConfirmar(false); setConfirmado(false); setAreaAtual(null)
  }

  // ---------- COMMIT ----------
  async function confirmarCommit() {
    setSalvando(true); setErroCommit('')
    try {
      const respostas: any[] = []
      for (const a of areas) for (const it of itensDaArea(a.id)) {
        const v = resp[it.id]
        if (!isAnswered(it, v) && !(respAnexos[it.id] || []).length) continue
        const base: any = { item_id: it.id, area_id: a.id, item_codigo: it.codigo || null, item_titulo: it.titulo, tipo: it.tipo, comentario: coment[it.id] || null }
        if (it.tipo === 'SCORE') base.valor_score = v
        else if (it.tipo === 'BOOLEANO') base.valor_booleano = v
        else if (it.tipo === 'CLASSIFICACAO') base.valor_classificacao = v
        else base.valor_texto = v
        respostas.push(base)
      }
      for (const a of areas) { const txt = notas[a.id]; if (txt && txt.trim()) respostas.push({ area_id: a.id, tipo: 'TEXTO_ANOTACAO', valor_texto: txt }) }

      const ncsArr: any[] = []
      for (const a of areas) for (const n of ncs[a.id] || []) {
        if (!ncValida(n)) continue
        if (!n.categoria) { setErroCommit('Selecione a categoria de todas as nao conformidades antes de confirmar.'); setSalvando(false); return }
        ncsArr.push({ area_id: a.id, item_id: n.item_id || null, descricao: n.descricao || '', categoria: n.categoria, g: n.g || null, u: n.u || null, t: n.t || null, prazo: n.prazo || null })
      }

      await confirmarAuditoria({ unidade_id: unidadeId, periodo, respostas, ncs: ncsArr })
      setConfirmado(true)
    } catch (e: any) {
      setErroCommit(e?.message || 'Nao foi possivel confirmar.')
    }
    setSalvando(false)
  }

  const area = areas.find((a: any) => a.id === areaAtual)
  const AreaIcon = iconComp(area?.icone)

  return (
    <div className="phone">
      <div className="appbar">
        {step !== 'inicio' && (
          <button className="iconbtn" aria-label="Voltar" onClick={() => setStep(step === 'area' ? 'painel' : 'inicio')}>
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="logo-mark"><ClipboardCheck size={20} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1>Auditoria Interna</h1>
          <div className="sub">{auditor}</div>
        </div>
        <button className="iconbtn" aria-label="Sair" title="Sair" onClick={onSair}><LogOut size={18} /></button>
      </div>

      {/* ---------- INICIO ---------- */}
      {step === 'inicio' && (
        <>
          <div className="body">
            <p className="section-title">Nova auditoria</p>
            <div className="card">
              <div className="field">
                <label><MapPin size={14} /> Unidade</label>
                <select value={unidadeId} onChange={(e) => trocarUnidade(e.target.value)}>
                  {DADOS.unidades.map((u: any) => <option key={u.id} value={u.id}>{u.nome}{u.localizacao ? ' - ' + u.localizacao : ''}</option>)}
                </select>
              </div>
              <div className="row2" style={{ marginTop: 12 }}>
                <div className="field">
                  <label><User size={14} /> Auditor(a)</label>
                  <input type="text" value={auditor} readOnly style={{ background: '#f4f5f7', color: 'var(--muted)' }} />
                </div>
                <div className="field">
                  <label><CalendarDays size={14} /> Periodo</label>
                  <input type="month" value={periodo} onChange={(e) => trocarPeriodo(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="banner">
              <Info size={16} style={{ flex: 'none', marginTop: 1 }} />
              <span>Uma auditoria por <b>unidade + auditor + periodo</b>. Voce registra as respostas area por area em <b>rascunho</b> - nada e enviado ate confirmar no final.</span>
            </div>
          </div>
          <div className="footer">
            <div className="info">{areas.length} areas nesta unidade</div>
            <button className="btn btn-primary" onClick={() => setStep('painel')}>Iniciar auditoria</button>
          </div>
        </>
      )}

      {/* ---------- PAINEL DA AUDITORIA ---------- */}
      {step === 'painel' && (
        <>
          <div className="body">
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="area-chip" style={{ background: 'var(--navy)' }}><ClipboardCheck size={22} /></div>
              <div>
                <div className="area-head"><span className="nome">{unidade?.nome}</span></div>
                <div className="meta">{auditor} - {fmtData(periodo)} - <b style={{ color: 'var(--orange)' }}>RASCUNHO</b></div>
                <div className="saved-note"><Check size={13} /> Respostas salvas no aparelho</div>
              </div>
            </div>

            <p className="section-title">Areas a auditar</p>
            {areas.map((a: any) => {
              const its = itensDaArea(a.id)
              const ans = its.filter((i: any) => isAnswered(i, resp[i.id])).length
              const Ico = iconComp(a.icone)
              const pct = its.length ? Math.round((ans / its.length) * 100) : 0
              const np = ncsPendentes(a.id).length
              return (
                <div className="card tap" key={a.id} onClick={() => { setAreaAtual(a.id); setStep('area'); setNcAberto(false); setGuiaAberto(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 13 }}>
                  <div className="area-chip" style={{ background: a.cor, width: 40, height: 40 }}><Ico size={20} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{a.nome}</div>
                    <div className="meta">
                      {ans}/{its.length} respondidas
                      {np > 0 && <span className="nc-badge">{np} NC pendente{np > 1 ? 's' : ''}</span>}
                    </div>
                    <div className="progress" style={{ marginTop: 7 }}><i style={{ width: pct + '%' }} /></div>
                  </div>
                  <ChevronRight size={18} color="var(--muted)" />
                </div>
              )
            })}
          </div>
          <div className="footer">
            <div className="info"><b>{respondidas}</b>/{totalItens} respostas - <b>{ncCount}</b> NC</div>
            <button className="btn btn-primary" disabled={respondidas === 0} onClick={() => setConfirmar(true)}>Confirmar auditoria</button>
          </div>
        </>
      )}

      {/* ---------- CHECKLIST DA AREA ---------- */}
      {step === 'area' && area && (
        <>
          <div className="body">
            <div className="card">
              <div className="area-head">
                <div className="area-chip" style={{ background: area.cor }}><AreaIcon size={22} /></div>
                <div>
                  <div className="nome">{area.nome}</div>
                  <div className="meta">{itensDaArea(area.id).length} itens de verificacao</div>
                </div>
              </div>
            </div>

            <div className="card nc-pend">
              <button className="nc-pend-head" onClick={() => setGuiaAberto((o) => !o)}>
                <BookOpen size={16} />
                <span>O que auditar aqui</span>
                {guiaAberto ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
              {guiaAberto && (
                <div style={{ padding: '2px 8px 10px', fontSize: 13, lineHeight: 1.5 }}>
                  Percorra os itens abaixo, avalie cada ponto e registre evidencias. Notas baixas, respostas "Nao"
                  e apontamentos sugerem automaticamente a abertura de uma nao conformidade.
                </div>
              )}
            </div>

            {ncsPendentes(area.id).length > 0 && (
              <div className="card nc-pend">
                <button className="nc-pend-head" onClick={() => setNcAberto((o) => !o)}>
                  <AlertTriangle size={16} />
                  <span>Nao conformidades pendentes neste setor ({ncsPendentes(area.id).length})</span>
                  {ncAberto ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                {ncAberto && ncsPendentes(area.id).map((n: any, i: number) => (
                  <div className="nc-pend-item" key={i}>
                    <div className="d">{n.descricao}</div>
                    <div className="m">
                      {n.risco && <span style={{ fontWeight: 700, color: COR_RISCO[n.risco] || 'inherit' }}>{n.risco}</span>}
                      {n.risco && n.data ? ' - ' : ''}{n.data ? fmtData(n.data) : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {itensDaArea(area.id).map((item: any) => {
              const v = resp[item.id]
              const setV = (x: any) => setResp((s) => ({ ...s, [item.id]: x }))
              return (
                <div className="card pergunta-box" key={item.id}>
                  <div className="ti">{item.titulo}</div>
                  {item.subtitulo && <div className="sub">{item.subtitulo}</div>}
                  <div style={{ marginTop: 8, marginBottom: 2 }}>
                    <span className="badge">{TIPO_LABEL[item.tipo]}</span>
                  </div>

                  {item.tipo === 'SCORE' && (
                    <>
                      <StarRating value={v || 0} onChange={setV} />
                      <div className="legend">{SCORE_LEGEND.map(([n, l]) => <span key={n}><b>{n}</b> {l}{n !== '5' ? ' - ' : ''}</span>)}</div>
                      {v >= 1 && v <= 5 && (
                        <div className="sugestoes">
                          <div className="sug-label">Sugestoes para a nota {v}:</div>
                          {SCORE_SUGESTOES[v].map((s, k) => (
                            <button key={k} className={coment[item.id] === s ? 'sel' : ''} onClick={() => setComent((st) => ({ ...st, [item.id]: s }))}>{s}</button>
                          ))}
                        </div>
                      )}
                      <textarea style={{ marginTop: 10 }} placeholder="Comentario (opcional)" value={coment[item.id] ?? ''} onChange={(e) => setComent((s) => ({ ...s, [item.id]: e.target.value }))} />
                    </>
                  )}
                  {item.tipo === 'BOOLEANO' && (
                    <div className="boolRow" style={{ marginTop: 10 }}>
                      <button className={v === true ? 'sel-sim' : ''} onClick={() => setV(true)}>Sim</button>
                      <button className={v === false ? 'sel-nao' : ''} onClick={() => setV(false)}>Nao</button>
                    </div>
                  )}
                  {item.tipo === 'CLASSIFICACAO' && item.schema_classificacao && (
                    <ClassificacaoForm schema={item.schema_classificacao} value={v} onChange={setV} />
                  )}
                  {item.tipo.startsWith('TEXTO_') && (
                    <textarea style={{ marginTop: 10 }} placeholder="Escreva aqui..." value={v ?? ''} onChange={(e) => setV(e.target.value)} />
                  )}

                  {COMPARAVEIS.includes(item.tipo) && getHist(item.id).length > 0 && (
                    <button className="hist-link" onClick={() => setVerHist(item)}>
                      <History size={14} /> Ver respostas anteriores ({getHist(item.id).length})
                    </button>
                  )}

                  {sugereNC(item, v) && (
                    temNCdoItem(area.id, item.id) ? (
                      <div className="nc-hint ok"><Check size={14} /> Nao conformidade registrada (veja abaixo)</div>
                    ) : (
                      <div className="nc-hint">
                        <AlertTriangle size={14} />
                        <span>Esta resposta sugere uma nao conformidade.</span>
                        <button onClick={() => addNCFromItem(area.id, item)}>Registrar</button>
                      </div>
                    )
                  )}

                  <div className="anexos-resp">
                    {(respAnexos[item.id] || []).map((a, idx) => (
                      <span className="anx-chip" key={idx} title={a.nome}>
                        {a.tipo === 'imagem' && a.url ? <img src={a.url} alt={a.nome} /> : <span className="anx-ic">FILE</span>}
                        <span className="anx-nm">{a.nome}</span>
                        <button type="button" aria-label="Remover anexo" onClick={() => removerAnexoResp(item.id, idx)}>x</button>
                      </span>
                    ))}
                    <label className="anx-add">
                      <Paperclip size={13} /> {upResp === item.id ? 'Enviando...' : 'Anexar evidencia'}
                      <input type="file" hidden multiple disabled={upResp === item.id}
                        onChange={(e) => { anexarResp(item.id, e.target.files); e.currentTarget.value = '' }} />
                    </label>
                  </div>
                </div>
              )
            })}

            {/* Nao conformidades da area */}
            <div className="card nc-area">
              <div className="nc-area-head"><AlertTriangle size={18} /> Nao conformidades da area</div>
              {(ncs[area.id] || []).map((nc: any, i: number) => (
                <div className="nc-entry" key={i}>
                  <div className="nc-entry-head">
                    <span>Nao conformidade {i + 1}</span>
                    <button className="multi-rm" aria-label="Remover" onClick={() => rmNC(area.id, i)}><X size={14} /></button>
                  </div>
                  {nc.origem && <div className="nc-origem">Vinculada a pergunta: {nc.origem}</div>}
                  <div className="field">
                    <label>Descricao</label>
                    <textarea value={nc.descricao} placeholder="Descreva a situacao encontrada" onChange={(e) => updNC(area.id, i, { ...nc, descricao: e.target.value })} />
                  </div>
                  <div className="field" style={{ marginTop: 10 }}>
                    <label>Categoria</label>
                    <select value={nc.categoria || ''} onChange={(e) => updNC(area.id, i, { ...nc, categoria: e.target.value })}>
                      <option value="">- selecione a categoria -</option>
                      {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ marginTop: 10 }}><GutPicker nc={nc} onChange={(x: any) => updNC(area.id, i, x)} /></div>
                  <div className="field" style={{ marginTop: 10 }}>
                    <label>Prazo de conclusao</label>
                    <input type="date" value={nc.prazo} onChange={(e) => updNC(area.id, i, { ...nc, prazo: e.target.value })} />
                  </div>
                </div>
              ))}
              <button className="multi-add" onClick={() => addNC(area.id)}><Plus size={14} /> Adicionar nao conformidade</button>
            </div>

            <div className="card notepad">
              <div className="np-head"><NotebookPen size={18} /> Bloco de notas da area</div>
              <textarea placeholder="Anotacoes livres do auditor sobre esta area..." value={notas[area.id] ?? ''} onChange={(e) => setNotas((s) => ({ ...s, [area.id]: e.target.value }))} />
            </div>
          </div>
          <div className="footer">
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep('painel')}>Salvar e voltar ao painel</button>
          </div>
        </>
      )}

      {/* ---------- CONFIRMACAO (commit) ---------- */}
      {confirmar && (
        <div className="overlay" onClick={() => !confirmado && setConfirmar(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            {!confirmado ? (
              <>
                <h2>Revisao da auditoria</h2>
                <p className="lead">{unidade?.nome} - {auditor} - {fmtData(periodo)}</p>
                <div className="summary">
                  <div className="stat"><div className="n">{respondidas}/{totalItens}</div><div className="l">respostas</div></div>
                  <div className="stat danger"><div className="n">{ncCount}</div><div className="l">NCs</div></div>
                </div>

                <div className="rev-sec">
                  <div className="rev-title">Por area</div>
                  {resumoAreas.length === 0 && <div className="rev-vazio">Nenhuma resposta registrada ainda.</div>}
                  {resumoAreas.map((x: any) => (
                    <div className="rev-area" key={x.area.id}>
                      <span className="rev-area-nome">{x.area.nome}</span>
                      <span className="rev-area-meta">{x.resp}/{x.total} resp.{x.nc > 0 ? ` - ${x.nc} NC` : ''}</span>
                    </div>
                  ))}
                </div>

                {ncsParaGerar.length > 0 && (
                  <div className="rev-sec">
                    <div className="rev-title">Nao conformidades a registrar ({ncsParaGerar.length})</div>
                    {ncsParaGerar.map((n: any, i: number) => (
                      <div className="rev-nc" key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="rev-nc-d">{n.descricao || '(sem descricao)'}</div>
                          <div className="rev-nc-m">
                            {n.area}
                            {n.risco ? <> - <b style={{ color: COR_RISCO[n.risco] || 'inherit' }}>{n.risco}</b>{n.score ? ` (GUT ${n.score})` : ''}</> : ''}
                            {n.categoria ? ` - ${n.categoria}` : ''}
                            {n.prazo ? ` - prazo ${fmtData(n.prazo)}` : ''}
                          </div>
                        </div>
                        <button type="button" aria-label="Remover esta NC" disabled={salvando} onClick={() => removerNcRevisao(n.areaId, n.idx)}
                          style={{ flex: '0 0 auto', border: 'none', background: 'transparent', color: '#b42318', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}>x</button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="muted-note">
                  <Info size={13} style={{ verticalAlign: -2 }} /> Ate aqui tudo ficou em <b>rascunho</b> no aparelho.
                  Ao confirmar, as respostas e nao conformidades serao registradas.
                </p>
                {erroCommit && <p className="muted-note" style={{ color: '#b42318' }}>{erroCommit}</p>}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button className="btn btn-ghost" style={{ flex: 1 }} disabled={salvando} onClick={() => setConfirmar(false)}>Voltar</button>
                  <button className="btn btn-primary" style={{ flex: 2 }} disabled={salvando} onClick={confirmarCommit}>{salvando ? 'Confirmando...' : 'Confirmar auditoria'}</button>
                </div>
              </>
            ) : (
              <div className="done">
                <ClipboardCheck className="ok" size={46} />
                <h2 style={{ marginTop: 10 }}>Auditoria confirmada</h2>
                <p className="muted-note" style={{ marginTop: 8 }}>Suas respostas foram salvas e as nao conformidades registradas.</p>
                <button className="btn btn-primary" style={{ marginTop: 18, width: '100%' }} onClick={resetTudo}>
                  <RotateCcw size={15} style={{ verticalAlign: -2, marginRight: 6 }} />Nova auditoria
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- RESPOSTAS ANTERIORES ---------- */}
      {verHist && (
        <div className="overlay" onClick={() => setVerHist(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2>Respostas anteriores</h2>
            <p className="lead">{verHist.titulo} - {unidade?.nome}</p>
            <div className="hist-list">
              {getHist(verHist.id).map((h: any, i: number) => (
                <div className="hist-item" key={i}>
                  <div className="hv">{h.valor}</div>
                  {h.comentario && <div className="hc">{h.comentario}</div>}
                  <div className="hm">{h.auditor} - {fmtData(h.data)}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost" style={{ width: '100%', marginTop: 12 }} onClick={() => setVerHist(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ===================== AUTENTICACAO / CARGA =====================
function Splash({ texto }: { texto: string }) {
  return (
    <div className="phone">
      <div style={{ padding: '70px 24px', textAlign: 'center', color: 'var(--muted)' }}>
        <Loader2 size={30} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: 12 }}>{texto}</p>
      </div>
    </div>
  )
}

function TelaLogin({ onLogin, erro, entrando }: { onLogin: (e: string, s: string) => void; erro: string; entrando: boolean }) {
  const [email, setEmail] = useState('auditor@exemplo.com')
  const [senha, setSenha] = useState('demo')
  return (
    <div className="phone">
      <div className="appbar">
        <div className="logo-mark"><ClipboardCheck size={20} /></div>
        <div><h1>Auditoria Interna</h1><div className="sub">Empresa Exemplo</div></div>
      </div>
      <div className="body">
        <p className="section-title">Entrar</p>
        <form className="card" onSubmit={(e) => { e.preventDefault(); onLogin(email.trim(), senha) }}>
          <div className="field">
            <label><User size={14} /> E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu.email@exemplo.com" required />
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Senha</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </div>
          {erro && <p className="muted-note" style={{ color: '#b42318', marginTop: 10 }}>{erro}</p>}
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} disabled={entrando}>{entrando ? 'Entrando...' : 'Entrar'}</button>
        </form>
        <div className="banner" style={{ marginTop: 12 }}>
          <Info size={16} style={{ flex: 'none', marginTop: 1 }} />
          <span>Demo: use qualquer e-mail e a senha <b>demo</b>. Depois de carregado, o app funciona <b>offline</b>.</span>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [perfil, setPerfil] = useState<Perfil | null | undefined>(undefined)
  const [pronto, setPronto] = useState(false)
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)

  useEffect(() => {
    (async () => {
      const u = await getSessionUser().catch(() => null)
      if (u) { await preparar(); setPerfil(u) } else setPerfil(null)
    })()
  }, [])

  async function preparar() {
    try { DADOS = await carregarCatalogo() } catch { DADOS = catalogoCache() || DADOS }
    setPronto(true)
  }
  async function login(email: string, senha: string) {
    setEntrando(true); setErro('')
    try { const u = await entrar(email, senha); await preparar(); setPerfil(u) }
    catch (e: any) { setErro(e?.message || 'Falha no login.') }
    setEntrando(false)
  }

  if (perfil === undefined) return <Splash texto="Carregando..." />
  if (!perfil) return <TelaLogin onLogin={login} erro={erro} entrando={entrando} />
  if (!pronto) return <Splash texto="Carregando catalogo..." />
  return <AppInterno perfil={perfil} onSair={async () => { await sair(); location.reload() }} />
}
