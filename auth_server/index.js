const request = require('request');
const url = require('url');
const express = require('express');
const session = require('express-session');

const app = express();
app.set("view engine", "pug");
app.use(express.urlencoded({ extended: true }));

// Configuração da sessão
app.use(
  session({
    secret: "segredo-super-seguro",
    resave: false,
    saveUninitialized: true,
  })
);

const port = process.env.PORT || 3000

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function load_env_variable(name) {
  var value = process.env[name];
  if (value) {
    console.log(name + " is " + value);
    return value;
  } else {
    console.error("You need to specify a value for the environment variable: " + name);
    process.exit(1);
  }
}

/*
  This is the secret provision key that the plugin has generated
  after being added to the API
*/
const PROVISION_KEY = load_env_variable("PROVISION_KEY");

/*
  URLs to Kong
*/
const KONG_ADMIN = load_env_variable("KONG_ADMIN");
const KONG_API = load_env_variable("KONG_API");

/*
  The path to the API, required later when making a request
  to authorize the OAuth 2.0 client application
*/
const API_PATH = load_env_variable("API_PATH");

/* 
  The scopes that we support, with their extended
  description for a nicer frontend user experience
*/
const SCOPE_DESCRIPTIONS = JSON.parse(load_env_variable("SCOPES"));

/*
  Retrieves the OAuth 2.0 client application name from
  a given client_id - used for a nicer fronted experience
*/
function get_application_name(client_id, callback) {
  request({
    method: "GET",
    url: KONG_ADMIN + "/oauth2/" + client_id,
    json: true
  }, function(error, response, body) {
    let application_name;
    if (client_id && !error) {
      application_name = body.name;
    }
    callback(application_name);
  });
}

// Middleware básico
app.get('/', (req, res) => {
  res.send(`Servidor de Autorização 🚀`);
});

/*
  The POST request to Kong that will actually try to
  authorize the OAuth 2.0 client application after the
  user submits the form
*/
function authorize(client_id, response_type, scope, callback) {
  request({
    method: "POST",
    url: KONG_API + API_PATH + "/oauth2/authorize",
    headers: {
    },
    json: true,
    form: { 
      client_id: client_id, 
      response_type: response_type, 
      scope: scope, 
      provision_key: PROVISION_KEY,
      authenticated_userid: "user123" // Hard-coding this value (it should be the logged-in user ID)
    }
  }, function(error, response, body) {
    console.log(JSON.stringify(body));
    callback(body.redirect_uri);
  });
}

/*
  The route that shows the authorization page
*/
app.get('/authorize', function(req, res) {
  var querystring = url.parse(req.url, true).query;
  get_application_name(querystring.client_id, function(application_name) {
    if (application_name) {
      res.render('authorization', { 
        client_id: querystring.client_id,
        response_type: querystring.response_type,
        scope: querystring.scope,
        application_name: application_name,
        SCOPE_DESCRIPTIONS: SCOPE_DESCRIPTIONS 
      });
    } else {
      res.status(403).send("Invalid client_id");
    }
  });
});

/*
  The route that handles the form submit, that will
  authorize the client application and redirect the user
*/
app.post('/authorize', function(req, res) {
  authorize(req.body.client_id, req.body.response_type, req.body.scope, function(redirect_uri) {
    if (redirect_uri) {
      res.redirect(redirect_uri);
    }
  });
});

// Usuário de exemplo
const USUARIO_TESTE = { username: "admin", password: "1234" };

// Página de login
app.get("/login", (req, res) => {
  res.render("login", { erro: null });
});

// Processar login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === USUARIO_TESTE.username && password === USUARIO_TESTE.password) {
    req.session.usuario = { username };
    return res.redirect("https://localhost:8443/client/login/callback");
  }

  res.render("login", { erro: "Usuário ou senha inválidos" });
});

app.listen(port, () => {
  console.log(`Servidor executando http://localhost:${port} 🚀`);
});
