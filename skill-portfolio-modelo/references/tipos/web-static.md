# Tipo: Web estático (HTML / CSS / JS)

Guia de anonimização para sites/painéis estáticos servidos direto do navegador
(HTML + CSS + JS puro, ou com libs via CDN). Vale também para front-ends que só
falam com um back-end externo (Supabase, Firebase, uma API REST) a partir do
navegador.

Leia primeiro [`../regras-anonimizacao.md`](../regras-anonimizacao.md) e o
`blocklist.txt` (se existir). Este arquivo é o "como" específico para web estático.

> Regra de ouro: **reconstrua**, não copie. Leia os arquivos reais só para
> entender estrutura e comportamento; escreva uma versão nova e genérica.

---

## 1. Remover chaves e segredos

Em web estático **todo JS roda no navegador**, então qualquer coisa no código-
fonte é pública por definição. Nunca deixe segredo real, mesmo "escondido" numa
variável.

Onde os segredos costumam se esconder:
- `const SUPABASE_URL = "https://xxxx.supabase.co"` e a `anon key`.
- `firebaseConfig = { apiKey, authDomain, projectId, ... }`.
- `Authorization: "Bearer ..."`, tokens de webhook, chaves de mapa
  (Google Maps, Mapbox), IDs de projeto/analytics.
- URLs internas de API/n8n/webhook que revelam o cliente.
- Comentários `// TODO`, `<!-- -->` com dados reais colados.

Duas estratégias (escolha por caso):

**A) Placeholder `{{ }}` + arquivo de exemplo** — quando faz sentido mostrar que
o projeto depende de config externa:
```js
// config.js  (versão pública — sem valores reais)
const CONFIG = {
  SUPABASE_URL: "{{SUPABASE_URL}}",
  SUPABASE_ANON_KEY: "{{SUPABASE_ANON_KEY}}",
  API_BASE: "{{API_BASE}}",
};
```
Inclua um `config.example.js` (ou `.env.example`) documentando cada variável, e
diga no README que o usuário deve copiá-lo e preencher. **Não** versione o
arquivo preenchido.

**B) Mock embutido (recomendado para demo que roda sozinha)** — quando você quer
que a página **abra e funcione** sem back-end. Troque as chamadas de rede por um
módulo de dados fictícios:
```js
// data.mock.js — dados 100% fictícios, sem rede
export const PROJETOS = [
  { id: 1, nome: "Projeto Alfa",  status: "Em andamento", responsavel: "Mariana Dias" },
  { id: 2, nome: "Projeto Beta",  status: "Concluído",    responsavel: "Rafael Lima"  },
  { id: 3, nome: "Projeto Gama",  status: "Planejado",    responsavel: "Diego Alves"  },
];
```
```js
// no lugar de: const { data } = await supabase.from('projetos').select('*')
import { PROJETOS } from "./data.mock.js";
const data = PROJETOS;              // demo offline
```
Deixe um comentário curto indicando onde entraria a chamada real, para o código
continuar didático:
```js
// Em produção: buscar via API/Supabase. Aqui usamos mock para a demo rodar offline.
```

> Prefira **(B)** para portfólio: quem abrir vê o projeto funcionando na hora,
> sem precisar de credenciais.

---

## 2. Substituir dados reais por mock fictício

Troque **todo** conteúdo real por equivalente plausível e inventado:
- Nomes de pessoas → nomes fictícios (Mariana Dias, Rafael Lima, Diego Alves).
- Empresa/cliente → "Empresa Exemplo" / "Organização Demo".
- Unidades/filiais → "Unidade Norte/Sul/Leste", "Matriz".
- E-mails → `nome@exemplo.com`.
- Valores/números/datas → inventados, mas coerentes (não use os reais nem
  "arredondados" a partir dos reais).
- Textos/observações colados de tickets/planilhas reais → reescreva genéricos.

Mantenha **volume e formato** parecidos (ex.: se a tabela real tinha ~10 linhas,
gere ~10) para a UI continuar demonstrando bem o layout, paginação, filtros etc.

Cuidado com dados escondidos: `data-*` no HTML, `<option value="...">`,
`localStorage`/`sessionStorage` semeados no código, JSON inline em `<script>`,
e imagens/PDFs embutidos (logo do cliente, prints com dados).

---

## 3. Manter a funcionalidade

