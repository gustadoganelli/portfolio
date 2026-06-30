"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/** Client Supabase para uso no browser (componentes "use client"). */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
