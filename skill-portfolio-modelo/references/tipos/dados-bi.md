# Tipo: dados/BI e binários (Power BI, planilhas, exports)

Projetos de dados e BI quase sempre chegam como **binários**: `.pbix` (Power BI),
`.msapp` (Power Apps), `.xlsx`/`.xlsm` (planilhas), `.pbit`, `.qvf`, dumps `.bak`,
exports `.csv`/`.json`. Esses arquivos são o caso mais perigoso do portfólio.

## Regra de ouro: NÃO publique o binário

Um `.pbix`, `.msapp` ou `.xlsx` **não é código-fonte** — é um contêiner que carrega
**dados reais embutidos** e a **forma de chegar neles**. Mesmo "abrindo bonito" na
tela, dentro do arquivo costuma ter:

- **Dados importados/em cache**: o modelo do Power BI guarda as linhas carregadas
  (VertiPaq). Deletar visuais não apaga os dados do modelo.
- **Connection strings**: servidor, banco, gateway, workspace, URLs de API.
- **Consultas M (Power Query)**: caminhos de rede, tokens em texto, `Web.Contents`
  com endpoints internos, credenciais em passos.
- **Planilhas**: abas ocultas, nomes definidos, comentários, metadados do autor,
  dados em células fora da área "visível", conexões externas, macros VBA.
- **Metadados**: autor, empresa, caminhos `C:\Users\...\OneDrive - Cliente\...`.

> Conclusão: publicar o binário = vazar dado real. Não faça. Transforme em
> **estudo de caso**.

## Em vez do binário: publique um ESTUDO DE CASO

O objetivo do portfólio é provar **competência técnica**, não entregar o arquivo.
Um estudo de caso bem escrito demonstra mais domínio do que o `.pbix` em si:
mostra que você entende o **problema**, modelou a **solução** e sabe **explicar**.

Entregue, na pasta do projeto:

1. **`README.md`** — o estudo de caso (modelo abaixo).
2. **`/imagens/`** — 2 a 4 prints **anonimizados** do painel/relatório.
3. **`modelo-dados.md`** (opcional) — tabelas, relacionamentos e medidas descritos.
4. **`/exemplos/`** (opcional) — trechos de DAX/M/SQL **genéricos** e dados fictícios.

Nunca coloque o `.pbix`/`.msapp`/`.xlsx` original na pasta. Se o `.gitignore` da
skill não cobrir, adicione `*.pbix *.pbit *.msapp *.xlsx *.xlsm *.qvf *.bak`.

## Como anonimizar os PRINTS (imagens)

Print de painel real vaza dado sem você perceber: nomes de cliente no título,
valores de faturamento, nomes de pessoas em tabelas, filtros com unidades reais.
Duas opções, em ordem de preferência:

**A) Recriar com dados fictícios (melhor).** Troque a fonte do relatório por uma
tabela fake (mesma estrutura, números inventados plausíveis), atualize e só então
tire o print. O layout fica idêntico e nada real aparece. É o único jeito 100%
seguro para tabelas com muitos registros.

**B) Editar/borrar a imagem existente (aceitável se A for inviável).**
- **Remova de verdade** — não confie em blur leve. Cubra com **retângulo sólido**
  (barra preta/cinza) por cima do dado; borrão fraco pode ser revertido/lido.
- Alvos a cobrir: **título/cabeçalho** (nome do cliente/empresa e logo), **KPIs e
  valores** (faturamento, metas, %), **nomes de pessoas/unidades** em tabelas,
  **filtros/segmentações** com valores reais, **rodapé** (data, usuário, caminho).
- **Achate a imagem**: exporte como PNG/JPG novo (screenshot da imagem editada) —
  não mande PSD/camadas nem PDF com objetos por baixo do retângulo.
- **Limpe metadados EXIF** (autor, GPS, software) ao reexportar.
- Substitua logos do cliente por um placeholder genérico ("Logo Exemplo").

> Regra prática: se você mandaria esse print num grupo público de LinkedIn sem
> pensar, está limpo. Se hesitou, cubra mais.

## Modelo de estudo de caso (README.md do projeto)

Copie e preencha. Mantenha tudo genérico e o aviso de demonstração.

