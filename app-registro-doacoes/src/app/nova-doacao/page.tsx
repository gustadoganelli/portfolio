import { redirect } from "next/navigation";
import { getSessaoUsuario, podeCriarDoacao } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import FormularioDoacao from "@/components/FormularioDoacao";

export const dynamic = "force-dynamic";

export default async function NovaDoacaoPage() {
  const sessao = await getSessaoUsuario();
  if (!sessao) redirect("/login");
  if (!podeCriarDoacao(sessao.perfil)) redirect("/");

  const supabase = createClient();
  const { data: classificacoes } = await supabase
    .from("ref_classificacao")
    .select("codigo, rotulo")
    .eq("ativo", true)
    .order("ordem");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Nova doação</h1>
        <p className="text-sm text-slate-500">
          Preencha os dados do doador e os itens, e anexe o comprovante. A doação só é confirmada
          após o upload bem-sucedido dos documentos.
        </p>
      </header>

      <FormularioDoacao
        classificacoes={classificacoes ?? []}
        responsavelPadrao={sessao.nome ?? ""}
      />
    </main>
  );
}
