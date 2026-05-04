# WhatsTenis Bot 🏖️

ChatBot no WhatsApp que conecta à sua planilha do Google Sheets para gerenciar mensalidades de alunos de Beach Tennis.

## Setup Rápido

### 1. Clonar/baixar o projeto
```bash
cd "C:\Users\victo\Desktop\Peoject WhatsTenis"
npm install
```

### 2. Configurar Google Cloud (credenciais)

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto chamado `WhatsTenis`
3. Habilite **Google Sheets API**
4. Crie uma **Conta de Serviço** (Service Account)
5. Gere uma chave **JSON** e baixe como `credentials.json`
6. Coloque o arquivo `credentials.json` na **raiz do projeto** (mesmo nível do `package.json`)

### 3. Criar Planilha no Google Sheets

1. Acesse [Google Sheets](https://sheets.google.com)
2. Crie uma nova planilha chamada `WhatsTenis` (ou o nome que preferir)
3. Copie o **ID da planilha** da URL:
   ```
   docs.google.com/spreadsheets/d/AQUI_ESTA_O_ID/edit
   ```
4. Compartilhe a planilha com o **email do service account** (encontrado no `credentials.json`)
   - Clique em "Compartilhar" → Cole o email → Permissão "Editor" → Desmarque "Notificar"

### 4. Configurar `.env`

Copie `.env.example` para `.env`:
```bash
cp .env.example .env
```

Edite o `.env` e preencha:
- `AUTHORIZED_NUMBER` — seu número de WhatsApp no formato `5511999999999` (sem + ou espaços)
- `GOOGLE_SHEETS_ID` — o ID que você copiou da URL da planilha

### 5. Popular a Planilha com Exemplo

```bash
npm run seed
```

Isso vai criar as abas (`Alunos` e `Pagamentos`) com headers e alguns alunos de exemplo.

### 6. Rodar o Bot

```bash
npm start
```

1. Um **QR Code** vai aparecer no terminal
2. **Escaneie com o WhatsApp do professor** (o número que você colocou no `AUTHORIZED_NUMBER`)
3. Pronto! O bot está pronto para receber comandos

## Comandos

Envie mensagens no WhatsApp do professor:

| Comando | Descrição |
|---------|-----------|
| `status` | Resumo do mês: total de alunos, recebido, pendente, devedores |
| `status <nome>` | Situação de um aluno específico + últimos 3 meses |
| `lembrar` | Lista devedores com links de WhatsApp para cobrar |
| `ajuda` | Lista todos os comandos |

## Estrutura da Planilha

### Aba `Alunos`
| ID | Nome | Telefone | Valor | DiaVencimento | DataInicio | Ativo |
|----|------|----------|-------|----------------|------------|-------|
| 1 | João Silva | 5511987654321 | 150 | 10 | 2026-01-15 | sim |

### Aba `Pagamentos`
| IDAluno | MesReferencia | Status | DataPagamento | ValorPago | UltimoLembrete |
|---------|---------------|--------|---------------|-----------|----------------|
| 1 | 05-2026 | Pago | 2026-05-02 | 150 | |

## Lembretes Automáticos

O bot roda um scheduler diariamente às **9h da manhã**. Ele envia ao professor:

- **3 dias antes**: "João vence em 3 dias (dia 10) — R$ 150"
- **No dia do vencimento**: "Hoje vence: João — R$ 150"
- **Atrasado**: "Atrasado: Maria há 5 dias — R$ 200"

Configure a hora editando `REMINDER_CRON` no `.env` (formato cron: `minuto hora dia mes dia-da-semana`).

## Desenvolvimento

Para rodar com hot-reload:
```bash
npm run dev
```

## Troubleshooting

### Erro: "credentials.json not found"
- Certifique-se que o arquivo `credentials.json` está na **raiz do projeto**
- Verifique o caminho em `GOOGLE_CREDENTIALS_PATH` no `.env`

### Erro: "GOOGLE_SHEETS_ID not configured"
- Copie o ID da URL da planilha (entre `/d/` e `/edit`)
- Preencha `GOOGLE_SHEETS_ID` no `.env`

### Bot não responde
- Verifique se o número no `AUTHORIZED_NUMBER` é exatamente igual ao seu WhatsApp (incluindo DDD)
- Tente fazer logout e login novamente: delete a pasta `.wwebjs_auth/` e rode `npm start` novamente

### Erro de permissão na planilha
- Abra o `credentials.json`, procure o campo `client_email`
- Compartilhe a planilha com esse email (permissão "Editor")

## Deploy (opcional)

Para rodar em servidor 24/7, use `pm2`:

```bash
npm install -g pm2
pm2 start src/index.js --name whatstenis-bot
pm2 save
```

## Licença

MIT
