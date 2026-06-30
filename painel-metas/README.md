# Painel de Metas e Desempenho

Painel web para acompanhamento de metas e desempenho por área e responsável,
com cálculo de atingimento, pontuação ponderada e evolução mensal.

> ⚠️ Projeto de demonstração — todos os dados são fictícios.

## O que faz

- **Login com perfis de acesso** (demonstração, autenticação local):
  - **Administrador** — vê e edita tudo; gerencia usuários e acessos.
  - **Diretoria** — vê todos os indicadores (somente leitura do escopo).
  - **Responsável** — vê e edita apenas os indicadores sob sua responsabilidade.
- **Indicadores (KPIs) agrupados por área**, com cartões de resumo e barra de
  atingimento (verde / amarelo / vermelho).
- **Detalhe do indicador** com:
  - Pontuação total consolidada (soma das pontuações ponderadas das metas).
  - Tabela de metas com meta acumulada, realizado acumulado, atingimento,
    pontuação e linha do tempo mensal (uma bolinha por mês).
  - Tabela de projetos e iniciativas vinculados às metas, com status,
    prioridade, prazo e progresso.
- **Edição de metas** em um painel lateral (drawer) com três abas:
  - Dados da meta (formato, direção "bom quando", fórmula, peso, status).
  - Realizado mensal (12 meses) + resumo calculado em tempo real.
  - Observações.
- **Cadastro de projetos** em modal, vinculados a uma meta.
- **Gerenciamento de acessos** (admin): criar/editar/remover usuários e marcar
  quais indicadores cada responsável pode acessar.

### Lógica de cálculo (resumo)

- **Acumulado**: cada meta soma (ex.: despesas, volume) ou tira a média
  (ex.: percentuais, valores unitários) dos meses até o último com realizado.
- **Atingimento exibido**: `Realizado ÷ Meta` ou `Meta ÷ Realizado` (configurável).
- **Pontuação**: sempre baseada em "bom quando" (maior/menor):
  - `>= 100%` → peso cheio.
  - `90% a 100%` → proporcional (linear).
  - `< 90%` → zero.

## Tecnologias

- **HTML5 + CSS3** (layout responsivo, sem frameworks).
- **JavaScript puro (vanilla)** — sem dependências nem build step.
- **Dados em memória** (mock embutido em `js/data.js`).

```
painel-metas/
├── index.html        # estrutura da página (login, app, drawer, modais)
├── style.css         # tema visual
├── js/
│   ├── data.js       # dados fictícios (usuários, KPIs, metas, projetos)
│   ├── engine.js     # cálculos, formatação e permissões
│   ├── auth.js       # fluxo de login/logout (local)
│   └── app.js        # renderização, navegação e interações
└── README.md
```

## Como rodar

Por ser 100% estático, basta abrir o `index.html` no navegador. Para evitar
restrições de alguns navegadores, prefira servir por um servidor local:

```bash
# Opção 1 — Python
python -m http.server 8000

# Opção 2 — Node
npx serve .
```

Depois acesse `http://localhost:8000`.

### Usuários de demonstração

A senha de todos é `demo` (há botões de atalho na tela de login):

| Perfil        | E-mail                  | Senha |
|---------------|-------------------------|-------|
| Administrador | admin@exemplo.dev       | demo  |
| Diretoria     | diretoria@exemplo.dev   | demo  |
| Responsável   | joao@exemplo.dev        | demo  |

> Todas as edições (metas, projetos, usuários) ficam apenas na memória do
> navegador e são descartadas ao recarregar a página.

## Integração com backend (opcional)

Esta demo não faz chamadas de rede. Para conectar a um backend real, substitua
a função `doLogin()` em `js/auth.js` por uma chamada à sua API
(ex.: `fetch('{{API_URL}}/login', ...)`) e popule o objeto `DB` em `js/data.js`
com a resposta antes de chamar `initApp()`. Use variáveis de ambiente /
placeholders como `{{API_URL}}` e `{{API_KEY}}` — nunca chaves reais no código.
