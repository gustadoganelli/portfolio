---
name: portfolio-modelo
description: >-
  Transforma um projeto finalizado em uma versão pública anonimizada (código
  genérico, dados 100% fictícios, sem credenciais/dados reais) e publica/atualiza
  no SEU repositório de portfólio no GitHub, com varredura de segurança
  automática. Genérica e configurável — cada dev usa o próprio repositório,
  token e blocklist. Use SEMPRE que terminar um projeto e quiser colocá-lo no
  portfólio, ou disser "publicar no portfólio", "adicionar ao meu portfólio",
  "anonimizar e publicar", "subir esse projeto pro meu github", "limpar e
  publicar", mesmo sem citar a palavra "portfólio".
---

# Publicar projeto no portfólio (anonimizado, dados fake) — modelo compartilhável

Pega um projeto recém-finalizado, cria uma **versão pública limpa** (genérica,
**dados 100% fictícios**, sem nada real) e **publica/atualiza** o seu
repositório de portfólio no GitHub. A limpeza de dados é **inegociável**: nada
real pode ir para o ar. Esta skill não tem token nem repositório embutidos —
cada pessoa configura os seus.

## 0. Configuração (uma vez) — verifique antes de tudo
Rode o diagnóstico e siga o que ele indicar:
```
python "<pasta-da-skill>/scripts/setup.py"
```
Ele confere: `config.json` (repo, working_copy, branch), `.gh-token` (token do
GitHub), e o `blocklist.txt`. Se algo faltar, ele mostra os comandos exatos
para resolver. Detalhes dos arquivos:
- `config.json` — copie de `config.example.json`: `repo` (`usuario/portfolio`),
  `working_copy` (clone local do repo), `branch` (`main`).
- `.gh-token` — token **fine-grained** com *Contents: Read and write* só nesse
  repo. Nunca versione.
- `blocklist.txt` (recomendado) — termos que nunca podem vazar (cliente,
  empresa, unidades, pessoas), um por linha. Copie de `blocklist.example.txt`.

## Passo a passo

### 1. Entender o projeto e DETECTAR O TIPO
Confirme o caminho de origem. Liste os arquivos-fonte, ignorando `.git/`,
`.claude/`, `node_modules/`, `.next/`, `dist/`, `build/`, `.wrangler/`, exports
e cópias duplicadas. Classifique o tipo e leia o guia correspondente:

| Tipo | Sinais | Guia (leia antes de reconstruir) |
|---|---|---|
| n8n | `.json` com `nodes`/`connections` | [`references/tipos/n8n.md`](references/tipos/n8n.md) |
| Web estático | HTML/CSS/JS sem build de app | [`references/tipos/web-static.md`](references/tipos/web-static.md) |
| Next.js / Node | `package.json`, `src/app`, `.tsx` | [`references/tipos/nextjs-node.md`](references/tipos/nextjs-node.md) |
| Python / CLI | `.py`, `requirements.txt` | [`references/tipos/python-cli.md`](references/tipos/python-cli.md) |
| Dados / BI / binário | `.pbix`, `.xlsx`, `.msapp`, exports | [`references/tipos/dados-bi.md`](references/tipos/dados-bi.md) |

Se for misto, leia mais de um guia.

### 2. Ler as regras
Leia [`references/regras-anonimizacao.md`](references/regras-anonimizacao.md) e o
`blocklist.txt` (se existir) **antes de escrever qualquer coisa**.

### 3. Reconstruir uma versão LIMPA (não copiar os arquivos reais)
Leia o original só para entender **estrutura e funcionalidade** e escreva uma
versão nova e genérica, seguindo o guia do tipo:
- Mesmo comportamento, **dados fictícios** (Empresa Exemplo, joao@exemplo.com,
  valores inventados).
- Segredos → placeholders (`{{VARIAVEL}}`, `.env.example`); nunca valores reais.
- Sem logos/imagens/dados de cliente.
- SQL → schema novo e genérico com INSERTs fictícios.
- Escolha um **slug** kebab-case e crie `<working_copy>/<slug>/`. Se já existir
  uma pasta com esse slug, avise: é atualização do mesmo projeto (sobrescreva) ou
  um novo (escolha outro slug)? Não duplique sem querer.
- Crie o `README.md` do projeto a partir de
  [`assets/README-template.md`](assets/README-template.md).

### 4. Varredura de segurança (BLOQUEIA a publicação)
```
python "<pasta-da-skill>/scripts/scrub.py" "<working_copy>/<slug>" "<pasta-da-skill>/blocklist.txt"
```
**Só siga se der `LIMPO`.** Corrija e rode de novo até zerar. Revise também os
AVISOS (binários, nomes de campo sensível) com olho crítico — o script é rede de
segurança, não substitui julgamento.

### 5. Atualizar o índice do portfólio
```
python "<pasta-da-skill>/scripts/atualizar_indice.py" "<working_copy>"
```
Regenera a tabela de projetos no README raiz automaticamente.

### 6. Publicar (commit + push, com segurança)
Nunca exiba o token nem o grave em arquivo do repositório. Puxe antes de
publicar para evitar conflito:
```
cd "<working_copy>"
TOKEN="$(tr -d '\r\n' < "<pasta-da-skill>/.gh-token")"
REPO="<repo do config>"        # ex.: usuario/portfolio
BRANCH="<branch do config>"    # ex.: main
git remote set-url origin "https://x-access-token:${TOKEN}@github.com/${REPO}.git"
git pull --rebase origin "$BRANCH" 2>/dev/null || true
git add -A
git -c commit.gpgsign=false commit -m "Adiciona <slug> ao portfólio (demo, dados fictícios)"
git push origin "$BRANCH"
git remote set-url origin "https://github.com/${REPO}.git"
```
Sempre restaure o remote sem token (última linha), mesmo se o push falhar.

**Modo prévia (dry-run):** se o usuário pedir só para "ver antes"/"não publicar
ainda", faça os passos 1–5 e PARE antes do commit/push; mostre a árvore gerada e
o resultado da varredura.

### 7. Reportar
Confirme o link no ar (`https://github.com/<repo>`), liste o que foi adicionado,
o resultado da varredura (zero bloqueios) e quaisquer AVISOS que o usuário deva
revisar.

## Lembretes
- Prefira o token de menor privilégio (fine-grained, só o repo do portfólio).
- Se aparecer termo sensível novo, generalize e sugira adicioná-lo ao
  `blocklist.txt`.
- Binários podem ter dados embutidos — use o guia de dados/BI (estudo de caso),
  não suba o binário.
