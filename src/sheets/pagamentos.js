const dayjs = require('dayjs');
const { getRows, updateRow } = require('./client');

const RANGE = 'Pagamentos!A2:F';
const SHEET = 'Pagamentos';

function parsePagamento(row, index) {
  const [idAluno, mesReferencia, status, dataPagamento, valorPago, ultimoLembrete] = row;
  return {
    rowIndex: index + 2,
    idAluno: Number(idAluno),
    mesReferencia: String(mesReferencia || '').trim(),
    status: String(status || '').trim(),
    dataPagamento: dataPagamento || '',
    valorPago: Number(String(valorPago || '0').replace(',', '.')),
    ultimoLembrete: ultimoLembrete || '',
  };
}

async function listPagamentos(sheetsId = null) {
  const rows = await getRows(RANGE, sheetsId);
  return rows.filter((r) => r[0]).map(parsePagamento);
}

function mesAtual() {
  return dayjs().format('MM-YYYY');
}

async function getPagamentosDoMes(mes = mesAtual(), sheetsId = null) {
  const todos = await listPagamentos(sheetsId);
  return todos.filter((p) => p.mesReferencia === mes);
}

async function getHistoricoAluno(idAluno, meses = 3, sheetsId = null) {
  const todos = await listPagamentos(sheetsId);
  return todos
    .filter((p) => p.idAluno === idAluno)
    .sort((a, b) => {
      const [ma, ya] = a.mesReferencia.split('-').map(Number);
      const [mb, yb] = b.mesReferencia.split('-').map(Number);
      return yb - ya || mb - ma;
    })
    .slice(0, meses);
}

async function marcarUltimoLembrete(rowIndex, dataIso, sheetsId = null) {
  await updateRow(`${SHEET}!F${rowIndex}`, [dataIso], sheetsId);
}

module.exports = {
  listPagamentos,
  getPagamentosDoMes,
  getHistoricoAluno,
  marcarUltimoLembrete,
  mesAtual,
};
