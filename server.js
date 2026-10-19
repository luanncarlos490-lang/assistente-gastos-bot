// Versão para a API oficial da Meta. Rode com: npm start
import express from 'express';
import crypto from 'crypto';
import { handleMessage } from './core.js';

const { VERIFY_TOKEN, WA_TOKEN, PHONE_NUMBER_ID, APP_SECRET, GRAPH_VERSION = 'v21.0', PORT = 3000 } = process.env;
const BOT_NAME = process.env.BOT_NAME || 'Assistente de Gastos';

const app = express();
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));

async function send(to, body) {
  const r = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
  });
  if (!r.ok) console.error('Erro ao enviar:', r.status, await r.text());
}

app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
    return res.status(200).send(req.query['hub.challenge']);
  }
  res.sendStatus(403);
});

app.post('/webhook', (req, res) => {
  const sig = req.get('x-hub-signature-256') || '';
  const expected = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(req.rawBody || '').digest('hex');
  const ok = sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (!ok) return res.sendStatus(401);
  res.sendStatus(200);

  for (const entry of req.body.entry || []) {
    for (const change of entry.changes || []) {
      for (const msg of change.value?.messages || []) {
        handleMessage({ phone: msg.from, id: msg.id, text: msg.type === 'text' ? msg.text.body : null }, send)
          .catch((e) => console.error('Erro:', e));
      }
    }
  }
});

app.get('/', (_req, res) => res.send(BOT_NAME + ': no ar'));
app.listen(PORT, () => console.log('Servidor na porta', PORT));
