# Regras de anonimização

Objetivo: a versão pública deve demonstrar a **competência técnica** sem expor
**nenhum** dado real de cliente/empregador. Na dúvida, generalize.

## O que SEMPRE precisa sair (ou virar placeholder/fake)
- **Nome do cliente/empresa/organização** e domínios de e-mail deles.
- **Pessoas reais** (nomes, e-mails, usuários) → nomes fictícios.
- **Lugares/unidades/filiais reais** → genéricos (Unidade Norte/Sul, Matriz).
- **Sistemas/fornecedores reais** citados (bancos, ERPs, adquirentes, SaaS) →
  genéricos (Banco Exemplo, ERP Exemplo) quando forem identificáveis do cliente.
- **Segredos**: chaves de API, tokens, JWTs, service_role, client_secret,
  connection strings, senhas, IDs de projeto (Supabase/SharePoint), GUIDs de
  credencial → placeholders `{{VARIAVEL}}` / `.env.example`.
- **Dados reais** em SQL/planilhas/JSON (registros, valores, e-mails) → dados
  fictícios plausíveis.
- **Logos/imagens/mapas** do cliente → remover ou trocar por genéricos.

## Mapa de dados fake (exemplos)
- Organização → "Empresa Exemplo" / "Organização Demo"
- Unidades → "Unidade Norte/Sul/Leste", "Matriz", "Filial 1"
- Pessoas → nomes fictícios comuns (Mariana Dias, Rafael Lima, Diego Alves…)
- E-mails → `nome@exemplo.com` / `@empresa-exemplo.com`
- Domínio → `exemplo.com` / `demo.exemplo.dev`
- Chaves/tokens/URLs internas → `{{ENV}}` / `.env.example`
- Contas/números sensíveis → `0000-0`
- SQL → tabelas/colunas genéricas + INSERTs fictícios

## Blocklist do projeto (opcional, muito recomendado)
Crie um `blocklist.txt` na pasta da skill (a partir de `blocklist.example.txt`)
com os termos ESPECÍFICOS que nunca podem vazar no seu contexto — um por linha
(nome do cliente, empresa, unidades, pessoas). A varredura (`scrub.py`) usa esse
arquivo para bloquear automaticamente esses termos, além das checagens genéricas
(segredos, e-mails não-fictícios, `.env` real, GUIDs de alta entropia).

> Esta lista é um piso, não um teto. Se aparecer algo sensível que não está aqui
> nem no blocklist, generalize mesmo assim.
