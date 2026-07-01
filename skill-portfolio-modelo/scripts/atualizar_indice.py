# -*- coding: utf-8 -*-
"""
Regenera a tabela de índice no README.md raiz do portfólio.

Uso:
    python atualizar_indice.py <working_copy>

O que faz:
  - Varre as subpastas de <working_copy> (o repositório do portfólio).
  - Para cada subpasta que contenha um README.md, extrai:
      * o TÍTULO (primeira linha "# ..." do README da pasta);
      * a primeira FRASE de descrição (primeiro parágrafo não vazio depois do título).
  - Monta uma tabela markdown | Projeto | Descrição | com link para a pasta.
  - Insere/atualiza a tabela entre os marcadores:
        <!-- INDICE:INICIO -->
        <!-- INDICE:FIM -->
    no README.md raiz. Se os marcadores (ou o README) não existirem, cria-os
    com um cabeçalho padrão.

Idempotente: rodar de novo sobre a mesma árvore produz o mesmo README.
Ignora pastas ocultas (começando com ".") e node_modules. Sempre utf-8.
Saída: 0 em sucesso; 2 se o caminho for inválido.
"""
import sys
import os
import re

INICIO = "<!-- INDICE:INICIO -->"
FIM = "<!-- INDICE:FIM -->"

SKIP_DIRS = {"node_modules", ".git", ".github", "__pycache__",
             ".next", "dist", "dev-dist", ".wrangler", ".venv", "venv",
             "assets", "public", "src", "scripts", "docs"}

TITULO_RE = re.compile(r"^\s{0,3}#\s+(.+?)\s*#*\s*$")


def le_texto(path):
    """Lê um arquivo em utf-8, tolerante a caracteres inválidos."""
    try:
        with open(path, encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception:
        return ""


def limpa_inline(texto):
    """Remove marcações markdown inline para uma célula de tabela legível."""
    t = texto.strip()
    # imagens ![alt](url) -> descarta
    t = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", t)
    # links [texto](url) -> texto
    t = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", t)
    # ênfase e código inline
    t = re.sub(r"[*_`~]+", "", t)
    # tags html simples
    t = re.sub(r"<[^>]+>", "", t)
    # normaliza espaços e escapa a barra da tabela
    t = re.sub(r"\s+", " ", t).strip()
    t = t.replace("|", "\\|")
    return t


def extrai_titulo_descricao(readme_path, fallback_nome):
    """Extrai (titulo, descricao) do README.md de um projeto."""
    txt = le_texto(readme_path)
    linhas = txt.splitlines()

    titulo = None
    idx_titulo = -1
    for i, ln in enumerate(linhas):
        m = TITULO_RE.match(ln)
        if m and m.group(1).strip():
            titulo = limpa_inline(m.group(1))
            idx_titulo = i
            break
    if not titulo:
        titulo = fallback_nome.replace("-", " ").replace("_", " ").strip().title()

    # primeira frase = primeiro parágrafo de texto após o título
    descricao = ""
    buffer = []
    for ln in linhas[idx_titulo + 1:]:
        s = ln.strip()
        if not s:
            if buffer:
                break
            continue
        # pula outros cabeçalhos, imagens, badges, separadores e listas de metadados
        if s.startswith("#") or s.startswith("---") or s.startswith("==="):
            if buffer:
                break
            continue
        if re.match(r"^!\[", s) or re.match(r"^\[!\[", s):
            continue
        if s.startswith(">"):
            s = s.lstrip("> ").strip()
        if s.startswith(("- ", "* ", "+ ")) or re.match(r"^\d+[.)]\s", s):
            s = re.sub(r"^([-*+]|\d+[.)])\s+", "", s)
        buffer.append(s)

    paragrafo = limpa_inline(" ".join(buffer))
    if paragrafo:
        # primeira frase: até o primeiro ponto final seguido de espaço/fim,
        # preservando abreviações comuns não é crítico aqui.
        m = re.search(r"(.+?[.!?])(\s|$)", paragrafo)
        descricao = (m.group(1) if m else paragrafo).strip()
        if len(descricao) > 220:
            descricao = descricao[:217].rstrip() + "..."
    if not descricao:
        descricao = "_(sem descrição)_"
    return titulo, descricao


def coleta_projetos(root):
    """Retorna lista de (titulo, descricao, pasta_rel) ordenada por título."""
    projetos = []
    for nome in sorted(os.listdir(root)):
        if nome.startswith(".") or nome in SKIP_DIRS:
            continue
        pasta = os.path.join(root, nome)
        if not os.path.isdir(pasta):
            continue
        readme = None
        for cand in ("README.md", "readme.md", "Readme.md", "README.MD"):
            p = os.path.join(pasta, cand)
            if os.path.isfile(p):
                readme = p
                break
        if not readme:
            continue
        titulo, descricao = extrai_titulo_descricao(readme, nome)
        projetos.append((titulo, descricao, nome))
    projetos.sort(key=lambda x: x[0].lower())
    return projetos


def monta_tabela(projetos):
    """Monta o bloco de tabela markdown (sem os marcadores)."""
    linhas = ["| Projeto | Descrição |", "| --- | --- |"]
    if not projetos:
        linhas.append("| _(nenhum projeto encontrado)_ | |")
    for titulo, descricao, pasta in projetos:
        link = pasta.replace(" ", "%20")
        linhas.append(f"| [{titulo}](./{link}/) | {descricao} |")
    return "\n".join(linhas)


def substitui_bloco(conteudo, bloco):
    """Insere/atualiza o bloco entre os marcadores. Idempotente."""
    novo = f"{INICIO}\n{bloco}\n{FIM}"
    if INICIO in conteudo and FIM in conteudo:
        return re.sub(
            re.escape(INICIO) + r".*?" + re.escape(FIM),
            lambda _: novo,
            conteudo,
            count=1,
            flags=re.DOTALL,
        )
    # marcadores ausentes: acrescenta uma seção de índice ao final
    cabecalho = "## Projetos\n\n"
    sep = "" if conteudo.endswith("\n") or not conteudo else "\n\n"
    if conteudo.strip():
        return conteudo.rstrip() + "\n\n" + cabecalho + novo + "\n"
    return cabecalho + novo + "\n"


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        print("uso: python atualizar_indice.py <working_copy>")
        return 2
    root = os.path.abspath(args[0])
    if not os.path.isdir(root):
        print(f"ERRO: pasta não encontrada: {root}")
        return 2

    readme_raiz = os.path.join(root, "README.md")
    conteudo = le_texto(readme_raiz) if os.path.isfile(readme_raiz) else ""

    projetos = coleta_projetos(root)
    bloco = monta_tabela(projetos)
    novo_conteudo = substitui_bloco(conteudo, bloco)

    if novo_conteudo == conteudo:
        print(f"Índice já atualizado ({len(projetos)} projeto(s)). Nada a fazer.")
        return 0

    with open(readme_raiz, "w", encoding="utf-8", newline="\n") as f:
        f.write(novo_conteudo)

    print(f"README raiz atualizado: {readme_raiz}")
    print(f"Projetos indexados: {len(projetos)}")
    for titulo, _, pasta in projetos:
        print(f"    - {titulo}  ({pasta}/)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
