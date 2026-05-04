const dayjs = require('dayjs');
const { listAlunos } = require('../sheets/alunos');
const { getPagamentosDoMes } = require('../sheets/pagamentos');
const { resumoMensal } = require('../domain/status');
const { brl } = require('./format');

async function handleLembrar(sheetsId = null) {
  const [alunos, pagamentos] = await Promise.all([
    listAlunos({ apenasAtivos: true, sheetsId }),
    getPagamentosDoMes(undefined, sheetsId),
  ]);

  const r = resumoMensal(alunos, pagamentos, dayjs());

  if (r.devedores.length === 0) {
    return 'Nenhum aluno em atraso ou com vencimento hoje.';
  }

  const linhas = [
    `*Lembrete manual - ${r.devedores.length} aluno(s) precisam pagar:*`,
    ``,
  ];

  let totalAReceber = 0;
  for (const { aluno, status, diasAtraso } of r.devedores) {
    const tag = status === 'Atrasado' ? `${diasAtraso}d atraso` : 'vence hoje';
    linhas.push(`- ${aluno.nome} - ${brl(aluno.valor)} (${tag})`);
    if (aluno.telefone) {
      linhas.push(`  wa.me/${aluno.telefone}`);
    }
    totalAReceber += aluno.valor;
  }

  linhas.push('');
  linhas.push(`Total a receber: ${brl(totalAReceber)}`);

  return linhas.join('\n');
}

module.exports = handleLembrar;
