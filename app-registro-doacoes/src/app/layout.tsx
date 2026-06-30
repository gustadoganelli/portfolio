import type { Metadata } from "next";
import "./globals.css";
import { getSessaoUsuario } from "@/lib/auth";
import { ORGANIZACAO_NOME } from "@/lib/constants";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: `Registro de Doações — ${ORGANIZACAO_NOME}`,
  description: "Registro, conferência e lançamento de doações.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sessao = await getSessaoUsuario();

  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">
        {sessao ? (
          <div className="flex min-h-screen">
            <NavBar sessao={sessao} />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
