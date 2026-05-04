const cron = require('node-cron');
const dayjs = require('dayjs');
const config = require('../config');
const { listAlunos } = require('../sheets/alunos');
const { getPagamentosDoMes, marcarUltimoLembrete } = require('../sheets/pagamentos');
const { brl } = require('../commands/format');

function classificar(aluno, pagamento, hoje) {
  if (pagamento && pagamento.status === 'Pago') return null;

  const diaVenc = aluno.diaVencimento;
  const diaHoje = hoje.date();
  const diff = diaHoje - diaVenc;

  if (diff === -3) return { tipo: 'previo', mensagem: `${aluno.nome} vence em 3 dias (dia ${diaVenc}) - ${brl(aluno.valor)}` };
  if (diff === 0) return { tipo: 'hoje', mensagem: `Hoje vence: ${aluno.nome} - ${brl(aluno.valor)}` };
  if (diff > 0) return { tipo: 'atraso', mensagem: `Atrasado: ${aluno.nome} ha ${diff} dia(s) - ${brl(aluno.valor)}` };
  return null;
}

async function rodarLembretesParaUsuario(client, phoneNumber, sheetsId) {
  const hoje = dayjs();
  const hojeIso = hoje.format('YYYY-MM-DD');

  const [alunos, pagamentos] = await Promise.all([
    listAlunos({ apenasAtivos: true, sheetsId }),
    getPagamentosDoMes(undefined, sheetsId),
  ]);

  const pagamentoPorAluno = new Map(pagamentos.map((p) => [p.idAluno, p]));
  const avisos = [];

  for (const aluno of alunos) {
    const pagamento = pagamentoPorAluno.get(aluno.id);
    if (pagamento && pagamento.ultimoLembrete === hojeIso) continue;

    const aviso = classificar(aluno, pagamento, hoje);
    if (!aviso) continue;

    avisos.push({ aluno, aviso, pagamento });
  }

  if (avisos.length === 0) {
    console.log(`[${hojeIso}] Usuário ${phoneNumber}: nenhum lembrete a enviar.`);
    return;
  }

  const cabecalho = `*Lembretes do dia (${hoje.format('DD/MM')})*\n`;
  const corpo = avisos.map((a) => `- ${a.aviso.mensagem}`).join('\n');
  const mensagem = cabecalho + corpo;

  // Envia para o número específico
  const chatId = `${phoneNumber}@c.us`;
  await client.sendMessage(chatId, mensagem);

  for (const { pagamento } of avisos) {
    if (pagamento && pagamento.rowIndex) {
      await marcarUltimoLembrete(pagamento.rowIndex, hojeIso, sheetsId);
    }
  }

  console.log(`[${hojeIso}] ${avisos.length} lembrete(s) enviados para ${phoneNumber}.`);
}

async function rodarLembretes(client) {
  const hoje = dayjs().format('YYYY-MM-DD');

  // Executa lembretes para cada usuário autorizado
  for (let i = 0; i < config.authorizedNumbers.length; i++) {
    const phoneNumber = config.authorizedNumbers[i];
    const sheetsId = config.sheetsIds[i];
    try {
      await rodarLembretesParaUsuario(client, phoneNumber, sheetsId);
    } catch (err) {
      console.error(`[${hoje}] Erro ao processar lembretes para ${phoneNumber}:`, err.message);
    }
  }
}

function agendar(client) {
  cron.schedule(
    config.reminderCron,
    () => rodarLembretes(client).catch((err) => console.error('Erro nos lembretes:', err)),
    { timezone: config.timezone }
  );
  console.log(`Scheduler de lembretes ativo (cron: ${config.reminderCron}, tz: ${config.timezone}).`);
}

module.exports = { agendar, rodarLembretes };
