const dayjs = require('dayjs');

const STATUS = {
  PAGO: 'Pago',
  PENDENTE: 'Pendente',
  ATRASADO: 'Atrasado',
  EM_DIA: 'Em dia',
};

function statusAlunoNoMes(aluno, pagamento, hoje = dayjs()) {
  if (pagamento && pagamento.status === STATUS.PAGO) {
    return { status: STATUS.PAGO, diasAtraso: 0 };
  }
  const diaVenc = aluno.diaVencimento;
  const hojeDia = hoje.date();
  if (hojeDia < diaVenc) {
    return { status: STATUS.EM_DIA, diasAtraso: 0 };
  }
  if (hojeDia === diaVenc) {
    return { status: STATUS.PENDENTE, diasAtraso: 0 };
  }
  return { status: STATUS.ATRASADO, diasAtraso: hojeDia - diaVenc };
}

function resumoMensal(alunos, pagamentos, hoje = dayjs()) {
  const pagamentoPorAluno = new Map(pagamentos.map((p) => [p.idAluno, p]));
  let totalRecebido = 0;
  let totalPendente = 0;
  const devedores = [];
  const emDia = [];

  for (const aluno of alunos) {
    const pagamento = pagamentoPorAluno.get(aluno.id);
    const { status, diasAtraso } = statusAlunoNoMes(aluno, pagamento, hoje);

    if (status === STATUS.PAGO) {
      totalRecebido += pagamento.valorPago || aluno.valor;
      emDia.push({ aluno, status });
    } else {
      totalPendente += aluno.valor;
      if (status === STATUS.ATRASADO || status === STATUS.PENDENTE) {
        devedores.push({ aluno, status, diasAtraso });
      } else {
        emDia.push({ aluno, status });
      }
    }
  }

  devedores.sort((a, b) => b.diasAtraso - a.diasAtraso);

  return {
    totalAlunos: alunos.length,
    totalRecebido,
    totalPendente,
    totalEsperado: totalRecebido + totalPendente,
    devedores,
    emDia,
  };
}

module.exports = { STATUS, statusAlunoNoMes, resumoMensal };
