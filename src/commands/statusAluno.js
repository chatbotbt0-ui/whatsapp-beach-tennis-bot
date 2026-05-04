const dayjs = require('dayjs');
const { getAlunoByNome } = require('../sheets/alunos');
const { getHistoricoAluno, getPagamentosDoMes } = require('../sheets/pagamentos');
const { statusAlunoNoMes } = require('../domain/status');
const { brl, emojiStatus } = require('./format');

async function handleStatusAluno(nome, sheetsId = null) {
  if (!nome || !nome.trim()) {
    return 'Use: *status <nome do aluno>*';
  }

  const aluno = await getAlunoByNome(nome, sheetsId);
  if (!aluno) {
    return `Aluno "${nome}" nao encontrado na planilha.`;
  }

  const [pagamentosMes, historico] = await Promise.all([
    getPagamentosDoMes(undefined, sheetsId),
    getHistoricoAluno(aluno.id, 3, sheetsId),
  ]);
  const pagamentoMes = pagamentosMes.find((p) => p.idAluno === aluno.id);
  const { status, diasAtraso } = statusAlunoNoMes(aluno, pagamentoMes, dayjs());

  const linhas = [
    `*${aluno.nome}*`,
    `Mensalidade: ${brl(aluno.valor)}`,
    `Vencimento: dia ${aluno.diaVencimento}`,
    `Status atual: ${emojiStatus(status)}${diasAtraso > 0 ? ` (${diasAtraso}d)` : ''}`,
    `Ativo: ${aluno.ativo ? 'sim' : 'nao'}`,
  ];

  return linhas.join('\n');
}

module.exports = handleStatusAluno;
