FROM node:20-alpine

# Utilities required for scripts (HTTPS to Vault)
RUN apk add --no-cache curl jq ca-certificates && update-ca-certificates

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy code
COPY . .

EXPOSE 3000

CMD ["npm", "start"]