# Banco de dados

Schema PostgreSQL do sistema de auditoria.

> ⚠️ Dados de exemplo - todos ficticios.

## Ordem de execucao

| Arquivo | Conteudo |
| --- | --- |
| `migrations/0001_schema.sql` | Tabelas, indices e triggers. |
| `migrations/0002_rpc_confirmar.sql` | Funcao `confirmar_auditoria` (commit em transacao). |
| `seed/0100_seed.sql` | Dados de exemplo (unidades, areas, itens, auditorias, NCs). |

## Modelo (resumo)

- **unidades** - locais auditados.
- **usuarios** - perfis `AUDITOR` (ve tudo) e `GESTOR_UNIDADE` (ve so a sua unidade).
- **areas** + **unidade_areas** - catalogo global de areas e quais cada unidade audita (N:N).
- **itens_verificacao** - banco de perguntas; tipos SCORE / BOOLEANO / CLASSIFICACAO /
  TEXTO_*. `schema_classificacao` (JSONB) define o formulario dinamico.
- **auditorias** - escopo = unidade + auditor + periodo; ciclo RASCUNHO -> CONFIRMADA.
- **respostas** - uma linha por resposta, com valor tipado e snapshot do item.
- **nao_conformidades** - achados; risco pela matriz GUT (`gut_score` calculado).
- **anexos** - evidencias por resposta.

## Observacoes

- A funcao `confirmar_auditoria` recebe um JSON com respostas + NCs e grava tudo numa
  unica transacao - reflete o "commit" disparado pelo app ao fechar a auditoria.
- Em producao, o `id` de `usuarios` deve referenciar a tabela de autenticacao do seu
  provedor e a funcao deve ser protegida (ex.: RLS + `SECURITY DEFINER`).
