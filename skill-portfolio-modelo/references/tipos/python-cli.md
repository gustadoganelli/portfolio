# Anonimização — Scripts Python / Automações / CLIs

Guia para transformar um script Python (automação, ETL, integração de API, CLI, bot) em um projeto de portfólio **público, genérico e 100% fictício**. O objetivo é demonstrar a competência técnica sem expor nenhum dado real: sem credenciais, sem tokens, sem endpoints internos, sem nomes de cliente.

---

## 1. Remover credenciais e tokens hardcoded

Este é o passo mais crítico. **Nunca** publique valores reais. Procure e elimine tudo que estiver escrito diretamente no código.

### O que procurar

Faça uma varredura completa no repositório antes de publicar:

```bash
# Padrões comuns de segredo vazado
grep -rniE "(api[_-]?key|token|secret|password|senha|bearer|authorization|client[_-]?secret|access[_-]?key)" .

# Strings que parecem tokens/hashes
grep -rnE "['\"][A-Za-z0-9_\-]{24,}['\"]" .

# URLs internas, IPs e hosts
grep -rnE "(https?://[a-z0-9.-]+\.(local|internal|corp)|[0-9]{1,3}(\.[0-9]{1,3}){3})" .
```

Revise também: connection strings de banco, webhooks (Slack, Teams, n8n), chaves de service account (`.json` do Google), certificados (`.pem`, `.pfx`, `.crt`, `.key`) e arquivos `.env` reais.

### O padrão correto: variáveis de ambiente

Antes (ERRADO — nunca publicar):

```python
API_KEY = "sk-live-9f3a2b8c1d4e5f6a7b8c9d0e"
DB_URL = "postgres://admin:SUA_SENHA@host-exemplo.com:5432/vendas"
```

Depois (CERTO):

```python
import os

API_KEY = os.environ["API_KEY"]                 # falha explícita se não definido
DB_URL = os.getenv("DB_URL", "sqlite:///exemplo.db")  # com default seguro/fictício
```

Para projetos com `python-dotenv` (carregam `.env` automaticamente em dev):

```python
from dotenv import load_dotenv
import os

load_dotenv()  # lê .env local; nunca commitado
API_KEY = os.environ["API_KEY"]
```

### O arquivo `.env.example`

Publique **apenas** o template, com as chaves esperadas e valores fictícios/placeholder. O `.env` real fica no `.gitignore`.

`.env.example`:

```dotenv
# Copie para .env e preencha com seus valores reais
# NUNCA faça commit do .env

API_KEY=coloque-sua-chave-aqui
API_BASE_URL=https://api.exemplo.com/v1
DB_URL=sqlite:///exemplo.db
TIMEOUT_SEGUNDOS=30
LOG_LEVEL=INFO
```

`.gitignore` (garanta que contém, no mínimo):

```gitignore
.env
*.env
!.env.example
__pycache__/
*.pyc
.venv/
venv/
*.log
credenciais*.json
*.pem
*.pfx
*.key
```

> Dica: rode `git log -p | grep -iE "api_key|token|senha"` para conferir se algum segredo já foi commitado no **histórico**. Se sim, o repositório precisa ser recriado do zero (o `.gitignore` não apaga o passado). Para portfólio, o mais simples é começar um repositório novo, sem histórico.

---

## 2. `requirements.txt`

Todo projeto Python de portfólio deve ter dependências declaradas, para que qualquer pessoa consiga rodar.

Gere a partir do ambiente virtual limpo do projeto:

```bash
pip freeze > requirements.txt
```

Prefira **fixar versões** para reprodutibilidade:

```text
requests==2.32.3
python-dotenv==1.0.1
pandas==2.2.2
```

Boas práticas:

- Inclua **só** o que o projeto usa. Remova pacotes de teste/lint se não forem essenciais, ou separe em `requirements-dev.txt`.
- Não deixe pacotes internos/privados da empresa (ex.: `empresa-utils==1.0`). Substitua pela lógica genérica ou remova.
- Se usar Poetry/uv, publique o `pyproject.toml` correspondente em vez do `requirements.txt`.

