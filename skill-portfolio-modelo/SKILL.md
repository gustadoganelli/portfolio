---
name: portfolio-modelo
description: >-
  Transforma um projeto finalizado em uma versão pública anonimizada (código
  genérico, dados 100% fictícios, sem credenciais/dados reais) e publica/atualiza
  no SEU repositório de portfólio no GitHub. Genérica e configurável — cada dev
  usa o próprio repositório e token. Use SEMPRE que terminar um projeto e quiser
  colocá-lo no portfólio, ou disser "publicar no portfólio", "adicionar ao meu
  portfólio", "anonimizar e publicar", "subir esse projeto pro meu github",
  mesmo sem citar a palavra "portfólio".
---

# Publicar projeto no portfólio (anonimizado, dados fake) — modelo compartilhável

Pega um projeto recém-finalizado, cria uma **versão pública limpa** (genérica,
com **dados 100% fictícios**, sem nada real) e **publica/atualiza** o seu
repositório de portfólio no GitHub.

Esta skill é **genérica**: ela não tem token nem repositório embutidos — cada
pessoa configura os seus. Tratar a limpeza de dados como requisito
inegociável: **nada real pode ir para o ar**.

## Configuração (feita uma vez pelo dono da skill)
Leia o arquivo `config.json` (na pasta da skill). Se ele não existir, instrua o
usuário a copiar `config.example.json` para `config.json` e preencher:
- `repo`: `"usuario/portfolio"` (o repositório de portfólio no GitHub)
- `working_copy`: caminho local de um clone desse repositório
- `branch`: normalmente `"main"`

O **token** fica em `.gh-token` (mesma pasta da skill; um token do GitHub numa
linha). Se faltar, peça ao usuário para criar um token **fine-grained** com
permissão *Contents: Read and write* apenas no repositório de portfólio e salvar
nesse arquivo. Nunca coloque token no código nem em arquivo versionado.

O `blocklist.txt` (opcional, na pasta da skill) tem termos específicos do
usuário que NUNCA podem vazar (nome do cliente/empresa, unidades, pessoas
reais). Um por linha.

## Passo a passo

### 1. Descobrir o projeto de entrada
O usuário "manda o projeto" (um caminho de pasta, ou o projeto atual). Confirme
o caminho. Liste os arquivos-fonte principais, ignorando `.git/`, `.claude/`,
`node_modules/`, `.next/`, `dist/`, `build/`, `.wrangler/`, exports/binários e
cópias duplicadas.

### 2. Ler as regras
Leia [`references/regras-anonimizacao.md`](references/regras-anonimizacao.md)
e o `blocklist.txt` (se existir) **antes de escrever qualquer coisa**.

### 3. Reconstruir uma versão LIMPA (não copiar os arquivos reais)
Leia os arquivos reais só para entender **estrutura e funcionalidade** e escreva
uma versão nova, genérica:
- Mesmo comportamento, mas **dados fictícios** (Empresa Exemplo, Unidade
  Norte/Sul, joao@exemplo.com, valores inventados).
- Segredos (chaves, tokens, connection strings) viram **placeholders**
  (`{{VARIAVEL}}`, `.env.example`) — nunca valores reais.
- Sem logos/imagens/mapas de cliente.
- Se houver SQL, escreva um schema **novo e genérico** com INSERTs fictícios —
  nunca cole migrações/dados reais.
- Um `README.md` (por projeto) com: título genérico, "## O que faz",
  "## Tecnologias", "## Como rodar" e o aviso
  `> ⚠️ Projeto de demonstração — todos os dados são fictícios.`
- Escolha um **slug** kebab-case e crie a pasta em
  `<working_copy>/<slug>/`.

### 4. Varredura de segurança (bloqueia a publicação)
Rode o scanner na pasta nova (passe o blocklist se existir):
```
python "<pasta-da-skill>/scripts/scrub.py" "<working_copy>/<slug>" "<pasta-da-skill>/blocklist.txt"
```
**Só siga se o resultado for `LIMPO`.** Se achar algo, corrija e rode de novo
até zerar. Faça também sua própria leitura crítica — o script é rede de
segurança, não substitui julgamento.

### 5. Atualizar o índice
Acrescente o novo projeto no `README.md` principal do `working_copy` (link para
a pasta + uma linha do que faz). Se não houver README raiz, crie um simples.

### 6. Publicar (commit + push)
Nunca exiba o token nem o grave em arquivo do repositório.
```
cd "<working_copy>"
TOKEN="$(tr -d '\r\n' < "<pasta-da-skill>/.gh-token")"
REPO="<repo do config, ex.: usuario/portfolio>"
git add -A
git -c commit.gpgsign=false commit -m "Adiciona <slug> ao portfólio (demo, dados fictícios)"
git remote set-url origin "https://x-access-token:${TOKEN}@github.com/${REPO}.git"
git push origin <branch>
git remote set-url origin "https://github.com/${REPO}.git"
```
Depois do push, **sempre** volte o remote para a URL sem token.

### 7. Reportar
Confirme o link no ar e resuma o que foi adicionado + o resultado da varredura
(zero vazamentos).

## Lembretes
- Binários (`.pbix`, `.msapp`, exports) podem ter dados embutidos — prefira
  transformá-los em estudo de caso (README + descrição) a subir o binário.
- Se aparecer um termo sensível novo (outro cliente, banco, unidade),
  generalize e sugira adicioná-lo ao `blocklist.txt`.
