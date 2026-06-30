# Sistema de Registro de Doações (Demo)

Aplicação web para registrar doações de bens e serviços, conferir os documentos
comprobatórios e acompanhar o lançamento contábil através de uma fila simples de
trabalho — com login, perfis de acesso e trilha de auditoria.

> ⚠️ Projeto de demonstração — todos os dados são fictícios.

## O que faz

- **Login e perfis de acesso** (Supabase Auth + RLS): cada usuário tem um perfil
  (`captacao`, `fiscal` ou `admin`) que define o que pode ver e fazer.
  - **Captação** registra novas doações e acompanha a fila.
  - **Fiscal** opera a fila e efetua o lançamento contábil.
  - **Admin** tem acesso total.
- **Registro de doação** (`/nova-doacao`): formulário com cabeçalho (doador,
  unidade, aplicação, natureza contábil, recorrência), múltiplos **itens**
  (descrição, quantidade, valor unitário com total calculado) e **upload de
  documentos** (comprovante, nota fiscal, outros).
  - O envio é transacional: se o upload de qualquer documento falhar, a doação e
    os arquivos já enviados são revertidos (rollback) — nada fica pela metade.
- **Fila de lançamento / acompanhamento** (`/fila`): cards com contadores por
  status, filtros (status, doador, aplicação, período), tabela das doações e um
  painel lateral de detalhe com itens, documentos (links assinados), ação de
  "marcar como lançado" e histórico de auditoria.
- **Máquina de estados** validada no banco: `pendente_lancamento → lancado`.
- **Auditoria**: cada criação e transição gera um registro imutável em
  `doacao_log` via triggers/RPCs `security definer`.

## Tecnologias

- **Next.js 14** (App Router, Server Components, Server Actions)
- **React 18** + **TypeScript**
- **Supabase** (Postgres, Auth, Storage, Row Level Security)
- **Zod** para validação compartilhada client/server
- **Tailwind CSS** + **lucide-react** (ícones)

### Estrutura

```
src/
  app/
    layout.tsx                 # layout raiz + navegação
    page.tsx                   # redireciona conforme o perfil
    login/                     # página + server action de autenticação
    nova-doacao/               # formulário + server action de criação (com rollback)
    fila/                      # fila/painel + actions (transição, lançamento, link assinado)
  components/                  # NavBar, FormularioDoacao, TabelaDoacoes, DetalheDoacao, etc.
  lib/
    supabase/                  # clients (browser, server, middleware)
    auth.ts                    # sessão + regras de permissão por perfil
    validacao.ts               # schemas Zod
    estados.ts                 # máquina de estados (espelho do banco)
    constants.ts               # rótulos, naturezas, listas (dados fictícios)
    utils.ts                   # formatação BRL/datas, nomes de arquivo, cn()
  types/                       # tipos do schema e tipos de domínio
  middleware.ts                # renova sessão e protege rotas privadas
supabase/
  migrations/                  # schema, funções/triggers, máquina de estados, RLS, storage
  seed.sql                     # dados de exemplo (fictícios)
```

## Como rodar

Pré-requisitos: Node.js 18.18+ e um projeto no [Supabase](https://supabase.com/).

1. **Instale as dependências:**

   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**

   ```bash
   cp .env.example .env.local
   ```

   Preencha `.env.local` com a URL e a chave anônima do seu projeto Supabase.

3. **Aplique o schema no Supabase** (via SQL Editor ou Supabase CLI), na ordem:

   ```
   supabase/migrations/0001_schema.sql
   supabase/migrations/0002_funcoes_triggers.sql
   supabase/migrations/0003_maquina_estados.sql
   supabase/migrations/0004_rls.sql
   supabase/migrations/0005_storage.sql
   supabase/seed.sql
   ```

4. **Crie usuários de teste** no Supabase Auth e registre o perfil de cada um na
   tabela `perfis_usuario` (veja exemplos comentados em `supabase/seed.sql`).

5. **Suba o app em desenvolvimento:**

   ```bash
   npm run dev
   ```

   Acesse `http://localhost:3000` e faça login com um usuário de teste.

### Scripts

| Comando         | Descrição                          |
| --------------- | ---------------------------------- |
| `npm run dev`   | Servidor de desenvolvimento        |
| `npm run build` | Build de produção                  |
| `npm run start` | Sobe o build de produção           |
| `npm run lint`  | Lint com ESLint                    |

---

> ⚠️ Projeto de demonstração — todos os dados são fictícios. Organização,
> nomes de pessoas, fornecedores, naturezas contábeis e credenciais são
> exemplos genéricos e não representam dados reais.
