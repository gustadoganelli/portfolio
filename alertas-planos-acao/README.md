# Alertas de Planos de Acao — Workflows n8n

Automacoes em [n8n](https://n8n.io) para notificar responsaveis sobre **planos de acao / deliberacoes** registrados em um portal interno. O conjunto cobre dois cenarios complementares: a **primeira notificacao** quando uma acao e criada e o **lembrete mensal** das acoes que continuam em aberto.

> ⚠️ Projeto de demonstracao — todos os dados sao ficticios.

## O que faz

O pacote contem dois workflows independentes:

### 1. Alerta de Nova Acao (`workflows/alerta_nova_acao.json`)
Roda diariamente, busca as acoes criadas nas ultimas 24 horas e envia uma **primeira notificacao por e-mail** ao responsavel. Possui controle de idempotencia (`alertaEnviado`) para nao notificar duas vezes a mesma acao.

- Trigger agendado (todo dia as 10h).
- Calcula a janela de tempo (ultimas 24h).
- Consulta a API do portal por acoes novas.
- Filtra itens com e-mail valido.
- Verifica, item a item, se o alerta ja foi enviado.
- Monta o HTML do e-mail e dispara via SMTP.
- Marca a acao como `alertaEnviado = true`.

### 2. Alerta Mensal de Acoes em Aberto (`workflows/alerta_mensal_pendencias.json`)
Roda no dia 1 de cada mes, agrupa por responsavel todas as acoes que **nao estao concluidas nem canceladas** e envia um **lembrete consolidado** com a quantidade de pendencias de cada pessoa.

- Trigger agendado (dia 1 do mes as 10h).
- Consulta a API por acoes em aberto.
- Agrupa por e-mail do responsavel e conta as pendencias.
- Se houver pendencias, gera um e-mail por responsavel.
- Dispara o lembrete via SMTP.

## Diagrama do fluxo

### Alerta de Nova Acao
```
[Schedule diario 10h]
        |
[Calcular Janela de Tempo (-24h)]
        |
[Buscar Novas Acoes] --(HTTP GET API)
        |
[Tem Novos Itens?] --nao--> [Sem Novos Itens]
        | sim
[Separar Itens (filtra e-mail valido)]
        |
[Verificar AlertaEnviado] --(HTTP GET item)
        |
[Ainda nao foi enviado?] --ja enviado--> [Ignorar]
        | sim
[Preparar HTML]
        |
[Enviar E-mail (SMTP)]
        |
[Marcar AlertaEnviado = true] --(HTTP PATCH)
```

### Alerta Mensal de Acoes em Aberto
```
[Schedule dia 1 do mes 10h]
        |
[Buscar Acoes em Aberto] --(HTTP GET API)
        |
[Agrupar por Responsavel (conta pendencias)]
        |
[Tem Acoes em Aberto?] --nao--> [Nenhuma Acao em Aberto]
        | sim
[Preparar E-mails (1 por responsavel)]
        |
[Enviar Lembrete Mensal (SMTP)]
```

## Tecnologias

- **n8n** — orquestracao dos workflows.
- **Schedule Trigger** — agendamento via expressao cron.
- **HTTP Request** — integracao com a API REST do portal (GET/PATCH).
- **Code (JavaScript)** — agrupamento, filtragem e controle de idempotencia.
- **IF / NoOp** — ramificacao condicional do fluxo.
- **Send Email (SMTP)** — disparo dos e-mails em HTML.

## Como rodar

1. Importe os arquivos da pasta `workflows/` no seu n8n (**Workflows → Import from File**).
2. Configure as credenciais (ficam vazias nos arquivos, como placeholders):
   - **Credencial API (placeholder)** — autenticacao por header para a API do portal (`httpHeaderAuth`).
   - **SMTP (placeholder)** — servidor de e-mail para o envio das notificacoes.
3. Ajuste os endpoints e parametros de exemplo para o seu ambiente:
   - URL base da API: `https://demo.exemplo.dev/api/acoes` (substitua por `{{ENV}}`/seu host).
   - Link do portal nos e-mails: `https://demo.exemplo.dev/portal`.
   - Remetente/`replyTo`: `naoresponda@exemplo.dev`.
4. Confira o schema esperado da API. Os workflows assumem objetos de acao com os campos:
   - `id`, `titulo`, `status`, `nomeResponsavel`, `emailResponsavel`, `alertaEnviado` (boolean), `criadoEm`.
   - As respostas de listagem retornam um array em `value`.
5. Ative os workflows. Os horarios padrao sao `0 10 * * *` (diario) e `0 10 1 * *` (mensal); altere as expressoes cron conforme necessario.

### Schema de exemplo (acao)

```json
{
  "id": "0000-0",
  "titulo": "Revisar procedimento da Sala 1",
  "status": "Nova",
  "nomeResponsavel": "Joao Exemplo",
  "emailResponsavel": "joao@exemplo.com",
  "alertaEnviado": false,
  "criadoEm": "2026-01-01T10:00:00Z"
}
```
