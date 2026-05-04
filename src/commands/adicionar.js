const { getState, setState, clearState } = require('../session/state');
const { addAluno } = require('../sheets/alunos');

async function handleAdicionar(userId, mensagem, sheetsId = null) {
  const state = getState(userId);

  // Inicia o fluxo
  if (!state.step) {
    setState(userId, 'nome');
    return 'Qual é o nome do aluno?';
  }

  // Passo 1: Nome
  if (state.step === 'nome') {
    setState(userId, 'mensalidade', { nome: mensagem.trim() });
    return `Ótimo, ${mensagem.trim()}!\n\nQual é a mensalidade? (em R$, ex: 150)`;
  }

  // Passo 2: Mensalidade
  if (state.step === 'mensalidade') {
    const valor = parseFloat(mensagem.trim().replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      return '❌ Valor inválido. Digite um número, ex: 150';
    }
    setState(userId, 'vencimento', { valor });
    return `Perfeito!\n\nQual é o dia de vencimento? (1-28, ex: 10)`;
  }

  // Passo 3: Dia de Vencimento
  if (state.step === 'vencimento') {
    const dia = parseInt(mensagem.trim());
    if (isNaN(dia) || dia < 1 || dia > 28) {
      return '❌ Dia inválido. Digite um número entre 1 e 28';
    }
    setState(userId, 'telefone', { diaVencimento: dia });
    return `Excelente!\n\nQual é o número de WhatsApp do aluno? (formato: 5511999999999)`;
  }

  // Passo 4: Telefone
  if (state.step === 'telefone') {
    const telefone = mensagem.trim().replace(/\D/g, '');
    if (telefone.length < 10) {
      return '❌ Número inválido. Digite um número completo, ex: 5511999999999';
    }

    // Salva na planilha
    try {
      const novoAluno = await addAluno({
        nome: state.data.nome,
        valor: state.data.valor,
        diaVencimento: state.data.diaVencimento,
        telefone: telefone,
        sheetsId,
      });

      clearState(userId);
      return `✅ Aluno adicionado com sucesso!\n\nNome: ${novoAluno.nome}\nMensalidade: R$ ${novoAluno.valor.toFixed(2)}\nVencimento: dia ${novoAluno.diaVencimento}\nWhatsApp: ${novoAluno.telefone}`;
    } catch (err) {
      clearState(userId);
      return `❌ Erro ao adicionar aluno: ${err.message}`;
    }
  }

  return 'Algo deu errado. Digite "adicionar" novamente.';
}

function isAdicionarFlow(state) {
  return state && state.step && ['nome', 'mensalidade', 'vencimento', 'telefone'].includes(state.step);
}

module.exports = { handleAdicionar, isAdicionarFlow };
