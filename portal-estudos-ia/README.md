# Portal de Estudos com IA

Aplicação web onde você escolhe **qualquer matéria**, envia o **PDF** do conteúdo e uma **IA monta a aula** automaticamente — com frase-chave, analogia, conceitos, "números que caem na prova" e flashcards. Ainda tem um modo **slideshow** (vídeo-aula) e marca as provas como finalizadas pela data.

> ⚠️ Projeto de demonstração — todos os dados são fictícios.

## O que faz
- 📚 **Cadastro de provas** por matéria + data. Só as provas futuras aparecem; um filtro mostra as anteriores (finalizadas automaticamente quando a data passa).
- 📄 ➡️ 🤖 **Upload de PDF**: o texto é extraído **no próprio navegador** (pdf.js) e enviado a uma função serverless que usa **IA** para gerar a aula estruturada e gravar no banco.
- ▶️ **Modo aula (slideshow)**: reproduz o conteúdo em tela cheia, slide a slide, como uma vídeo-aula (capa → conceitos → números → flashcards).
- 🎧 **Áudio-resumo** por tópico (TTS opcional, desativável).
- ✅ **Progresso salvo** por prova (localStorage) e barra de conclusão.

## Tecnologias
- **Front-end:** HTML/CSS/JS puro (sem framework); `pdf.js` para ler PDF no cliente.
- **Backend:** Cloudflare Pages Functions (`functions/api/gerar.js`).
- **IA:** Cloudflare Workers AI (modelo open-source Llama) — sem chave de terceiros.
- **Banco:** Supabase (PostgreSQL) com RLS (leitura pública, escrita via `service_role`).
- **TTS (opcional):** provedor de voz por API.

## Como rodar
1. Crie um projeto no **Supabase** e rode `db/schema.sql`.
2. Copie `.env.example` e preencha com as suas credenciais.
3. No `index.html`, ajuste `SB_URL` e `SB_KEY` (chave **anon**, pública).
4. Configure os **secrets** da função no Cloudflare Pages:
   `wrangler pages secret put SB_URL` / `SB_SERVICE_KEY` (e `ELEVEN_KEY` se quiser áudio).
5. Deploy: `wrangler pages deploy .` (o binding de IA já está no `wrangler.toml`).

## Estrutura
```
portal-estudos-ia/
├─ index.html             # app (intro, seletor, cards, slideshow, modal de cadastro)
├─ functions/api/gerar.js # função serverless: texto do PDF → IA → grava no Supabase
├─ wrangler.toml          # config Cloudflare Pages + binding de IA
├─ db/schema.sql          # schema (provas, topicos) + dados fictícios
└─ .env.example           # variáveis/segredos (placeholders)
```

## Como funciona (fluxo)
```
Usuário → escolhe matéria + anexa PDF
        → pdf.js extrai o texto (no navegador)
        → POST /api/gerar → IA gera a aula (JSON) → grava no Supabase
        → o site lê do Supabase e exibe (com slideshow e progresso)
```
