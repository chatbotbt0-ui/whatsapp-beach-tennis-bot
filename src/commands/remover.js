const { getState, setState, clearState } = require('../session/state');
const { getAlunoByNome, listAlunos } = require('../sheets/alunos');
const { getRows, updateRow } = require('../sheets/client');

const RANGE = 'Alunos!A2:G';
const SHEET = 'Alunos';

async function handleRemover(userId, mensagem, sheetsId = null) {
  const state = getState(userId);

  // Inicia o fluxo
  if (!state.step) {
    setState(userId, 'confirmar_nome');
    return 'Qual é o nome do aluno que deseja remover?';
  }

  // Passo 1: Nome do aluno
  if (state.step === 'confirmar_nome') {
    const aluno = await getAlunoByNome(mensagem.trim(), sheetsId);

    if (!aluno) {
      return `❌ Aluno "${mensagem.trim()}" não encontrado na planilha.`;
    }

    setState(userId, 'confirmar_remocao', { aluno });
    return `⚠️ Tem certeza que deseja remover ${aluno.nome}?\n\nDigite *sim* para confirmar ou *não* para cancelar.`;
  }

  // Passo 2: Confirmação
  if (state.step === 'confirmar_remocao') {
    const resposta = mensagem.trim().toLowerCase();

    if (resposta === 'não' || resposta === 'nao') {
      clearState(userId);
      return `❌ Remoção cancelada.`;
    }

    if (resposta !== 'sim') {
      return `⚠️ Resposta inválida. Digite *sim* para confirmar ou *não* para cancelar.`;
    }

    // Remove o aluno (marca como inativo)
    try {
      const aluno = state.data.aluno;

      // Busca todas as linhas para encontrar o índice correto
      const rows = await getRows(RANGE, sheetsId);
      let rowIndex = null;

      for (let i = 0; i < rows.length; i++) {
        if (Number(rows[i][0]) === aluno.id) {
          rowIndex = i + 2; // +1 por causa do header, +1 porque começa em linha 2
          break;
        }
      }

      if (!rowIndex) {
        clearState(userId);
        return `❌ Erro: aluno não encontrado na planilha.`;
      }

      // Marca como inativo na coluna G (ativo) - índice 6 (coluna G)
      const range = `${SHEET}!G${rowIndex}`;
      await updateRow(range, ['não'], sheetsId);

      clearState(userId);
      return `✅ Aluno ${aluno.nome} foi removido com sucesso!`;
    } catch (err) {
      clearState(userId);
      return `❌ Erro ao remover aluno: ${err.message}`;
    }
  }

  return 'Algo deu errado. Digite "remover" novamente.';
}

function isRemoverFlow(state) {
  return state && state.step && ['confirmar_nome', 'confirmar_remocao'].includes(state.step);
}

module.exports = { handleRemover, isRemoverFlow };
