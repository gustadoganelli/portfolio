# Guia de anonimização — apps Next.js / Node

Este guia cobre como preparar um projeto **Next.js** (ou Node em geral: Express, NestJS, Vite, etc.) para o portfólio público. O objetivo é publicar o código com **dados 100% fictícios** e **zero credenciais reais**, mantendo o projeto funcional para quem clonar (`npm i && npm run dev`).

> Regra de ouro: se um dado permite identificar o cliente, acessar um sistema, ou vazar informação sensível, ele **não vai** para o repositório público.

---

## 1. Variáveis de ambiente — NUNCA versione `.env`

Este é o ponto mais crítico e a causa nº 1 de vazamento de credenciais em portfólios.

### O que fazer

1. **NUNCA** comitar `.env`, `.env.local`, `.env.development.local`, `.env.production.local` ou qualquer arquivo com valores reais.
2. Publicar **apenas** um `.env.example` com **placeholders** (chaves sim, valores não).
3. Garantir que o `.gitignore` bloqueia todos os arquivos de ambiente.

### `.gitignore` mínimo

```gitignore
# Variáveis de ambiente (NUNCA versionar valores reais)
.env
.env.*
!.env.example

# Dependências e build
node_modules/
.next/
dist/
build/
out/

# Logs e temporários
*.log
npm-debug.log*
.DS_Store
```

> Note o `!.env.example`: ele reabre a exceção para que **só** o exemplo seja versionado.

### Modelo de `.env.example`

Use nomes de variáveis reais, mas valores genéricos e obviamente falsos. Prefixe valores de placeholder com algo inequívoco (`your-`, `example`, `xxxx`).

```dotenv
# --- App ---
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# --- Banco de dados (Postgres) ---
DATABASE_URL=postgresql://usuario:senha@localhost:5432/meu_banco

# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-aqui  # NUNCA expor no client

# --- Autenticação ---
AUTH_SECRET=gere-com-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# --- APIs externas ---
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
SMTP_HOST=smtp.exemplo.com
SMTP_USER=usuario@exemplo.com
SMTP_PASS=sua-senha-de-app
```

### Antes de comitar: remova e limpe o histórico

Se o `.env` já foi rastreado em algum commit, **não basta** apagar o arquivo — ele fica no histórico.

```bash
# Parar de rastrear (mantém o arquivo local)
git rm --cached .env .env.local

# Confirmar que não há segredos rastreados
git ls-files | grep -Ei "\.env" || echo "OK: nenhum .env rastreado"

# Varredura rápida por segredos no working tree
grep -rEn "sk-[a-zA-Z0-9]{20}|service_role|BEGIN.*PRIVATE KEY|password=" \
  --include="*.ts" --include="*.js" --include="*.json" --include="*.env*" . \
  || echo "OK: nenhum segredo óbvio encontrado"
```

> Se um segredo real já foi comitado, considere o projeto **um novo repositório**: reconstrua a partir de um `git init` limpo em vez de tentar reescrever o histórico. É mais seguro e mais simples para um portfólio. E **revogue/rotacione** a credencial vazada no provedor.

---

## 2. Configs de Supabase / banco de dados

### Client Supabase

O client deve ler **sempre** de variáveis de ambiente — nunca com valores hardcoded.

Errado (vaza projeto e chave):
```ts
const supabase = createClient(
  "https://abcd1234real.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.chave-real..."
)
```

Certo (lê do ambiente):
```ts
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Checklist Supabase / DB

- [ ] Nenhuma URL de projeto real (`*.supabase.co`) no código ou nos commits.
- [ ] Nenhuma `anon key`, `service_role key` ou connection string real versionada.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` só usada no servidor (nunca com prefixo `NEXT_PUBLIC_`).
- [ ] `DATABASE_URL` só existe no `.env.example` como placeholder.
- [ ] Referências a nomes de projeto/bucket/schema trocadas por nomes genéricos (`meu_banco`, `documentos`, `public`).

---

## 3. Seed e dados fictícios

O portfólio deve rodar com dados de exemplo que **contem uma história plausível** sem expor nada real.

### Princípios

- Nomes de pessoas: use fictícios (`Ana Silva`, `Bruno Costa`, `Carla Mendes`).
- Empresas/clientes: genéricos (`Empresa Exemplo Ltda`, `Cliente A`, `Fornecedor Beta`).
- E-mails: domínio `@exemplo.com` ou `@example.com`.
- Valores financeiros: números redondos e claramente fictícios.
- CPF/CNPJ: use geradores de teste ou máscaras (`000.000.000-00`).

### Exemplo de seed (`prisma/seed.ts` ou `scripts/seed.ts`)

```ts
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  await prisma.cliente.createMany({
    data: [
      { nome: "Empresa Exemplo Ltda", email: "contato@exemplo.com", cidade: "São Paulo" },
      { nome: "Comércio Beta ME",     email: "beta@exemplo.com",    cidade: "Rio de Janeiro" },
      { nome: "Serviços Gama S.A.",   email: "gama@exemplo.com",    cidade: "Curitiba" },
    ],
  })

  await prisma.pedido.createMany({
    data: [
      { clienteId: 1, valor: 1500.0, status: "PAGO" },
      { clienteId: 2, valor: 3200.0, status: "PENDENTE" },
      { clienteId: 3, valor: 890.5,  status: "CANCELADO" },
    ],
  })

  console.log("Seed concluído com dados fictícios.")
}

main().finally(() => prisma.$disconnect())
```

### Seed com Supabase (SQL puro)

