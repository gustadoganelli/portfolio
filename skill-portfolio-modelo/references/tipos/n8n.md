# Anonimização de workflows n8n (.json)

Guia para transformar um workflow real do n8n em um exemplo de portfólio 100% fictício, mantendo a arquitetura intacta e removendo qualquer dado sensível.

O objetivo é preservar **o que o workflow faz e como está estruturado** (nós, conexões, lógica) e descartar **tudo que identifica cliente, ambiente ou credencial**.

---

## 1. Regra de ouro

Um `.json` de workflow do n8n exportado carrega muito mais do que a lógica. Ele pode conter:

- Referências a credenciais salvas (com `id` e `name`).
- Caminhos de webhook que expõem nomes internos.
- Queries SQL com nomes reais de tabelas, schemas e colunas.
- E-mails, URLs, tokens, chaves de API embutidas em nós HTTP Request, Set, Code, etc.
- IDs de recursos externos (planilhas, bases, canais, listas do SharePoint, spreadsheetId, siteId, listId).
- Nomes de pessoas, empresas e clientes em textos, prompts e comentários.

Nunca publique um export "cru". Sempre passe pelo processo abaixo.

---

## 2. Credenciais — trocar por placeholders vazios

No n8n, cada nó que usa credencial guarda um bloco assim:

```json
"credentials": {
  "httpBasicAuth": {
    "id": "aBc123XyZ",
    "name": "Conta Produção Cliente X"
  }
}
```

O `id` aponta para uma credencial real na instância de quem exportou e o `name` costuma vazar o cliente ou o ambiente.

**O que fazer:** manter o bloco (para o leitor ver que o nó autentica), mas neutralizar `id` e `name`.

```json
"credentials": {
  "httpBasicAuth": {
    "id": "REPLACE_ME",
    "name": "Credencial (configurar na sua instância)"
  }
}
```

Padrões recomendados:

- `id`: use sempre `"REPLACE_ME"` — deixa claro que precisa ser reconectado e nunca é um ID válido.
- `name`: use um rótulo genérico pelo tipo, ex. `"HTTP Basic (exemplo)"`, `"OAuth2 genérico (exemplo)"`, `"Conta SMTP (exemplo)"`, `"Postgres (exemplo)"`.

Faça isso para **todos** os tipos de credencial: `httpHeaderAuth`, `httpBasicAuth`, `oAuth2Api`, `smtp`, `postgres`, `mySql`, `googleApi`, `openAiApi`, `microsoftOutlookOAuth2Api`, etc.

> Dica de varredura: procure por `"credentials"` no arquivo e revise cada ocorrência.

---

## 3. Credenciais embutidas em parâmetros (o vazamento mais comum)

Credenciais nem sempre estão no bloco `credentials`. Muita coisa fica **hardcoded** dentro de `parameters`:

- Header `Authorization: Bearer eyJ...` num nó HTTP Request.
- `apiKey`, `token`, `client_secret` em query strings ou no body.
- Senha de banco escrita direto num nó Code.
- Chave de API concatenada numa URL.

**O que fazer:** substituir o valor por um placeholder textual óbvio.

Antes:

```json
"value": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6..."
```

Depois:

```json
"value": "Bearer SEU_TOKEN_AQUI"
```

Placeholders sugeridos: `SEU_TOKEN_AQUI`, `SUA_API_KEY_AQUI`, `SUA_SENHA_AQUI`, `SEU_CLIENT_SECRET_AQUI`.

> Varredura obrigatória: procure por `Bearer `, `apikey`, `api_key`, `token`, `secret`, `password`, `senha`, `Authorization`. Qualquer string longa e aleatória (base64, JWT, hex) é suspeita — trate como credencial.

---

## 4. Webhooks — caminho genérico e sem `webhookId` real

Nós Webhook expõem dois pontos sensíveis:

```json
"parameters": {
  "path": "conciliacao-vendas-clientex-prod"
},
"webhookId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

O `path` costuma revelar cliente/processo e o `webhookId` é único da instância original.

**O que fazer:**

- `path`: troque por algo genérico e descritivo do exemplo, ex. `"exemplo-webhook"`, `"receber-dados"`, `"gatilho-processo"`.
- `webhookId`: troque por um valor claramente falso, ex. `"00000000-0000-0000-0000-000000000000"`.

```json
"parameters": {
  "path": "exemplo-webhook"
},
"webhookId": "00000000-0000-0000-0000-000000000000"
```

Faça o mesmo para URLs de webhook que apareçam **em outros nós** (um nó que chama o próprio webhook, ou uma URL de produção `https://n8n.suaempresa.com/webhook/...`). Troque o host por `https://SEU-N8N.exemplo.com/webhook/exemplo-webhook`.

