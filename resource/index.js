const https = require('https');
const fs = require('fs');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000

app.get('/', (req, res) => {
  console.log("Servidor de Recurso!");
  res.send(`{ "data": "Servidor de Recurso 🚀" }`);
});

// Carregar certificados SSL
const options = {
  key: fs.readFileSync('../certificados/key.pem'),
  cert: fs.readFileSync('../certificados/cert.pem')
};

// Criar servidor HTTPS
https.createServer(options, app).listen(port, () => {
  console.log(`Servidor executando https://localhost:${port} 🚀`);
});