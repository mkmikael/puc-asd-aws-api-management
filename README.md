## Instalar versão community do kong

Criar rede

```sh
docker network create kong-net
```

Inicializar Kong

```sh
docker compose up -d
```

Inicializar serviços

```sh
docker compose -f docker-compose-services.yml up -d --build
```

Fonte: https://docs.konghq.com/gateway/3.9.x/install/docker/?install=oss

## Criar certificados autoassinados

Gerar os certificados em uma pasta na raiz do projeto ./certificados

```shell
cd certificados
openssl req -x509 -newkey rsa:2048 -keyout tempkey.pem -out cert.pem -days 365
```

Inserir senha e teclar enter repetidamente para pular as informações de certificado

```shell
openssl rsa -in tempkey.pem -out key.pem
```

Inserir senha definida anteriormente

## Configuração oAuth2

curl -X POST http://localhost:8001/consumers/ \
 --data "username=user123" \
 --data "custom_id=SOME_CUSTOM_ID"

id: 9760b046-9327-4157-866b-68457d8493c3

curl -X POST http://localhost:8001/consumers/9760b046-9327-4157-866b-68457d8493c3/oauth2 \
  --data "name=Test%20Application" \
  --data "client_id=SOME-CLIENT-ID" \
  --data "client_secret=SOME-CLIENT-SECRET" \
  --data "redirect_uris=http://localhost:8000/a/" \
  --data "hash_secret=true"

{"id":"ddcb9a1e-813b-4ad4-a872-ea72f5d5b21f","client_id":"SOME-CLIENT-ID","client_type":"confidential","redirect_uris":["http://localhost:8000/a/"],"tags":null,"name":"Test Application","hash_secret":true,"consumer":{"id":"9760b046-9327-4157-866b-68457d8493c3"},"created_at":1741130776,"client_secret":"$pbkdf2-sha512$i=10000,l=32$oClZ3j2YLNpVn4HDlJ+FoA$PjCD8pNJdVfXh7Zi+6aXu/Scr7ViqZSW3Bcx4Hm3ToM"}

curl localhost:8001/oauth2?client_id=SOME-CLIENT-ID

## Client credentials

curl -k -i -X POST 'https://localhost:8443/a/oauth2/token' \
    --header 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode 'client_id=SOME-CLIENT-ID' \
    --data-urlencode 'client_secret=SOME-CLIENT-SECRET' \
    --data-urlencode 'grant_type=client_credentials'

curl -k -i -H "Authorization: Bearer OZxRBbTABhCjt2GJLvMejSCffCAMVtTf" https://localhost:8443/a

## Authorization Code

https://localhost:8443/a/oauth2/authorize?client_id=SOME-CLIENT-ID&response_type=code&provision_key=default&authenticated_userid=usuario123&redirect_uri=http://localhost:3000/a

https://localhost:3443/authorize?response_type=code&scope=email%20address&client_id=SOME-CLIENT-ID

## URLs Serviços

### Client

URL Interna: http://localhost:10001/
Rota Kong  : https://localhost:8443/client

### Auth Server

URL Interna: http://localhost:10002/
Rota Kong  : https://localhost:8443/auth_server

### Resource

URL Interna: https://localhost:10003/
Rota Kong  : https://localhost:8443/resource