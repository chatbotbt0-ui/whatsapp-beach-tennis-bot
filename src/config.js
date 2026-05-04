require('dotenv').config();
const fs = require('fs');
const path = require('path');

const required = ['AUTHORIZED_NUMBERS', 'GOOGLE_SHEETS_IDS'];

// Verifica se há credenciais via variável de ambiente ou arquivo
if (!process.env.GOOGLE_CREDENTIALS_B64 && !process.env.GOOGLE_CREDENTIALS_PATH) {
  required.push('GOOGLE_CREDENTIALS_B64');
}

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Variaveis de ambiente faltando: ${missing.join(', ')}`);
  console.error('Configure as variáveis de ambiente no Railway ou crie um arquivo .env');
  process.exit(1);
}

// Se houver credenciais em Base64, decodifica e salva em arquivo temporário
let credentialsPathResolved = process.env.GOOGLE_CREDENTIALS_PATH;
if (process.env.GOOGLE_CREDENTIALS_B64) {
  credentialsPathResolved = path.join(__dirname, '..', 'credentials.json');
  if (!fs.existsSync(credentialsPathResolved)) {
    try {
      const buffer = Buffer.from(process.env.GOOGLE_CREDENTIALS_B64, 'base64');
      const credentialsJson = buffer.toString('utf-8');
      fs.writeFileSync(credentialsPathResolved, credentialsJson);
      console.log('✓ Credenciais carregadas da variável de ambiente.');
    } catch (err) {
      console.error('❌ Erro ao decodificar credenciais:', err.message);
      process.exit(1);
    }
  }
}

// Parse múltiplos números (separados por vírgula)
const authorizedNumbers = process.env.AUTHORIZED_NUMBERS
  .split(',')
  .map((n) => n.trim())
  .filter((n) => n);

// Parse múltiplos IDs de planilha (separados por vírgula)
const sheetsIds = process.env.GOOGLE_SHEETS_IDS
  .split(',')
  .map((id) => id.trim())
  .filter((id) => id);

// Validar que há o mesmo número de números autorizados e IDs de planilha
if (authorizedNumbers.length !== sheetsIds.length) {
  console.error(
    `Erro: AUTHORIZED_NUMBERS tem ${authorizedNumbers.length} itens, ` +
      `mas GOOGLE_SHEETS_IDS tem ${sheetsIds.length} itens. Eles devem ter a mesma quantidade.`
  );
  process.exit(1);
}

// Criar mapa: número → sheetsId
const userSheetsMap = new Map(
  authorizedNumbers.map((num, idx) => [num, sheetsIds[idx]])
);

module.exports = {
  authorizedNumbers,
  authorizedNumber: authorizedNumbers[0], // para compatibilidade com código antigo
  sheetsIds,
  sheetsId: sheetsIds[0], // para compatibilidade com código antigo
  userSheetsMap,
  getSheetsId: (phoneNumber) => userSheetsMap.get(phoneNumber) || sheetsIds[0],
  credentialsPath: credentialsPathResolved,
  reminderCron: process.env.REMINDER_CRON || '0 9 * * *',
  timezone: process.env.TZ || 'America/Sao_Paulo',
};
