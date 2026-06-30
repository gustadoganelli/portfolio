"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessaoUsuario, podeCriarDoacao } from "@/lib/auth";
import { doacaoHeaderSchema, itensSchema, type ErroCampo } from "@/lib/validacao";
import { caminhoStorage } from "@/lib/utils";
import { BUCKET_DOCUMENTOS, UPLOAD_ACEITOS, UPLOAD_TAMANHO_MAX_BYTES } from "@/lib/constants";
import type { TipoDocumento } from "@/types/database.types";

const TIPOS: TipoDocumento[] = ["comprovante", "nota_fiscal", "termo", "outro"];

export interface CriarDoacaoState {
  ok?: boolean;
  mensagem?: string;
  erros?: ErroCampo[];
  doacaoId?: string;
  token?: string;
}

interface ArquivoEntrada {
  tipo: TipoDocumento;
  file: File;
}

/**
 * Cria a doação garantindo que nenhum documento se perca:
 *   valida → INSERT cabeçalho → INSERT itens → SOBE documentos →
 *   se falhar upload: remove arquivos + cancela a doação (rollback) →
 *   só então grava as linhas de documentos.
 */
export async function criarDoacao(
  _prev: CriarDoacaoState,
  formData: FormData
): Promise<CriarDoacaoState> {
  const sessao = await getSessaoUsuario();
  if (!sessao) return { ok: false, mensagem: "Sessão expirada. Faça login novamente." };
  if (!podeCriarDoacao(sessao.perfil)) {
    return { ok: false, mensagem: "Seu perfil não pode registrar doações." };
  }

  const supabase = createClient();

  // 1) cabeçalho
  const parsed = doacaoHeaderSchema.safeParse({
    classificacao: formData.get("classificacao"),
    recorrencia: formData.get("recorrencia"),
    empresa: formData.get("empresa"),
    estoque: formData.get("estoque"),
    doador_nome: formData.get("doador_nome"),
    doador_documento: formData.get("doador_documento") ?? undefined,
    captador_responsavel: formData.get("captador_responsavel") ?? undefined,
    documento_fiscal_numero: formData.get("documento_fiscal_numero") ?? undefined,
    data_doacao: formData.get("data_doacao"),
    observacoes: formData.get("observacoes") ?? undefined,
    codigo_fornecedor: formData.get("codigo_fornecedor") ?? undefined,
    natureza_contabil: formData.get("natureza_contabil") ?? undefined,
  });
  if (!parsed.success) {
    const erros: ErroCampo[] = parsed.error.issues.map((i) => ({
      campo: String(i.path[0] ?? ""),
      mensagem: i.message,
    }));
    return { ok: false, mensagem: "Corrija os campos destacados.", erros };
  }
  const header = parsed.data;

  // 2) itens (chegam como JSON no campo "itens")
  let itensBrutos: unknown = [];
  try {
    itensBrutos = JSON.parse(String(formData.get("itens") ?? "[]"));
  } catch {
    return { ok: false, mensagem: "Itens inválidos." };
  }
  const itensParsed = itensSchema.safeParse(itensBrutos);
  if (!itensParsed.success) {
    return {
      ok: false,
      mensagem: "Verifique os itens: cada linha precisa de descrição, quantidade e valor.",
      erros: [{ campo: "itens", mensagem: itensParsed.error.issues[0]?.message ?? "Itens inválidos." }],
    };
  }
  const itens = itensParsed.data;

  // 3) arquivos por tipo
  const arquivos: ArquivoEntrada[] = [];
  for (const tipo of TIPOS) {
    for (const e of formData.getAll(`arquivo_${tipo}`)) {
      if (e instanceof File && e.size > 0) arquivos.push({ tipo, file: e });
    }
  }
  if (arquivos.length === 0) {
    return {
      ok: false,
      mensagem: "Anexe ao menos um documento (comprovante, orçamento ou nota fiscal).",
      erros: [{ campo: "documentos", mensagem: "Anexe ao menos um documento." }],
    };
  }
  for (const { file } of arquivos) {
    if (file.size > UPLOAD_TAMANHO_MAX_BYTES) {
      return { ok: false, mensagem: `Arquivo "${file.name}" excede o limite de 15 MB.` };
    }
    if (file.type && !UPLOAD_ACEITOS.includes(file.type)) {
      return { ok: false, mensagem: `Tipo de arquivo não permitido: "${file.name}".` };
    }
  }

  // 4) INSERT cabeçalho
  const { data: doacao, error: insErr } = await supabase
    .from("doacoes")
    .insert({
      classificacao: header.classificacao,
      recorrencia: header.recorrencia,
      empresa: header.empresa,
      estoque: header.estoque,
      doador_nome: header.doador_nome,
      doador_documento: header.doador_documento,
      captador_responsavel: header.captador_responsavel,
      documento_fiscal_numero: header.documento_fiscal_numero,
      data_doacao: header.data_doacao,
      observacoes: header.observacoes,
      codigo_fornecedor: header.codigo_fornecedor,
      natureza_contabil: header.natureza_contabil,
      status: "pendente_lancamento",
      criado_por: sessao.id,
    })
    .select("id, doador_nome")
    .single();

  if (insErr || !doacao) {
    return { ok: false, mensagem: "Não foi possível registrar a doação. Tente novamente." };
  }
  const doacaoId = doacao.id;

  async function rollback(pathsEnviados: string[]) {
    if (pathsEnviados.length > 0) await supabase.storage.from(BUCKET_DOCUMENTOS).remove(pathsEnviados);
    await supabase.rpc("cancelar_doacao_incompleta", { p_doacao_id: doacaoId });
  }

  // 5) INSERT itens (o trigger recalcula os totais do cabeçalho)
  const { error: itErr } = await supabase.from("doacao_itens").insert(
    itens.map((it, i) => ({
      doacao_id: doacaoId,
      ordem: i + 1,
      descricao: it.descricao,
      quantidade: it.quantidade,
      valor_unitario: it.valor_unitario,
    }))
  );
  if (itErr) {
    await rollback([]);
    return { ok: false, mensagem: "Falha ao gravar os itens. Operação revertida." };
  }

  // 6) upload dos documentos
  const enviados: string[] = [];
  const linhasDoc: {
    doacao_id: string;
    tipo_documento: TipoDocumento;
    storage_path: string;
    nome_original: string;
    tamanho_bytes: number;
    mime_type: string;
  }[] = [];
  const contadorPorTipo: Record<string, number> = {};

  for (const { tipo, file } of arquivos) {
    contadorPorTipo[tipo] = (contadorPorTipo[tipo] ?? 0) + 1;
    const path = caminhoStorage({
      doacaoId,
      tipo,
      doadorNome: doacao.doador_nome,
      nomeOriginal: file.name,
      indice: contadorPorTipo[tipo],
    });
    const buffer = await file.arrayBuffer();
    const { error: upErr } = await supabase.storage
      .from(BUCKET_DOCUMENTOS)
      .upload(path, buffer, { contentType: file.type || "application/octet-stream", upsert: false });

    if (upErr) {
      await rollback(enviados);
      return {
        ok: false,
        mensagem: `Falha ao enviar "${file.name}". Nenhum dado foi gravado — tente novamente.`,
      };
    }
    enviados.push(path);
    linhasDoc.push({
      doacao_id: doacaoId,
      tipo_documento: tipo,
      storage_path: path,
      nome_original: file.name,
      tamanho_bytes: file.size,
      mime_type: file.type || "application/octet-stream",
    });
  }

  // 7) grava as linhas de documentos
  const { error: docErr } = await supabase.from("doacao_documentos").insert(linhasDoc);
  if (docErr) {
    await rollback(enviados);
    return { ok: false, mensagem: "Falha ao registrar os documentos. Operação revertida." };
  }

  return {
    ok: true,
    mensagem: "Doação registrada com sucesso! O responsável fiscal foi notificado para o lançamento.",
    doacaoId,
    token: doacaoId,
  };
}
