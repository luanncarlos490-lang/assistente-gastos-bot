// Versão para Z-API. Rode com: npm run start:zapi
import express from 'express';
import { handleMessage } from './core.js';

const { ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN, WEBHOOK_SECRET, PORT = 3000 } = process.env;

const app = express();
app.use(express.json());

async function send(phone, message) {
  const headers = { 'Content-Type': 'application/json' };
  if (ZAPI_CLIENT_TOKEN) headers['Client-Token'] = ZAPI_CLIENT_TOKEN;
  const r = await fetch(`https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`, {
    method: 'POST', headers, body: JSON.stringify({ phone, message }),
  });
  if (!r.ok) console.error('Erro ao enviar:', r.status, await r.text());
}

// A Z-API não assina as chamadas, então o segredo vai na própria URL:
// https://SEU-APP/webhook/SEGREDO  (use um texto longo e aleatório)
app.post('/webhook/:secret', (req, res) => {
  if (!WEBHOOK_SECRET || req.params.secret !== WEBHOOK_SECRET) return res.sendStatus(401);
  res.sendStatus(200);

  const b = req.body || {};
  if (b.type !== 'ReceivedCallback' || b.fromMe || b.isGroup) return;
  handleMessage({ phone: b.phone, id: b.messageId, text: b.text?.message ?? null }, send)
    .catch((e) => console.error('Erro:', e));
});

app.get('/', (_req, res) => res.send((process.env.BOT_NAME || 'Assistente de Gastos') + ': no ar'));
app.listen(PORT, '0.0.0.0', () => console.log('Servidor Z-API na porta', PORT));
