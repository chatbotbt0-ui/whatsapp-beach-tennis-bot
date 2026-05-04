FROM buildkite/puppeteer:latest

# Definir o diretório de trabalho
WORKDIR /app

# Copiar arquivos do projeto
COPY package*.json ./
RUN npm install --production

COPY . .

# Configurar variáveis para usar o Chrome que já vem na imagem
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Rodar o bot
CMD ["node", "src/index.js"]
