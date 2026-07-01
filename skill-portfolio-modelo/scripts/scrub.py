# -*- coding: utf-8 -*-
"""
Varredura de segurança genérica para portfólio público.

Uso:
    python scrub.py <pasta> [blocklist.txt]

Checa (e BLOQUEIA) por:
  - termos do seu blocklist.txt (opcional; um por linha) — ex.: nome do cliente,
    empresa, unidades, pessoas reais do seu projeto;
  - e-mails cujo domínio não parece fictício;
  - valores de segredo (chaves/JWT/tokens/private keys);
  - GUIDs de alta entropia (placeholders de baixa entropia passam);
  - arquivos .env reais (só .env.example é permitido).

Avisa (não bloqueia) nomes de campo comuns como client_secret / service_role.

Saída: código 0 se LIMPO, 1 se encontrar algo.
"""
import sys, os, re


def load_blocklist(path):
    terms = []
    if path and os.path.isfile(path):
        for line in open(path, encoding="utf-8", errors="ignore"):
            t = line.strip()
            if t and not t.startswith("#"):
                terms.append(t)
    return terms


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) < 2:
        print("uso: python scrub.py <pasta> [blocklist.txt]")
        return 2
    root = sys.argv[1]
    blist = load_blocklist(sys.argv[2] if len(sys.argv) > 2 else None)

    # Indicadores de domínio fictício (substring) — e-mail fora disso é suspeito.
    FAKE = ("example", "exemplo", "demo", "empresa", "teste", "acme", "fake",
            "localhost", ".test", ".local", "seu-", "sua-", "your-",
            "placeholder", "dominio", "meu-", "sample", "mydomain")
    EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
    GUID = re.compile(r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b")
    # Só VALORES de segredo bloqueiam:
    SECRET = re.compile(r"(sb_secret_[A-Za-z0-9_-]{6,}|eyJ[A-Za-z0-9_-]{20,}|"
                        r"gh[oprs]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{12,}|"
                        r"xox[baprs]-[A-Za-z0-9-]{10,}|sk-[A-Za-z0-9]{20,}|"
                        r"-----BEGIN [A-Z ]*PRIVATE KEY-----)")
    WARN_SECRET = ["client_secret", "service_role", "password", "senha"]

    SKIP = {".git", "node_modules", ".next", "dist", "dev-dist", ".wrangler",
            ".claude", "__pycache__", ".venv", "venv"}
    findings = {"BLOCKLIST": [], "EMAIL": [], "SEGREDO": [], "GUID": [], "ENV": []}
    warns = []
    nfiles = 0

    for base, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in SKIP]
        for fn in files:
            fp = os.path.join(base, fn)
            rel = os.path.relpath(fp, root).replace(os.sep, "/")
            if fn == ".env" or (fn.startswith(".env.") and "local" in fn and not fn.endswith(".example")):
                findings["ENV"].append((rel, fn))
            try:
                txt = open(fp, encoding="utf-8", errors="ignore").read()
            except Exception:
                continue
            nfiles += 1
            low = txt.lower()
            for t in blist:
                if t.lower() in low:
                    findings["BLOCKLIST"].append((rel, t))
            for em in set(EMAIL.findall(txt)):
                if not any(d in em.lower() for d in FAKE):
                    findings["EMAIL"].append((rel, em))
            for m in set(SECRET.findall(txt)):
                findings["SEGREDO"].append((rel, m[:20] + "..."))
            for g in set(GUID.findall(txt)):
                if len(set(g.replace("-", "").lower())) <= 5:
                    continue  # placeholder de baixa entropia
                findings["GUID"].append((rel, g))
            for t in WARN_SECRET:
                if t in low:
                    warns.append((rel, t))

    print(f"Arquivos varridos: {nfiles}")
    if blist:
        print(f"(blocklist com {len(blist)} termo(s) carregada)")
    print("=" * 56)
    total = 0
    labels = {"BLOCKLIST": "Termos do seu blocklist", "EMAIL": "E-mails não-fictícios",
              "SEGREDO": "Chaves/segredos (valores)", "GUID": "GUIDs de alta entropia",
              "ENV": "Arquivos .env reais"}
    for cat in ["BLOCKLIST", "EMAIL", "SEGREDO", "GUID", "ENV"]:
        hits = findings[cat]
        total += len(hits)
        print(f"[{labels[cat]}] " + ("OK (0)" if not hits else f"!!! {len(hits)}"))
        for rel, t in hits[:40]:
            print(f"    {rel}  ::  {t}")
    if warns:
        seen = set()
        uniq = [(r, t) for r, t in warns if not ((r, t) in seen or seen.add((r, t)))]
        print(f"[AVISO/revisar] {len(uniq)} nome(s) de campo sensível — confira se o valor é placeholder:")
        for rel, t in uniq[:20]:
            print(f"    {rel}  ::  {t}")
    print("=" * 56)
    if total == 0:
        print("RESULTADO: LIMPO ✅  (pode publicar)" + ("  — revise os AVISOS" if warns else ""))
        return 0
    print(f"RESULTADO: PRECISA CORRIGIR ❌  ({total} ocorrência(s))")
    return 1


if __name__ == "__main__":
    sys.exit(main())
