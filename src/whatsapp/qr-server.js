const express = require('express');
const QRCode = require('qrcode');

const app = express();
let currentQR = null;
const PORT = process.env.PORT || 3000;

// Armazenar o QR code atual
function setQR(qrString) {
  currentQR = qrString;
  console.log('✓ QR code atualizado e disponível em /qr');
}

// Endpoint raiz - status do servidor
app.get('/', (req, res) => {
  if (currentQR) {
    res.json({ status: 'waiting_for_scan', message: 'QR code disponível em /qr' });
  } else {
    res.json({ status: 'ready', message: 'Bot pronto e conectado ao WhatsApp' });
  }
});

// Endpoint para retornar a imagem QR code
app.get('/qr', async (req, res) => {
  try {
    if (!currentQR) {
      return res.status(404).json({ error: 'QR code não disponível. Aguarde a reinicialização do bot.' });
    }

    // Gerar imagem PNG do QR code
    const imageBuffer = await QRCode.toBuffer(currentQR, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 500,
    });

    res.type('png');
    res.send(imageBuffer);
  } catch (err) {
    console.error('❌ Erro ao gerar QR code:', err);
    res.status(500).json({ error: 'Erro ao gerar QR code' });
  }
});

// Endpoint de status
app.get('/status', (req, res) => {
  if (currentQR) {
    res.json({ status: 'waiting_for_scan', message: 'QR code disponível em /qr' });
  } else {
    res.json({ status: 'ready', message: 'Bot pronto. QR code não mais necessário.' });
  }
});

function startQRServer() {
  app.listen(PORT, () => {
    console.log(`\n✅ Servidor HTTP iniciado na porta ${PORT}`);
    console.log(`📱 QR Code disponível em:`);
    console.log(`   Local: http://localhost:${PORT}/qr`);
    console.log(`   Railway: https://chatbot-production-5216.up.railway.app/qr\n`);
  });
}

module.exports = { setQR, startQRServer };
