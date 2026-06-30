"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus2, ListChecks, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORGANIZACAO_NOME } from "@/lib/constants";
import { signOut } from "@/app/login/actions";
import type { SessaoUsuario } from "@/lib/auth";

const PERFIL_ROTULO: Record<string, string> = {
  captacao: "Captação",
  fiscal: "Fiscal",
  admin: "Administrador",
};

export default function NavBar({ sessao }: { sessao: SessaoUsuario }) {
  const pathname = usePathname();
  const perfil = sessao.perfil;
  const podeCriar = perfil === "captacao" || perfil === "admin";
  const podeVerFila = perfil === "captacao" || perfil === "fiscal" || perfil === "admin";
  const podeOperar = perfil === "fiscal" || perfil === "admin";

  const itens: { href: string; label: string; Icone: typeof FilePlus2; ativo: boolean }[] = [];
  if (podeCriar) {
    itens.push({ href: "/nova-doacao", label: "Nova doação", Icone: FilePlus2, ativo: pathname === "/nova-doacao" });
  }
  if (podeVerFila) {
    itens.push({
      href: "/fila",
      label: podeOperar ? "Fila de lançamento" : "Acompanhamento",
      Icone: ListChecks,
      ativo: pathname.startsWith("/fila"),
    });
  }

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <Link href="/" className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-marca-100 text-sm font-bold text-marca-700">
          {ORGANIZACAO_NOME.charAt(0)}
        </div>
        <span className="text-sm font-semibold leading-tight text-slate-700">
          Registro de<br />Doações
        </span>
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {itens.map(({ href, label, Icone, ativo }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              ativo ? "bg-marca-100 text-marca-700" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Icone className="h-4 w-4 shrink-0" /> {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-200 px-4 py-3">
        <p className="truncate text-sm font-medium text-slate-700">{sessao.nome ?? sessao.email}</p>
        <p className="mb-3 text-xs text-slate-500">{perfil ? PERFIL_ROTULO[perfil] : "Sem perfil"}</p>
        <form action={signOut}>
          <button type="submit" className="btn-secundario w-full justify-center" title="Sair">
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
