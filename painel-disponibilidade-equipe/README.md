# Painel de Disponibilidade da Equipe

Painel HTML para exibicao em TV (modo kiosk) que mostra, em tempo quase real, a **disponibilidade da equipe** (livre / em reuniao / ausente) e a **agenda do dia**. Pensado para uma tela compartilhada em sala de reuniao ou recepcao.

> ⚠️ Projeto de demonstracao — todos os dados sao ficticios. Nesta versao, a equipe, as reunioes e a agenda sao geradas localmente no navegador; nao ha backend, chaves ou contas reais.

---

## O que faz

- **Aba Disponibilidade** — cards por colaborador (e por sala), agrupados em categorias, mostrando:
  - status atual com cor (verde = disponivel, vermelho = em reuniao, amarelo = ausente);
  - reuniao em andamento (assunto, local e horario de termino);
  - proxima reuniao do dia.
- **Filtro por categoria** — mostrar/ocultar grupos (Diretoria, Gerencia, Equipe, Salas) com um clique.
- **Ticker** — faixa rolante no topo destacando quem esta em reuniao no momento.
- **Aba Agenda do Dia** — todas as reunioes do dia, navegavel por data, com dois modos de visualizacao (por horario ou por pessoa), botao de **copiar** o resumo e **exportar PDF** (via impressao do navegador).
- **Calendario mensal** — ao clicar num card, abre um modal com o mes completo daquela pessoa/sala e os compromissos de cada dia.
- **Relogio e data** em tempo real e **atualizacao automatica** a cada 60 segundos.

---

## Como funciona a integracao real (resumo)

Em producao, o painel nao acessa os calendarios diretamente. Um middleware de automacao (ex.: **n8n**) faz o trabalho pesado:

```
API de Calendario (ex.: Microsoft 365 / Google Calendar)
        |  autenticacao OAuth2 (client credentials)
        v
   Workflow n8n  --- agrega e calcula o status de cada pessoa/sala
        |  expoe um Webhook (HTTP GET) que devolve JSON
        v
   index.html  --- fetch a cada 60s  --->  TV em modo kiosk
```

O front so consome um JSON simples. Toda credencial fica **exclusivamente** no middleware, nunca no HTML.

Um exemplo ilustrativo de workflow esta em `n8n/workflow-disponibilidade.exemplo.json` — todos os valores sensiveis sao placeholders `{{ }}`.

---

## Tecnologias

- **HTML5 + CSS3** puro (sem framework, layout responsivo em grid/flexbox).
- **JavaScript (ES6+)** sem dependencias externas.
- **Mock embutido** (`dados.js`) para rodar 100% offline na demo.
- **n8n** (opcional, em producao) como middleware de integracao com a API de calendario.

Estrutura dos arquivos:

```
painel-disponibilidade-equipe/
├── index.html     # estrutura e estilos do painel
├── dados.js       # dados ficticios + geradores de status/agenda/mes (mock)
├── app.js         # logica da UI (cards, filtro, ticker, modal, agenda, PDF)
├── n8n/
│   └── workflow-disponibilidade.exemplo.json   # exemplo de integracao (placeholders)
└── README.md
```

---

## Como rodar

A demo precisa ser servida via HTTP (por causa do carregamento dos scripts e do `fetch`); evite abrir o arquivo direto como `file://`.

**Opcao A — Python (sem instalar nada):**

```bash
cd painel-disponibilidade-equipe
python -m http.server 8080
```
Acesse `http://localhost:8080`.

**Opcao B — Node.js:**

```bash
npx http-server painel-disponibilidade-equipe -p 8080
```
Acesse `http://localhost:8080`.

**Opcao C — VS Code Live Server:** clique com o botao direito em `index.html` e escolha *Open with Live Server*.

### Modo TV / kiosk (opcional)

Abra o navegador em tela cheia apontando para a URL do painel, por exemplo:

```
chrome --kiosk --noerrdialogs --disable-infobars http://localhost:8080
```

---

## Como ligar a uma API real (passo a passo)

1. Em `app.js`, no objeto `CONFIG`, defina os endpoints do seu middleware:
   ```js
   const CONFIG = {
     webhookUrl:       "{{WEBHOOK_DISPONIBILIDADE}}",
     webhookMesUrl:    "{{WEBHOOK_MES}}",
     webhookAgendaUrl: "{{WEBHOOK_AGENDA_DIA}}",
     intervaloAtualizacao: 60000,
     usarMock: false
   };
   ```
2. Nas funcoes `buscarDados`, `buscarMes` e `carregarAgenda`, troque o trecho de mock pelo bloco `fetch(...)` ja deixado comentado.
3. No middleware (ex.: n8n), importe o workflow de exemplo, preencha os placeholders `{{ }}` com credenciais armazenadas com seguranca e ative o webhook.

O formato de JSON esperado pelo front:

```json
[
  {
    "id": "pessoa@exemplo.dev",
    "nome": "Pessoa Exemplo",
    "statusAtual": "Em Reuniao",
    "reuniaoAtual": { "subject": "Alinhamento", "local": "Sala 1", "fim": "15:30" },
    "proximaReuniao": { "horario": "16:00", "subject": "Review" }
  }
]
```

---

## Observacoes

- Nenhuma chave, credencial, URL de producao ou dado pessoal real esta presente neste repositorio.
- Os geradores em `dados.js` sao deterministicos (mesma data/usuario -> mesmo resultado), o que mantem a demo estavel a cada recarga.
