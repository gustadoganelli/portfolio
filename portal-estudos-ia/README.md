# Portal de Estudos com IA

Aplicação web onde você escolhe uma matéria, envia o **PDF** do conteúdo e uma **IA monta a aula** automaticamente: frase-chave, analogia do dia a dia, conceitos essenciais, passo a passo, "números que caem na prova" e **flashcards**. Ainda tem um modo **slideshow** (vídeo-aula) que avança sozinho e acompanhamento de progresso por matéria.

> ⚠️ **Projeto de demonstração** — todos os dados são fictícios. A versão pública já vem com **6 matérias de exemplo (39 tópicos)** embarcadas, para você explorar a profundidade do conteúdo sem precisar de backend.

## O que faz
- **Geração de aula por IA**: o texto do PDF é extraído **no navegador** (pdf.js) e enviado a uma função serverless que usa um LLM para estruturar a aula e gravar no banco.
- **Estudo guiado**: cada tópico traz frase-chave, analogia, conceitos, passo a passo, dados e flashcards com "toque para revelar".
- **Modo slideshow**: transforma a aula numa apresentação com auto-avanço (duração de cada slide calculada pelo tamanho do conteúdo).
- **Progresso**: marca tópicos estudados, barra de progresso e banner de conclusão (persistido em `localStorage` por matéria).
- **Multi-matéria**: cadastro de várias provas/matérias, com tema e ordenação por data (as passadas viram "finalizadas").

## Matérias de exemplo (mostram o alcance do formato)
Astronomia (Sistema Solar) · Estruturas de Dados e Complexidade (Big-O) · Matemática Financeira · Sistema Cardiovascular · Revolução Industrial · Estatística e Probabilidade — de exatas a humanas, com fórmulas, valores e passo a passo reais.

## Tecnologias
- **Front-end:** HTML/CSS/JS puro (sem framework), design tokens em CSS, mobile-first.
- **PDF:** `pdf.js` para extração de texto no cliente.
- **Backend (deploy real):** Cloudflare Pages Functions (`functions/api/gerar.js`).
- **IA:** Cloudflare Workers AI (modelo open-source Llama) — sem chave de terceiros.
- **Banco:** Supabase (PostgreSQL) com RLS, alimentado por um fluxo n8n.

## Como rodar
```bash
# 1) rodar a demo (já vem com as matérias de exemplo)
python -m http.server 5603      # abra http://localhost:5603

# 2) deploy real (opcional)
#    - crie um projeto Supabase e rode db/schema.sql
#    - copie .env.example -> .env e preencha as credenciais
#    - em index.html, ajuste SB_URL e SB_KEY (chave anon, pública)
#    - configure os secrets no Cloudflare Pages e: wrangler pages deploy .
```

## Estrutura
```
portal-estudos-ia/
├─ index.html             # app (intro, seletor, cards, slideshow, modal) + 6 matérias demo
├─ functions/api/gerar.js # função serverless: texto do PDF → IA → grava no Supabase
├─ wrangler.toml          # Cloudflare Pages + binding de IA
├─ db/schema.sql          # schema (provas, topicos) + dados fictícios
└─ .env.example           # variáveis/segredos (placeholders)
```

## Fluxo
```
Usuário → escolhe matéria + anexa PDF
        → pdf.js extrai o texto (no navegador)
        → POST /api/gerar → IA gera a aula (JSON) → grava no Supabase
        → o site lê do Supabase e exibe (com slideshow e progresso)
```

## Decisões técnicas (destaques)
- **Extração de PDF no cliente** evita subir o arquivo bruto e reduz custo de backend.
- **Fallback offline**: se o Supabase não responder, o app usa o dataset de exemplo em vez de quebrar.
- **Duração dinâmica de slide** (`durSlide`) calcula o tempo de leitura pelo tamanho do texto — sem números mágicos.
- **Saída da IA sempre escapada** no render (`esc()`), evitando XSS de conteúdo gerado.

## Melhorias futuras (roadmap)
- Modo "gerar aula" 100% client-side (mock) para a demo pública funcionar sem backend.
- Acessibilidade: tornar cards/flashcards focáveis por teclado (role/tabindex) e `aria-expanded` nos acordeões.
- Testes de funções puras (`durSlide`, agrupamento de blocos) + lint.
