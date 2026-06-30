// =============================================================================
// Camada de dados do app de auditoria.
//
// MODO DEMO: este arquivo usa dados ficticios embutidos (seed.json) e simula
// login/commit em memoria, para o portfolio rodar sem backend.
//
// Para ligar a um backend real (ex.: API REST ou Supabase), implemente as
// funcoes abaixo usando VITE_API_URL / VITE_API_KEY do .env e mantenha as
// mesmas assinaturas. O resto do app nao precisa mudar.
// =============================================================================
import seed from './data/seed.json'

export type Perfil = {
  id: string
  nome: string
  email: string
  perfil: 'AUDITOR' | 'GESTOR_UNIDADE'
  unidade_id: string | null
}

const CACHE_KEY = 'auditoria_catalogo_v1'
const SESSAO_KEY = 'auditoria_sessao_v1'

// Atraso curto so para simular ida ao servidor.
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))

// ---------- Autenticacao (mock) ----------
// Aceita qualquer e-mail. Senha de demonstracao: "demo".
export async function getSessionUser(): Promise<Perfil | null> {
  try {
    return JSON.parse(localStorage.getItem(SESSAO_KEY) || 'null')
  } catch {
    return null
  }
}

export async function entrar(email: string, senha: string): Promise<Perfil> {
  await delay()
  if (senha !== 'demo') throw new Error('E-mail ou senha invalidos. (Senha do demo: "demo")')
  const perfil: Perfil = {
    id: 'auditor-demo',
    nome: email.split('@')[0] || 'Auditor Exemplo',
    email,
    perfil: 'AUDITOR',
    unidade_id: null,
  }
  localStorage.setItem(SESSAO_KEY, JSON.stringify(perfil))
  return perfil
}

export async function sair(): Promise<void> {
  localStorage.removeItem(SESSAO_KEY)
}

// ---------- Catalogo ----------
export function catalogoCache(): any | null {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
  } catch {
    return null
  }
}

// No modo demo retornamos o seed.json. Num backend real, este seria o ponto
// onde os varios SELECTs do catalogo seriam combinados.
export async function carregarCatalogo(): Promise<any> {
  await delay()
  const cat = seed
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cat))
  } catch {
    /* cota cheia: segue com o seed do bundle */
  }
  return cat
}

// ---------- Anexos (mock) ----------
export type AnexoTmp = {
  path: string
  nome: string
  mime: string
  tipo: 'imagem' | 'arquivo'
  url: string | null
}

// No demo geramos uma URL local (object URL) so para pre-visualizar.
export async function uploadAnexo(file: File): Promise<AnexoTmp> {
  await delay(150)
  const path = `demo/${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  return {
    path,
    nome: file.name,
    mime: file.type || '',
    tipo: (file.type || '').startsWith('image/') ? 'imagem' : 'arquivo',
    url: URL.createObjectURL(file),
  }
}

export async function removerAnexoTmp(_path: string): Promise<void> {
  /* no-op no demo */
}

// ---------- Commit (fechamento) ----------
// No demo apenas validamos e devolvemos um id ficticio. Num backend real,
// chamaria a RPC confirmar_auditoria (ver db/migrations/0002_rpc_confirmar.sql).
export async function confirmarAuditoria(payload: any): Promise<string> {
  await delay(400)
  if (!payload?.unidade_id || !payload?.periodo) {
    throw new Error('unidade_id e periodo sao obrigatorios.')
  }
  console.info('[DEMO] auditoria confirmada (nao foi enviada a nenhum servidor):', payload)
  return `aud-demo-${Date.now()}`
}
