const request = require('request');
const express = require('express');
const session = require('express-session');
const app = express();

const port = process.env.PORT || 3000
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function load_env_variable(name) {
    const value = process.env[name];
    if (value) {
        console.log(name + " is " + value);
        return value;
    } else {
        console.error("You need to specify a value for the environment variable: " + name);
        process.exit(1);
    }
}

const KONG_API = load_env_variable("KONG_API");

/*
  The path to the API, required later when making a request
  to authorize the OAuth 2.0 client application
*/
const API_PATH = load_env_variable("API_PATH");

const CLIENT_ID = load_env_variable("CLIENT_ID")
const CLIENT_SECRET = load_env_variable("CLIENT_SECRET")

function getToken(code, callback) {
    request({
        method: "POST",
        url: KONG_API + API_PATH + "/oauth2/token",
        headers: {
        },
        json: true,
        form: { 
            grant_type: "authorization_code", 
            code: code, 
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET
        }
    }, function(error, response, body) {
        if (error) {
            console.log(error);
        } else if (body) {
            callback(body);
        }
    });
}

function getResource(token, callback) {
    console.log(token);
    request({
        method: "GET",
        url: KONG_API + API_PATH,
        headers: {
            'Authorization': `Bearer ${token}`
        },
        json: true
    }, function(error, response, body) {
        if (error) {
            console.log(error);
            callback(false);
        } else if (body) {
            callback(body.data != null, body);
        }
    });
}

// Configurar o middleware de sessão
app.use(session({
    secret: 'minhaChaveSecreta', // Chave secreta para assinar a sessão
    resave: false, // Evita regravar a sessão se não houver alterações
    saveUninitialized: true, // Salva sessões não inicializadas
    cookie: { secure: false } // Configurações do cookie (secure: true requer HTTPS)
}));  

app.get('/', (req, res) => {
    const access_token = req.session.usuario?.access_token || null
    if (req.session.usuario == null) {
        return res.redirect("https://localhost:8443/auth_server/login");
    }
    if (req.session.usuario?.access_token == null) {
        return res.redirect(`https://localhost:8443/auth_server/authorize?response_type=code&scope=email%20address&client_id=${CLIENT_ID}`);
    }
    getResource(access_token, function(acessoRecurso, data) {
        res.send(`
            <p>Aplicação Cliente 🚀</p>
            <p>
                Acesso Recurso: ${acessoRecurso ? '✅ Concedido': '❌ Negado'}
            </p>
            <p><pre>${JSON.stringify(data)}</pre></p>
            ${req.session.usuario ? `
                <p>
                    <a href="https://localhost:8443/client/logout">Logout</a>
                </p>
                ` : `
                <p>
                    <a href="https://localhost:8443/auth_server/authorize?response_type=code&scope=email%20address&client_id=${CLIENT_ID}">Autorizar uso do recurso</a>
                </p>
                `
            }
        `);
    });
});

app.get('/oauth2/callback', (req, res) => {
    console.log(`oAuth2 callback ${req.query.code}`)
    getToken(req.query.code, function(tokenInfo) {
        req.session.usuario = tokenInfo;
        res.redirect("https://localhost:8443/client");
    })
});

app.get('/login/callback', (req, res) => {
    req.session.usuario = {};
    res.redirect("https://localhost:8443/client");    
});

// Rota para destruir a sessão
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Erro ao destruir a sessão.');
        }
        res.redirect("https://localhost:8443/client");
    });
});

app.listen(port, () => {
    console.log(`Servidor executando http://localhost:${port} 🚀`);
});