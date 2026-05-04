FROM node:18-bullseye

# Instalar dependências mínimas do Chrome
RUN apt-get update && apt-get install -y \
    chromium-browser \
    fonts-noto-color-emoji \
    ca-certificates \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Definir o diretório de trabalho
WORKDIR /app

# Copiar arquivos do projeto
COPY package*.json ./
RUN npm install --production

COPY . .

# Configurar o Puppeteer para usar o Chromium instalado
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Rodar o bot
CMD ["node", "src/index.js"]
