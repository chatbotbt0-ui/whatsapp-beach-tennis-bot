const config = require('../config');
const { getLidForNumber, getPhoneNumberFromLid } = require('./discover-lids');

function isAuthorized(message) {
  if (!message || !message.from) {
    return false;
  }

  const jid = message.from;

  // Primeiro, tenta comparar com números diretos (formato @c.us)
  const phoneNumber = jid.replace(/\D/g, '');
  const isPhoneAuthorized = config.authorizedNumbers.some(num => {
    const normalizedNum = num.replace(/\D/g, '');
    return normalizedNum === phoneNumber;
  });

  if (isPhoneAuthorized) {
    return true;
  }

  // Se não for número direto, tenta comparar com LIDs salvos
  for (const authorizedNumber of config.authorizedNumbers) {
    const authorizedLid = getLidForNumber(authorizedNumber);
    if (authorizedLid && authorizedLid === jid) {
      return true;
    }
  }

  // Log para debug
  console.log(`[AUTH] ❌ JID não autorizado: ${jid}`);
  return false;
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
