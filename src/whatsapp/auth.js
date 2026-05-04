const config = require('../config');

function isAuthorized(message) {
  // Aceita mensagens de chats diretos (não grupos)
  // Grupos terminam em @g.us, chats diretos em @c.us ou @lid
  if (message.from && (message.from.includes('@c.us') || message.from.includes('@lid'))) {
    return true;
  }
  // Se for privado (não é grupo), aceita
  if (message.from && !message.from.includes('-') && !message.from.includes('@g.us')) {
    return true;
  }
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
