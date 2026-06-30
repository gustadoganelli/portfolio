# Sistema de Auditoria Interna

Sistema para registro e acompanhamento de auditorias internas em campo. Composto por
tres partes que conversam pelo mesmo modelo de dados:

1. **App PWA** (`app/`) - aplicativo mobile para o auditor preencher checklists e abrir
   nao conformidades em campo, com funcionamento **offline**.
2. **Painel** (`painel/`) - dashboard de resultados com indicadores de conformidade por
   unidade, por area e por risco.
3. **Banco de dados** (`db/`) - schema PostgreSQL (DDL) e dados de exemplo.

> ⚠️ Projeto de demonstracao - todos os dados sao ficticios.

## O que faz

- **Catalogo configuravel**: unidades, areas e um banco de perguntas (itens de verificacao).
  Cada unidade define quais areas audita.
- **Tipos de pergunta**: nota (1 a 5), Sim/Nao, classificacao (formulario dinamico via JSON),
  recomendacao, apontamento e anotacao livre.
- **Fluxo de duas fases**: o auditor preenche tudo em **rascunho** (salvo no aparelho,
  funciona sem internet) e confirma a auditoria de uma vez no final.
- **Nao conformidades com matriz GUT**: cada NC recebe Gravidade x Urgencia x Tendencia,
  resultando num score de risco (Baixo / Medio / Alto / Critico). Respostas ruins
  (nota baixa, "Nao", apontamento) sugerem automaticamente a abertura de uma NC.
- **Historico**: o auditor ve as respostas anteriores de cada item naquela unidade.
- **Evidencias**: anexos (fotos/arquivos) por resposta.
- **Painel**: nota media por unidade e por area, NCs por risco e tabela de
  acompanhamento de nao conformidades e auditorias.

## Tecnologias

- **App**: React 18 + TypeScript + Vite, PWA (`vite-plugin-pwa`) para uso offline,
  icones `lucide-react`. Persistencia local via `localStorage`.
- **Painel**: HTML + CSS + JavaScript puro (sem dependencias externas; graficos de
  barra em CSS), servido por um pequeno servidor Python estatico.
- **Banco**: PostgreSQL (schema + funcao de fechamento em PL/pgSQL).
- **Backend (opcional)**: o app foi escrito com uma camada de dados isolada
  (`app/src/db.ts`). No modo demo ele usa dados ficticios embutidos; para producao,
  basta implementar as mesmas funcoes apontando para sua API (ver `.env.example`).

## Como rodar

### App PWA

```bash
cd app
npm install
npm run dev
# abra http://localhost:5173
```

Login do demo: qualquer e-mail e a senha `demo`.

Para gerar o build de producao (com service worker / offline):

```bash
npm run build
npm run preview
```

### Painel

```bash
cd painel
python serve.py
# abra http://localhost:5174
```

(Ou sirva a pasta `painel/public` com qualquer servidor estatico.)

### Banco de dados

```bash
# requer PostgreSQL
psql -d minha_base -f db/migrations/0001_schema.sql
psql -d minha_base -f db/migrations/0002_rpc_confirmar.sql
psql -d minha_base -f db/seed/0100_seed.sql      # dados de exemplo (ficticios)
```

## Estrutura

```
sistema-auditoria/
├─ app/                 # PWA do auditor (React + Vite + TS)
│  ├─ src/
│  │  ├─ App.tsx        # telas: login, nova auditoria, painel, checklist, NCs
│  │  ├─ db.ts          # camada de dados (mock no demo; troque por API real)
│  │  ├─ icons.ts       # mapeia nome do icone -> componente lucide
│  │  └─ data/seed.json # catalogo ficticio (unidades, areas, itens, historico)
│  └─ ...
├─ painel/              # dashboard de resultados (HTML/CSS/JS)
│  ├─ public/           # index.html, app.js, data.js (dados ficticios), styles.css
│  └─ serve.py
└─ db/                  # schema + dados de exemplo
   ├─ migrations/       # 0001 schema, 0002 RPC de fechamento
   └─ seed/             # 0100 dados ficticios
```
