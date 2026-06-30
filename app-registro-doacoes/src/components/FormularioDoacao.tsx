"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2, FileUp, Loader2, Plus, Trash2 } from "lucide-react";
import { criarDoacao, type CriarDoacaoState } from "@/app/nova-doacao/actions";
import { parseNumeroBR } from "@/lib/validacao";
import { formatarBRL, dataIso } from "@/lib/utils";
import { RECORRENCIA_OPCOES, RESPONSAVEIS, UNIDADES, NATUREZAS } from "@/lib/constants";

interface OpcaoClassificacao {
  codigo: string;
  rotulo: string;
}
interface LinhaItem {
  descricao: string;
  quantidade: string;
  valor_unitario: string;
}

const itemVazio = (): LinhaItem => ({ descricao: "", quantidade: "", valor_unitario: "" });
const estadoInicial: CriarDoacaoState = {};

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primario" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Enviando documentos...
        </>
      ) : (
        <>
          <FileUp className="h-4 w-4" /> Registrar doação
        </>
      )}
    </button>
  );
}

export default function FormularioDoacao({
  classificacoes,
  responsavelPadrao,
}: {
  classificacoes: OpcaoClassificacao[];
  responsavelPadrao: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(criarDoacao, estadoInicial);

  const [classificacao, setClassificacao] = useState("");
  const [recorrencia, setRecorrencia] = useState("sob_demanda");
  const [empresa, setEmpresa] = useState("");
  const [estoque, setEstoque] = useState("");
  const [doadorNome, setDoadorNome] = useState("");
  const [doadorDocumento, setDoadorDocumento] = useState("");
  const [codigoFornecedor, setCodigoFornecedor] = useState("");
  const [responsavel, setResponsavel] = useState(responsavelPadrao);
  const [docFiscal, setDocFiscal] = useState("");
  const [naturezaContabil, setNaturezaContabil] = useState("");
  const [dataDoacao, setDataDoacao] = useState(dataIso());
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<LinhaItem[]>([itemVazio()]);
  const [clientErros, setClientErros] = useState<Record<string, string>>({});

  useEffect(() => {
    if (state.ok && state.token) {
      formRef.current?.reset();
      setClassificacao("");
      setRecorrencia("sob_demanda");
      setEmpresa("");
      setEstoque("");
      setDoadorNome("");
      setDoadorDocumento("");
      setCodigoFornecedor("");
      setResponsavel(responsavelPadrao);
      setDocFiscal("");
      setNaturezaContabil("");
      setDataDoacao(dataIso());
      setObservacoes("");
      setItens([itemVazio()]);
      setClientErros({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.token]);

  function setItem(idx: number, campo: keyof LinhaItem, valor: string) {
    setItens((prev) => prev.map((it, i) => (i === idx ? { ...it, [campo]: valor } : it)));
  }
  function addItem() {
    setItens((prev) => [...prev, itemVazio()]);
  }
  function removeItem(idx: number) {
    setItens((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  const totalLinha = (it: LinhaItem) =>
    (parseNumeroBR(it.quantidade) ?? 0) * (parseNumeroBR(it.valor_unitario) ?? 0);
  const totalGeral = itens.reduce((s, it) => s + totalLinha(it), 0);
  const qtdGeral = itens.reduce((s, it) => s + (parseNumeroBR(it.quantidade) ?? 0), 0);

  function validarClient(): boolean {
    const e: Record<string, string> = {};
    if (!doadorNome.trim()) e.doador_nome = "Informe o fornecedor/doador.";
    if (!doadorDocumento.trim()) e.doador_documento = "Informe o CNPJ/CPF.";
    if (!codigoFornecedor.trim()) e.codigo_fornecedor = "Informe o código do fornecedor.";
    if (!dataDoacao) e.data_doacao = "Informe a data.";
    if (!responsavel) e.captador_responsavel = "Selecione o responsável.";
    if (!classificacao) e.classificacao = "Selecione a aplicação.";
    if (!empresa) e.empresa = "Selecione a unidade.";
    if (!estoque) e.estoque = "Informe se entra em estoque.";
    if (!docFiscal.trim()) e.documento_fiscal_numero = "Informe o documento fiscal (ou 'Sem NF').";
    if (!naturezaContabil.trim()) e.natureza_contabil = "Informe a natureza contábil.";
    if (!observacoes.trim()) e.observacoes = "Preencha as observações.";

    const itensValidos = itens.filter(
      (it) =>
        it.descricao.trim() &&
        (parseNumeroBR(it.quantidade) ?? 0) > 0 &&
        parseNumeroBR(it.valor_unitario) !== null
    );
    if (itensValidos.length === 0)
      e.itens = "Inclua ao menos 1 item com descrição, quantidade e valor unitário.";

    setClientErros(e);
    return Object.keys(e).length === 0;
  }

  function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    if (!validarClient()) ev.preventDefault();
  }

  function erroDe(campo: string): string | undefined {
    return clientErros[campo] ?? state.erros?.find((x) => x.campo === campo)?.mensagem;
  }

  // payload de itens (apenas linhas preenchidas) → vai no FormData como JSON
  const itensPayload = JSON.stringify(
    itens
      .filter((it) => it.descricao.trim() || it.quantidade || it.valor_unitario)
      .map((it) => ({
        descricao: it.descricao,
        quantidade: it.quantidade,
        valor_unitario: it.valor_unitario,
      }))
  );

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} className="space-y-6" noValidate>
      <input type="hidden" name="itens" value={itensPayload} />

      {state.ok && state.mensagem && (
        <div className="flex items-start gap-2 rounded-lg border border-marca-500/30 bg-marca-50 px-4 py-3 text-sm text-marca-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.mensagem}</span>
        </div>
      )}
      {state.ok === false && state.mensagem && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.mensagem}
        </div>
      )}

      {/* Doador / Fornecedor */}
      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-sm font-semibold text-slate-700">Doador / Fornecedor</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="campo-label" htmlFor="doador_nome">
              Fornecedor / Doador <span className="text-red-500">*</span>
            </label>
            <input id="doador_nome" name="doador_nome" className="campo-input" value={doadorNome}
              onChange={(e) => setDoadorNome(e.target.value)} placeholder="Razão social ou nome" />
            {erroDe("doador_nome") && <p className="campo-erro">{erroDe("doador_nome")}</p>}
          </div>
          <div>
            <label className="campo-label" htmlFor="doador_documento">CNPJ / CPF <span className="text-red-500">*</span></label>
            <input id="doador_documento" name="doador_documento" className="campo-input"
              value={doadorDocumento} onChange={(e) => setDoadorDocumento(e.target.value)} placeholder="CNPJ ou CPF do doador" />
            {erroDe("doador_documento") && <p className="campo-erro">{erroDe("doador_documento")}</p>}
          </div>
          <div>
            <label className="campo-label" htmlFor="codigo_fornecedor">Cód. fornecedor <span className="text-red-500">*</span></label>
            <input id="codigo_fornecedor" name="codigo_fornecedor" className="campo-input"
              value={codigoFornecedor} onChange={(e) => setCodigoFornecedor(e.target.value)}
              placeholder="Código no sistema contábil" />
            {erroDe("codigo_fornecedor") && <p className="campo-erro">{erroDe("codigo_fornecedor")}</p>}
          </div>
        </div>
      </fieldset>

      {/* Dados da doação */}
      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-sm font-semibold text-slate-700">Dados da doação</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="campo-label" htmlFor="data_doacao">Data <span className="text-red-500">*</span></label>
            <input id="data_doacao" name="data_doacao" type="date" className="campo-input"
              value={dataDoacao} onChange={(e) => setDataDoacao(e.target.value)} />
            {erroDe("data_doacao") && <p className="campo-erro">{erroDe("data_doacao")}</p>}
          </div>
          <div>
            <label className="campo-label" htmlFor="captador_responsavel">Responsável <span className="text-red-500">*</span></label>
            <select id="captador_responsavel" name="captador_responsavel" className="campo-input"
              value={responsavel} onChange={(e) => setResponsavel(e.target.value)}>
              <option value="">Selecione...</option>
              {RESPONSAVEIS.map((nome) => (
                <option key={nome} value={nome}>{nome}</option>
              ))}
            </select>
            {erroDe("captador_responsavel") && <p className="campo-erro">{erroDe("captador_responsavel")}</p>}
          </div>
          <div>
            <label className="campo-label" htmlFor="empresa">Unidade <span className="text-red-500">*</span></label>
            <select id="empresa" name="empresa" className="campo-input"
              value={empresa} onChange={(e) => setEmpresa(e.target.value)}>
              <option value="">Selecione...</option>
              {UNIDADES.map((cod) => (
                <option key={cod} value={cod}>Unidade {cod}</option>
              ))}
            </select>
            {erroDe("empresa") && <p className="campo-erro">{erroDe("empresa")}</p>}
          </div>
          <div>
            <label className="campo-label" htmlFor="estoque">Estoque <span className="text-red-500">*</span></label>
            <select id="estoque" name="estoque" className="campo-input"
              value={estoque} onChange={(e) => setEstoque(e.target.value)}>
              <option value="">Selecione...</option>
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
            {erroDe("estoque") && <p className="campo-erro">{erroDe("estoque")}</p>}
          </div>
          <div>
            <label className="campo-label" htmlFor="classificacao">Aplicação <span className="text-red-500">*</span></label>
            <select id="classificacao" name="classificacao" className="campo-input"
              value={classificacao} onChange={(e) => setClassificacao(e.target.value)}>
              <option value="">Selecione...</option>
              {classificacoes.map((c) => (
                <option key={c.codigo} value={c.codigo}>{c.rotulo}</option>
              ))}
            </select>
            {erroDe("classificacao") && <p className="campo-erro">{erroDe("classificacao")}</p>}
          </div>
          <div>
            <label className="campo-label" htmlFor="recorrencia">Recorrência <span className="text-red-500">*</span></label>
            <select id="recorrencia" name="recorrencia" className="campo-input"
              value={recorrencia} onChange={(e) => setRecorrencia(e.target.value)}>
              {RECORRENCIA_OPCOES.map((r) => (
                <option key={r.codigo} value={r.codigo}>{r.rotulo}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="campo-label" htmlFor="documento_fiscal_numero">Documento fiscal / NF <span className="text-red-500">*</span></label>
            <input id="documento_fiscal_numero" name="documento_fiscal_numero" className="campo-input"
              value={docFiscal} onChange={(e) => setDocFiscal(e.target.value)} placeholder="Nº da NF (ou 'Sem NF')" />
            {erroDe("documento_fiscal_numero") && <p className="campo-erro">{erroDe("documento_fiscal_numero")}</p>}
          </div>
          <div>
            <label className="campo-label" htmlFor="natureza_contabil">Natureza contábil <span className="text-red-500">*</span></label>
            <select id="natureza_contabil" name="natureza_contabil" className="campo-input"
              value={naturezaContabil} onChange={(e) => setNaturezaContabil(e.target.value)}>
              <option value="">Selecione...</option>
              {NATUREZAS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            {erroDe("natureza_contabil") && <p className="campo-erro">{erroDe("natureza_contabil")}</p>}
          </div>
        </div>
      </fieldset>

      {/* Itens */}
      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-sm font-semibold text-slate-700">Itens da doação</legend>
        <div className="space-y-2">
          <div className="hidden grid-cols-12 gap-2 px-1 text-xs font-medium text-slate-500 sm:grid">
            <span className="col-span-6">Descrição</span>
            <span className="col-span-2 text-right">Qtd</span>
            <span className="col-span-2 text-right">Vlr unitário</span>
            <span className="col-span-2 text-right">Total</span>
          </div>
          {itens.map((it, idx) => (
            <div key={idx} className="grid grid-cols-12 items-center gap-2">
              <input className="campo-input col-span-12 sm:col-span-6" placeholder="Ex.: Material de papelaria"
                value={it.descricao} onChange={(e) => setItem(idx, "descricao", e.target.value)} />
              <input className="campo-input col-span-4 text-right sm:col-span-2" inputMode="decimal" placeholder="Qtd"
                value={it.quantidade} onChange={(e) => setItem(idx, "quantidade", e.target.value)} />
              <input className="campo-input col-span-4 text-right sm:col-span-2" inputMode="decimal" placeholder="0,0000"
                value={it.valor_unitario} onChange={(e) => setItem(idx, "valor_unitario", e.target.value)} />
              <div className="col-span-3 text-right text-sm text-slate-600 sm:col-span-2">
                {formatarBRL(totalLinha(it))}
              </div>
              <button type="button" onClick={() => removeItem(idx)}
                className="col-span-1 flex justify-center text-slate-400 hover:text-red-600"
                title="Remover item" disabled={itens.length === 1}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {erroDe("itens") && <p className="campo-erro">{erroDe("itens")}</p>}
        <div className="mt-3 flex items-center justify-between">
          <button type="button" onClick={addItem} className="btn-secundario px-3 py-1.5 text-xs">
            <Plus className="h-4 w-4" /> Adicionar item
          </button>
          <div className="text-right text-sm">
            <span className="text-slate-500">Qtd total: </span>
            <span className="font-medium text-slate-700">{qtdGeral.toLocaleString("pt-BR")}</span>
            <span className="mx-2 text-slate-300">|</span>
            <span className="text-slate-500">Total: </span>
            <span className="font-bold text-marca-700">{formatarBRL(totalGeral)}</span>
          </div>
        </div>
      </fieldset>

      {/* Observações */}
      <div>
        <label className="campo-label" htmlFor="observacoes">Observações <span className="text-red-500">*</span></label>
        <textarea id="observacoes" name="observacoes" rows={2} className="campo-input"
          value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Ex.: Doação sem NF destinada à área administrativa" />
        {erroDe("observacoes") && <p className="campo-erro">{erroDe("observacoes")}</p>}
      </div>

      {/* Anexos */}
      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-sm font-semibold text-slate-700">Documentos comprobatórios</legend>
        <p className="mb-3 text-xs text-slate-500">
          Anexe ao menos um documento (comprovante, orçamento ou nota fiscal).
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <CampoArquivo nome="arquivo_comprovante" rotulo="Comprovante / Orçamento" obrigatorio />
          <CampoArquivo nome="arquivo_nota_fiscal" rotulo="Nota fiscal" />
          <CampoArquivo nome="arquivo_outro" rotulo="Outros (termo...)" />
        </div>
        {erroDe("documentos") && <p className="campo-erro">{erroDe("documentos")}</p>}
      </fieldset>

      <div className="flex items-center justify-end gap-3">
        <BotaoSalvar />
      </div>
    </form>
  );
}

function CampoArquivo({
  nome,
  rotulo,
  obrigatorio,
}: {
  nome: string;
  rotulo: string;
  obrigatorio?: boolean;
}) {
  const [nomes, setNomes] = useState<string[]>([]);
  return (
    <div>
      <label className="campo-label" htmlFor={nome}>
        {rotulo} {obrigatorio && <span className="text-red-500">*</span>}
      </label>
      <input
        id={nome}
        name={nome}
        type="file"
        multiple
        className="block w-full text-xs text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-marca-100 file:px-2 file:py-1.5 file:text-xs file:font-medium file:text-marca-700"
        onChange={(e) => setNomes(Array.from(e.target.files ?? []).map((f) => f.name))}
      />
      {nomes.length > 0 && (
        <ul className="mt-1 space-y-0.5 text-[11px] text-slate-500">
          {nomes.map((n, i) => (
            <li key={i} className="truncate">• {n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
