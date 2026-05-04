const dayjs = require('dayjs');
const { listAlunos } = require('../sheets/alunos');
const { getPagamentosDoMes, mesAtual } = require('../sheets/pagamentos');
const { resumoMensal } = require('../domain/status');
const { brl } = require('./format');

async function handleStatus(sheetsId = null, mesBuscado = null) {
  // Se não especificar mês, usa o atual
  let mes = mesBuscado || mesAtual();

  // Valida o formato do mês (MM-YYYY ou apenas MM para ano atual)
  if (mesBuscado && !mesBuscado.includes('-')) {
    // Se for apenas um número (ex: 04), adiciona o ano atual
    const mesNum = parseInt(mesBuscado);
    if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
      return '❌ Mês inválido. Use um número de 01 a 12. Ex: *status 04*';
    }
    mes = `${String(mesNum).padStart(2, '0')}-${dayjs().year()}`;
  }

  const [alunos, pagamentos] = await Promise.all([
    listAlunos({ apenasAtivos: true, sheetsId }),
    getPagamentosDoMes(mes, sheetsId),
  ]);

  const r = resumoMensal(alunos, pagamentos, dayjs());

  const linhas = [
    `*Resumo ${mes}*`,
    ``,
    `Alunos ativos: ${r.totalAlunos}`,
    `Recebido: ${brl(r.totalRecebido)}`,
    `Pendente: ${brl(r.totalPendente)}`,
    `Esperado: ${brl(r.totalEsperado)}`,
    ``,
  ];

  if (r.devedores.length === 0) {
    linhas.push('Nenhum aluno em atraso. Tudo em dia!');
  } else {
    linhas.push(`*Devedores (${r.devedores.length})*`);
    for (const { aluno, status, diasAtraso } of r.devedores) {
      const tag = status === 'Atrasado' ? `${diasAtraso}d atraso` : 'vence hoje';
      linhas.push(`- ${aluno.nome} - ${brl(aluno.valor)} (${tag})`);
    }
  }

  return linhas.join('\n');
}

module.exports = handleStatus;
