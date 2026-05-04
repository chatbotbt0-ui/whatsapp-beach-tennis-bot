const { getRows, appendRow } = require('./client');
const dayjs = require('dayjs');

const RANGE = 'Alunos!A2:G';

function parseAluno(row) {
  const [id, nome, telefone, valor, diaVencimento, dataInicio, ativo] = row;
  return {
    id: Number(id),
    nome: nome || '',
    telefone: String(telefone || '').replace(/\D/g, ''),
    valor: Number(String(valor || '0').replace(',', '.')),
    diaVencimento: Number(diaVencimento),
    dataInicio: dataInicio || '',
    ativo: String(ativo || '').trim().toLowerCase() === 'sim',
  };
}

async function listAlunos({ apenasAtivos = true, sheetsId = null } = {}) {
  const rows = await getRows(RANGE, sheetsId);
  const alunos = rows
    .filter((r) => r[0])
    .map(parseAluno);
  return apenasAtivos ? alunos.filter((a) => a.ativo) : alunos;
}

async function getAlunoByNome(nome, sheetsId = null) {
  const alunos = await listAlunos({ apenasAtivos: false, sheetsId });
  const alvo = nome.trim().toLowerCase();
  return (
    alunos.find((a) => a.nome.toLowerCase() === alvo) ||
    alunos.find((a) => a.nome.toLowerCase().startsWith(alvo)) ||
    alunos.find((a) => a.nome.toLowerCase().includes(alvo)) ||
    null
  );
}

async function addAluno({ nome, valor, diaVencimento, telefone = '', sheetsId = null }) {
  if (!nome || !valor || !diaVencimento) {
    throw new Error('Nome, valor e diaVencimento são obrigatórios');
  }

  const alunos = await listAlunos({ apenasAtivos: false, sheetsId });
  const novoId = Math.max(...alunos.map((a) => a.id), 0) + 1;
  const dataInicio = dayjs().format('DD/MM/YYYY');

  const novaLinha = [
    novoId,
    nome,
    telefone || '', // telefone
    valor,
    diaVencimento,
    dataInicio,
    'sim', // ativo
  ];

  await appendRow(RANGE, novaLinha, sheetsId);

  return {
    id: novoId,
    nome,
    telefone: telefone || '',
    valor,
    diaVencimento,
    dataInicio,
    ativo: true,
  };
}

module.exports = { listAlunos, getAlunoByNome, addAluno };
