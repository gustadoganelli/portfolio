import type {
  Recorrencia,
  StatusDoacao,
  TipoDocumento,
} from "@/types/database.types";

export const BUCKET_DOCUMENTOS = "doacoes-documentos";

/** Nome fictício da organização (troque pela sua marca). */
export const ORGANIZACAO_NOME = "Organização Exemplo";

/** Códigos de unidade disponíveis no formulário (fictícios). */
export const UNIDADES = ["1", "2", "3"];

/** Naturezas contábeis (rótulos fictícios; mapeie para o seu plano de contas). */
export const NATUREZAS = [
  "001 - Doações de mercadorias físicas",
  "002 - Doações de serviços",
  "003 - Doações de passagens / logística",
  "004 - Doações de tecnologia",
  "005 - Doações de mídia e publicidade",
  "006 - Cestas básicas e alimentos",
  "007 - Outros bens recebidos em doação",
];

/** Responsáveis disponíveis para seleção no formulário (nomes fictícios). */
export const RESPONSAVEIS = [
  "Ana Souza",
  "Diego Rocha",
  "Eduarda Alves",
  "Felipe Castro",
  "Gabriela Nunes",
  "Henrique Dias",
  "Isabela Moraes",
];

/** Rótulos e cores por status (fila simples: 2 estados). */
export const STATUS_META: Record<StatusDoacao, { rotulo: string; badge: string; card: string }> = {
  pendente_lancamento: {
    rotulo: "Pendente de lançamento",
    badge: "bg-amber-100 text-amber-800 ring-amber-200",
    card: "border-amber-300",
  },
  lancado: {
    rotulo: "Lançado",
    badge: "bg-marca-100 text-marca-700 ring-marca-500/30",
    card: "border-marca-500",
  },
};

export const STATUS_ORDEM: StatusDoacao[] = ["pendente_lancamento", "lancado"];

export const RECORRENCIA_META: Record<Recorrencia, string> = {
  sob_demanda: "Sob demanda",
  recorrente: "Recorrente",
};
export const RECORRENCIA_OPCOES: { codigo: Recorrencia; rotulo: string }[] = [
  { codigo: "sob_demanda", rotulo: "Sob demanda" },
  { codigo: "recorrente", rotulo: "Recorrente" },
];

export const TIPO_DOCUMENTO_META: Record<TipoDocumento, { rotulo: string }> = {
  comprovante: { rotulo: "Comprovante / Orçamento" },
  nota_fiscal: { rotulo: "Nota fiscal" },
  termo: { rotulo: "Termo de doação" },
  outro: { rotulo: "Outro" },
};
export const TIPO_DOCUMENTO_OPCOES: { codigo: TipoDocumento; rotulo: string }[] = [
  { codigo: "comprovante", rotulo: "Comprovante / Orçamento" },
  { codigo: "nota_fiscal", rotulo: "Nota fiscal" },
  { codigo: "termo", rotulo: "Termo de doação" },
  { codigo: "outro", rotulo: "Outro" },
];

export const UPLOAD_ACEITOS = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];
export const UPLOAD_TAMANHO_MAX_BYTES = 15 * 1024 * 1024; // 15 MB por arquivo
