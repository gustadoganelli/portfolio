"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  erro?: string;
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/");

  if (!email || !senha) {
    return { erro: "Informe e-mail e senha." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    return { erro: "Credenciais inválidas. Verifique e-mail e senha." };
  }

  redirect(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/");
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
