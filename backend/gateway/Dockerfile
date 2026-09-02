FROM node:20-alpine

WORKDIR /app

# Copy package manifests for shared and gateway modules
COPY shared/package*.json ./shared/
RUN cd shared && npm install --omit=dev

COPY gateway/package*.json ./gateway/
RUN cd gateway && npm install --omit=dev

# Copy source code
COPY shared ./shared
COPY gateway ./gateway

WORKDIR /app/gateway

EXPOSE 8000

CMD [ "npm", "start" ]