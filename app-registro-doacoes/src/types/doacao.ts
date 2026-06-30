import type { DoacaoRow, DocumentoRow, ItemRow, LogRow, StatusDoacao } from "./database.types";

/** Doação com itens e documentos (usado no painel). */
export interface DoacaoComDetalhes extends DoacaoRow {
  itens: ItemRow[];
  documentos: DocumentoRow[];
}

export interface DoacaoDetalhe extends DoacaoComDetalhes {
  logs: LogRow[];
}

/** Contadores por status (cards do topo). */
export type ContadoresStatus = Record<StatusDoacao, number>;

export interface FiltrosFila {
  status?: StatusDoacao | "todos";
  doador?: string;
  classificacao?: string;
  dataDe?: string;
  dataAte?: string;
}