A demo tem que **provar a competência técnica** — então preserve tudo que não é
dado sensível:
- Layout, CSS, responsividade, tema/dark mode.
- Interações: filtros, busca, ordenação, abas, gráficos, modais.
- Lógica de cálculo/validação (só troque os dados de entrada, não a regra).
- Bibliotecas: se usava CDN (Chart.js, etc.), mantenha o mesmo CDN.

Checagem rápida: abra a página após a limpeza e confirme que **nada quebrou** no
console (sem `undefined` por causa de dado removido, sem erro de rede porque
sobrou uma chamada a API que devia virar mock).

---

## 4. Como rodar (qualquer servidor estático)

`file://` costuma quebrar `fetch`, `import` de módulos ES e CORS. Sirva por HTTP
local. Documente uma opção simples no README:

```bash
# Python (já vem no macOS/Linux e no Windows via py)
python -m http.server 8000
# abra http://localhost:8000

# Node
npx serve .
# ou
npx http-server -p 8000

# VS Code: extensão "Live Server" (botão "Go Live")
```

Se o projeto for HTML puro sem módulos/fetch, abrir o `index.html` direto no
navegador também serve — mas prefira orientar o servidor local, que cobre todos
os casos.

---

## 5. Screenshot / GIF e link de demo (opcional, recomendado)

Vale muito para o portfólio:
- **Screenshot**: 1 imagem do estado principal já com os dados fake. Salve em
  `docs/screenshot.png` e referencie no README (`![Demo](docs/screenshot.png)`).
- **GIF**: se houver interação legal (filtro, gráfico animado), um GIF curto
  (5–10s) vende melhor. Ferramentas: ScreenToGif (Windows), Kap (macOS),
  Peek (Linux).
- **Demo ao vivo**: como é estático, publique em GitHub Pages, Cloudflare Pages
  ou Netlify e linke no README. **Só publique a versão com mock/placeholder** —
  nunca uma demo que aponte para back-end real.

Confirme que a imagem/GIF **não** mostra dado real (aba do navegador, nome de
arquivo, outra janela ao fundo, título da página com nome do cliente).

---

## Checklist de anonimização (web estático)

- [ ] Nenhuma chave real no código (Supabase/Firebase/API/mapa/analytics) —
      viraram `{{PLACEHOLDER}}` ou foram substituídas por mock.
- [ ] Nenhuma URL interna de API/webhook/n8n que identifique o cliente.
- [ ] `config.example.js` / `.env.example` presente (se usou placeholders); o
      arquivo real **não** foi versionado.
- [ ] Todos os dados exibidos são fictícios (nomes, empresa, unidades, e-mails,
      valores, datas, textos livres).
- [ ] Sem dados reais escondidos em `data-*`, `value`, JSON inline,
      `localStorage`/`sessionStorage` ou comentários.
- [ ] Sem logo/imagem/print/mapa do cliente; assets trocados por genéricos.
- [ ] A página abre e funciona (mock offline) sem erros no console.
- [ ] README com "Como rodar" (servidor estático).
- [ ] Screenshot/GIF (se incluído) não mostra nada real.
- [ ] `python scripts/scrub.py <pasta> blocklist.txt` retornou **LIMPO**.

---

## Modelo de seção de README (por projeto)

````markdown
# Painel de Projetos (demo)

> ⚠️ Projeto de demonstração — todos os dados são fictícios.

Site estático (HTML/CSS/JS) que exibe um painel de acompanhamento de projetos
com filtros, busca e gráficos. Nesta versão pública os dados vêm de um mock
local, para a demo rodar offline.

![Demo](docs/screenshot.png)

🔗 Demo ao vivo: https://usuario.github.io/painel-projetos  <!-- opcional -->

## O que faz
- Lista projetos com status, responsável e progresso.
- Filtro por status e busca por nome.
- Gráfico de distribuição por status (Chart.js).

## Tecnologias
- HTML, CSS e JavaScript (sem framework).
- Chart.js via CDN.
- Dados via mock local (`data.mock.js`).

## Como rodar
```bash
python -m http.server 8000
# abra http://localhost:8000
```
Ou use a extensão "Live Server" do VS Code.

## Configuração (versão com back-end)
A versão real usa variáveis externas. Copie `config.example.js` para `config.js`
e preencha:
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — projeto de dados.
- `API_BASE` — base da API.
````
