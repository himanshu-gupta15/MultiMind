FROM node:20

WORKDIR /app

# Root/shared dependencies
COPY package*.json ./
RUN npm install

# Agent service dependencies
COPY services/agent/package*.json ./services/agent/
RUN cd services/agent && npm install

# Source code
COPY services/agent ./services/agent
COPY shared ./shared

WORKDIR /app/services/agent

EXPOSE 8003

CMD ["npm", "start"]

