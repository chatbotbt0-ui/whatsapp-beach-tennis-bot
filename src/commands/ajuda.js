function handleAjuda() {
  return [
    '*Comandos disponiveis:*',
    '',
    '*status* - resumo do mes atual (alunos, recebido, pendente, devedores)',
    '*status <mes>* - resumo de um mes especifico (ex: status 04)',
    '*status <nome>* - situacao de um aluno especifico',
    '*pago <nome>* - marca aluno como pago',
    '*devendo <nome>* - marca aluno como devendo',
    '*lembrar* - lista devedores com link de WhatsApp para cobrar',
    '*adicionar* - registra um novo aluno na planilha',
    '*ativo* - ativa ou desativa um aluno',
    '*ajuda* - mostra esta mensagem',
  ].join('\n');
}

module.exports = handleAjuda;
