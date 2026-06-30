# Integração de Notas Fiscais (API → Painel)

Workflow [n8n](https://n8n.io/) que coleta notas fiscais de uma API externa, normaliza
os dados (incluindo o XML de cada documento) e envia os registros para um painel/repositório
de destino, de forma incremental e sem duplicatas.

> ⚠️ Projeto de demonstração — todos os dados são fictícios.

## O que faz

A cada execução agendada, o fluxo:

1. **Agendador (1h)** — dispara o workflow de hora em hora.
2. **Configurações** — centraliza parâmetros (URL da API, token, conta, data de corte,
   destino). O token vem de uma variável de ambiente (`{{ENV_API_TOKEN}}`).
3. **Buscar Documentos (API)** — consome a API de origem com **paginação** e **retry com
   backoff** para erros transitórios (5xx, 429, timeout). Páginas que falham são registradas
   para reprocessamento.
4. **Filtrar por Data de Corte** — descarta documentos anteriores à data de corte, mantém
   apenas o modelo desejado e remove duplicatas internas pela chave.
5. **Baixar XML** — faz o download do XML de cada nota a partir da URL fornecida pela API.
6. **XML para JSON** — converte o XML em um objeto navegável.
7. **Mapear Campos** — combina os dados da API com os do XML em um registro plano e
   padronizado (chave, número, emitente, valores, impostos, etc.).
8. **Verificar Duplicata (Painel)** — consulta o destino pela chave da nota.
9. **Já existe no Painel?** — se **não** existe, segue para a criação; se já existe, ignora
   (evita gravar a mesma nota duas vezes).
10. **Criar Registro no Painel** — insere o registro no destino via `POST`, com batching
    para respeitar limites de taxa.

### Diagrama do fluxo

```
┌──────────────┐     ┌───────────────┐     ┌────────────────────────┐
│ Agendador 1h │ ──▶ │ Configurações │ ──▶ │ Buscar Documentos (API)│
└──────────────┘     └───────────────┘     │ (paginação + retry)    │
                                            └───────────┬────────────┘
                                                        │
                                                        ▼
                                          ┌─────────────────────────┐
                                          │ Filtrar por Data de Corte│
                                          │ (cutoff + dedup)         │
                                          └───────────┬─────────────┘
                                                      │
                                                      ▼
                                    ┌────────────┐   ┌──────────────┐
                                    │ Baixar XML │ ▶ │ XML para JSON│
                                    └────────────┘   └──────┬───────┘
                                                            │
                                                            ▼
                                                  ┌──────────────────┐
                                                  │  Mapear Campos   │
                                                  └────────┬─────────┘
                                                           │
                                                           ▼
                                            ┌──────────────────────────┐
                                            │ Verificar Duplicata      │
                                            │ (Painel)                 │
                                            └────────────┬─────────────┘
                                                         │
                                                         ▼
                                              ┌─────────────────────┐
                                              │ Já existe no Painel? │
                                              └───────┬─────────┬────┘
                                                não   │         │  sim
                                                      ▼         ▼
                                       ┌─────────────────────┐ (ignora)
                                       │ Criar Registro      │
                                       │ no Painel (POST)    │
                                       └─────────────────────┘
```

## Tecnologias

- **n8n** — orquestração do workflow (low-code).
- **Schedule Trigger** — execução periódica.
- **HTTP Request** — consumo da API de origem e gravação no painel de destino.
- **Code (JavaScript)** — paginação, retry, filtragem, dedup e normalização dos campos.
- **XML** — conversão do XML das notas em JSON.
- **OAuth2** — autenticação no painel de destino (credencial n8n).

## Como rodar

1. **Importe o workflow**
   - No n8n: *Workflows → Import from File* e selecione `workflow_notas_fiscais.json`.

2. **Configure as variáveis** no nó **Configurações**:
   | Campo | Descrição | Exemplo (fictício) |
   |-------|-----------|--------------------|
   | `baseUrl` | URL base da API de origem | `https://demo.exemplo.dev/api/v1` |
   | `contaId` | Identificador da conta | `000000` |
   | `documentoEmpresa` | Documento da empresa consultada | `00000000000000` |
   | `apiToken` | Token de acesso (use variável de ambiente) | `{{ENV_API_TOKEN}}` |
   | `dataCorte` | Importa notas a partir desta data | `2025-01-01` |
   | `destBaseUrl` | URL base do painel de destino | `https://demo.exemplo.dev/painel/api` |
   | `destTabela` | Tabela/lista de destino | `notas_fiscais` |
   | `maxPaginas` | Limite de páginas por execução | `2` |

3. **Defina o token como variável de ambiente** (não deixe credenciais no workflow):
   ```bash
   export ENV_API_TOKEN="seu-token-aqui"
   ```

4. **Crie a credencial OAuth2** no n8n e vincule aos nós
   *Verificar Duplicata (Painel)* e *Criar Registro no Painel*.
   No arquivo exportado essa credencial está vazia (placeholder), por segurança.

5. **Ative o workflow** — ele passará a rodar de hora em hora.

## Estrutura do projeto

```
integracao-notas-fiscais/
├── workflow_notas_fiscais.json   # Workflow n8n (importável)
└── README.md                     # Este arquivo
```

## Observações de design

- **Idempotência**: cada nota é verificada pela chave antes de gravar — execuções repetidas
  não duplicam registros.
- **Resiliência**: a busca na API tolera falhas transitórias com retry/backoff e segue
  processando as páginas que vieram com sucesso.
- **Segurança**: nenhum segredo fica no arquivo — token via variável de ambiente e
  credencial OAuth2 como placeholder vazio.
