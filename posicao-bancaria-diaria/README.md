# Posicao Bancaria Diaria (Workflow n8n)

Automacao em [n8n](https://n8n.io) que, todo dia util, le a planilha de posicao
bancaria do dia, monta um resumo financeiro formatado e envia automaticamente
para uma lista de destinatarios.

> ⚠️ Projeto de demonstracao — todos os dados sao ficticios.

---

## O que faz

Todo dia util, em horario agendado, o fluxo:

1. Calcula a data do dia e monta o nome esperado da planilha
   (ex.: `Posicao Bancaria 18.05.2026.xlsx`).
2. Busca esse arquivo em uma API de armazenamento de documentos.
3. Le um intervalo da aba `Posicao Diaria` da planilha (rotulo + valor).
4. Formata um resumo em HTML, com secoes (CAIXA, APLICACOES) e linhas de
   destaque (ex.: saldo final), convertendo numeros para o formato monetario.
5. Valida se ha conteudo; se nao houver, segue para um ramo de erro.
6. Expande a lista de destinatarios (um por pessoa) e envia o resumo via API
   de mensagens.

Ramos de erro tratam dois casos: falha de acesso ao arquivo/planilha e
ausencia de dados no intervalo lido.

### Diagrama do fluxo

```
[Agendamento Diario]  (cron: 0 11 * * 1-5)
        |
        v
[Montar Nome do Arquivo]   -> calcula data e nome do .xlsx
        |
        v
[Buscar Arquivo do Dia] ----------------(erro)----> [Erro - Falha no Acesso]
        |
        v
[Extrair IDs do Arquivo]
        |
        v
[Ler Aba Posicao Diaria] --------------(erro)-----> [Erro - Falha no Acesso]
        |
        v
[Formatar Mensagem]
        |
        v
[Mensagem Valida?] ----(vazia)-------------------> [Erro - Sem Dados]
        | (ok)
        v
[Expandir Destinatarios]   -> 1 item por destinatario
        |
        v
[Enviar Resumo ao Destinatario]   -> POST para API de mensagens
```

---

## Tecnologias

- **n8n** — orquestracao do workflow (Schedule Trigger, Code, IF, HTTP Request).
- **JavaScript** — nos de codigo para montagem de nome, parsing e formatacao.
- **API de documentos (generica)** — busca e leitura de planilha via HTTP
  (endpoints estilo `/search/query` e `/workbook/worksheets/.../range`).
- **API de mensagens (generica)** — envio do resumo por HTTP.

Todos os endpoints apontam para `https://demo.exemplo.dev` (placeholder).
As credenciais sao referenciadas como credenciais vazias do n8n
(`Header Auth`), a serem preenchidas pelo usuario.

---

## Como rodar

1. **Importar o workflow**
   - No n8n: `Workflows` -> `Import from File` -> selecione
     `posicao-bancaria-workflow.json`.

2. **Configurar credenciais**
   - Crie em `Credentials` duas credenciais do tipo `Header Auth`
     (ou outro tipo conforme sua API) e vincule aos nos:
     - `Buscar Arquivo do Dia` e `Ler Aba Posicao Diaria` -> API de documentos.
     - `Enviar Resumo ao Destinatario` -> API de mensagens.
   - Substitua os endpoints `https://demo.exemplo.dev/...` pelos da sua API real.

3. **Ajustar o agendamento**
   - No no `Agendamento Diario`, a expressao cron `0 11 * * 1-5` dispara as
     11h, de segunda a sexta. Ajuste ao fuso do servidor se necessario.

4. **Ajustar destinatarios**
   - No no `Expandir Destinatarios`, edite a lista `destinatarios`
     (nomes e e-mails ficticios estao no codigo como exemplo).

5. **Ajustar a leitura da planilha**
   - No no `Ler Aba Posicao Diaria`, o intervalo lido e `A2:B12` da aba
     `Posicao Diaria`. Veja `exemplo-planilha-posicao.csv` para o layout
     esperado (coluna A = rotulo, coluna B = valor; linhas so com texto viram
     titulos de secao; linhas vazias viram quebras de paragrafo).

6. **Testar antes de ativar**
   - Use `Test step` nos primeiros nos para validar nome do arquivo e leitura
     do intervalo antes de ligar o toggle `Active`.

---

## Estrutura do repositorio

```
posicao-bancaria-diaria/
├── README.md
├── posicao-bancaria-workflow.json   # workflow n8n (importar)
└── exemplo-planilha-posicao.csv     # layout de dados ficticios de exemplo
```
