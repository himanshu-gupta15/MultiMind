FROM node:20

WORKDIR /app

# Root/shared dependencies
COPY package*.json ./
RUN npm install

# Auth service dependencies
COPY services/billing/package*.json ./services/billing/
RUN cd services/billing && npm install

# Source code
COPY services/billing ./services/billing
COPY shared ./shared

WORKDIR /app/services/billing

EXPOSE 8004

CMD ["npm", "start"]