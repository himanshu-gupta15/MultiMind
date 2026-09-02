FROM node:20

WORKDIR /app

# Root/shared dependencies
COPY package*.json ./
RUN npm install

# Auth service dependencies
COPY services/chat/package*.json ./services/chat/
RUN cd services/chat && npm install

# Source code
COPY services/chat ./services/chat
COPY shared ./shared

WORKDIR /app/services/chat

EXPOSE 8002

CMD ["npm", "start"]