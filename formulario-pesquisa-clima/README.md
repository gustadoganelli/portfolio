# Pesquisa de Clima Organizacional

Sistema web de **pesquisa de clima / risco psicossocial** com formulário anônimo,
painel administrativo protegido por login, resultados em gráficos, exportação de
dados e geração de QR Code para divulgação.

> ⚠️ Projeto de demonstração — todos os dados são fictícios. Nenhuma credencial,
> empresa ou pessoa real é utilizada. O envio de respostas e o login são apenas
> simulados no navegador.

## O que faz

- **Formulário de resposta** (`index.html`)
  - Identificação por **Unidade** e **Setor** (selects encadeados — o setor depende da unidade).
  - 10 perguntas em escala de 5 pontos (*Nunca → Sempre*).
  - Barra de progresso, validação obrigatória campo a campo e tela de sucesso.
  - 100% anônimo. No modo demo, o envio é simulado e guardado no `localStorage`.

- **Login do painel** (`login.html`)
  - Tela de acesso restrito à equipe administrativa.
  - No modo demo, autenticação simulada. Credenciais: `admin@exemplo.com` / `demo123`.

- **Painel de resultados** (`resultados.html`)
  - Proteção de rota (redireciona para o login se não autenticado).
  - **KPIs**: total de respostas, resposta mais frequente e data da última resposta.
  - **Gráficos de barras** (um por pergunta) com Chart.js.
  - **Filtros** por unidade e setor.
  - **Tabela detalhada** com todas as respostas.
  - **Exportação CSV** (respeita o filtro de unidade ativo).
  - No modo demo, os dados vêm de um gerador fictício (`mock-data.js`).

- **QR Code** (`qrcode.html`)
  - Cartaz pronto para impressão com QR Code apontando para o formulário.
  - Instruções passo a passo e selo "100% Anônimo".

## Tecnologias

- HTML + CSS puro (sem framework de UI).
- JavaScript (vanilla).
- [Chart.js](https://www.chartjs.org/) — gráficos do painel (via CDN).
- [qrcode](https://github.com/soldair/node-qrcode) — geração do QR Code (via CDN).
- Configuração de perguntas, opções e setores centralizada em `config.js`.
- `backend-setup.sql` — exemplo opcional de esquema PostgreSQL para um backend real.

## Estrutura

```
formulario-pesquisa-clima/
├── index.html         # formulário de resposta (público)
├── login.html         # login do painel (demo)
├── resultados.html    # painel de resultados (gráficos, filtros, CSV)
├── qrcode.html        # cartaz com QR Code para impressão
├── config.js          # perguntas, opções e setores (fonte única)
├── mock-data.js       # gerador de respostas fictícias para a demo
├── backend-setup.sql  # exemplo opcional de esquema de banco
└── README.md
```

## Como rodar

Por usar `fetch` de arquivos locais (`config.js`, `mock-data.js`), abra com um
servidor estático simples — abrir o HTML direto pelo `file://` pode bloquear o
carregamento dos scripts.

```bash
# dentro da pasta do projeto
python -m http.server 8000
# depois acesse:
#   http://localhost:8000/index.html      (formulário)
#   http://localhost:8000/login.html      (login do painel)
#   http://localhost:8000/qrcode.html     (cartaz QR Code)
```

Fluxo sugerido:

1. Abra `index.html`, preencha e envie algumas respostas (ficam no `localStorage`).
2. Abra `login.html` e entre com `admin@exemplo.com` / `demo123`.
3. Veja o painel em `resultados.html` — suas respostas demo aparecem junto com os
   dados fictícios gerados. Teste os filtros e a exportação CSV.

## Como conectar um backend real (opcional)

1. Crie a tabela usando `backend-setup.sql` no seu banco PostgreSQL.
2. Em `index.html`, preencha `API_URL` e `API_KEY` (placeholders `{{ }}`) e troque
   `DEMO_MODE` para `false`.
3. Em `resultados.html`, substitua a função `loadData()` por uma chamada à sua API.
4. Em `login.html`, substitua a checagem local por um provedor de autenticação real.

> Nunca versione chaves ou URLs reais. Use variáveis de ambiente / placeholders.