---

## 3. Dados de exemplo fictícios

Substitua qualquer dado real por dados inventados e coerentes. O projeto deve rodar de ponta a ponta com esses dados de amostra.

### Regras

- **Nomes de pessoas/empresas:** use genéricos ("Cliente A", "Fornecedor Exemplo", "João da Silva", "ACME Ltda").
- **Documentos:** CPF/CNPJ fictícios (`000.000.000-00`, `00.000.000/0001-00`), nunca reais.
- **Valores/datas:** plausíveis, mas inventados. Mantenha a estrutura para o código funcionar.
- **Endpoints:** troque hosts internos por `https://api.exemplo.com`.
- **Chaves de negócio:** IDs, PVs, contas — troque por sequências fictícias (`1001`, `1002`).

### Onde colocar

Crie uma pasta `dados_exemplo/` (ou `samples/`) com arquivos pequenos:

```
dados_exemplo/
├── vendas_exemplo.csv
├── entrada.json
└── resposta_api_exemplo.json
```

Se o projeto consome uma API, inclua um **mock** da resposta (JSON salvo) para que o código rode offline, sem chamar o serviço real. Exemplo de gerador de dados fictícios:

```python
import csv, random
from datetime import date, timedelta

clientes = ["Cliente A", "Cliente B", "Cliente C", "ACME Ltda"]
with open("dados_exemplo/vendas_exemplo.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["data", "cliente", "produto", "valor"])
    for i in range(20):
        w.writerow([
            (date(2024, 1, 1) + timedelta(days=i)).isoformat(),
            random.choice(clientes),
            f"Produto {random.randint(1, 9)}",
            round(random.uniform(50, 5000), 2),
        ])
```

---

## 4. Uso via `argparse`

Uma CLI de portfólio fica muito mais profissional com argumentos nomeados, `--help` e valores default. Evita hardcode de caminhos e facilita quem for testar.

```python
import argparse

def parse_args():
    parser = argparse.ArgumentParser(
        description="Processa um arquivo de vendas e gera um relatório resumido."
    )
    parser.add_argument(
        "--entrada", "-e",
        default="dados_exemplo/vendas_exemplo.csv",
        help="Caminho do CSV de entrada (default: dados de exemplo).",
    )
    parser.add_argument(
        "--saida", "-s",
        default="relatorio.csv",
        help="Caminho do arquivo de saída.",
    )
    parser.add_argument(
        "--min-valor",
        type=float,
        default=0.0,
        help="Filtra registros com valor abaixo deste limite.",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Ativa logs detalhados.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    # ... lógica usando args.entrada, args.saida, args.min_valor
    print(f"Lendo {args.entrada}, gravando em {args.saida}")


if __name__ == "__main__":
    main()
```

Boas práticas:

- Sempre proteja a execução com `if __name__ == "__main__":`.
- Dê `default` apontando para os **dados de exemplo** — assim o projeto roda sem argumentos.
- Coloque `help` em português em cada argumento.
- Segredos vêm de variáveis de ambiente, **não** de argumentos de linha de comando (ficam visíveis no histórico do shell).

---

## 5. Como rodar (documentar sempre)

O README precisa deixar óbvio como colocar o projeto de pé. Padrão recomendado:

```bash
# 1. Clonar
git clone https://github.com/usuario/nome-do-projeto.git
cd nome-do-projeto

# 2. Ambiente virtual
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
# .venv\Scripts\activate         # Windows (PowerShell)

# 3. Dependências
pip install -r requirements.txt

# 4. Configurar variáveis de ambiente
cp .env.example .env
# edite o .env com seus valores (opcional se rodar só com dados de exemplo)

# 5. Executar
python main.py --entrada dados_exemplo/vendas_exemplo.csv
```

