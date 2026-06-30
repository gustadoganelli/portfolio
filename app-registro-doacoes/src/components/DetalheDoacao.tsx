"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Clock, Download, Loader2, Receipt, X } from "lucide-react";
import { cn, formatarBRL, formatarData, formatarDataHora } from "@/lib/utils";
import { RECORRENCIA_META, STATUS_META, TIPO_DOCUMENTO_META } from "@/lib/constants";
import { exigeNumeroErp, proximosEstados } from "@/lib/estados";
import { gerarUrlAssinada, lancarDoacao, transicionarStatus } from "@/app/fila/actions";
import type { DoacaoDetalhe } from "@/types/doacao";
import type { StatusDoacao } from "@/types/database.types";

function fmtUnit(n: number) {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export default function DetalheDoacao({
  detalhe,
  mapClassificacao,
  podeOperar,
}: {
  detalhe: DoacaoDetalhe;
  mapClassificacao: Record<string, string>;
  podeOperar: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [processando, setProcessando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [modalErp, setModalErp] = useState(false);
  const [nrErp, setNrErp] = useState("");

  const status = detalhe.status as StatusDoacao;
  const destinos = proximosEstados(status);
  const itens = [...detalhe.itens].sort((a, b) => a.ordem - b.ordem);

  function fechar() {
    const p = new URLSearchParams(params.toString());
    p.delete("doacao");
    router.push(p.toString() ? `${pathname}?${p.toString()}` : pathname);
  }

  async function transicionar(destino: StatusDoacao) {
    if (exigeNumeroErp(destino)) {
      setModalErp(true);
      return;
    }
    setProcessando(true);
    setMsg(null);
    const r = await transicionarStatus(detalhe.id, destino, status);
    setMsg({ ok: r.ok, texto: r.mensagem });
    setProcessando(false);
    if (r.ok) router.refresh();
  }

  async function confirmarLancamento() {
    setProcessando(true);
    setMsg(null);
    const r = await lancarDoacao(detalhe.id, nrErp);
    setProcessando(false);
    if (r.ok) {
      setModalErp(false);
      setNrErp("");
      router.refresh();
    } else {
      setMsg({ ok: false, texto: r.mensagem });
    }
  }

  async function verDocumento(path: string) {
    const r = await gerarUrlAssinada(path);
    if (r.url) window.open(r.url, "_blank", "noopener,noreferrer");
    else setMsg({ ok: false, texto: r.erro ?? "Falha ao abrir o documento." });
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40" onClick={fechar}>
      <aside className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">{detalhe.doador_nome}</h2>
              <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1", STATUS_META[status].badge)}>
                {STATUS_META[status].rotulo}
              </span>
            </div>
            {detalhe.doador_documento && <p className="text-xs text-slate-400">{detalhe.doador_documento}</p>}
          </div>
          <button onClick={fechar} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 space-y-6 px-5 py-5">
          {msg && (
            <div className={cn("rounded-lg px-3 py-2 text-sm", msg.ok ? "bg-marca-50 text-marca-700" : "bg-red-50 text-red-700")}>
              {msg.texto}
            </div>
          )}

          {/* Dados */}
          <section className="grid grid-cols-2 gap-4 text-sm">
            <Campo rotulo="Aplicação" valor={mapClassificacao[detalhe.classificacao] ?? detalhe.classificacao} />
            <Campo rotulo="Recorrência" valor={RECORRENCIA_META[detalhe.recorrencia]} />
            <Campo rotulo="Unidade" valor={detalhe.empresa ?? "—"} />
            <Campo rotulo="Estoque" valor={detalhe.estoque === null ? "—" : detalhe.estoque ? "Sim" : "Não"} />
            <Campo rotulo="Responsável" valor={detalhe.captador_responsavel ?? "—"} />
            <Campo rotulo="Data da doação" valor={formatarData(detalhe.data_doacao)} />
            <Campo rotulo="Documento fiscal" valor={detalhe.documento_fiscal_numero ?? "—"} />
            <Campo rotulo="Cód. fornecedor" valor={detalhe.codigo_fornecedor ?? "—"} />
            <Campo rotulo="Valor total" valor={formatarBRL(detalhe.valor)} />
            <Campo rotulo="Qtd total" valor={Number(detalhe.quantidade_itens).toLocaleString("pt-BR")} />
            <Campo rotulo="Notificação" valor={detalhe.notificado ? `Enviada (${formatarDataHora(detalhe.notificado_em)})` : "Pendente"} />
            {detalhe.observacoes && (
              <div className="col-span-2"><Campo rotulo="Observações" valor={detalhe.observacoes} /></div>
            )}
          </section>

          {/* Itens */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Itens ({itens.length})</h3>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Descrição</th>
                    <th className="px-3 py-2 text-right font-medium">Qtd</th>
                    <th className="px-3 py-2 text-right font-medium">Vlr unit.</th>
                    <th className="px-3 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itens.map((it) => (
                    <tr key={it.id}>
                      <td className="px-3 py-2 text-slate-700">{it.descricao}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{Number(it.quantidade).toLocaleString("pt-BR")}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{fmtUnit(it.valor_unitario)}</td>
                      <td className="px-3 py-2 text-right font-medium text-slate-700">{formatarBRL(it.valor_total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td className="px-3 py-2 text-xs font-semibold text-slate-500" colSpan={3}>Total</td>
                    <td className="px-3 py-2 text-right font-bold text-marca-700">{formatarBRL(detalhe.valor)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Lançamento contábil */}
          {detalhe.status === "lancado" && (
            <section className="rounded-lg border border-marca-500/30 bg-marca-50 p-4 text-sm">
              <p className="mb-2 flex items-center gap-2 font-semibold text-marca-700"><Receipt className="h-4 w-4" /> Lançamento contábil</p>
              <div className="grid grid-cols-2 gap-3">
                <Campo rotulo="Nº lançamento" valor={detalhe.nr_lancamento_erp ?? "—"} />
                <Campo rotulo="Data" valor={formatarDataHora(detalhe.data_lancamento_erp)} />
                <Campo rotulo="Lançado por" valor={detalhe.usuario_lancamento_erp ?? "—"} />
              </div>
            </section>
          )}

          {/* Documentos */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Documentos ({detalhe.documentos.length})</h3>
            {detalhe.documentos.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum documento anexado.</p>
            ) : (
              <ul className="space-y-2">
                {detalhe.documentos.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-700">{doc.nome_original ?? doc.storage_path.split("/").pop()}</p>
                      <p className="text-xs text-slate-400">{TIPO_DOCUMENTO_META[doc.tipo_documento].rotulo}</p>
                    </div>
                    <button onClick={() => verDocumento(doc.storage_path)} className="btn-secundario shrink-0 px-3 py-1.5 text-xs">
                      <Download className="h-3.5 w-3.5" /> Ver
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Ação (só fiscal/admin conclui o lançamento) */}
          {podeOperar && destinos.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Ação</h3>
              <div className="flex flex-wrap gap-2">
                {destinos.map((destino) => (
                  <button key={destino} disabled={processando} onClick={() => transicionar(destino)} className="btn-primario">
                    {processando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                    Marcar como lançado
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Histórico */}
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><Clock className="h-4 w-4" /> Histórico</h3>
            <ol className="space-y-3 border-l border-slate-200 pl-4">
              {detalhe.logs.map((log) => {
                const det = (log.detalhe ?? {}) as Record<string, unknown>;
                const email = (det["usuario_email"] as string) ?? null;
                return (
                  <li key={log.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-marca-500 ring-2 ring-white" />
                    <p className="text-sm text-slate-700">
                      {log.acao === "criacao" ? "Doação registrada" : (
                        <>
                          {STATUS_META[log.status_anterior as StatusDoacao]?.rotulo ?? log.status_anterior}{" "}
                          <ArrowRight className="inline h-3 w-3" />{" "}
                          <span className="font-medium">{STATUS_META[log.status_novo as StatusDoacao]?.rotulo ?? log.status_novo}</span>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatarDataHora(log.criado_em)}
                      {email ? ` · ${email}` : ""}
                      {det["nr_lancamento_erp"] ? ` · Lançamento ${String(det["nr_lancamento_erp"])}` : ""}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </aside>

      {/* Modal lançar */}
      {podeOperar && modalErp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4" onClick={() => !processando && setModalErp(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800">Marcar como lançado</h3>
            <p className="mt-1 text-sm text-slate-500">
              Informe o número do lançamento gerado no sistema contábil. Os campos do lançamento serão preenchidos e a doação será finalizada.
            </p>
            <div className="mt-4">
              <label className="campo-label" htmlFor="nr_erp">Nº do lançamento contábil <span className="text-red-500">*</span></label>
              <input id="nr_erp" className="campo-input" value={nrErp} onChange={(e) => setNrErp(e.target.value)} placeholder="Ex.: 2026-000123" autoFocus />
              {msg && !msg.ok && <p className="campo-erro">{msg.texto}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-secundario" onClick={() => setModalErp(false)} disabled={processando}>Cancelar</button>
              <button className="btn-primario" onClick={confirmarLancamento} disabled={processando || nrErp.trim().length === 0}>
                {processando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                Confirmar lançamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{rotulo}</p>
      <p className="mt-0.5 text-slate-700">{valor}</p>
    </div>
  );
}
