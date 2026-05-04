const client = require('./whatsapp/client');
const config = require('./config');
const { isAuthorized } = require('./whatsapp/auth');
const { route } = require('./commands');
const { agendar } = require('./scheduler/reminders');

let messageCounter = 0;

console.log(`\n═══════════════════════════════════`);
console.log(`BOT ESPERANDO MENSAGENS DOS NÚMEROS:`);
console.log(`${config.authorizedNumbers.join(', ')}`);
console.log(`═══════════════════════════════════\n`);

// Debug: Monitor ALL events
const events = ['message', 'message_create', 'message_edit', 'message_revoke_everyone', 'message_revoke_me', 'group_join', 'group_leave', 'group_update', 'change_number'];
events.forEach(ev => {
  client.on(ev, () => console.log(`[EVENT] ${ev} disparado`));
});

client.on('message', async (message) => {
  // Log TUDO que vem
  console.log(`\n[RAW] Tipo: ${message.type} | De: ${message.from} | Corpo: "${message.body}"`);

  // Ignora notificações de criptografia (e2e_notification, notification_template)
  if (message.type.includes('notification') && !message.body) {
    return;
  }

  messageCounter++;
  const from = (message.from || '').replace(/\D/g, '');
  const expected = config.authorizedNumber.replace(/\D/g, '');

  console.log(`\n[MSG #${messageCounter}] ════════════════════`);
  console.log(`[MSG #${messageCounter}] Tipo: ${message.type}`);
  console.log(`[MSG #${messageCounter}] De (raw): ${message.from}`);
  console.log(`[MSG #${messageCounter}] De (números): ${from}`);
  console.log(`[MSG #${messageCounter}] Esperado: ${expected}`);
  console.log(`[MSG #${messageCounter}] Corpo: "${message.body}"`);
  console.log(`[MSG #${messageCounter}] fromMe: ${message.fromMe}`);

  // Processa mensagens de texto
  if (message.type !== 'chat') {
    console.log(`[MSG #${messageCounter}] ❌ Tipo incorreto: ${message.type}`);
    return;
  }

  if (!message.body) {
    console.log(`[MSG #${messageCounter}] ❌ Sem corpo`);
    return;
  }

  if (!isAuthorized(message)) {
    console.log(`[MSG #${messageCounter}] ❌ NÃO AUTORIZADO`);
    return;
  }

  console.log(`[MSG #${messageCounter}] ✓ Processando: "${message.body}"`);
  try {
    // Extrai o número do telefone de message.from (ex: 5582996198965@c.us → 5582996198965)
    let phoneNumber = (message.from || '').match(/^(\d+)/)?.[1];

    // Se não conseguir extrair número ou ele não está na lista autorizada,
    // usa o primeiro número autorizado como padrão
    if (!phoneNumber || !config.authorizedNumbers.includes(phoneNumber)) {
      phoneNumber = config.authorizedNumbers[0];
    }

    const resposta = await route(message.body, phoneNumber);
    await message.reply(resposta);
    console.log(`[MSG #${messageCounter}] ✓ Resposta enviada`);
  } catch (err) {
    console.error(`[MSG #${messageCounter}] ❌ Erro:`, err.message);
  }
});

client.on('ready', () => {
  console.log('\n✓✓✓ WhatsApp Pronto ✓✓✓');
  console.log('Agendando lembretes...\n');
  agendar(client);
});

console.log('Inicializando...');
client.initialize();

process.on('SIGINT', async () => {
  console.log('\nEncerrando bot...');
  await client.destroy();
  process.exit(0);
});
