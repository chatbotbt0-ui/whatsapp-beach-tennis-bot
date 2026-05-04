const dayjs = require('dayjs');
const { getAlunoByNome } = require('../sheets/alunos');
const { getPagamentosDoMes, mesAtual } = require('../sheets/pagamentos');
const { appendRow, updateRow } = require('../sheets/client');

const RANGE = 'Pagamentos!A2:F';
const SHEET = 'Pagamentos';

async function handleMarcarPagamento(nome, status, sheetsId = null) {
  if (!nome || !nome.trim()) {
    return 'Use: *pago <nome do aluno>* ou *devendo <nome do aluno>*';
  }

  // Valida o status
  const statusNormalizado = status.toLowerCase().trim();
  if (!['pago', 'devendo', 'pendente', 'atrasado'].includes(statusNormalizado)) {
    return '❌ Status inválido. Use: *pago* ou *devendo*';
  }

  const statusFinal = statusNormalizado === 'pago' ? 'Pago' : 'Pendente';

  try {
    const aluno = await getAlunoByNome(nome, sheetsId);
    if (!aluno) {
      return `❌ Aluno "${nome}" não encontrado na planilha.`;
    }

    const mes = mesAtual();
    const pagamentos = await getPagamentosDoMes(mes, sheetsId);
    const pagamentoExistente = pagamentos.find((p) => p.idAluno === aluno.id);

    if (pagamentoExistente) {
      // Atualiza o status existente
      const novaData = statusFinal === 'Pago' ? dayjs().format('DD/MM/YYYY') : '';
      await updateRow(
        `${SHEET}!C${pagamentoExistente.rowIndex}`,
        [statusFinal],
        sheetsId
      );
      if (statusFinal === 'Pago') {
        await updateRow(
          `${SHEET}!D${pagamentoExistente.rowIndex}`,
          [novaData],
          sheetsId
        );
      }
    } else {
      // Cria novo registro
      const dataAtual = statusFinal === 'Pago' ? dayjs().format('DD/MM/YYYY') : '';
      const novaLinha = [
        aluno.id,
        mes,
        statusFinal,
        dataAtual,
        statusFinal === 'Pago' ? aluno.valor : '', // valor pago
        '', // último lembrete
      ];
      await appendRow(RANGE, novaLinha, sheetsId);
    }

    const emoji = statusFinal === 'Pago' ? '✅' : '⏳';
    return `${emoji} ${aluno.nome} marcado como ${statusFinal.toLowerCase()} para ${mes}`;
  } catch (err) {
    return `❌ Erro ao atualizar: ${err.message}`;
  }
}

module.exports = handleMarcarPagamento;
