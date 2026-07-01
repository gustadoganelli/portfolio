#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
setup.py — Doctor/Setup da skill "portfolio-modelo"

Verifica, de forma NAO-interativa, se o ambiente esta pronto para anonimizar
projetos finalizados e publica-los num repositorio de portfolio no GitHub.

Uso:
    python setup.py

O script:
  1. Verifica se existe config.json (senao, mostra o formato e como criar).
  2. Valida os campos repo / working_copy / branch.
     - working_copy existe? e um repositorio git?
     - repo esta no formato "owner/nome"?
  3. Verifica se existe .gh-token (SEM imprimir o conteudo).
  4. Imprime, com marcadores ✅/❌, o que falta e os COMANDOS exatos para
     resolver: criar token fine-grained (link), criar o repo e clona-lo.

Nao faz chamadas de rede obrigatorias. Robusto: usa UTF-8 e nao quebra se
faltar arquivo. Codigo de saida 0 quando tudo OK, 1 quando ha pendencias.
"""

import io
import json
import os
import subprocess
import sys

# ---------------------------------------------------------------------------
# Suporte a UTF-8 no console (Windows/PowerShell costuma vir em cp1252)
# ---------------------------------------------------------------------------
try:
    sys.stdout.reconfigure(encoding="utf-8")  # Python 3.7+
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
    except Exception:
        pass  # ultimo recurso: seguimos mesmo assim

# ---------------------------------------------------------------------------
# Caminhos: a skill vive em .../portfolio-modelo/ e este script em scripts/
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.dirname(SCRIPT_DIR)

CONFIG_PATH = os.path.join(SKILL_DIR, "config.json")
CONFIG_EXAMPLE_PATH = os.path.join(SKILL_DIR, "config.example.json")
TOKEN_PATH = os.path.join(SKILL_DIR, ".gh-token")

# Formato canonico do config.json (usado quando o arquivo nao existe)
CONFIG_TEMPLATE = {
    "repo": "seu-usuario/meu-portfolio",
    "working_copy": "C:/Users/voce/portfolio-publico",
    "branch": "main",
}

# Marcadores
OK = "✅"      # ✅
FAIL = "❌"    # ❌
WARN = "⚠️"  # ⚠️
INFO = "ℹ️"  # ℹ️
ARROW = "→"   # →

# Acumula pendencias para o resumo final
_problemas = []


def _p(texto=""):
    """print() tolerante a erros de encoding."""
    try:
        print(texto)
    except Exception:
        print(str(texto).encode("ascii", "replace").decode("ascii"))


def cabecalho(titulo):
    linha = "-" * 68
    _p(linha)
    _p(titulo)
    _p(linha)


def registrar_problema(msg):
    _problemas.append(msg)


# ---------------------------------------------------------------------------
# 1) config.json
# ---------------------------------------------------------------------------
def checar_config():
    cabecalho("1. Arquivo de configuracao (config.json)")

    if not os.path.isfile(CONFIG_PATH):
        _p(f"{FAIL} config.json NAO encontrado em:")
        _p(f"     {CONFIG_PATH}")
        _p("")
        _p(f"   {INFO} Copie o modelo e preencha com seus dados:")
        if os.path.isfile(CONFIG_EXAMPLE_PATH):
            _p(f"       copy \"{CONFIG_EXAMPLE_PATH}\" \"{CONFIG_PATH}\"   (Windows)")
            _p(f"       cp   \"{CONFIG_EXAMPLE_PATH}\" \"{CONFIG_PATH}\"   (Linux/macOS)")
        else:
            _p(f"   {WARN} config.example.json tambem nao existe. Crie o config.json com este formato:")
        _p("")
        _p("   Formato esperado (config.json):")
        for linha in json.dumps(CONFIG_TEMPLATE, indent=2, ensure_ascii=False).splitlines():
            _p("       " + linha)
        _p("")
        _p("   Campos:")
        _p("     - repo         : \"owner/nome\" do repositorio no GitHub (ex.: joao/meu-portfolio)")
        _p("     - working_copy : caminho local onde o repo esta/ficara clonado")
        _p("     - branch       : branch de publicacao (normalmente \"main\")")
        registrar_problema("Criar e preencher config.json")
        return None

    _p(f"{OK} config.json encontrado.")

    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            cfg = json.load(f)
    except json.JSONDecodeError as e:
        _p(f"{FAIL} config.json existe mas nao e um JSON valido: {e}")
        _p("   Revise virgulas, aspas e chaves. Formato esperado:")
        for linha in json.dumps(CONFIG_TEMPLATE, indent=2, ensure_ascii=False).splitlines():
            _p("       " + linha)
        registrar_problema("Corrigir JSON invalido em config.json")
        return None
    except Exception as e:
        _p(f"{FAIL} Nao foi possivel ler config.json: {e}")
        registrar_problema("Corrigir leitura de config.json")
        return None

    if not isinstance(cfg, dict):
        _p(f"{FAIL} config.json deve conter um objeto JSON (chaves e valores).")
        registrar_problema("config.json com estrutura invalida")
        return None

    return cfg


# ---------------------------------------------------------------------------
# 2) Validacao dos campos repo / working_copy / branch
# ---------------------------------------------------------------------------
def _repo_valido(repo):
    """Formato 'owner/nome', sem espacos, com exatamente uma barra."""
    if not isinstance(repo, str) or repo.count("/") != 1:
        return False
    owner, _, nome = repo.partition("/")
    if not owner or not nome:
        return False
    if any(c.isspace() for c in repo):
        return False
    return True


def _eh_repo_git(caminho):
    """True se o caminho for a raiz (ou estiver dentro) de um repo git."""
    if os.path.isdir(os.path.join(caminho, ".git")):
        return True
    try:
        r = subprocess.run(
            ["git", "-C", caminho, "rev-parse", "--is-inside-work-tree"],
            capture_output=True, text=True, timeout=15,
        )
        return r.returncode == 0 and r.stdout.strip() == "true"
    except Exception:
        return False


def checar_campos(cfg):
    cabecalho("2. Campos do config.json (repo / working_copy / branch)")
    if cfg is None:
        _p(f"{WARN} Pulando: config.json ausente ou invalido (ver item 1).")
        return None, None

    repo = cfg.get("repo")
    working_copy = cfg.get("working_copy")
    branch = cfg.get("branch")

    # --- repo ---
    if _repo_valido(repo):
        _p(f"{OK} repo         : {repo}")
    else:
        _p(f"{FAIL} repo         : valor invalido ({repo!r}). Use o formato \"owner/nome\".")
        registrar_problema("Corrigir campo repo (formato owner/nome)")

    # --- branch ---
    if isinstance(branch, str) and branch.strip():
        _p(f"{OK} branch       : {branch}")
    else:
        _p(f"{FAIL} branch       : ausente ou vazio. Ex.: \"main\".")
        registrar_problema("Definir campo branch (ex.: main)")

    # --- working_copy ---
    if not isinstance(working_copy, str) or not working_copy.strip():
        _p(f"{FAIL} working_copy : ausente ou vazio. Informe o caminho local do repo.")
        registrar_problema("Definir campo working_copy")
        return repo, working_copy

    wc = os.path.expanduser(working_copy)
    if not os.path.isdir(wc):
        _p(f"{FAIL} working_copy : pasta NAO existe:")
        _p(f"                {wc}")
        _p(f"   {INFO} Clone o repositorio nesse caminho (ver item 4).")
        registrar_problema("Clonar/criar a pasta working_copy")
    elif not _eh_repo_git(wc):
        _p(f"{FAIL} working_copy : a pasta existe, mas NAO e um repositorio git:")
        _p(f"                {wc}")
        _p(f"   {INFO} Clone o repo nessa pasta ou rode 'git init' e adicione o remote (ver item 4).")
        registrar_problema("Transformar working_copy em repo git (clone/init)")
    else:
        _p(f"{OK} working_copy : {wc}")
        _p(f"                (repositorio git valido)")

    return repo, working_copy


# ---------------------------------------------------------------------------
# 3) Token do GitHub (.gh-token) — sem imprimir o conteudo
# ---------------------------------------------------------------------------
def checar_token():
    cabecalho("3. Token do GitHub (.gh-token)")
    if not os.path.isfile(TOKEN_PATH):
        _p(f"{FAIL} .gh-token NAO encontrado em:")
        _p(f"     {TOKEN_PATH}")
        _p("")
        _p(f"   {INFO} Crie um token fine-grained (com permissao de escrita em Contents")
        _p("       do repositorio de portfolio) e salve nesse arquivo:")
        _p("       https://github.com/settings/personal-access-tokens/new")
        _p("")
        _p("   Depois salve o token no arquivo (NAO deixe rastro no terminal):")
        _p(f"       Windows PowerShell:  Set-Content -Path \"{TOKEN_PATH}\" -Value 'SEU_TOKEN' -NoNewline -Encoding utf8")
        _p(f"       Linux/macOS:         printf '%s' 'SEU_TOKEN' > \"{TOKEN_PATH}\"")
        registrar_problema("Criar arquivo .gh-token com um token fine-grained")
        return False

    # Existe: validamos apenas que nao esta vazio — sem imprimir o conteudo.
    try:
        tamanho = os.path.getsize(TOKEN_PATH)
    except Exception:
        tamanho = -1

    if tamanho == 0:
        _p(f"{FAIL} .gh-token existe, mas esta VAZIO. Cole um token valido nele.")
        registrar_problema("Preencher .gh-token (arquivo vazio)")
        return False

    _p(f"{OK} .gh-token encontrado (conteudo nao exibido por seguranca).")
    _p(f"   {WARN} Nunca faca commit do .gh-token. Confirme que ele esta no .gitignore.")
    return True


# ---------------------------------------------------------------------------
# 4) Como criar o repo e clonar (instrucoes acionaveis)
# ---------------------------------------------------------------------------
def instrucoes_repo(repo, working_copy):
    cabecalho("4. Criar o repositorio e clonar (se ainda nao existir)")

    repo_ref = repo if _repo_valido(repo) else "owner/nome"
    nome_repo = repo_ref.split("/", 1)[1] if "/" in repo_ref else "meu-portfolio"
    destino = os.path.expanduser(working_copy) if isinstance(working_copy, str) and working_copy.strip() else nome_repo

    _p("Com a GitHub CLI (gh) — cria o repo publico e ja clona no destino:")
    _p(f"    gh repo create {repo_ref} --public --clone")
    _p("")
    _p("Se o repo JA existe no GitHub, apenas clone no caminho de working_copy:")
    _p(f"    git clone https://github.com/{repo_ref}.git \"{destino}\"")
    _p("")
    _p("Sem a gh CLI: crie o repo pelo site e depois clone:")
    _p(f"    https://github.com/new   (nome sugerido: {nome_repo})")
    _p(f"    git clone https://github.com/{repo_ref}.git \"{destino}\"")
    _p("")
    _p(f"{INFO} Verifique se a gh CLI esta instalada e autenticada:")
    _p("    gh --version")
    _p("    gh auth status")


# ---------------------------------------------------------------------------
# Resumo
# ---------------------------------------------------------------------------
def resumo():
    cabecalho("Resumo")
    if not _problemas:
        _p(f"{OK} Tudo pronto! Ambiente configurado para publicar o portfolio.")
        return 0

    _p(f"{FAIL} Faltam {len(_problemas)} item(ns) antes de publicar:")
    for i, prob in enumerate(_problemas, 1):
        _p(f"   {i}. {prob}")
    _p("")
    _p(f"{INFO} Resolva os itens acima e rode novamente: python setup.py")
    return 1


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    _p("")
    _p("=" * 68)
    _p("  Doctor da skill: portfolio-modelo")
    _p("  Verificando o ambiente de publicacao do portfolio...")
    _p("=" * 68)
    _p("")
    _p(f"{INFO} Pasta da skill: {SKILL_DIR}")
    _p("")

    cfg = checar_config()
    _p("")
    repo, working_copy = checar_campos(cfg)
    _p("")
    checar_token()
    _p("")
    instrucoes_repo(repo, working_copy)
    _p("")
    codigo = resumo()
    _p("")
    return codigo


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        _p("\nInterrompido pelo usuario.")
        sys.exit(130)
    except Exception as e:
        # Nunca quebrar com stacktrace feio para o usuario final.
        _p(f"{FAIL} Erro inesperado no setup: {e}")
        sys.exit(1)
