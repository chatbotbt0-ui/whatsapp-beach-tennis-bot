const { google } = require('googleapis');
const config = require('../config');

const auth = new google.auth.GoogleAuth({
  keyFile: config.credentialsPath,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Cache em memória: { "sheetsId:range": { data, timestamp } }
const cache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos

// Retry logic com backoff
async function withRetry(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 15000) // 15 segundos timeout
        )
      ]);
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // backoff exponencial
      console.log(`[RETRY] Tentativa ${attempt} falhou, aguardando ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function getRows(range, sheetsId = null) {
  const spreadsheetId = sheetsId || config.sheetsId;
  const cacheKey = `${spreadsheetId}:${range}`;

  // Verifica cache
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL) {
      console.log(`[CACHE HIT] ${range}`);
      return data;
    }
    cache.delete(cacheKey);
  }

  // Busca com retry
  const res = await withRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    })
  );

  const data = res.data.values || [];
  cache.set(cacheKey, { data, timestamp: Date.now() });
  console.log(`[API] Buscado ${range} (${data.length} linhas)`);
  return data;
}

async function updateRow(range, values, sheetsId = null) {
  const spreadsheetId = sheetsId || config.sheetsId;
  // Limpar cache de escrita para forçar refresh na próxima leitura
  cache.clear();

  await withRetry(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] },
    })
  );
}

async function appendRow(range, values, sheetsId = null) {
  const spreadsheetId = sheetsId || config.sheetsId;
  // Limpar cache de escrita para forçar refresh na próxima leitura
  cache.clear();

  await withRetry(() =>
    sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] },
    })
  );
}

module.exports = { getRows, updateRow, appendRow };
