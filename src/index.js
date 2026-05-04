const client = require('./whatsapp/client');
const config = require('./config');
const { isAuthorized } = require('./whatsapp/auth');
const { route } = require('./commands');
const { agendar } = require('./scheduler/reminders');
const { startQRServer } = require('./whatsapp/qr-server');
const { discoverLids, getPhoneNumberFromLid } = require('./whatsapp/discover-lids');

let messageCounter = 0;

console.log(`\n═══════════════════════════════════`);
console.log(`BOT ESPERANDO MENSAGENS DOS NÚMEROS:`);
console.log(`${config.authorizedNumbers.join(', ')}`);
console.log(`═══════════════════════════════════\n`);

// Iniciar servidor HTTP para QR code ANTES do cliente WhatsApp
console.log('🚀 Iniciando servidor HTTP para QR code...');
startQRServer();

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
    // Primeiro tenta encontrar o número através dos LIDs descobertos
    let phoneNumber = null;

    // Se for um @lid, procura nos LIDs salvos
    if (message.from && message.from.includes('@lid')) {
      phoneNumber = getPhoneNumberFromLid(message.from);
      console.log(`[MSG #${messageCounter}] 🔍 LID ${message.from} → ${phoneNumber || 'não encontrado'}`);
    }

    // Se ainda não encontrou, tenta extrair como número direto
    if (!phoneNumber) {
      const extracted = (message.from || '').match(/^(\d+)/)?.[1];
      // Valida se é um número de telefone real (começa com 55 = Brasil, 10+ dígitos)
      if (extracted && extracted.length >= 10 && /^55\d{9,11}$/.test(extracted)) {
        phoneNumber = extracted;
      }
    }

    // Se ainda não conseguiu identificar, usa o primeiro número autorizado como fallback
    if (!phoneNumber || !config.authorizedNumbers.includes(phoneNumber)) {
      console.log(`[MSG #${messageCounter}] ⚠️  Número não identificado, usando padrão: ${config.authorizedNumbers[0]}`);
      phoneNumber = config.authorizedNumbers[0];
    }

    console.log(`[MSG #${messageCounter}] 🔄 Aguardando resposta...`);
    const startTime = Date.now();

    // Timeout de 30 segundos para a resposta
    const resposta = await Promise.race([
      route(message.body, phoneNumber),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout ao processar comando (30s)')), 30000)
      )
    ]);

    const duration = Date.now() - startTime;
    await message.reply(resposta);
    console.log(`[MSG #${messageCounter}] ✓ Resposta enviada (${duration}ms)`);
  } catch (err) {
    console.error(`[MSG #${messageCounter}] ❌ Erro:`, err.message);
    try {
      await message.reply(`❌ Erro ao processar comando: ${err.message}`);
    } catch (replyErr) {
      console.error(`[MSG #${messageCounter}] ❌ Erro ao enviar mensagem de erro:`, replyErr.message);
    }
  }
});

client.on('ready', async () => {
  console.log('\n✓✓✓ WhatsApp Pronto ✓✓✓');

  // Descobrir LIDs dos números autorizados
  await discoverLids(client);

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
