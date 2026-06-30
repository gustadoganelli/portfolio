import { z } from "zod";

/**
 * Validação compartilhada client + server para o formulário de doação.
 */

/** Converte "1.234,56" | "0,1035" | "0.1035" | number → number | null. */
export function parseNumeroBR(input: unknown): number | null {
  if (input === null || input === undefined || input === "") return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  let s = String(input).trim();
  if (!s) return null;
  if (s.includes(",")) {
    // vírgula é o decimal → ponto é separador de milhar
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export const parseValorBRL = parseNumeroBR;

/** "sim"/"true" → true, "nao"/"não"/"false" → false, senão null (inválido). */
const parseSimNao = (v: unknown): boolean | null => {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  if (["sim", "true", "1"].includes(s)) return true;
  if (["nao", "não", "false", "0"].includes(s)) return false;
  return null;
};

/** Cabeçalho da doação — TODOS os campos são obrigatórios. */
export const doacaoHeaderSchema = z.object({
  classificacao: z.string().min(1, "Selecione a aplicação."),
  recorrencia: z.enum(["sob_demanda", "recorrente"], {
    errorMap: () => ({ message: "Selecione a recorrência." }),
  }),
  empresa: z.enum(["1", "2", "3"], {
    errorMap: () => ({ message: "Selecione a unidade." }),
  }),
  estoque: z.preprocess(
    parseSimNao,
    z.boolean({ errorMap: () => ({ message: "Informe se entra em estoque (Sim/Não)." }) })
  ),
  doador_nome: z.string().trim().min(2, "Informe o fornecedor/doador."),
  doador_documento: z.string().trim().min(1, "Informe o CNPJ/CPF."),
  captador_responsavel: z.string().trim().min(1, "Selecione o responsável."),
  documento_fiscal_numero: z.string().trim().min(1, "Informe o documento fiscal (ou 'Sem NF')."),
  data_doacao: z.string().min(1, "Informe a data da doação."),
  observacoes: z.string().trim().min(1, "Preencha as observações."),
  codigo_fornecedor: z.string().trim().min(1, "Informe o código do fornecedor."),
  natureza_contabil: z.string().trim().min(1, "Informe a natureza contábil."),
});

export type DoacaoHeaderValores = z.infer<typeof doacaoHeaderSchema>;

/** Linha da doação (item). */
export const itemSchema = z.object({
  descricao: z.string().trim().min(1, "Descreva o item."),
  quantidade: z.preprocess(parseNumeroBR, z.number().positive("Quantidade deve ser maior que zero.")),
  valor_unitario: z.preprocess(parseNumeroBR, z.number().min(0, "Valor unitário inválido.")),
});

export type ItemValores = z.infer<typeof itemSchema>;

export const itensSchema = z.array(itemSchema).min(1, "Inclua ao menos 1 item.");

export interface ErroCampo {
  campo: string;
  mensagem: string;
}

export const lancamentoErpSchema = z.object({
  nr_lancamento_erp: z.string().trim().min(1, "Informe o nº do lançamento contábil."),
});
