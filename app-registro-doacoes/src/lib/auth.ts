import { createClient } from "@/lib/supabase/server";
import type { PerfilUsuario } from "@/types/database.types";

export interface SessaoUsuario {
  id: string;
  email: string | null;
  nome: string | null;
  perfil: PerfilUsuario | null;
}

/**
 * Retorna o usuário autenticado + seu perfil (de perfis_usuario).
 * Retorna null se não houver sessão.
 */
export async function getSessaoUsuario(): Promise<SessaoUsuario | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfis_usuario")
    .select("nome, email, perfil")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: perfil?.email ?? user.email ?? null,
    nome: perfil?.nome ?? null,
    perfil: (perfil?.perfil as PerfilUsuario) ?? null,
  };
}

/** Quem registra novas doações: captação e admin. */
export function podeCriarDoacao(perfil: PerfilUsuario | null): boolean {
  return perfil === "captacao" || perfil === "admin";
}

/** Quem opera a fila (lança/transiciona): fiscal e admin. */
export function podeOperarFila(perfil: PerfilUsuario | null): boolean {
  return perfil === "fiscal" || perfil === "admin";
}

/** Quem pode VER a fila (consulta): captação acompanha; fiscal/admin também operam. */
export function podeVerFila(perfil: PerfilUsuario | null): boolean {
  return perfil === "captacao" || perfil === "fiscal" || perfil === "admin";
}