O projeto ideal roda de ponta a ponta **apenas com os dados de exemplo**, sem precisar de nenhuma credencial real.

---

## Checklist de anonimização

Antes de publicar, confirme cada item:

- [ ] Nenhuma API key, token, senha ou secret hardcoded no código.
- [ ] Rodei `grep` por `api_key|token|secret|senha|password|bearer` e revisei todos os hits.
- [ ] Nenhum segredo no **histórico do git** (ou repositório recriado do zero).
- [ ] Todas as credenciais lidas de `os.environ` / `os.getenv`.
- [ ] Existe `.env.example` com chaves e valores fictícios.
- [ ] `.env` real está no `.gitignore` (junto com `*.pem`, `*.key`, `credenciais*.json`).
- [ ] `requirements.txt` presente, com versões fixadas, sem pacotes internos da empresa.
- [ ] Nenhum host/IP/URL interno — trocado por `api.exemplo.com`.
- [ ] Nenhum nome real de cliente, fornecedor, colaborador ou empresa.
- [ ] Nenhum CPF/CNPJ/documento real — só fictícios.
- [ ] Dados de exemplo em `dados_exemplo/` e o projeto roda com eles.
- [ ] CLI com `argparse`, `--help` funcionando e defaults apontando para dados de exemplo.
- [ ] Comentários e docstrings sem referências internas (nomes de sistema, projeto interno, jargão da empresa).
- [ ] README com seção "Como rodar" testada do zero em ambiente limpo.
- [ ] LICENSE definido (ex.: MIT) e um `.gitignore` de Python.

---

## Modelo de seção de README

Copie e adapte:

```markdown
# Nome do Projeto

Breve descrição do que a automação/script faz, em 1–2 frases.
Ex.: CLI em Python que lê um arquivo de vendas, aplica regras de
filtro e gera um relatório resumido em CSV.

> Projeto de portfólio. Todos os dados são fictícios e não há
> credenciais reais. As integrações apontam para endpoints de exemplo.

## Funcionalidades

- Leitura de dados de CSV/JSON.
- Filtragem e transformação com regras configuráveis.
- Geração de relatório de saída.
- Configuração via variáveis de ambiente e argumentos de linha de comando.

## Tecnologias

- Python 3.11+
- `requests`, `pandas`, `python-dotenv` (ver `requirements.txt`).

## Estrutura

​```
.
├── main.py                 # ponto de entrada (CLI)
├── requirements.txt        # dependências
├── .env.example            # template de variáveis de ambiente
├── dados_exemplo/          # dados fictícios para teste
└── README.md
​```

## Como rodar

​```bash
git clone https://github.com/usuario/nome-do-projeto.git
cd nome-do-projeto

python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env             # edite se for usar integrações reais

python main.py --entrada dados_exemplo/vendas_exemplo.csv --saida relatorio.csv
​```

## Variáveis de ambiente

| Variável       | Descrição                          | Exemplo                   |
|----------------|------------------------------------|---------------------------|
| `API_KEY`      | Chave da API externa               | `coloque-sua-chave-aqui`  |
| `API_BASE_URL` | URL base da API                    | `https://api.exemplo.com` |
| `DB_URL`       | String de conexão do banco         | `sqlite:///exemplo.db`    |

## Uso da CLI

​```
python main.py --help
​```

| Argumento     | Default                              | Descrição                       |
|---------------|--------------------------------------|---------------------------------|
| `--entrada`   | `dados_exemplo/vendas_exemplo.csv`   | Arquivo de entrada              |
| `--saida`     | `relatorio.csv`                      | Arquivo de saída                |
| `--min-valor` | `0.0`                                | Filtro por valor mínimo         |
| `--verbose`   | `false`                              | Logs detalhados                 |

## Licença

MIT.
```

> Observação sobre as crases: no modelo acima, os blocos de código internos usam o caractere `​` invisível apenas para exibição neste guia. No README real, use três crases normais (```` ``` ````).
