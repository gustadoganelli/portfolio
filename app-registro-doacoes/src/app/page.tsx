import { redirect } from "next/navigation";
import { getSessaoUsuario } from "@/lib/auth";

/** Home: encaminha conforme o perfil. */
export default async function Home() {
  const sessao = await getSessaoUsuario();
  if (!sessao) redirect("/login");

  if (sessao.perfil === "captacao") redirect("/nova-doacao");
  if (sessao.perfil === "fiscal" || sessao.perfil === "admin") redirect("/fila");

  // Usuário autenticado mas sem perfil atribuído.
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-xl font-bold text-slate-800">Acesso pendente de configuração</h1>
      <p className="mt-2 text-slate-600">
        Sua conta ainda não tem um perfil atribuído. Procure o administrador para liberar o acesso
        (perfis: Captação, Fiscal ou Admin).
      </p>
    </main>
  );
}
