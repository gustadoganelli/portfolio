# Alertas de Auditoria - Lembretes de Pendencias por E-mail (n8n)

Workflow de automacao em [n8n](https://n8n.io) que envia, em cadencia semanal,
lembretes/alertas de pendencias de auditoria (nao conformidades) por e-mail.
A cada execucao o fluxo busca as pendencias em aberto, agrupa por unidade e
dispara um e-mail personalizado para o responsavel de cada unidade, com link
direto para o quadro de tarefas onde a pendencia deve ser tratada.

> ⚠️ Projeto de demonstracao - todos os dados sao ficticios.

## O que faz

- Roda automaticamente toda segunda-feira as 10h (gatilho agendado por cron).
- Consulta uma fonte de dados (API REST) e traz todas as pendencias com
  `status = Aberta`.
- Agrupa as pendencias por unidade e conta quantas existem em cada uma.
- Descarta unidades sem e-mail valido ou sem link de quadro (com log de aviso).
- Verifica se ha pendencias; se nao houver, encerra sem enviar nada.
- Gera um e-mail HTML personalizado por unidade (nome do responsavel,
  quantidade de pendencias e botao para o quadro da unidade).
- Envia o e-mail para o responsavel, com copia para a supervisao.

## Tecnologias

- **n8n** - orquestracao do workflow (low-code).
- **Schedule Trigger (cron)** - agendamento semanal.
- **HTTP Request** - leitura das pendencias na fonte de dados.
- **Code (JavaScript)** - agrupamento por unidade e montagem dos e-mails.
- **IF** - controle de fluxo (so envia se houver pendencias).
- **Email Send (SMTP)** - disparo dos e-mails em HTML.

## Diagrama do fluxo

```
[Gatilho Agendado (Segunda 10h)]
            |
            v
[Buscar Pendencias Abertas]            (HTTP GET na API, status=Aberta)
            |
            v
[Agrupar Pendencias por Unidade]       (Code: agrupa, conta, filtra invalidas)
            |
            v
[Existem Pendencias?]  --- nao --->  (fim, nada e enviado)
            |
           sim
            v
[Preparar Emails por Unidade]          (Code: 1 item por unidade)
            |
            v
[Enviar Lembrete por E-mail]           (SMTP: 1 e-mail por unidade)
```

## Como rodar

1. Importe o arquivo `lembrete_pendencias_semanal.json` no seu n8n
   (menu **Workflows -> Import from File**).
2. Configure as credenciais (todas vem vazias como placeholder):
   - **Credencial API (placeholder)** - autenticacao por header (`httpHeaderAuth`)
     para a fonte de dados.
   - **Credencial SMTP (placeholder)** - servidor de envio de e-mail.
3. Defina a variavel de ambiente `DATA_SOURCE_URL` apontando para a sua API
   (ex.: `https://demo.exemplo.dev`). O no de HTTP Request usa
   `{{ $env.DATA_SOURCE_URL }}/api/pendencias?status=Aberta&limit=5000`.
4. Ajuste os e-mails de remetente (`auditoria@demo.exemplo.dev`) e de copia
   (`supervisao@demo.exemplo.dev`) no no **Enviar Lembrete por E-mail**.
5. (Opcional) Ajuste o cron no **Gatilho Agendado** (`0 10 * * 1` = segunda 10h).
6. Para testar sem uma API real, use o arquivo `dados_exemplo.json` como
   payload de mock (ele segue o formato esperado: campos `unidade`,
   `emailResponsavel`, `nomeResponsavel`, `linkQuadro`, `status`).

### Formato esperado dos dados

A fonte deve retornar um objeto com a chave `value` (ou um array direto),
onde cada pendencia tem:

| Campo             | Descricao                                  |
|-------------------|--------------------------------------------|
| `unidade`         | Nome da unidade (chave de agrupamento)     |
| `status`          | Situacao da pendencia (filtra por `Aberta`)|
| `emailResponsavel`| E-mail do responsavel da unidade           |
| `nomeResponsavel` | Nome do responsavel                        |
| `linkQuadro`      | URL do quadro de tarefas da unidade        |
