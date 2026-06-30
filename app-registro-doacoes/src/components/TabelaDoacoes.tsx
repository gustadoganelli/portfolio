"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FileText, Inbox } from "lucide-react";
import { cn, formatarBRL, formatarData } from "@/lib/utils";
import { RECORRENCIA_META, STATUS_META } from "@/lib/constants";
import type { DoacaoComDetalhes } from "@/types/doacao";

export default function TabelaDoacoes({
  doacoes,
  mapClassificacao,
}: {
  doacoes: DoacaoComDetalhes[];
  mapClassificacao: Record<string, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function abrir(id: string) {
    const p = new URLSearchParams(params.toString());
    p.set("doacao", id);
    router.push(`${pathname}?${p.toString()}`);
  }

  if (doacoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <Inbox className="h-8 w-8 text-slate-300" />
        <p className="mt-2 text-sm text-slate-500">Nenhuma doação encontrada com os filtros atuais.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Fornecedor</th>
              <th className="px-4 py-3 font-medium">Aplicação</th>
              <th className="px-4 py-3 font-medium">Recorrência</th>
              <th className="px-4 py-3 text-right font-medium">Qtd</th>
              <th className="px-4 py-3 text-right font-medium">Valor</th>
              <th className="px-4 py-3 text-center font-medium">Docs</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doacoes.map((d) => (
              <tr key={d.id} onClick={() => abrir(d.id)} className="cursor-pointer transition hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatarData(d.data_doacao)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{d.doador_nome}</p>
                  {d.doador_documento && <p className="text-xs text-slate-400">{d.doador_documento}</p>}
                </td>
                <td className="px-4 py-3 text-slate-600">{mapClassificacao[d.classificacao] ?? d.classificacao}</td>
                <td className="px-4 py-3 text-slate-600">{RECORRENCIA_META[d.recorrencia]}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                  {Number(d.quantidade_itens).toLocaleString("pt-BR")}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">{formatarBRL(d.valor)}</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <FileText className="h-4 w-4" />
                    {d.documentos?.length ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1", STATUS_META[d.status].badge)}>
                    {STATUS_META[d.status].rotulo}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
