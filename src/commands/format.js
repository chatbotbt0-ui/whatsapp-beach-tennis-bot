function brl(valor) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function emojiStatus(status) {
  switch (status) {
    case 'Pago':
      return 'EM DIA';
    case 'Atrasado':
      return 'ATRASADO';
    case 'Pendente':
      return 'VENCE HOJE';
    case 'Em dia':
      return 'EM DIA';
    default:
      return status;
  }
}

module.exports = { brl, emojiStatus };