```markdown
# Painel de [Assunto] — Estudo de caso (Power BI)

> ⚠️ Estudo de caso de demonstração — dados, nomes e valores 100% fictícios.
> O arquivo `.pbix` original não é publicado por conter dados e conexões reais.

## Problema
A área precisava [dor concreta: acompanhar X manualmente em planilhas, sem
visão consolidada, com fechamento demorado e propenso a erro]. O objetivo era
[centralizar / automatizar / dar visão gerencial de ...].

## Solução
Construí um painel no Power BI que [o que entrega: consolida fontes A e B,
atualiza automaticamente, mostra KPI 1, KPI 2 e detalhamento por dimensão].
- **Fontes de dados**: [genérico — ex.: banco relacional, API REST, planilhas].
- **ETL / transformação**: Power Query (limpeza, tipagem, merge, colunas
  calculadas).
- **Modelagem**: modelo estrela com tabela fato + dimensões.
- **Métricas**: medidas em DAX (ver "Modelo de dados").
- **Atualização**: [agendada via gateway / manual].

## Resultado / impacto
[Quantifique de forma genérica: reduziu o tempo de fechamento de dias para
horas; eliminou reconciliação manual; deu visão diária que não existia.]
Sem números reais do cliente — descreva o ganho, não o dado sigiloso.

## Modelo de dados (genérico)
### Tabelas
- **fato_movimentos** (grão: 1 linha por lançamento/dia)
  colunas: data, id_unidade, id_categoria, valor, quantidade
- **dim_calendario**: data, ano, mês, trimestre, dia_semana
- **dim_unidade**: id_unidade, nome_unidade (ex.: Unidade Norte/Sul), região
- **dim_categoria**: id_categoria, categoria, subcategoria

### Relacionamentos
- fato_movimentos[data] → dim_calendario[data] (N:1)
- fato_movimentos[id_unidade] → dim_unidade[id_unidade] (N:1)
- fato_movimentos[id_categoria] → dim_categoria[id_categoria] (N:1)

### Principais medidas (DAX) — descritas
- **Total do Período** = SUM(fato_movimentos[valor])
- **Total Ano Anterior** = CALCULATE([Total do Período],
    SAMEPERIODLASTYEAR(dim_calendario[data]))
- **Variação % YoY** = DIVIDE([Total do Período] - [Total Ano Anterior],
    [Total Ano Anterior])
- **Média Móvel 3M** = média de [Total do Período] nas 3 últimas competências.

## Prints
![Visão geral](imagens/visao-geral.png)
![Detalhe por dimensão](imagens/detalhe.png)

## Tecnologias
Power BI (Power Query / M, DAX, modelagem estrela), [fonte de dados genérica].
```

## Checklist antes de publicar (dados/BI)

- [ ] O binário (`.pbix`/`.pbit`/`.msapp`/`.xlsx`/`.xlsm`/`.qvf`/`.bak`) **NÃO**
      está na pasta e está no `.gitignore`.
- [ ] Nenhum export bruto real (`.csv`/`.json` com registros reais) foi incluído.
- [ ] README é um estudo de caso genérico, com o aviso de demonstração.
- [ ] Modelo de dados descrito com **tabelas/colunas/medidas genéricas** — sem
      nomes reais de tabelas do ERP, sem connection string, sem servidor/gateway.
- [ ] Trechos de DAX/M/SQL não citam endpoints, caminhos de rede, tokens nem
      nomes reais; dados de exemplo são fictícios.
- [ ] **Prints anonimizados**: título/logo, KPIs, nomes de pessoas/unidades,
      filtros e rodapé cobertos com **retângulo sólido** (não blur), imagem
      achatada e sem EXIF.
- [ ] Nenhum caminho `C:\Users\...\OneDrive - <Cliente>\...` aparece em texto
      ou imagem.
- [ ] `scrub.py` rodou na pasta e o resultado foi `LIMPO`.

## Lembretes específicos

- **Power Apps (`.msapp`)**: é um zip com o app + fontes; guarda nomes de listas
  SharePoint, IDs de conexão e fórmulas com URLs. Trate exatamente como o `.pbix`
  — estudo de caso, nunca o arquivo.
- **Planilhas (`.xlsx`)**: antes de considerar qualquer print, cheque **abas
  ocultas**, **conexões de dados** (Dados → Consultas e Conexões), **nomes
  definidos** e **VBA**. O mais seguro continua sendo recriar com dados fake.
- **Se precisar mesmo mostrar interatividade**, recrie uma versão mínima com dados
  fictícios (ex.: um HTML/planilha demo) — não republique o arquivo do cliente.
- Achou um termo sensível novo (nome de cliente, banco, ERP, unidade) num print
  ou numa consulta M? Generalize e sugira adicioná-lo ao `blocklist.txt`.
