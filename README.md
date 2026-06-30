# Portfólio — Automação de Processos, BI e Aplicações

Coleção de projetos de **automação de processos, painéis de dados (BI) e aplicações** que demonstram, na prática, como reduzir trabalho manual, dar visibilidade em tempo real e organizar fluxos de negócio.

> ⚠️ **Projetos de demonstração.** Todo o código aqui é genérico e **todos os dados são fictícios** (nomes, e-mails, valores, empresas e credenciais são inventados ou placeholders). Nada representa dados reais de qualquer organização — o objetivo é mostrar a arquitetura e a funcionalidade das soluções.

---

## 🖥️ Painéis e ferramentas web

| Projeto | O que faz | Stack |
|---|---|---|
| [`painel-disponibilidade-equipe`](./painel-disponibilidade-equipe) | Painel para TV com a disponibilidade da equipe (livre/ocupado/ausente) e a agenda do dia, alimentado por integração de calendário. | HTML/CSS/JS, n8n (exemplo) |
| [`formulario-pesquisa-clima`](./formulario-pesquisa-clima) | Pesquisa de clima organizacional: formulário anônimo, login admin, painel de resultados com gráficos, QR Code e exportação. | HTML/JS, Chart.js |
| [`painel-metas`](./painel-metas) | Painel de metas e desempenho por área/responsável (atingimento, pontuação e evolução mês a mês). | HTML/CSS/JS |
| [`painel-projetos`](./painel-projetos) | Catálogo de projetos internos por categoria e setor, com dashboard de indicadores. | HTML/CSS/JS, Supabase |

## ⚙️ Automações (n8n)

| Projeto | O que faz |
|---|---|
| [`agente-ia-corporativo`](./agente-ia-corporativo) | Agente de IA que recebe solicitações em linguagem natural, interpreta com LLM, roteia por intenção e registra/encaminha. |
| [`integracao-notas-fiscais`](./integracao-notas-fiscais) | Coleta notas fiscais de uma API (paginação, retry, deduplicação) e grava em um painel de destino. |
| [`alertas-auditoria`](./alertas-auditoria) | Lembretes semanais de pendências (não conformidades) por e-mail, agrupados por unidade. |
| [`relatorio-agenda-equipe`](./relatorio-agenda-equipe) | Relatório semanal e resumo diário da agenda da equipe, com detecção de mudanças (novos/alterados/cancelados). |
| [`posicao-bancaria-diaria`](./posicao-bancaria-diaria) | Em agendamento diário, lê a posição/saldo, monta um resumo financeiro e envia aos responsáveis. |
| [`conciliacao-bancaria`](./conciliacao-bancaria) | Conciliação de pagamentos (banco × ERP) e de vendas em cartão (adquirente × ERP), apontando divergências. |
| [`alertas-planos-acao`](./alertas-planos-acao) | Alertas de planos de ação/deliberações: aviso de nova ação e lembrete mensal de pendências por responsável. |
| [`newsletter-ia`](./newsletter-ia) | Coleta notícias (RSS), gera um resumo/newsletter diário com IA e envia por e-mail. |
| [`post-linkedin-ia`](./post-linkedin-ia) | Gera e publica um post diário no LinkedIn com IA (texto + imagem). |

## 🧩 Aplicações

| Projeto | O que faz | Stack |
|---|---|---|
| [`app-registro-doacoes`](./app-registro-doacoes) | Aplicação de registro de doações/itens com fila, status, login e detalhes. | Next.js (App Router), Supabase |
| [`sistema-auditoria`](./sistema-auditoria) | Sistema de auditoria interna: app PWA (offline) para checklists e não conformidades em campo + painel de resultados + schema. | React, Vite, TypeScript, PostgreSQL |

---

## Como usar este repositório

Cada pasta é um projeto independente com seu próprio `README.md` explicando **o que faz**, as **tecnologias** e **como rodar**. Os workflows n8n estão em `.json` prontos para importar; as ferramentas web rodam com qualquer servidor estático; a aplicação Next.js traz `.env.example` (preencha com suas próprias credenciais).

## Licença

[MIT](./LICENSE) © Gustavo Doganelli
