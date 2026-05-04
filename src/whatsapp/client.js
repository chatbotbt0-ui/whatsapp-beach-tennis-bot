const { Client, LocalAuth } = require('whatsapp-web.js');
const { setQR, startQRServer } = require('./qr-server');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

let qrServerStarted = false;

client.on('qr', (qr) => {
  console.log('\n📱 QR CODE GERADO!');
  console.log('   Acesse: http://localhost:3000/qr');
  console.log('   (Em Railway: veja a URL abaixo)\n');

  setQR(qr);

  // Iniciar servidor na primeira vez
  if (!qrServerStarted) {
    qrServerStarted = true;
    startQRServer();
  }
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
