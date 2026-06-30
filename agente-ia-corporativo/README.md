# Agente de IA Corporativo (Workflow n8n)

> ⚠️ Projeto de demonstração — todos os dados são fictícios.

Workflow **n8n** de um agente de IA corporativo genérico. O colaborador escreve uma
solicitação em **linguagem natural** (chat ou webhook HTTP); o agente **interpreta** a
intenção com um LLM, **consulta/grava dados** numa base estruturada e **responde ou
encaminha** a solicitação automaticamente (incluindo a criação de uma tarefa em um
gestor de tarefas externo via API).

## O que faz

1. **Recebe** a mensagem do usuário por dois gatilhos possíveis: nó de chat ou webhook `POST /agente-corporativo`.
2. **Interpreta** com um agente LLM + memória de conversa, que devolve um JSON estruturado contendo a `acao` desejada, uma `resposta` amigável e os `dados` extraídos.
3. **Decide** se há ação a executar (`executar_acao`). Se não houver (faltam dados ou é só uma dúvida), responde diretamente ao usuário pedindo o que falta.
4. **Roteia por intenção** (nó *Switch*) entre quatro fluxos:
   - `abrir_solicitacao` — normaliza, **grava** na tabela e **cria uma tarefa** via API externa.
   - `consultar_minhas` — busca e formata as solicitações do usuário.
   - `consultar_status` — busca uma solicitação por protocolo e informa o status.
   - `atualizar_cadastro` — atualiza o cadastro do colaborador.
5. **Responde** de volta ao usuário com o resultado final.

### Diagrama do fluxo

```
[Receber Mensagem (Chat)] ┐
                          ├─> [Agente Interpretador] ─> [Interpretar Saida] ─> [Executar Acao?]
[Receber Mensagem (Webhook)] ┘        ^      ^                                      │
                                      │      │                              true ───┤─── false
                  [Modelo de Linguagem]   [Memoria da Conversa]                     │            │
                                                                                    v            v
                                                                          [Rotear por Acao]  [Responder (so informacao)]
                                                                                    │
        ┌───────────────────┬──────────────────────┬───────────────────┬──────────┘
        v                   v                      v                   v
 abrir_solicitacao   consultar_minhas       consultar_status    atualizar_cadastro
        │                   │                      │                   │
 [Normalizar Dados]  [Consultar Minhas]    [Consultar Status]  [Atualizar Cadastro]
        │                   │                      │                   │
 [Gravar Solicitacao] [Formatar Minhas]     [Formatar Status]  [Responder (Atualizacao)]
        │                   │                      │                   │
 [Criar Tarefa (API)]      │                      │                   │
        │                   │                      │                   │
 [Responder (Abertura)]    │                      │                   │
        └───────────────────┴──────────────────────┴───────────────────┘
                                      │
                                      v
                          [Resposta Final (Webhook)]
```

## Tecnologias

- **n8n** — orquestração do workflow (low-code).
- **Nó de Agente LangChain** (`@n8n/n8n-nodes-langchain.agent`) com **LLM** (`gpt-4o-mini`, configurável) e **memória de janela** de conversa.
- **Nós de código (JavaScript)** para parsing e normalização dos dados.
- **Data Table** do n8n como base de dados estruturada (`tabela_solicitacoes`, `tabela_cadastro`).
- **HTTP Request** para integração com um gestor de tarefas externo (API genérica).

## Como rodar

1. Tenha uma instância do **n8n** (local via `npx n8n` ou Docker).
2. No n8n, vá em **Workflows → Import from File** e selecione `workflow_agente_ia_corporativo.json`.
3. Crie/seleccione as credenciais (deixadas como placeholders vazios):
   - **Credencial LLM** no nó *Modelo de Linguagem* (ex.: sua chave de API do provedor de LLM).
   - **API Gestor de Tarefas** (Header Auth) no nó *Criar Tarefa*.
4. Crie as Data Tables `tabela_solicitacoes` e `tabela_cadastro` com colunas compatíveis
   (`protocolo`, `solicitante`, `departamento`, `categoria`, `descricao`, `prioridade`, `status`, `criado_em`).
5. Ative o workflow e teste pelo painel de chat ou enviando:
   ```bash
   curl -X POST https://demo.exemplo.dev/webhook/agente-corporativo \
     -H "Content-Type: application/json" \
     -d '{"mensagem": "Quero abrir uma solicitacao da categoria suporte, prioridade alta", "sessionId": "sessao-demo"}'
   ```

### Variáveis / placeholders

| Item | Valor de exemplo |
|------|------------------|
| Webhook | `https://demo.exemplo.dev/webhook/agente-corporativo` |
| Usuário de exemplo | `joao@exemplo.com` |
| API de tarefas | `https://demo.exemplo.dev/api/tarefas` |
| Tabelas | `tabela_solicitacoes`, `tabela_cadastro` |
| Modelo LLM | `{{ENV_LLM_MODEL}}` (padrão `gpt-4o-mini`) |

---

> Repositório de portfólio. Não contém dados, credenciais ou integrações de qualquer organização real.
