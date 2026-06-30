# Post Diario no LinkedIn com IA (n8n)

Workflow de automacao em [n8n](https://n8n.io) que, todos os dias em horario fixo, le varias fontes de noticias por RSS, escolhe os assuntos mais relevantes, gera um texto reflexivo com um modelo de linguagem (LLM), cria uma imagem ilustrativa por IA e publica tudo automaticamente como um post no LinkedIn.

> ⚠️ Projeto de demonstracao — todos os dados sao ficticios.

## O que faz

1. **Dispara as 08h00** todos os dias (agendamento via cron `0 8 * * *`).
2. **Le 6 feeds RSS** de noticias (tecnologia, IA, startups, negocios, pesquisa e automacao).
3. **Combina e filtra** os itens: deduplica titulos, descarta noticias antigas (janela de 48h, com fallback de 72h) e pontua por relevancia (palavras-chave fortes somam, ruidos subtraem). Seleciona o **top 5**.
4. **Gera o post** com um LLM de texto: nao um resumo, e sim uma reflexao analitica inspirada nas noticias do dia, em estilo de post de LinkedIn (afirmacao forte de abertura, paragrafos curtos, pergunta provocativa ao final).
5. **Extrai texto + prompt de imagem**: o LLM devolve, na mesma resposta, o post e um prompt em ingles para a ilustracao, separados pelo marcador `---IMAGE_PROMPT---`.
6. **Prepara o LinkedIn**: obtem o perfil do autor (`/userinfo`) e registra um upload de imagem (`registerUpload`).
7. **Gera a imagem** por IA (estilo corporativo / render 3D, sem texto e sem pessoas) a partir do prompt.
8. **Faz upload da imagem** para a URL temporaria fornecida pelo LinkedIn.
9. **Monta e publica** o post (`/ugcPosts`) com texto + imagem, visibilidade publica.

Cada no de codigo tem validacoes defensivas (resposta vazia, imagem ausente, IDs faltando) que interrompem o fluxo com mensagem clara quando algo falha.

## Diagrama do fluxo

```
                         +-------------------------+
                         |     Agendamento - 8h    |  (cron 0 8 * * *)
                         +-----------+-------------+
                                     |
        +---------+---------+--------+--------+---------+---------+
        v         v         v       v        v         v
   [RSS Tec] [RSS IA] [RSS Start] [RSS Neg] [RSS Pesq] [RSS Autom]
        |         |         |       |        |         |
        +---------+---------+---+---+--------+---------+
                                |
                                v
                     +----------------------+
                     | Merge - Combinar Feeds|
                     +----------+-----------+
                                v
                  +-----------------------------+
                  | Code - Filtrar e Formatar   |  (top 5 por relevancia)
                  +--------------+--------------+
                                 v
                     +-----------------------+
                     |    LLM - Gerar Post   |  (texto reflexivo)
                     +----------+------------+
                                v
              +-------------------------------------+
              | Code - Extrair Texto e Prompt       |  (post + image_prompt)
              +------------------+------------------+
                                 v
                     +-----------------------+
                     | LinkedIn - Get Profile|
                     +----------+------------+
                                v
                   +--------------------------+
                   | LinkedIn - Register Upload|
                   +-----------+--------------+
                               v
                     +-----------------------+
                     |   LLM - Gerar Imagem  |
                     +----------+------------+
                                v
                   +--------------------------+
                   |  Code - Extrair Imagem   |  (base64 -> binario)
                   +-----------+--------------+
                               v
                   +--------------------------+
                   | LinkedIn - Upload Imagem |
                   +-----------+--------------+
                               v
                     +-----------------------+
                     |   Code - Montar Post  |  (payload ugcPosts)
                     +----------+------------+
                                v
                   +--------------------------+
                   | LinkedIn - Publicar Post |  (POST /ugcPosts)
                   +--------------------------+
```

## Tecnologias

- **n8n** (self-hosted) — orquestracao do workflow
- **RSS Feed Read** — ingestao de noticias
- **Code (JavaScript)** — filtragem, scoring, parsing e montagem de payload
- **HTTP Request** — chamadas a APIs de LLM (texto e imagem) e a API do LinkedIn
- **LinkedIn API v2** — `userinfo`, `assets?action=registerUpload`, upload binario e `ugcPosts`
- **LLM de texto + LLM de imagem** — provedores genericos (configurados como credenciais do n8n)

## Como rodar

1. **Importe o workflow**: no n8n, `Workflows` -> `Import from File` -> selecione `workflow_post_linkedin_ia.json`.
2. **Crie as credenciais** (todas como placeholders no projeto; preencha com as suas):
   - `LLM_TEXTO` — autenticacao por header (`httpHeaderAuth`) para a API de chat.
   - `LLM_IMAGEM` — autenticacao por header para a API de geracao de imagem.
   - `LINKEDIN_OAUTH2` — credencial OAuth2 generica, com scopes `openid`, `profile` e `w_member_social`.
   - Associe cada credencial aos nos correspondentes (`LLM - Gerar Post`, `LLM - Gerar Imagem` e todos os nos `LinkedIn - *`).
3. **Ajuste os feeds RSS**: troque as URLs `https://demo.exemplo.dev/rss/...` pelas fontes reais que desejar.
4. **Revise o horario** no no `Agendamento - 8h` se quiser outro disparo.
5. **Teste manualmente** com `Execute Workflow` antes de ativar. Recomenda-se rodar com o no final desconectado na primeira vez para inspecionar o texto/imagem gerados.
6. **Ative** o workflow (toggle `Active`) para que o agendamento passe a rodar diariamente.

### Notas

- Os nos de codigo nao dependem de provedor especifico: a API de texto espera o formato `{ choices: [{ message: { content } }] }` e a de imagem `{ data: [{ b64_json }] }`. Adapte os parsers se a sua API responder em outro formato.
- O prompt de imagem evita propositalmente texto, logos e rostos para gerar ilustracoes corporativas neutras.
- Nenhuma credencial real, URL real ou dado pessoal esta incluido neste repositorio.
