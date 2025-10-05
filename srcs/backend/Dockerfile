FROM node:20-alpine

# Utilidades necesarias para los scripts (HTTPS a Vault)
RUN apk add --no-cache curl jq ca-certificates && update-ca-certificates

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código
COPY . .

EXPOSE 3000

CMD ["npm", "start"]