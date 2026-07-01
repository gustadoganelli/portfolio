# portfolio-modelo — skill para publicar projetos no portfólio (anonimizados)

Uma **skill do Claude Code** que pega um projeto que você acabou de finalizar,
cria uma **versão pública anonimizada** (código genérico, **dados 100%
fictícios**, sem credenciais nem dados reais) e **publica/atualiza** o seu
repositório de portfólio no GitHub — com uma **varredura de segurança
automática** que bloqueia a publicação se encontrar qualquer coisa sensível.

É **genérica e compartilhável**: não tem token nem repositório embutidos. Cada
pessoa configura os seus.

> ⚠️ Projeto de demonstração — quando publicada no portfólio, esta pasta é a
> própria skill; use-a como modelo.

## O que ela faz
1. Você manda um projeto finalizado.
2. Ela reconstrói uma versão limpa: naming genérico, dados fictícios, segredos
   como placeholders, README com aviso de demonstração.
3. Roda um scanner (`scripts/scrub.py`) que **bloqueia** se achar: termos do seu
   blocklist, e-mails não-fictícios, valores de chave/token/JWT, GUIDs reais ou
   arquivos `.env` reais.
4. Só depois de passar, faz commit + push no seu repositório de portfólio.

## Instalação
1. Copie a pasta `portfolio-modelo/` para o seu diretório de skills do Claude
   Code: `~/.claude/skills/portfolio-modelo/` (Windows:
   `C:\Users\SEU_USUARIO\.claude\skills\portfolio-modelo\`).

## Configuração (uma vez)
1. **Repositório:** crie um repositório `portfolio` (público) na sua conta e
   clone-o em algum lugar local.
2. **config.json:** copie `config.example.json` para `config.json` e preencha
   `repo` (`seu-usuario/portfolio`), `working_copy` (caminho do clone) e
   `branch`.
3. **Token:** crie um GitHub Token **fine-grained** com permissão
   *Contents: Read and write* apenas no repositório de portfólio e salve-o em
   `.gh-token` (um arquivo com só o token, nesta pasta).
4. **blocklist.txt (recomendado):** copie `blocklist.example.txt` para
   `blocklist.txt` e liste os termos que nunca podem vazar no seu contexto
   (cliente, empresa, unidades, pessoas) — um por linha.

> `.gh-token`, `config.json` e `blocklist.txt` estão no `.gitignore` — não são
> versionados. Nunca comite segredos.

## Uso
Quando terminar um projeto, é só pedir ao Claude Code algo como:
> "Terminei esse projeto aqui, ó: `C:\...\meu-projeto`. Anonimiza e publica no
> meu portfólio."

ou invoque a skill diretamente: `/portfolio-modelo`.

## Segurança
- A varredura é uma rede de segurança — revise sempre o resultado antes de
  publicar. Prefira token de menor privilégio possível.
- Binários (`.pbix`, `.msapp`, exports) podem conter dados embutidos; para esses,
  publique um estudo de caso (README + prints), não o binário.

---
Feito com [Claude Code](https://claude.com/claude-code).
