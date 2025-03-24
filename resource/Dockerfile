# Usa uma imagem oficial do Node.js
FROM node:22-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos do projeto para o container
COPY package.json .
COPY index.js .
RUN npm install

# Expõe a porta HTTP
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "index.js"]
