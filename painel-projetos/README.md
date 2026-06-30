# Painel de Projetos

Painel/catálogo de projetos internos: uma aplicação web (HTML/CSS/JS puro) para
cadastrar, organizar e acompanhar os projetos e ferramentas de uma equipe,
agrupados por categoria e por setor, com um dashboard de indicadores.

> ⚠️ Projeto de demonstração — todos os dados são fictícios.

## O que faz

- **Catálogo de projetos** em dois modos de visualização:
  - **Quadro** (estilo kanban) com colunas por categoria — Automações, BI / Relatórios, Aplicativos, Integrações e Web.
  - **Grade** (tabela) com as principais colunas e ação de editar.
- **Filtros combinados** por título, setor, tecnologia, autor e status.
- **Cadastro, edição e exclusão** de projetos em modal (título, descrição,
  categoria, setor, autor, status, prioridade, tecnologias, link e prazo).
- **Detalhe do projeto** em modal somente-leitura.
- **Catálogo de tecnologias**, com contagem de uso e adição/remoção.
- **Dashboard** com cartões-resumo e gráficos (Chart.js):
  projetos por categoria, demanda por setor, projetos por status e
  produtividade por autor.

A demo roda inteiramente no navegador, sem backend: os dados ficam em memória,
carregados de `public/data.js` (mock 100% fictício). As alterações que você
fizer valem durante a sessão (não são persistidas ao recarregar).

## Tecnologias

- HTML, CSS e JavaScript (sem framework / sem build)
- [Chart.js](https://www.chartjs.org/) (via CDN) para os gráficos
- Esquema de banco em PostgreSQL / Supabase (`schema.sql`) — opcional, para a
  versão com backend real

## Como rodar

Por ser estático, basta servir a pasta `public/` com qualquer servidor HTTP.

```bash
# a partir da raiz do projeto
cd public

# opção 1 — Python
python -m http.server 8000

# opção 2 — Node
npx serve .
```

Depois acesse `http://localhost:8000`.

> Abrir o `index.html` direto pelo `file://` também funciona, mas servir por
> HTTP evita restrições de alguns navegadores.

## Ligando um backend real (opcional)

O front foi escrito para ser fácil de plugar a um backend tipo Supabase:

1. Crie o banco rodando o `schema.sql` (tabelas + índices + seeds de exemplo).
2. Copie `.env.example` para `.env` e preencha `SUPABASE_URL` e `SUPABASE_KEY`.
3. Em `public/app.js`, substitua as funções da "API mock" (que hoje leem o
   array `MOCK` de `public/data.js`) por chamadas HTTP ao seu backend, usando
   os placeholders `{{SUPABASE_URL}}` / `{{SUPABASE_KEY}}`.

## Estrutura

```
painel-projetos/
├── public/
│   ├── index.html     # marcação das telas e modais
│   ├── styles.css     # estilos (paleta neutra, responsivo)
│   ├── app.js         # lógica: views, filtros, CRUD, dashboard
│   └── data.js        # dados FICTÍCIOS embutidos (mock)
├── schema.sql         # DDL PostgreSQL/Supabase + seeds de exemplo
├── .env.example       # variáveis de ambiente (placeholders)
└── README.md
```