---

## 5. IDs de recursos externos

Procure e substitua por placeholders qualquer identificador de recurso de terceiros:

| Campo típico | Onde aparece | Placeholder |
|---|---|---|
| `spreadsheetId` / `documentId` | Google Sheets/Docs | `SEU_SPREADSHEET_ID` |
| `sheetName` (com nome de cliente) | Google Sheets | `Pagina1` |
| `siteId`, `listId` | SharePoint / Microsoft | `SEU_SITE_ID`, `SEU_LIST_ID` |
| `channelId`, `chatId` | Slack/Teams/Telegram | `SEU_CHANNEL_ID` |
| `baseId`, `tableId` | Airtable/NocoDB | `SEU_BASE_ID` |
| `folderId` | Drive/OneDrive | `SEU_FOLDER_ID` |
| `calendarId` | Google/Outlook Calendar | `agenda@exemplo.com` |

---

## 6. SQL — tabelas, schemas e colunas fictícias

Nós Postgres/MySQL/MS SQL/Execute Query carregam queries que expõem o modelo de dados real. Anonimize sem quebrar a demonstração da lógica (JOIN, filtro, agregação continuam fazendo sentido).

Antes:

```sql
SELECT cli.cnpj, ped.valor_liquido, ped.data_baixa
FROM erp_prod.pedidos_venda ped
JOIN erp_prod.clientes_master cli ON cli.id = ped.cliente_id
WHERE ped.filial = 'MATRIZ-SP' AND ped.status = 'BAIXADO';
```

Depois:

```sql
SELECT c.documento, p.valor_liquido, p.data_baixa
FROM vendas.pedidos p
JOIN vendas.clientes c ON c.id = p.cliente_id
WHERE p.filial = 'FILIAL_EXEMPLO' AND p.status = 'BAIXADO';
```

Diretrizes:

- Schema: `erp_prod`, `dw_cliente` → `vendas`, `financeiro`, `estoque` (genéricos por domínio).
- Tabelas: nomes neutros (`pedidos`, `clientes`, `pagamentos`, `produtos`).
- Colunas com significado de negócio real: mantenha se forem genéricas (`valor_liquido`, `data_baixa`), troque se identificarem sistema (`cod_alterdata_x` → `cod_externo`).
- Valores literais no `WHERE`: troque `'MATRIZ-SP'` por `'FILIAL_EXEMPLO'`, CNPJ/CPF por `'00000000000000'`.
- **Preserve a estrutura da query** — o valor do portfólio está em mostrar que você sabe fazer o JOIN/agregação, não nos nomes reais.

---

## 7. E-mails, URLs e valores

- **E-mails**: `fulano@empresacliente.com` → `contato@exemplo.com`, `usuario@exemplo.com`. Para listas, use `destinatario1@exemplo.com`, `destinatario2@exemplo.com`.
- **Nomes de pessoas/empresas**: em prompts, textos de e-mail, comentários e nomes de nós → nomes fictícios genéricos ("Cliente Exemplo", "Equipe Financeiro").
- **Domínios internos**: `intranet.empresa.com`, `erp.cliente.com.br` → `sistema.exemplo.com`.
- **URLs de API de terceiros**: pode manter o host público oficial (ex. `https://api.openai.com`, `https://graph.microsoft.com`) — não é sensível. Mas remova query params com token.
- **Valores monetários / métricas reais**: troque por números redondos fictícios (`R$ 1.234,56`, `1000`). Não exponha faturamento, volumes ou metas reais.
- **Telefones / documentos**: use máscaras óbvias (`(11) 90000-0000`, `000.000.000-00`).

---

## 8. O que PRESERVAR (não anonimize demais)

O portfólio perde valor se você destruir a lógica. **Mantenha intactos:**

- A lista completa de nós (`nodes`) e seus tipos (`type`).
- Todas as conexões (`connections`) — é o que desenha o fluxo.
- Expressões n8n (`{{ $json.campo }}`, `{{ $node["X"].json }}`) — a menos que o nome do campo vaze algo.
- Estrutura de nós Code/Function (a lógica JS), removendo apenas segredos hardcoded.
- Configurações de nós IF, Switch, Merge, Loop, Split in Batches, Wait — são o "cérebro" do fluxo.
- Nomes de nós descritivos e genéricos ("Buscar Pedidos", "Transformar Dados", "Enviar E-mail"). Renomeie só se citarem cliente ("Buscar Pedidos Cliente X" → "Buscar Pedidos").

