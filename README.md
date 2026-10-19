# Bot de gestão de gastos no WhatsApp

Stack: Node.js 18+, Express, Supabase (Postgres) e WhatsApp Cloud API (Meta).

## 1. Banco de dados (Supabase)
1. Crie um projeto em supabase.com.
2. No SQL Editor, rode o arquivo `schema.sql`.
3. Cadastre seu número de teste (só dígitos, com 55 e DDD):
   `insert into customers (phone, name) values ('5598XXXXXXXXX', 'Teste');`
4. Em Project Settings > API, copie a URL e a chave **service_role** (nunca coloque essa chave no front-end).

## 2. Rodar local
```
npm install
cp .env.example .env     # preencha os valores
npm start
```
Para a Meta alcançar seu computador, use um túnel (ex.: `npx localtunnel --port 3000`) ou já faça o deploy.

## 3. Deploy
Suba para o GitHub (o `.env` fica de fora) e publique no Railway ou Render como serviço Node
(build: `npm install`, start: `npm start`). Cadastre as variáveis do `.env.example` no painel do serviço.
Você terá uma URL pública, ex.: `https://seu-app.up.railway.app`.

## 4. Conectar na Meta
No app em developers.facebook.com > WhatsApp > Configuration:
- Callback URL: `https://SUA-URL/webhook`
- Verify token: o mesmo `VERIFY_TOKEN` do `.env`
- Webhook fields: assine **messages**

Depois mande "ajuda" para o número do bot.

## Atenção
- Número brasileiro: a Meta às vezes entrega o número sem o nono dígito. O servidor imprime no log o número que chega;
  cadastre em `customers` exatamente como aparecer.
- Fora da janela de 24 h após a mensagem do cliente, só vale mensagem de modelo aprovado (esta versão só responde a quem escreve).
- Cada cliente seu = uma linha em `customers` com `active = true`. Desativar = `active = false`.

## Próximos passos
Áudio (transcrição), foto de comprovante, cobrança automática (webhook da Ticto/Kiwify ativando o cliente) e painel web.

---
## Usando Z-API em vez da API da Meta
1. Na Z-API: crie a instância, leia o QR Code com o chip do bot (WhatsApp > Aparelhos conectados).
2. Preencha no `.env`: `ZAPI_INSTANCE_ID`, `ZAPI_TOKEN`, `ZAPI_CLIENT_TOKEN` (se a segurança da conta estiver ativa) e `WEBHOOK_SECRET`.
3. No deploy, o comando de início passa a ser `npm run start:zapi`.
4. Na Z-API, em "Webhooks e configurações gerais", campo **Ao receber**: `https://SUA-URL/webhook/SEU_WEBHOOK_SECRET` (precisa ser HTTPS).
5. Cadastre o número de teste em `customers` (formato 55 + DDD + número, como chega no log).
