"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Filter, X } from "lucide-react";
import { STATUS_META, STATUS_ORDEM } from "@/lib/constants";

interface Opcao {
  codigo: string;
  rotulo: string;
}

export default function FiltrosFila({
  classificacoes,
  valores,
}: {
  classificacoes: Opcao[];
  valores: {
    status: string;
    doador: string;
    classificacao: string;
    dataDe: string;
    dataAte: string;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [v, setV] = useState(valores);

  function aplicar() {
    const p = new URLSearchParams();
    if (v.status && v.status !== "todos") p.set("status", v.status);
    if (v.doador) p.set("doador", v.doador);
    if (v.classificacao) p.set("classificacao", v.classificacao);
    if (v.dataDe) p.set("dataDe", v.dataDe);
    if (v.dataAte) p.set("dataAte", v.dataAte);
    router.push(p.toString() ? `${pathname}?${p.toString()}` : pathname);
  }

  function limpar() {
    setV({ status: "", doador: "", classificacao: "", dataDe: "", dataAte: "" });
    router.push(pathname);
  }

  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        <div>
          <label className="campo-label">Status</label>
          <select className="campo-input" value={v.status} onChange={(e) => setV({ ...v, status: e.target.value })}>
            <option value="">Todos</option>
            {STATUS_ORDEM.map((s) => (
              <option key={s} value={s}>{STATUS_META[s].rotulo}</option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="campo-label">Doador / Fornecedor</label>
          <input className="campo-input" value={v.doador} onChange={(e) => setV({ ...v, doador: e.target.value })}
            placeholder="Buscar por nome..." onKeyDown={(e) => e.key === "Enter" && aplicar()} />
        </div>

        <div>
          <label className="campo-label">Aplicação</label>
          <select className="campo-input" value={v.classificacao} onChange={(e) => setV({ ...v, classificacao: e.target.value })}>
            <option value="">Todas</option>
            {classificacoes.map((c) => (
              <option key={c.codigo} value={c.codigo}>{c.rotulo}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="campo-label">De</label>
            <input type="date" className="campo-input" value={v.dataDe} onChange={(e) => setV({ ...v, dataDe: e.target.value })} />
          </div>
          <div>
            <label className="campo-label">Até</label>
            <input type="date" className="campo-input" value={v.dataAte} onChange={(e) => setV({ ...v, dataAte: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <button onClick={limpar} className="btn-secundario"><X className="h-4 w-4" /> Limpar</button>
        <button onClick={aplicar} className="btn-primario"><Filter className="h-4 w-4" /> Aplicar filtros</button>
      </div>
    </div>
  );
}