---

## 9. Checklist de anonimização

Antes de commitar o `.json`, confirme cada item:

- [ ] Todo bloco `"credentials"` tem `id: "REPLACE_ME"` e `name` genérico.
- [ ] Nenhum `Bearer`, `apiKey`, `token`, `secret`, `password` com valor real (busca textual feita).
- [ ] Nenhum JWT / string base64 / hex longa suspeita restante.
- [ ] Webhook `path` genérico e `webhookId` zerado.
- [ ] Nenhuma URL de produção interna (`n8n.suaempresa.com`, `erp.cliente...`).
- [ ] IDs externos (`spreadsheetId`, `siteId`, `listId`, `channelId`, `baseId`) substituídos.
- [ ] SQL sem schema/tabela/coluna reais; valores literais fictícios.
- [ ] E-mails, nomes de pessoas e empresas trocados por fictícios.
- [ ] Valores monetários e métricas reais substituídos por números fictícios.
- [ ] `nodes` e `connections` intactos — o fluxo ainda faz sentido.
- [ ] O `.json` continua sendo JSON válido (valide antes de commitar).
- [ ] Leitura final linha a linha procurando qualquer sobra de dado real.

> Validação rápida do JSON (PowerShell): `Get-Content workflow.json -Raw | ConvertFrom-Json | Out-Null` — se não der erro, o JSON é válido.

---

## 10. Modelo de seção de README para projeto n8n

Cole e adapte o bloco abaixo no README do projeto. Substitua os textos entre colchetes.

```markdown
## [Nome do Workflow] (n8n)

Automação em **n8n** que [uma frase: o que o fluxo resolve e para quem, de forma genérica].

### O que faz

- [Passo/regra de negócio 1, ex.: recebe dados via webhook e valida]
- [Passo/regra de negócio 2, ex.: consulta o banco e cruza informações]
- [Passo/regra de negócio 3, ex.: notifica por e-mail em caso de divergência]

### Fluxo

Gatilho → Buscar → Transformar → Enviar

```
┌──────────┐   ┌───────────┐   ┌──────────────┐   ┌────────────┐
│ Gatilho  │──▶│  Buscar   │──▶│  Transformar │──▶│   Enviar   │
│ (Webhook │   │ (Postgres │   │ (Code / Set  │   │ (E-mail /  │
│ ou Cron) │   │  / HTTP)  │   │  / Merge)    │   │  Slack)    │
└──────────┘   └───────────┘   └──────────────┘   └────────────┘
```

> Adapte o diagrama ao seu fluxo real. Exemplos de variações:
> - Com ramificação: `Gatilho → Buscar → IF ─(sim)→ Enviar Alerta`
> `                                     └(não)→ Registrar OK`
> - Em lote: `Cron → Buscar Lista → Split in Batches → Transformar → Enviar`

### Nós principais

| Nó | Tipo | Função |
|---|---|---|
| Gatilho | Webhook / Schedule Trigger | Inicia o fluxo |
| Buscar Dados | Postgres / HTTP Request | Consulta a origem |
| Transformar | Code / Set / Merge | Formata e cruza os dados |
| Enviar | Send Email / Slack / HTTP | Entrega o resultado |

### Stack

n8n · [Postgres/MySQL] · [Google Sheets/SharePoint] · [OpenAI/outro] · [SMTP/Slack]

### Como usar

1. Importe o `workflow.json` na sua instância n8n.
2. Reconecte as credenciais (todos os nós marcados com credencial precisam ser configurados — os IDs estão como `REPLACE_ME`).
3. Ajuste os placeholders (`SEU_TOKEN_AQUI`, `SEU_SPREADSHEET_ID`, `exemplo-webhook`, etc.).
4. Ative o workflow.

> **Nota:** Este é um exemplo de portfólio. Todos os dados, credenciais, endpoints e nomes são **fictícios**. Nenhuma credencial real, endpoint de produção ou dado de cliente está incluído.
```

---

## 11. Fluxo de trabalho sugerido

1. Copie o `.json` original para a pasta do projeto no portfólio (nunca edite o arquivo de produção).
2. Aplique as seções 2 a 7 (credenciais → parâmetros → webhooks → IDs → SQL → textos).
3. Rode o checklist da seção 9.
4. Valide o JSON.
5. Escreva o README com o modelo da seção 10.
6. Faça uma revisão final humana lendo o arquivo inteiro antes do commit.
