const { google } = require('googleapis');
const config = require('../config');

const auth = new google.auth.GoogleAuth({
  keyFile: config.credentialsPath,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function getRows(range, sheetsId = null) {
  const spreadsheetId = sheetsId || config.sheetsId;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return res.data.values || [];
}

async function updateRow(range, values, sheetsId = null) {
  const spreadsheetId = sheetsId || config.sheetsId;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

async function appendRow(range, values, sheetsId = null) {
  const spreadsheetId = sheetsId || config.sheetsId;
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

module.exports = { getRows, updateRow, appendRow };
