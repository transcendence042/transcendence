FROM node:18-alpine

WORKDIR /app

# Instalar dependencias del sistema para SQLite
RUN apk add --no-cache sqlite

# Copiar package files
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Crear directorio para la base de datos
RUN mkdir -p /app/data

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]