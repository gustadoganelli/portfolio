# Conciliacao Bancaria Automatizada (n8n)

Dois workflows de [n8n](https://n8n.io) que automatizam a conciliacao financeira
diaria de uma empresa, cruzando dados de fontes externas (banco e adquirente de
cartao) contra o ERP interno e apontando divergencias automaticamente.

> ⚠️ Projeto de demonstracao — todos os dados sao ficticios.

---

## O que faz

O pacote contem dois fluxos independentes, cada um seguindo o mesmo padrao:
**buscar dados de duas fontes -> confrontar -> gerar relatorio -> notificar**.

### Workflow 01 — Conciliacao de Pagamentos (Banco x ERP)
Confere se os pagamentos que sairam da conta bancaria batem com os titulos
baixados no ERP (contas a pagar).

- Roda todo dia util as 06h00 (ou sob demanda via webhook), sempre sobre o dia
  anterior (D-1).
- Busca o extrato de debitos via API do banco (OAuth) e os titulos pagos via SQL
  no ERP.
- Faz dois niveis de confronto:
  - **Totais**: soma do extrato x soma do ERP (tem que bater dentro de R$ 0,01).
  - **Titulo a titulo**: por numero de documento (OK / DIVERGENTE / nao
    encontrado em uma das pontas).
- Gera um Excel com duas abas (Divergencias e Confronto Completo), salva no
  SharePoint e envia um resumo no Teams.

### Workflow 02 — Conciliacao de Vendas (Maquininha x ERP)
Confere se as vendas em cartao registradas pela adquirente (maquininha) batem
com as vendas lancadas no ERP (contas a receber).

- Roda todo dia util as 07h30 (ou sob demanda via webhook), sobre D-1.
- Busca as vendas via API da adquirente (OAuth + paginacao por cursor) e as
  vendas em cartao via SQL no ERP.
- Confronta por **numero de autorizacao** (chave principal) com fallback para
  **NSU**.
- Trata o **MDR** (taxa retida pela adquirente): diferencas de centavos por
  arredondamento de MDR sao classificadas como `OK (ARREDONDAMENTO MDR)`, nao
  como divergencia real.
- Ignora transacoes canceladas.
- Gera Excel (Divergencias + Confronto Completo), salva no SharePoint e notifica
  no Teams.

### Categorias de resultado
| Status | Significado |
|---|---|
| `OK` | Valores batem dentro da tolerancia |
| `OK (ARREDONDAMENTO MDR)` | So o workflow 02; diferenca de centavos no MDR |
| `DIVERGENTE` | Existe nas duas pontas mas com valores diferentes |
| `NAO ENCONTRADO NO ERP` | Existe na fonte externa, ausente no ERP |
| `NAO ENCONTRADO NO BANCO` / `...NA ADQUIRENTE` | Existe no ERP, ausente na fonte externa |

---

## Tecnologias

- **n8n** — orquestracao dos workflows (low-code).
- **HTTP Request (OAuth2)** — integracao com a API do banco e da adquirente.
- **Microsoft SQL** — consultas no banco de dados do ERP.
- **Code node (JavaScript)** — logica de confronto e geracao do Excel com a lib
  `xlsx`.
- **Microsoft Graph API** — upload dos relatorios no SharePoint.
- **Microsoft Teams (Incoming Webhook)** — notificacoes com resumo do resultado.

---

## Como rodar

1. **Importe os workflows** no n8n
   (`Workflows -> Import from File`):
   - `workflows/01_conciliacao_pagamentos_banco.json`
   - `workflows/02_conciliacao_vendas_maquininha.json`

2. **Configure as variaveis de ambiente** do n8n a partir de `.env.example`
   (renomeie para `.env` ou cadastre em `Settings -> Variables`). Todos os
   valores do exemplo sao placeholders ficticios.

3. **Cadastre a credencial do ERP** (`Credentials -> Microsoft SQL`) e
   selecione-a nos nos `ERP - Pagos D-1` / `ERP - SQL Vendas`. No JSON ela esta
   referenciada como credencial vazia (placeholder).

4. **Teste sem chamar APIs reais.** Os dois workflows trazem `pinData` com dados
   ficticios nos nos de fonte de dados. Basta abrir o workflow e clicar em
   *Execute Workflow* para ver o confronto rodar de ponta a ponta com os dados de
   exemplo, sem credencial nenhuma.

5. **Ativacao em producao**: troque o `pinData` por dados reais, preencha as
   variaveis e credenciais, e ative o cron (`active: true`).

### SQL de referencia
As consultas usadas pelos nos de ERP estao tambem em arquivos `.sql` separados
para leitura, em `sql/`:
- `sql/01_erp_pagamentos.sql`
- `sql/02_erp_vendas_cartao.sql`

---

## Diagrama do fluxo

### Workflow 01 — Pagamentos (Banco x ERP)

```
[Cron 06h00] ─┐
              ├─> [Merge Triggers] ─> [Parametros de Execucao] ─┬─> [Banco - OAuth Token] ─> [Banco - Extrato D-1] ─┐
[Webhook] ────┘                                                 │                                                   ├─> [Merge Banco + ERP]
                                                                └─> [ERP - Pagos D-1] ──────────────────────────────┘            │
                                                                                                                                  v
                                                                                                          [Confronto Totais + Titulos]
                                                                                                                                  │
                                                                                                                                  v
                                                                                                                       [Gera Excel XLSX]
                                                                                                                                  │
                                                                                                                                  v
                                                                                              [MS Graph - Auth] ─> [SharePoint - Upload]
                                                                                                                                  │
                                                                                                                                  v
                                                                                  [Preparar Msg Teams] ─> [Teams] ─> [Resposta Webhook]

[Error Trigger] ─> [Teams - Alerta Erro]
```

### Workflow 02 — Vendas (Maquininha x ERP)

```
[Cron 07h30] ─┐
              ├─> [Calcular Datas D-1] ─> [Preparar Consulta SQL] ─> [Adquirente - OAuth] ─> [Adquirente - Buscar Vendas]
[Webhook] ────┘                                                                                          │
                                                                                                         v
                                                                                              [ERP - SQL Vendas]
                                                                                                         │
                                                                                                         v
                                                                                            [Confronto NSU + MDR]
                                                                                                         │
                                                                                                         v
                                                                                                  [Gerar Excel]
                                                                                                         │
                                                                                                         v
                                                                       [MS Graph - Auth] ─> [SharePoint - Upload]
                                                                                                         │
                                                                                                         v
                                                                          [Preparar Msg Teams] ─> [Teams - Notificacao]

[Error Trigger] ─> [Teams - Alerta Erro]
```

---

## Estrutura do projeto

```
conciliacao-bancaria/
├── README.md
├── .env.example
├── sql/
│   ├── 01_erp_pagamentos.sql
│   └── 02_erp_vendas_cartao.sql
└── workflows/
    ├── 01_conciliacao_pagamentos_banco.json
    └── 02_conciliacao_vendas_maquininha.json
```
