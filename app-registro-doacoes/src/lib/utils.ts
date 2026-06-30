import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina classes Tailwind com merge inteligente. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** slug ASCII para uso em nomes de arquivo (remove acentos, espaços etc.). */
const ACENTOS_COMBINANTES = new RegExp("[\\u0300-\\u036f]", "g");

export function slugify(texto: string): string {
  return (texto || "doador")
    .normalize("NFD")
    .replace(ACENTOS_COMBINANTES, "") // remove acentos (combining marks)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "doador";
}

/** Primeiros 8 caracteres de um uuid — "id curto" para o nome do arquivo. */
export function idCurto(uuid: string): string {
  return uuid.replace(/-/g, "").slice(0, 8);
}

/** Data no formato AAAA-MM-DD (fuso local). */
export function dataIso(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Extensão (sem ponto) a partir do nome do arquivo. */
export function extensaoArquivo(nome: string): string {
  const m = /\.([a-zA-Z0-9]+)$/.exec(nome);
  return m ? m[1].toLowerCase() : "bin";
}

/**
 * Nomenclatura padrão de arquivo:
 *   {AAAA-MM-DD}_{doador-slug}_{tipo}_{id-curto}.{ext}
 */
export function nomePadraoArquivo(params: {
  data?: Date;
  doadorNome: string;
  tipo: string;
  doacaoId: string;
  nomeOriginal: string;
  indice?: number; // sufixo p/ múltiplos arquivos do mesmo tipo (1, 2, ...)
}): string {
  const { doadorNome, tipo, doacaoId, nomeOriginal, indice } = params;
  const data = dataIso(params.data ?? new Date());
  const ext = extensaoArquivo(nomeOriginal);
  const sufixo = indice && indice > 1 ? `-${indice}` : "";
  return `${data}_${slugify(doadorNome)}_${slugify(tipo)}_${idCurto(doacaoId)}${sufixo}.${ext}`;
}

/** Caminho completo do objeto no bucket: {doacao_id}/{tipo}/{nome-padrao} */
export function caminhoStorage(params: {
  doacaoId: string;
  tipo: string;
  doadorNome: string;
  nomeOriginal: string;
  data?: Date;
  indice?: number;
}): string {
  const nome = nomePadraoArquivo(params);
  return `${params.doacaoId}/${slugify(params.tipo)}/${nome}`;
}

const fmtBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatarBRL(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  return fmtBRL.format(valor);
}

export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatarData(iso: string | null | undefined): string {
  if (!iso) return "—";
  // Datas "puras" (AAAA-MM-DD) não devem sofrer conversão de fuso (evita off-by-one).
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function formatarTamanho(bytes: number | null | undefined): string {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
