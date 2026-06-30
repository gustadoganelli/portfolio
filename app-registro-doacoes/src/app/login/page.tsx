"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signIn, type LoginState } from "./actions";
import { ORGANIZACAO_NOME } from "@/lib/constants";

const estadoInicial: LoginState = {};

function BotaoEntrar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primario w-full" disabled={pending}>
      {pending ? "Entrando..." : "Entrar"}
    </button>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const [state, formAction] = useFormState(signIn, estadoInicial);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-marca-100 text-lg font-bold text-marca-700">
            {ORGANIZACAO_NOME.charAt(0)}
          </div>
          <h1 className="mt-4 text-lg font-bold text-slate-800">Registro de Doações</h1>
          <p className="text-sm text-slate-500">{ORGANIZACAO_NOME}</p>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="redirect" value={searchParams?.redirect ?? "/"} />
          <div>
            <label className="campo-label" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="campo-input"
              placeholder="voce@exemplo.com"
            />
          </div>
          <div>
            <label className="campo-label" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              required
              className="campo-input"
            />
          </div>

          {state?.erro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.erro}</p>
          )}

          <BotaoEntrar />
        </form>
      </div>
    </div>
  );
}
