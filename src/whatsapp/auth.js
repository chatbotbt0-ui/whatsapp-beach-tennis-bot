const config = require('../config');

function isAuthorized(message) {
  if (!message || !message.from) {
    return false;
  }

  // Extrai apenas o número (remove @c.us, @g.us, etc)
  const phoneNumber = message.from.replace(/\D/g, '');

  // Verifica se o número está na lista de autorizados
  const isInAuthorizedList = config.authorizedNumbers.some(num => {
    const normalizedNum = num.replace(/\D/g, '');
    return normalizedNum === phoneNumber;
  });

  // Log para debug
  if (!isInAuthorizedList) {
    console.log(`[AUTH] ❌ Número não autorizado: ${phoneNumber}`);
  }

  return isInAuthorizedList;
}

function professorChatIds() {
  // Retorna lista de IDs de chat para todos os números autorizados
  return config.authorizedNumbers.map((num) => `${num}@c.us`);
}

function professorChatId() {
  // Para compatibilidade com código antigo
  return `${config.authorizedNumber}@c.us`;
}

module.exports = { isAuthorized, professorChatId, professorChatIds };