```sql
insert into public.clientes (nome, email, cidade) values
  ('Empresa Exemplo Ltda', 'contato@exemplo.com', 'São Paulo'),
  ('Comércio Beta ME',     'beta@exemplo.com',    'Rio de Janeiro'),
  ('Serviços Gama S.A.',   'gama@exemplo.com',    'Curitiba');
```

> Se o projeto tinha um dump de produção (`dump.sql`, `backup.csv`, planilhas exportadas), **remova-o** e substitua por um seed pequeno e fictício.

---

## 4. Migrações SQL genéricas

Migrações descrevem o **schema** — mantenha a estrutura, remova qualquer dado semeado real e nomes que identifiquem o cliente.

### Faça

- Mantenha `CREATE TABLE`, índices, constraints, RLS policies — isso demonstra sua competência técnica.
- Renomeie tabelas/colunas com nomes de cliente (`vendas_amigos`, `conta_itau_64653`) para genéricos (`vendas`, `conta_bancaria`).
- Remova `INSERT` com dados reais de dentro das migrações (mova para o seed fictício).

### Exemplo de migração limpa

```sql
-- migrations/0001_init.sql
create table public.clientes (
  id         bigint generated always as identity primary key,
  nome       text not null,
  email      text unique not null,
  cidade     text,
  created_at timestamptz not null default now()
);

create table public.pedidos (
  id          bigint generated always as identity primary key,
  cliente_id  bigint not null references public.clientes(id),
  valor       numeric(12,2) not null,
  status      text not null default 'PENDENTE',
  created_at  timestamptz not null default now()
);

-- Exemplo de RLS (demonstra boa prática, sem dado real)
alter table public.pedidos enable row level security;

create policy "usuarios leem seus pedidos"
  on public.pedidos for select
  using (auth.uid() = cliente_id::text::uuid);
```

---

## 5. Scripts do `package.json`

Revise os scripts: eles não podem apontar para hosts reais, tokens embutidos ou caminhos privados.

### Antes (vaza infra)
```json
{
  "scripts": {
    "deploy": "wrangler deploy --account-id abc123 --token $CF_REAL_TOKEN",
    "db:push": "psql postgresql://user:SENHA@host-exemplo.com/db < schema.sql"
  }
}
```

### Depois (genérico e seguro)
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset --force"
  }
}
```

### Checklist `package.json`

- [ ] Nenhum token, account-id ou senha embutido em script.
- [ ] Nenhum host de produção real (troque por `localhost` ou variável de ambiente).
- [ ] Campo `name` sem nome de cliente (use algo genérico, ex.: `painel-pedidos`).
- [ ] `repository`, `author`, `homepage` sem dados pessoais/privados que você não queira publicar.
- [ ] Remova dependências privadas (`@empresa-cliente/pacote`) ou substitua por equivalente público.

---

## 6. Como rodar (seção para o README)

Documente o passo a passo para que qualquer pessoa clone e rode localmente.

```bash
# 1. Instalar dependências
npm install

# 2. Criar o arquivo de ambiente a partir do exemplo
cp .env.example .env.local
#   Edite .env.local com suas próprias credenciais

# 3. (Opcional) rodar migrações e seed com dados fictícios
npm run db:migrate
npm run db:seed

# 4. Subir o servidor de desenvolvimento
npm run dev
#   Acesse http://localhost:3000
```

---

## 7. Checklist final de anonimização (Next.js / Node)

Antes de publicar, confirme **todos** os itens:

- [ ] `.env`, `.env.local` e afins **removidos** e listados no `.gitignore`.
- [ ] Só o `.env.example` (com placeholders) está versionado.
- [ ] `git ls-files | grep .env` retorna **apenas** `.env.example`.
- [ ] Varredura de segredos (`sk-`, `service_role`, `PRIVATE KEY`, `password=`) sem resultados reais.
- [ ] Clients de Supabase/DB leem de `process.env`, nada hardcoded.
- [ ] Nenhuma URL `*.supabase.co` real, connection string ou chave no código.
- [ ] Dumps/backups/planilhas de produção removidos; seed fictício no lugar.
- [ ] Migrações com schema mantido, mas sem dados reais nem nomes de cliente.
- [ ] Scripts do `package.json` sem tokens, hosts de produção ou caminhos privados.
- [ ] Campo `name`, `author` e afins do `package.json` genéricos.
- [ ] `node_modules/`, `.next/`, `dist/`, `build/` ignorados (não versionar build).
- [ ] Comentários no código sem nomes de pessoas, clientes ou infraestrutura interna.
- [ ] README com seção "Como rodar" testada (`npm i && npm run dev` funciona do zero).

---

## 8. Modelo de seção de README (copie e adapte)

```markdown
## 🛠️ Stack

- **Next.js** (App Router) + React + TypeScript
- **Supabase** (Postgres + Auth) / Prisma ORM
- **Tailwind CSS** para estilização
- Deploy em **Vercel** / **Cloudflare Pages**

## 🚀 Como rodar localmente

```bash
git clone https://github.com/usuario/nome-do-projeto.git
cd nome-do-projeto
npm install
cp .env.example .env.local   # preencha com suas credenciais
npm run db:migrate           # aplica o schema
npm run db:seed              # popula com dados fictícios
npm run dev                  # http://localhost:3000
```

## ⚙️ Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do seu projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (somente servidor) |
| `DATABASE_URL` | String de conexão Postgres |

## 📝 Observações

Este é um projeto de portfólio. Todos os dados exibidos são **fictícios** e não
representam informações reais de clientes ou sistemas de produção.
```
```
