FROM node:20

WORKDIR /app

# Root/shared dependencies
COPY package*.json ./
RUN npm install

# Auth service dependencies
COPY services/auth/package*.json ./services/auth/
RUN cd services/auth && npm install

# Source code
COPY services/auth ./services/auth
COPY shared ./shared

WORKDIR /app/services/auth

EXPOSE 8001

CMD ["npm", "start"]