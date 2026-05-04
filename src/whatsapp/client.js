const { Client, LocalAuth } = require('whatsapp-web.js');
const { setQR } = require('./qr-server');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', (qr) => {
  console.log('\n📱 QR CODE GERADO!');
  console.log('   Acesse: https://motivated-stillness.up.railway.app/qr\n');

  setQR(qr);
});

client.on('ready', () => {
  console.log('[✓] WhatsApp conectado e pronto.');
  console.log('[✓] Bot aguardando mensagens...');
});

client.on('auth_failure', (msg) => {
  console.error('[✗] Falha de autenticacao:', msg);
});

client.on('disconnected', (reason) => {
  console.warn('[!] WhatsApp desconectado:', reason);
});

client.on('error', (error) => {
  console.error('[✗] Erro do cliente WhatsApp:', error);
});

module.exports = client;
