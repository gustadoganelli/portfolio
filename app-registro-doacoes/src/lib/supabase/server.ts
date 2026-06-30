import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/**
 * Client Supabase para Server Components, Server Actions e Route Handlers.
 * Usa a sessão do usuário via cookies → todas as queries respeitam RLS.
 *
 * (Next.js 14: `cookies()` é síncrono. Em Next 15 troque para `await cookies()`.)
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado de um Server Component (cookies read-only).
            // A sessão é renovada pelo middleware — pode ignorar aqui.
          }
        },
      },
    }
  );
}
