# -*- coding: utf-8 -*-
"""
Varredura de segurança para portfólio público (genérica e configurável).

Uso:
    python scrub.py <pasta> [blocklist.txt] [--json]

BLOQUEIA (exit 1) se encontrar:
  - termos do seu blocklist.txt (opcional; um por linha);
  - e-mails cujo domínio não parece fictício;
  - VALORES de segredo (chaves de API, JWT, tokens, private keys);
  - connection strings com usuário:senha embutidos;
  - arquivos de chave (.pem/.key/.p12/.pfx/.jks) e .env reais;
  - GUIDs de alta entropia (placeholders de baixa entropia passam).

AVISA (não bloqueia):
  - nomes de campo sensíveis (client_secret, password...) — confira o valor;
  - binários que podem ter dados embutidos (.pbix, .xlsx, .msapp...).

--json imprime os achados em JSON (para a skill processar).
Saída: 0 se LIMPO, 1 se encontrar algo que bloqueia.
"""
import sys, os, re, json


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
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = [a for a in sys.argv[1:] if a.startswith("--")]
    as_json = "--json" in flags
    if not args:
        print("uso: python scrub.py <pasta> [blocklist.txt] [--json]")
        return 2
    root = args[0]
    blist = load_blocklist(args[1] if len(args) > 1 else None)

    FAKE = ("example", "exemplo", "demo", "empresa", "teste", "acme", "fake",
            "localhost", ".test", ".local", "seu-", "sua-", "your-",
            "placeholder", "dominio", "meu-", "sample", "mydomain", "email.com")

    EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
    GUID = re.compile(r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b")

    # VALORES de segredo (cada um é um leak real)
    SECRET_PATTERNS = [
        ("supabase_secret", r"sb_secret_[A-Za-z0-9_-]{6,}"),
        ("jwt",             r"eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{5,}"),
        ("github_token",    r"gh[oprsu]_[A-Za-z0-9]{20,}"),
        ("gitlab_token",    r"glpat-[A-Za-z0-9_-]{15,}"),
        ("aws_key_id",      r"\bAKIA[0-9A-Z]{16}\b"),
        ("google_api_key",  r"AIza[0-9A-Za-z_-]{20,}"),
        ("stripe_key",      r"\b[rspk]k_(live|test)_[0-9A-Za-z]{16,}"),
        ("slack_token",     r"xox[baprs]-[0-9A-Za-z-]{10,}"),
        ("sendgrid",        r"SG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}"),
        ("openai_key",      r"sk-[A-Za-z0-9]{20,}"),
        ("npm_token",       r"npm_[A-Za-z0-9]{30,}"),
        ("digitalocean",    r"dop_v1_[a-f0-9]{40,}"),
        ("twilio_sid",      r"\bAC[0-9a-f]{32}\b"),
        ("private_key",     r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    ]
    SECRET = [(name, re.compile(p)) for name, p in SECRET_PATTERNS]
    CONN = re.compile(r"\b(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis|amqps?|ftp)://([^\s:@/]+):([^\s:@/]+)@([^\s/]+)")

    def _placeholder_pw(pw):
        # senha embutida que é claramente placeholder (não bloqueia)
        p = pw.lower()
        if len(set(p)) <= 3:
            return True
        if any(k in p for k in ("senha", "pass", "pwd", "secret", "exemplo", "example",
                                "your", "seu", "sua", "changeme", "placeholder", "xxxx",
                                "redacted", "dummy", "fake", "test")):
            return True
        return any(c in pw for c in "{}<>")

    def _low_entropy(val):
        alnum = re.sub(r"[^A-Za-z0-9]", "", val)
        return len(set(alnum)) <= 4  # ex.: sk-xxxxxxxx, 00000000

    WARN_SECRET = ["client_secret", "service_role", "password", "passwd", "senha", "secret_key", "api_key", "apikey"]
    KEYFILE_EXT = (".pem", ".key", ".p12", ".pfx", ".jks", ".keystore", ".ppk")
    BINARY_EXT = (".pbix", ".msapp", ".xlsx", ".xls", ".xlsm", ".docx", ".pptx",
                  ".accdb", ".mdb", ".bak", ".zip", ".7z", ".rar", ".sqlite", ".db")

    SKIP = {".git", "node_modules", ".next", "dist", "dev-dist", ".wrangler",
            ".claude", "__pycache__", ".venv", "venv"}
    findings = {"BLOCKLIST": [], "EMAIL": [], "SEGREDO": [], "CONN": [],
                "GUID": [], "KEYFILE": [], "ENV": []}
    warns = []
    nfiles = 0

    for base, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in SKIP]
        for fn in files:
            fp = os.path.join(base, fn)
            rel = os.path.relpath(fp, root).replace(os.sep, "/")
            low_fn = fn.lower()
            if fn == ".env" or (fn.startswith(".env.") and "local" in fn and not fn.endswith(".example")):
                findings["ENV"].append((rel, fn))
            if low_fn.endswith(KEYFILE_EXT) and not low_fn.endswith(".example"):
                findings["KEYFILE"].append((rel, fn))
            if low_fn.endswith(BINARY_EXT):
                warns.append((rel, "binário (" + os.path.splitext(fn)[1] + ") pode ter dados embutidos"))
                continue
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
            for name, rx in SECRET:
                for m in set(rx.findall(txt)):
                    val = m if isinstance(m, str) else m[0]
                    if _low_entropy(val):
                        continue  # placeholder óbvio (ex.: sk-xxxxxxxx)
                    findings["SEGREDO"].append((rel, name + ": " + val[:16] + "..."))
            for m in CONN.finditer(txt):
                if not _placeholder_pw(m.group(2)):
                    findings["CONN"].append((rel, m.group(0)[:40] + "..."))
            for g in set(GUID.findall(txt)):
                if len(set(g.replace("-", "").lower())) <= 5:
                    continue
                findings["GUID"].append((rel, g))
            for t in WARN_SECRET:
                if re.search(r"(?i)\b" + re.escape(t) + r"\b", txt):
                    warns.append((rel, t))

    total = sum(len(v) for v in findings.values())

    if as_json:
        print(json.dumps({"clean": total == 0, "files_scanned": nfiles,
                          "findings": findings, "warnings": warns}, ensure_ascii=False, indent=1))
        return 0 if total == 0 else 1

    labels = {"BLOCKLIST": "Termos do seu blocklist", "EMAIL": "E-mails não-fictícios",
              "SEGREDO": "Chaves/segredos (valores)", "CONN": "Connection strings com senha",
              "GUID": "GUIDs de alta entropia", "KEYFILE": "Arquivos de chave",
              "ENV": "Arquivos .env reais"}
    print(f"Arquivos varridos: {nfiles}" + (f"  |  blocklist: {len(blist)} termo(s)" if blist else ""))
    print("=" * 58)
    for cat in ["BLOCKLIST", "EMAIL", "SEGREDO", "CONN", "GUID", "KEYFILE", "ENV"]:
        hits = findings[cat]
        print(f"[{labels[cat]}] " + ("OK (0)" if not hits else f"!!! {len(hits)}"))
        for rel, t in hits[:40]:
            print(f"    {rel}  ::  {t}")
    if warns:
        seen = set()
        uniq = [(r, t) for r, t in warns if not ((r, t) in seen or seen.add((r, t)))]
        print(f"[AVISO/revisar] {len(uniq)} (não bloqueia — confira à mão):")
        for rel, t in uniq[:25]:
            print(f"    {rel}  ::  {t}")
    print("=" * 58)
    if total == 0:
        print("RESULTADO: LIMPO ✅  (pode publicar)" + ("  — revise os AVISOS" if warns else ""))
        return 0
    print(f"RESULTADO: PRECISA CORRIGIR ❌  ({total} ocorrência(s))")
    return 1


if __name__ == "__main__":
    sys.exit(main())
