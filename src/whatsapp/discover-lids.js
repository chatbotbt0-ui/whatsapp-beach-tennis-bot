const fs = require('fs');
const path = require('path');
const config = require('../config');

const LIDS_FILE = path.join(__dirname, '../../.lids.json');

// Carrega LIDs salvos anteriormente
function loadLids() {
  if (fs.existsSync(LIDS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(LIDS_FILE, 'utf-8'));
    } catch (err) {
      console.error('❌ Erro ao carregar .lids.json:', err.message);
      return {};
    }
  }
  return {};
}

// Salva LIDs descobertos
function saveLids(lids) {
  try {
    fs.writeFileSync(LIDS_FILE, JSON.stringify(lids, null, 2));
    console.log('✓ LIDs salvos em .lids.json');
  } catch (err) {
    console.error('❌ Erro ao salvar .lids.json:', err.message);
  }
}

// Descobrir LIDs a partir de números de telefone
async function discoverLids(client) {
  console.log('\n🔍 Descobrindo LIDs dos números autorizados...');

  const lids = loadLids();
  let discovered = 0;

  for (const phoneNumber of config.authorizedNumbers) {
    // Se já temos o LID desse número, pula
    if (lids[phoneNumber]) {
      console.log(`✓ ${phoneNumber} → ${lids[phoneNumber]} (já salvo)`);
      continue;
    }

    try {
      console.log(`⏳ Convertendo ${phoneNumber}...`);

      // Timeout de 10 segundos para não travar
      const numberId = await Promise.race([
        client.getNumberId(phoneNumber),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 10000)
        )
      ]);

      if (numberId) {
        lids[phoneNumber] = numberId._serialized;
        discovered++;
        console.log(`✅ ${phoneNumber} → ${numberId._serialized}`);
      } else {
        console.warn(`⚠️  ${phoneNumber} não está registrado no WhatsApp`);
      }
    } catch (err) {
      console.warn(`⚠️  Erro ao converter ${phoneNumber}: ${err.message}`);
    }
  }

  // Salva os LIDs descobertos
  if (discovered > 0) {
    saveLids(lids);
    console.log(`\n✅ ${discovered} novo(s) LID(s) descoberto(s)!`);
    console.log('📝 Verifique .lids.json para ver os IDs completos\n');
  }

  return lids;
}

// Obter LID para um número (usa cache)
function getLidForNumber(phoneNumber) {
  const lids = loadLids();
  return lids[phoneNumber] || null;
}

// Obter número a partir de um @lid (reverso)
function getPhoneNumberFromLid(lid) {
  const lids = loadLids();
  for (const [phone, savedLid] of Object.entries(lids)) {
    if (savedLid === lid) {
      return phone;
    }
  }
  return null;
}

module.exports = {
  discoverLids,
  getLidForNumber,
  getPhoneNumberFromLid,
  loadLids,
  saveLids,
};
