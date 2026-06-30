// ============================================================
// CONFIGURAÇÃO COMPARTILHADA — Pesquisa de Clima (DEMO)
// Perguntas, opções de resposta e mapa de setores por unidade.
// Tudo fictício e genérico. Sem dados reais.
// ============================================================

// Opções da escala (mesma ordem em todas as perguntas)
const OPCOES = [
  { value: 'nunca',            label: 'Nunca' },
  { value: 'raramente',        label: 'Raramente' },
  { value: 'as_vezes',         label: 'Às vezes' },
  { value: 'frequentemente',   label: 'Frequentemente' },
  { value: 'sempre',           label: 'Sempre' }
];

// Rótulos amigáveis (para tabelas e gráficos)
const LABEL_MAP = {
  nunca: 'Nunca',
  raramente: 'Raramente',
  as_vezes: 'Às vezes',
  frequentemente: 'Frequentemente',
  sempre: 'Sempre'
};

// Texto completo das perguntas (formulário)
const PERGUNTAS = [
  'Existem momentos em que as atividades demandam maior ritmo, atenção e volume de trabalho?',
  'A dinâmica de trabalho permite realizar as atividades dentro do horário previsto, com pausas adequadas?',
  'A equipe recebe orientações e alinhamentos claros sobre as atividades e mudanças do trabalho?',
  'A convivência no ambiente de trabalho ocorre de forma respeitosa e profissional?',
  'A equipe sente que recebe o suporte necessário para desenvolver suas atividades com segurança?',
  'Existem aspectos da rotina que poderiam ser melhorados para facilitar o dia a dia?',
  'A equipe tem a percepção de que o trabalho realizado é reconhecido de forma justa?',
  'No dia a dia, existe autonomia e espaço adequado para realizar as atividades?',
  'A organização incentiva a boa comunicação e o bem-estar no ambiente de trabalho?',
  'As máquinas, equipamentos e materiais disponíveis atendem às necessidades das atividades?'
];

// Versão curta das perguntas (títulos dos gráficos no painel)
const PERGUNTAS_CURTAS = [
  'Maior ritmo/atenção nas atividades?',
  'Horário previsto com pausas adequadas?',
  'Orientações e alinhamentos claros?',
  'Convivência respeitosa e profissional?',
  'Suporte para atividades com segurança?',
  'Aspectos que poderiam ser melhorados?',
  'Trabalho reconhecido de forma justa?',
  'Autonomia e espaço adequado?',
  'Organização incentiva bem-estar?',
  'Equipamentos atendem às necessidades?'
];

// Mapa de setores por unidade (fictício)
const SETORES = {
  'Unidade Norte': ['Administrativo', 'Atendimento', 'Logística', 'Manutenção', 'Recursos Humanos'],
  'Unidade Sul':   ['Administrativo', 'Comercial', 'Financeiro', 'Operações', 'Recursos Humanos'],
  'Unidade Leste': ['Administrativo', 'Produção', 'Qualidade', 'Suprimentos', 'Recursos Humanos'],
  'Unidade Oeste': ['Administrativo', 'Expedição', 'Manutenção', 'Operações', 'Recursos Humanos'],
  'Matriz':        ['Diretoria', 'Financeiro', 'Marketing', 'Tecnologia', 'Recursos Humanos']
};

// Lista de unidades (para selects e filtros)
const UNIDADES = Object.keys(SETORES);
