FROM node:20

ENV PORT=3000 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install Chromium + fonts
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json* ./

# IMPORTANT: install dev deps for Vite build
RUN npm install --include=dev

# Copy application code
COPY . .

# Build frontend
RUN npm run build

# Now switch to production
ENV NODE_ENV=production

RUN mkdir -p data

EXPOSE 3000

CMD ["sh", "-c", "npm run db:migrate && npm start"]
