"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessaoUsuario, podeOperarFila } from "@/lib/auth";
import { BUCKET_DOCUMENTOS } from "@/lib/constants";
import { transicaoPermitida } from "@/lib/estados";
import { lancamentoErpSchema } from "@/lib/validacao";
import type { StatusDoacao } from "@/types/database.types";

export interface AcaoResultado {
  ok: boolean;
  mensagem: string;
}

/** Transição genérica de status (exceto → lancado, que usa lancarDoacao). */
export async function transicionarStatus(
  doacaoId: string,
  novoStatus: StatusDoacao,
  statusAtual: StatusDoacao
): Promise<AcaoResultado> {
  const sessao = await getSessaoUsuario();
  if (!sessao || !podeOperarFila(sessao.perfil)) {
    return { ok: false, mensagem: "Sem permissão para operar a fila." };
  }
  // checagem local de coerência (a validação inviolável está no banco)
  if (!transicaoPermitida(statusAtual, novoStatus)) {
    return { ok: false, mensagem: `Transição inválida: ${statusAtual} → ${novoStatus}.` };
  }

  const supabase = createClient();
  const { error } = await supabase.rpc("transicionar_status", {
    p_doacao_id: doacaoId,
    p_novo_status: novoStatus,
  });

  if (error) {
    return { ok: false, mensagem: error.message ?? "Falha ao transicionar status." };
  }

  revalidatePath("/fila");
  return { ok: true, mensagem: "Status atualizado." };
}

/** Marca como lançada: grava o nº do lançamento e transiciona atomicamente. */
export async function lancarDoacao(doacaoId: string, nrLancamento: string): Promise<AcaoResultado> {
  const sessao = await getSessaoUsuario();
  if (!sessao || !podeOperarFila(sessao.perfil)) {
    return { ok: false, mensagem: "Sem permissão para lançar." };
  }

  const parsed = lancamentoErpSchema.safeParse({ nr_lancamento_erp: nrLancamento });
  if (!parsed.success) {
    return { ok: false, mensagem: parsed.error.issues[0]?.message ?? "Nº de lançamento inválido." };
  }

  const supabase = createClient();
  const { error } = await supabase.rpc("lancar_doacao", {
    p_doacao_id: doacaoId,
    p_nr_lancamento_erp: parsed.data.nr_lancamento_erp,
  });

  if (error) {
    return { ok: false, mensagem: error.message ?? "Falha ao lançar a doação." };
  }

  revalidatePath("/fila");
  return { ok: true, mensagem: "Doação marcada como lançada." };
}

/** Gera URL assinada (60 min) para visualizar um documento do Storage. */
export async function gerarUrlAssinada(
  storagePath: string
): Promise<{ url?: string; erro?: string }> {
  const sessao = await getSessaoUsuario();
  if (!sessao) return { erro: "Sessão expirada." };

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET_DOCUMENTOS)
    .createSignedUrl(storagePath, 60 * 60);

  if (error || !data?.signedUrl) {
    return { erro: "Não foi possível gerar o link do documento." };
  }
  return { url: data.signedUrl };
}
