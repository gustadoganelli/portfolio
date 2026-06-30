# Relatório e Alertas da Agenda da Equipe (n8n)

Workflow de automação em **n8n** que consulta a agenda de calendário de cada membro de uma equipe, monta um relatório consolidado e dispara alertas quando algo muda (compromissos novos, alterados ou cancelados).

> ⚠️ Projeto de demonstração — todos os dados são fictícios.

## O que faz

O workflow tem dois modos de execução, controlados por dois gatilhos agendados (cron):

- **Segunda-feira (modo semanal):** monta um **e-mail HTML** com a agenda completa da semana de toda a equipe, agrupada por pessoa e por dia, e envia para o gestor. Em seguida salva um *snapshot* (retrato) da agenda da semana.
- **Terça a sexta (modo diário):**
  1. envia um **resumo do dia** (somente os compromissos de hoje) para o chat da equipe;
  2. **compara** a agenda atual com o snapshot salvo na segunda e detecta diferenças:
     - `NOVO` — compromisso que não existia antes;
     - `ALTERADO` — mudou o horário ou o título;
     - `CANCELADO` — sumiu da agenda.
  3. se houver alterações, envia uma **mensagem de alerta** listando o que mudou e **atualiza o snapshot** (para não repetir o mesmo aviso no dia seguinte).

Pontos de implementação que valem destaque:

- **Cálculo do período** (segunda a domingo da semana corrente) feito em código, com ajuste de fuso horário.
- **Tolerância a falha por membro**: a chamada à API usa `neverError`, então o erro na agenda de uma pessoa não derruba o relatório inteiro — aparece como aviso só naquele bloco.
- **Detecção de mudanças sem banco de dados**, usando `$getWorkflowStaticData('global')` para persistir o snapshot entre execuções.

## Tecnologias

- **n8n** (workflow / automação low-code)
- Nós usados: `Schedule Trigger`, `Set`, `Code` (JavaScript), `HTTP Request`, `Switch`, `IF`, `Send Email`
- **API de calendário** genérica via OAuth2 (placeholder `https://demo.exemplo.dev`) — substituível por qualquer provedor de calendário
- **Webhook de chat** genérico para envio das mensagens
- **SMTP** para o envio do relatório semanal por e-mail

## Como rodar

1. Tenha uma instância do **n8n** (local via Docker/npm ou n8n Cloud).
2. No n8n, vá em **Workflows → Import from File** e selecione o arquivo [`workflow.json`](./workflow.json).
3. Configure as **credenciais** (todas entram como placeholder vazio no arquivo):
   - `Credencial Calendario (placeholder)` → OAuth2 do seu provedor de calendário, no nó **Buscar Eventos do Calendario**;
   - `SMTP (placeholder)` → servidor de e-mail, no nó **Enviar E-mail Semanal**;
   - `Webhook Chat (placeholder)` → autenticação do seu webhook de chat, nos nós **Enviar Resumo do Dia (Chat)** e **Enviar Alerta (Chat)**.
4. Ajuste os dados fictícios para os reais:
   - lista da equipe no nó **Montar Lista da Equipe** (`nome` / `email`);
   - URL da API no nó **Buscar Eventos do Calendario**;
   - URL do webhook nos nós de chat;
   - destinatários (`fromEmail` / `toEmail` / `ccEmail`) no nó de e-mail.
5. Confira os horários dos gatilhos (cron) — por padrão `08:00`, segunda no modo semanal e terça a sexta no modo diário.
6. Ative o workflow e/ou rode manualmente para testar.

## Diagrama do fluxo

```
[Gatilho Semanal (seg)]  -> [Tipo: Semanal] \
                                             >-> [Calcular Periodo] -> [Montar Lista da Equipe]
[Gatilho Diario (ter-sex)] -> [Tipo: Diario]/
        -> [Buscar Eventos do Calendario] -> [Agregar Equipe] -> [Switch: Semanal ou Diario?]
                                                                          |
        +-----------------------------------------------------------------+
        |                                                                 |
   (saida 0: SEMANAL)                                              (saida 1: DIARIO)
        |                                                                 |
        v                                                                 v
 [Gerar HTML Relatorio Semanal]                                 [Gerar Mensagem de Hoje]
        |                                                                 |
        v                                                                 v
 [Enviar E-mail Semanal]                                  [Enviar Resumo do Dia (Chat)]
                                                                          |
   (o modo semanal tambem aciona                                         v
    "Gerar Mensagem de Hoje" para                                   [E Segunda?]
    enviar o resumo + salvar snapshot)                              /          \
                                                              (sim)            (nao)
                                                                v               (fim)
                                                         [Salvar Snapshot]

   (modo diario, em paralelo ao resumo do dia)
        [Comparar com Snapshot] -> [Tem Alteracoes?] --(nao)--> (fim)
                                          |
                                        (sim)
                                          v
                            [Gerar Mensagem de Alertas] -> [Enviar Alerta (Chat)] -> [Atualizar Snapshot]
```

Legenda dos modos:
- **Semanal** = relatório completo por e-mail + snapshot inicial da semana.
- **Diário** = resumo do dia no chat + comparação contra o snapshot e alerta de mudanças.
