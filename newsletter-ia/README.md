# Newsletter de IA Diária (Demo n8n)

Workflow de automação no [n8n](https://n8n.io) que coleta notícias de várias fontes RSS, filtra e pontua as mais relevantes para um público executivo, gera uma newsletter em HTML com auxílio de um modelo de IA e envia o boletim por e-mail — tudo de forma agendada, todos os dias.

> ⚠️ Projeto de demonstração — todos os dados são fictícios.

## O que faz

1. **Agenda** uma execução diária às 07h00 (cron `0 7 * * *`).
2. **Coleta** notícias de 6 feeds RSS fictícios (`*.exemplo.dev`).
3. **Combina** todos os feeds em um único fluxo (nó *Merge*).
4. **Filtra e pontua** as notícias por relevância para gestores, com um nó de código que:
   - identifica a fonte e a categoria de cada item;
   - aplica uma janela de recência (48h, com fallback para 72h e depois para as mais recentes);
   - remove duplicatas por título/link;
   - calcula um score por palavras-chave (negócios, automação, finanças, investimentos valem mais; gadgets e fofoca penalizam);
   - monta um **prompt de sistema** e um **prompt de usuário** com as melhores notícias e as regras de formatação.
5. **Gera a newsletter** chamando uma API de IA (HTTP Request) que retorna um e-mail em HTML puro.
6. **Valida o HTML** retornado: confere `<!DOCTYPE html>`, tags principais, ausência de markdown, compatibilidade com clientes de e-mail (sem flexbox/grid/box-shadow/linear-gradient) e presença de links clicáveis.
7. **Envia** o boletim por e-mail (SMTP) para a lista de destinatários.

## Diagrama do fluxo

```
                          ┌────────────────────────┐
                          │  Agendamento Diario 7h  │  (Schedule Trigger - cron 0 7 * * *)
                          └───────────┬────────────┘
                                      │
        ┌───────────┬───────────┬─────┴─────┬───────────┬───────────┐
        ▼           ▼           ▼           ▼           ▼           ▼
   RSS Blog    RSS Portal   RSS Auto-   RSS Finan-  RSS Pesqui-  RSS Start-
   Exemplo     Noticias     macao       cas         sa           ups
        └───────────┴───────────┴─────┬─────┴───────────┴───────────┘
                                      ▼
                          ┌────────────────────────┐
                          │  Merge - Combinar Feeds │  (6 entradas → 1 saída)
                          └───────────┬────────────┘
                                      ▼
                          ┌────────────────────────┐
                          │ Code - Filtrar e        │  (recência, dedupe, score,
                          │ Formatar                │   monta os prompts)
                          └───────────┬────────────┘
                                      ▼
                          ┌────────────────────────┐
                          │  IA - Gerar Newsletter  │  (HTTP Request → API de IA,
                          └───────────┬────────────┘   retorna HTML)
                                      ▼
                          ┌────────────────────────┐
                          │ Code - Extrair e        │  (extrai e valida o HTML)
                          │ Validar HTML            │
                          └───────────┬────────────┘
                                      ▼
                          ┌────────────────────────┐
                          │ Enviar Newsletter       │  (SMTP / e-mail)
                          │ (E-mail)                │
                          └────────────────────────┘
```

## Tecnologias

- **n8n** — orquestração do workflow (low-code).
- **RSS Feed Read** — coleta de notícias das fontes.
- **Merge** — consolidação de múltiplos feeds.
- **Code (JavaScript)** — filtragem, deduplicação, pontuação por relevância, montagem dos prompts e validação do HTML.
- **HTTP Request** — chamada genérica a uma API de IA (modelo de geração de texto) no padrão *chat completions*.
- **Email Send (SMTP)** — entrega do boletim por e-mail.
- **Schedule Trigger (cron)** — execução diária automática.

## Como rodar

1. Tenha uma instância de **n8n** (local via Docker/npm ou n8n Cloud).
2. No n8n, vá em **Workflows → Import from File** e selecione `newsletter_ia_diaria.json`.
3. Configure as **credenciais** (todas estão como placeholders vazios no arquivo):
   - **Credencial IA (placeholder)** — credencial HTTP (ex.: *Header Auth* com a chave da sua API de IA) usada no nó `IA - Gerar Newsletter`.
   - **SMTP (placeholder)** — credencial de e-mail usada no nó `Enviar Newsletter (E-mail)`.
4. Ajuste, se quiser:
   - as **URLs dos feeds RSS** (atualmente fictícias `*.exemplo.dev`) para fontes reais;
   - o **endpoint e o modelo** no nó `IA - Gerar Newsletter` (`url` e o campo `model` do corpo);
   - os **destinatários** e o **remetente** no nó de e-mail (`joao@exemplo.com`, `maria@exemplo.com`, `boletim@exemplo.dev`);
   - o **horário** no nó `Agendamento Diario 7h`.
5. Execute manualmente com **Test workflow** para validar e, quando estiver satisfeito, **ative** o workflow para rodar todo dia.

## Estrutura

```
newsletter-ia/
├── newsletter_ia_diaria.json   # workflow n8n (importável)
└── README.md                   # este arquivo
```

---

> ⚠️ Projeto de demonstração — todos os dados (fontes, e-mails, credenciais, endpoints) são fictícios e servem apenas para ilustrar a arquitetura da automação.
