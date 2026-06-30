import type { StatusDoacao } from "@/types/database.types";

/**
 * Espelho, no front, da máquina de estados do banco (fila simples).
 * A validação REAL acontece em transicionar_status()/lancar_doacao().
 */
export const TRANSICOES: Record<StatusDoacao, StatusDoacao[]> = {
  pendente_lancamento: ["lancado"],
  lancado: [],
};

export const ROTULO_ACAO: Record<StatusDoacao, string> = {
  pendente_lancamento: "Reabrir",
  lancado: "Marcar como lançado",
};

export function proximosEstados(atual: StatusDoacao): StatusDoacao[] {
  return TRANSICOES[atual] ?? [];
}

export function transicaoPermitida(de: StatusDoacao, para: StatusDoacao): boolean {
  return proximosEstados(de).includes(para);
}

/** A transição para 'lancado' exige o nº do lançamento no sistema contábil (modal). */
export function exigeNumeroErp(destino: StatusDoacao): boolean {
  return destino === "lancado";
}
