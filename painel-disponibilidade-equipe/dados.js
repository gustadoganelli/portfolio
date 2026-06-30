/* ================================================================
   DADOS DE EXEMPLO (MOCK) — 100% ficticios
   ----------------------------------------------------------------
   Em producao, estes dados viriam de um webhook que agrega os
   calendarios da equipe. Aqui sao gerados localmente para que a
   demo funcione sem nenhum backend, chave ou conta real.
================================================================ */

/* Equipe ficticia: pessoas + salas, agrupadas por categoria. */
const USUARIOS = [
  // -- Diretoria -------------------------------------------------
  { id: "ana.souza@exemplo.dev",     nome: "Ana Souza",       tipo: "pessoa", categoria: "Diretoria" },
  { id: "rafael.lima@exemplo.dev",   nome: "Rafael Lima",     tipo: "pessoa", categoria: "Diretoria" },
  { id: "mariana.dias@exemplo.dev",  nome: "Mariana Dias",    tipo: "pessoa", categoria: "Diretoria" },
  // -- Gerencia --------------------------------------------------
  { id: "diego.alves@exemplo.dev",   nome: "Diego Alves",     tipo: "pessoa", categoria: "Gerencia" },
  { id: "elisa.rocha@exemplo.dev",   nome: "Elisa Rocha",     tipo: "pessoa", categoria: "Gerencia" },
  { id: "fabio.melo@exemplo.dev",    nome: "Fabio Melo",      tipo: "pessoa", categoria: "Gerencia" },
  { id: "gisele.nunes@exemplo.dev",  nome: "Gisele Nunes",    tipo: "pessoa", categoria: "Gerencia" },
  // -- Equipe Operacional ---------------------------------------
  { id: "heitor.pinto@exemplo.dev",  nome: "Heitor Pinto",    tipo: "pessoa", categoria: "Equipe Operacional" },
  { id: "iris.gomes@exemplo.dev",    nome: "Iris Gomes",      tipo: "pessoa", categoria: "Equipe Operacional" },
  { id: "joao.costa@exemplo.dev",    nome: "Joao Costa",      tipo: "pessoa", categoria: "Equipe Operacional" },
  { id: "patricia.farias@exemplo.dev", nome: "Patricia Farias", tipo: "pessoa", categoria: "Equipe Operacional" },
  { id: "lucas.barros@exemplo.dev",  nome: "Lucas Barros",    tipo: "pessoa", categoria: "Equipe Operacional" },
  { id: "marina.teixeira@exemplo.dev", nome: "Marina Teixeira", tipo: "pessoa", categoria: "Equipe Operacional" },
  // -- Salas -----------------------------------------------------
  { id: "sala-1@exemplo.dev",        nome: "Sala 1",          tipo: "sala",   categoria: "Salas" },
  { id: "sala-2@exemplo.dev",        nome: "Sala 2",          tipo: "sala",   categoria: "Salas" },
  { id: "sala-3@exemplo.dev",        nome: "Auditorio",       tipo: "sala",   categoria: "Salas" },
];

/* Ordem em que as categorias aparecem no painel. */
const ORDEM_CATEGORIAS = ["Diretoria", "Gerencia", "Equipe Operacional", "Salas"];

/* Textos de exemplo para reunioes. */
const SUBJECTS = [
  "Reuniao de Diretoria", "Alinhamento Semanal", "Daily Standup",
  "Review de Projetos", "Call com Parceiros", "Planejamento Trimestral",
  "1:1 com Gestor", "Workshop de Produto", "Treinamento Interno",
  "Retrospectiva", "Apresentacao de Resultados", "Sync Estrategico"
];
const LOCAIS = ["Sala 1", "Sala 2", "Auditorio", "Online (videochamada)", "Online (videochamada)"];
const PROXIMAS = ["Review de Sprint", "Planejamento Semanal", "Sync de Equipe", "Treinamento Interno", "Alinhamento Estrategico"];
const HORARIOS_FIM  = ["10:00", "11:30", "13:00", "14:30", "15:30", "16:00", "17:00", "18:00"];
const HORARIOS_PROX = ["10:30", "11:00", "14:00", "15:00", "16:30", "17:30"];

