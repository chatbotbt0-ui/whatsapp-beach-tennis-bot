const { getState, setState, clearState } = require('../session/state');
const { getAlunoByNome } = require('../sheets/alunos');
const { getRows, updateRow } = require('../sheets/client');

const RANGE = 'Alunos!A2:G';
const SHEET = 'Alunos';

async function handleAtivo(userId, mensagem, sheetsId = null) {
  const state = getState(userId);

  // Inicia o fluxo
  if (!state.step) {
    setState(userId, 'buscar_nome');
    return 'Qual é o nome do aluno?';
  }

  // Passo 1: Nome do aluno
  if (state.step === 'buscar_nome') {
    const aluno = await getAlunoByNome(mensagem.trim(), sheetsId);

    if (!aluno) {
      return `❌ Aluno "${mensagem.trim()}" não encontrado na planilha.`;
    }

    setState(userId, 'escolher_ativo', { aluno });
    const statusAtual = aluno.ativo ? 'ativo' : 'inativo';
    return `${aluno.nome} está ${statusAtual}.\n\nDeseja ativar ou desativar?\nDigite *ativar* ou *desativar*`;
  }

  // Passo 2: Escolher ativar ou desativar
  if (state.step === 'escolher_ativo') {
    const resposta = mensagem.trim().toLowerCase();

    if (!['ativar', 'desativar'].includes(resposta)) {
      return `⚠️ Resposta inválida. Digite *ativar* ou *desativar*`;
    }

    // Atualiza o aluno
    try {
      const aluno = state.data.aluno;
      const novoStatus = resposta === 'ativar' ? 'sim' : 'não';

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

      // Atualiza a coluna G (ativo)
      const range = `${SHEET}!G${rowIndex}`;
      await updateRow(range, [novoStatus], sheetsId);

      clearState(userId);
      const acao = novoStatus === 'sim' ? 'ativado' : 'desativado';
      return `✅ Aluno ${aluno.nome} foi ${acao} com sucesso!`;
    } catch (err) {
      clearState(userId);
      return `❌ Erro ao atualizar: ${err.message}`;
    }
  }

  return 'Algo deu errado. Digite "ativo" novamente.';
}

function isAtivoFlow(state) {
  return state && state.step && ['buscar_nome', 'escolher_ativo'].includes(state.step);
}

module.exports = { handleAtivo, isAtivoFlow };
