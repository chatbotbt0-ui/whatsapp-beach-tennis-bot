const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', (qr) => {
  console.log('\nEscaneie o QR Code abaixo com o WhatsApp do professor:\n');
  qrcode.generate(qr, { small: true });
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
