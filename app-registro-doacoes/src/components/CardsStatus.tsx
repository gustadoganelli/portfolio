"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { STATUS_META, STATUS_ORDEM } from "@/lib/constants";
import type { ContadoresStatus } from "@/types/doacao";

export default function CardsStatus({
  contadores,
  statusAtivo,
}: {
  contadores: ContadoresStatus;
  statusAtivo: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const total = STATUS_ORDEM.reduce((s, k) => s + (contadores[k] ?? 0), 0);

  function filtrar(status: string) {
    const p = new URLSearchParams(params.toString());
    if (!status || status === "todos") p.delete("status");
    else p.set("status", status);
    p.delete("doacao"); // fecha o detalhe ao trocar de filtro
    router.push(`${pathname}?${p.toString()}`);
  }

  const ativo = statusAtivo || "todos";

  return (
    <div className="mb-5 grid grid-cols-3 gap-3">
      <button
        onClick={() => filtrar("todos")}
        className={cn(
          "rounded-xl border bg-white p-3 text-left transition hover:shadow-sm",
          ativo === "todos" ? "border-slate-800 ring-1 ring-slate-800" : "border-slate-200"
        )}
      >
        <p className="text-xs font-medium text-slate-500">Todas</p>
        <p className="mt-1 text-2xl font-bold text-slate-800">{total}</p>
      </button>

      {STATUS_ORDEM.map((s) => (
        <button
          key={s}
          onClick={() => filtrar(s)}
          className={cn(
            "rounded-xl border bg-white p-3 text-left transition hover:shadow-sm",
            ativo === s ? STATUS_META[s].card + " ring-1" : "border-slate-200"
          )}
        >
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
              STATUS_META[s].badge
            )}
          >
            {STATUS_META[s].rotulo}
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-800">{contadores[s] ?? 0}</p>
        </button>
      ))}
    </div>
  );
}
