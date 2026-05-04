const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json';
const sheetsId = process.env.GOOGLE_SHEETS_ID;

if (!sheetsId) {
  console.error('GOOGLE_SHEETS_ID nao configurado no .env');
  process.exit(1);
}

if (!fs.existsSync(credentialsPath)) {
  console.error(`credentials.json nao encontrado em ${credentialsPath}`);
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  keyFile: credentialsPath,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function criarAbas() {
  console.log('Criando/verificando abas...');

  const info = await sheets.spreadsheets.get({ spreadsheetId: sheetsId });
  const abasExistentes = info.data.sheets.map((s) => s.properties.title);

  const requests = [];

  if (!abasExistentes.includes('Alunos')) {
    requests.push({
      addSheet: {
        properties: { title: 'Alunos', gridProperties: { rowCount: 100, columnCount: 7 } },
      },
    });
    console.log('- Criando aba "Alunos"');
  }

  if (!abasExistentes.includes('Pagamentos')) {
    requests.push({
      addSheet: {
        properties: { title: 'Pagamentos', gridProperties: { rowCount: 200, columnCount: 6 } },
      },
    });
    console.log('- Criando aba "Pagamentos"');
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetsId,
      requestBody: { requests },
    });
    console.log('Abas criadas com sucesso!');
  } else {
    console.log('Abas ja existem.');
  }
}

async function populaHeaders() {
  console.log('\nAdicionando headers...');

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetsId,
    range: 'Alunos!A1:G1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['ID', 'Nome', 'Telefone', 'Valor', 'DiaVencimento', 'DataInicio', 'Ativo'],
      ],
    },
  });
  console.log('- Headers da aba "Alunos" criados');

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetsId,
    range: 'Pagamentos!A1:F1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['IDAluno', 'MesReferencia', 'Status', 'DataPagamento', 'ValorPago', 'UltimoLembrete'],
      ],
    },
  });
  console.log('- Headers da aba "Pagamentos" criados');
}

async function populaExemplos() {
  console.log('\nAdicionando dados de exemplo...');

  const alunosExemplo = [
    [1, 'Joao Silva', '5511987654321', 150, 10, '2026-01-15', 'sim'],
    [2, 'Maria Santos', '5511987654322', 150, 20, '2026-02-01', 'sim'],
    [3, 'Pedro Costa', '5511987654323', 200, 5, '2026-01-20', 'sim'],
    [4, 'Ana Oliveira', '5511987654324', 150, 15, '2026-03-10', 'sim'],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetsId,
    range: 'Alunos!A2:G',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: alunosExemplo },
  });
  console.log(`- ${alunosExemplo.length} alunos de exemplo adicionados`);

  const pagamentosExemplo = [
    [1, '05-2026', 'Pago', '2026-05-02', 150, ''],
    [2, '05-2026', 'Pendente', '', '', ''],
    [3, '05-2026', 'Pendente', '', '', ''],
    [4, '05-2026', 'Pago', '2026-04-30', 200, ''],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetsId,
    range: 'Pagamentos!A2:F',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: pagamentosExemplo },
  });
  console.log(`- ${pagamentosExemplo.length} registros de pagamento de exemplo adicionados`);
}

async function main() {
  try {
    console.log('🚀 Iniciando setup da planilha...\n');
    await criarAbas();
    await populaHeaders();
    await populaExemplos();
    console.log('\n✅ Setup concluido com sucesso!');
    console.log('\nProximos passos:');
    console.log('1. Preencha AUTHORIZED_NUMBER no .env com seu numero de WhatsApp (ex: 5511999999999)');
    console.log('2. Rode: npm install');
    console.log('3. Rode: npm start');
    console.log('4. Escaneie o QR Code com seu WhatsApp\n');
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
}

main();
