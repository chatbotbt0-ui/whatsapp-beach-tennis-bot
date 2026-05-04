const config = require('../config');
const handleStatus = require('./status');
const handleStatusAluno = require('./statusAluno');
const handleLembrar = require('./lembrar');
const handleAjuda = require('./ajuda');
const { handleAdicionar, isAdicionarFlow } = require('./adicionar');
const { handleAtivo, isAtivoFlow } = require('./ativo');
const handleMarcarPagamento = require('./marcarPagamento');
const { getState } = require('../session/state');

function normalize(text) {
  return text.trim().replace(/^\//, '').toLowerCase();
}

async function route(rawText, userId = null) {
  const text = normalize(rawText);

  // Obtém o sheetsId baseado no número do usuário
  const sheetsId = userId ? config.getSheetsId(userId) : null;

  // Se o usuário está em um fluxo de adicionar, continua nesse fluxo
  if (userId && isAdicionarFlow(getState(userId))) {
    return handleAdicionar(userId, rawText, sheetsId);
  }

  // Se o usuário está em um fluxo de ativo, continua nesse fluxo
  if (userId && isAtivoFlow(getState(userId))) {
    return handleAtivo(userId, rawText, sheetsId);
  }

  // Comandos normais
  if (text === 'status' || text === 'resumo') {
    return handleStatus(sheetsId);
  }

  if (text.startsWith('status ')) {
    const parametro = rawText.trim().replace(/^\/?status\s+/i, '');

    // Verifica se é um número (mês)
    const mesNum = parseInt(parametro);
    if (!isNaN(mesNum) && mesNum >= 1 && mesNum <= 12) {
      return handleStatus(sheetsId, parametro);
    }

    // Caso contrário, é o nome de um aluno
    return handleStatusAluno(parametro, sheetsId);
  }

  if (text === 'lembrar' || text === 'lembrar todos') {
    return handleLembrar(sheetsId);
  }

  if (text === 'adicionar') {
    if (!userId) {
      return '❌ Erro: usuário não identificado';
    }
    return handleAdicionar(userId, rawText, sheetsId);
  }

  if (text === 'ativo' || text.startsWith('ativo ')) {
    if (!userId) {
      return '❌ Erro: usuário não identificado';
    }
    const nome = text.startsWith('ativo ') ? rawText.trim().replace(/^ativo\s+/i, '') : '';
    return handleAtivo(userId, nome || rawText, sheetsId);
  }

  if (text.startsWith('pago ') || text.startsWith('devendo ')) {
    const [cmd, ...nomePartes] = text.split(/\s+/);
    const nome = nomePartes.join(' ');
    return handleMarcarPagamento(nome, cmd, sheetsId);
  }

  if (text === 'ajuda' || text === 'help' || text === '?') {
    return handleAjuda();
  }

  return `Comando nao reconhecido. Envie *ajuda* para ver as opcoes.`;
}

module.exports = { route };
