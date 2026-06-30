import { redirect } from "next/navigation";
import { getSessaoUsuario, podeOperarFila, podeVerFila } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { STATUS_ORDEM } from "@/lib/constants";
import CardsStatus from "@/components/CardsStatus";
import FiltrosFila from "@/components/FiltrosFila";
import TabelaDoacoes from "@/components/TabelaDoacoes";
import DetalheDoacao from "@/components/DetalheDoacao";
import type { ContadoresStatus, DoacaoComDetalhes, DoacaoDetalhe } from "@/types/doacao";
import type { StatusDoacao } from "@/types/database.types";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function FilaPage({ searchParams }: { searchParams: SP }) {
  const sessao = await getSessaoUsuario();
  if (!sessao) redirect("/login");
  if (!podeVerFila(sessao.perfil)) redirect("/");
  const podeOperar = podeOperarFila(sessao.perfil);

  const supabase = createClient();

  const fStatus = str(searchParams.status);
  const fDoador = str(searchParams.doador);
  const fClassificacao = str(searchParams.classificacao);
  const fDataDe = str(searchParams.dataDe);
  const fDataAte = str(searchParams.dataAte);
  const detalheId = str(searchParams.doacao);

  const { data: classificacoes } = await supabase
    .from("ref_classificacao")
    .select("codigo, rotulo")
    .order("ordem");
  const mapClassificacao = Object.fromEntries(
    (classificacoes ?? []).map((c) => [c.codigo, c.rotulo])
  );

  // contadores (visão geral)
  const contagens = await Promise.all(
    STATUS_ORDEM.map((s) =>
      supabase.from("doacoes").select("id", { count: "exact", head: true }).eq("status", s)
    )
  );
  const contadores = STATUS_ORDEM.reduce((acc, s, i) => {
    acc[s] = contagens[i].count ?? 0;
    return acc;
  }, {} as ContadoresStatus);

  // lista filtrada
  let query = supabase
    .from("doacoes")
    .select("*, itens:doacao_itens(*), documentos:doacao_documentos(*)");
  if (fStatus && fStatus !== "todos") query = query.eq("status", fStatus as StatusDoacao);
  if (fClassificacao) query = query.eq("classificacao", fClassificacao);
  if (fDoador) query = query.ilike("doador_nome", `%${fDoador}%`);
  if (fDataDe) query = query.gte("data_doacao", fDataDe);
  if (fDataAte) query = query.lte("data_doacao", fDataAte);

  const { data: doacoes } = await query.order("criado_em", { ascending: false }).limit(300);

  // detalhe (drawer)
  let detalhe: DoacaoDetalhe | null = null;
  if (detalheId) {
    const [{ data: d }, { data: logs }] = await Promise.all([
      supabase
        .from("doacoes")
        .select("*, itens:doacao_itens(*), documentos:doacao_documentos(*)")
        .eq("id", detalheId)
        .maybeSingle(),
      supabase
        .from("doacao_log")
        .select("*")
        .eq("doacao_id", detalheId)
        .order("criado_em", { ascending: true }),
    ]);
    if (d) detalhe = { ...(d as DoacaoComDetalhes), logs: logs ?? [] };
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {podeOperar ? "Fila de lançamento" : "Acompanhamento"}
        </h1>
        <p className="text-sm text-slate-500">
          {podeOperar
            ? "Doações aguardando lançamento no sistema contábil. Clique numa linha para ver os itens, os documentos e marcar como lançada."
            : "Acompanhe as doações pendentes e já lançadas. Clique numa linha para ver os itens e os documentos (somente consulta)."}
        </p>
      </header>

      <CardsStatus contadores={contadores} statusAtivo={fStatus} />

      <FiltrosFila
        classificacoes={classificacoes ?? []}
        valores={{
          status: fStatus,
          doador: fDoador,
          classificacao: fClassificacao,
          dataDe: fDataDe,
          dataAte: fDataAte,
        }}
      />

      <TabelaDoacoes
        doacoes={(doacoes ?? []) as DoacaoComDetalhes[]}
        mapClassificacao={mapClassificacao}
      />

      {detalhe && (
        <DetalheDoacao detalhe={detalhe} mapClassificacao={mapClassificacao} podeOperar={podeOperar} />
      )}
    </main>
  );
}
