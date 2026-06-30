// ============================================================
// GERADOR DE RESPOSTAS FICTÍCIAS — Pesquisa de Clima (DEMO)
// Cria respostas aleatórias plausíveis para o painel de resultados.
// Nenhum dado real é usado.
// ============================================================

function gerarRespostasFicticias(qtd = 60) {
  const opcoes = OPCOES.map(o => o.value);
  // pesos para a escala parecer mais realista (tende ao centro/positivo)
  const pesos = [1, 2, 4, 5, 3];

  function escolhaPonderada() {
    const total = pesos.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < opcoes.length; i++) {
      r -= pesos[i];
      if (r <= 0) return opcoes[i];
    }
    return opcoes[opcoes.length - 1];
  }

  const registros = [];
  const agora = Date.now();

  for (let n = 0; n < qtd; n++) {
    const unidade = UNIDADES[Math.floor(Math.random() * UNIDADES.length)];
    const setoresUnidade = SETORES[unidade];
    const setor = setoresUnidade[Math.floor(Math.random() * setoresUnidade.length)];

    // datas espalhadas nos últimos 30 dias
    const offset = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
    const reg = {
      id: n + 1,
      created_at: new Date(agora - offset).toISOString(),
      unidade,
      setor
    };
    for (let i = 1; i <= PERGUNTAS.length; i++) {
      reg['q' + i] = escolhaPonderada();
    }
    registros.push(reg);
  }

  // ordena do mais recente para o mais antigo
  registros.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return registros;
}

// Combina respostas geradas + respostas enviadas pelo formulário demo
function carregarDadosDemo() {
  const enviadas = JSON.parse(localStorage.getItem('respostas_clima_demo') || '[]');
  const base = gerarRespostasFicticias(60);
  const todas = [...enviadas, ...base];
  todas.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return todas;
}