/* ----------------------------------------------------------------
   1) STATUS ATUAL (aba Disponibilidade)
   Gera, de forma deterministica, o status de cada usuario.
---------------------------------------------------------------- */
function gerarStatusAtual() {
  const ciclo = ["Em Reuniao", "Disponivel", "Disponivel", "Disponivel", "Ausente", "Disponivel", "Em Reuniao", "Disponivel"];
  return USUARIOS.map((u, i) => {
    const status = ciclo[i % ciclo.length];
    return {
      id: u.id,
      nome: u.nome,
      statusAtual: status,
      reuniaoAtual: status === "Em Reuniao" ? {
        subject: SUBJECTS[i % SUBJECTS.length],
        local:   LOCAIS[i % LOCAIS.length],
        fim:     HORARIOS_FIM[i % HORARIOS_FIM.length]
      } : null,
      proximaReuniao: (i % 4 !== 0) ? {
        horario: HORARIOS_PROX[i % HORARIOS_PROX.length],
        subject: PROXIMAS[i % PROXIMAS.length]
      } : null
    };
  });
}

/* ----------------------------------------------------------------
   2) EVENTOS DE UM MES (modal do calendario)
   Retorna um objeto { dia: [eventos] } para o usuario/mes pedido.
---------------------------------------------------------------- */
function gerarEventosMes(userId, ano, mes) {
  const idx = Math.max(0, USUARIOS.findIndex(u => u.id === userId));
  const resultado = {};
  const nDias = new Date(ano, mes + 1, 0).getDate();
  const slots = [[8,30],[9,0],[10,30],[11,0],[14,0],[15,30],[16,0],[17,0]];

  for (let d = 1; d <= nDias; d++) {
    const dow = new Date(ano, mes, d).getDay();
    if (dow === 0 || dow === 6) continue;            // pula fim de semana
    const seed = (idx * 37 + d * 13 + mes * 7) % 100;
    if (seed <= 40) continue;                         // alguns dias sem eventos

    const n = 1 + (seed % 3);
    const evs = [];
    for (let k = 0; k < n; k++) {
      const [bh, bm] = slots[(seed + k * 3) % slots.length];
      const dur = [30, 60, 90, 60][(seed + k) % 4];
      const fMin = bh * 60 + bm + dur;
      evs.push({
        inicio:  pad(bh) + ":" + pad(bm),
        fim:     pad(Math.floor(fMin / 60)) + ":" + pad(fMin % 60),
        subject: SUBJECTS[(seed + k * 5 + idx) % SUBJECTS.length],
        local:   LOCAIS[(seed + k) % LOCAIS.length]
      });
    }
    evs.sort((a, b) => a.inicio.localeCompare(b.inicio));
    resultado[d] = evs;
  }
  return resultado;
}

/* ----------------------------------------------------------------
   3) AGENDA DE UM DIA (aba Agenda do Dia)
   Retorna { dayLabel, eventos:[{nome, hora, fim, subject, local, isExternal}] }
---------------------------------------------------------------- */
function gerarAgendaDia(dataISO) {
  const d = new Date(dataISO + "T12:00:00");
  const dayLabel = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
                    .replace(/^\w/, c => c.toUpperCase());

  const eventos = [];
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return { dayLabel, eventos };   // fim de semana vazio

  const base = parseInt(dataISO.replace(/-/g, ""), 10);
  USUARIOS.filter(u => u.tipo === "pessoa").forEach((u, i) => {
    const seed = (base + i * 17) % 100;
    if (seed <= 35) return;                                   // nem todos tem reuniao
    const n = 1 + (seed % 2);
    const horas = ["08", "09", "10", "11", "14", "15", "16", "17"];
    for (let k = 0; k < n; k++) {
      const hora = horas[(seed + k * 3) % horas.length];
      const fimH = pad((parseInt(hora) + 1) % 24);
      eventos.push({
        nome:       u.nome,
        hora:       hora,
        fim:        fimH + ":00",
        subject:    SUBJECTS[(seed + k * 5 + i) % SUBJECTS.length],
        local:      LOCAIS[(seed + k) % LOCAIS.length],
        isExternal: ((seed + k) % 3 === 0)
      });
    }
  });

  eventos.sort((a, b) => a.hora.localeCompare(b.hora));
  return { dayLabel, eventos };
}

/* util */
function pad(n) { return String(n).padStart(2, "0"); }
