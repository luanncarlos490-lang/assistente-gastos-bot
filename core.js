// Lógica do bot, independente do provedor (Meta ou Z-API)
import { createClient } from '@supabase/supabase-js';
import { parse, norm, isoBR } from './parser.js';

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const BOT_NAME = process.env.BOT_NAME || 'Assistente de Gastos';
const SUPPORT_CONTACT = process.env.SUPPORT_CONTACT || 'o responsável pelo serviço';
const brl = (n) => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// msg = { phone, id, text }  (text = null quando não for mensagem de texto)
// send = async (phone, texto) => void
export async function handleMessage({ phone, id, text }, send) {
  console.log('Mensagem de', phone); // confira o formato do número dos clientes

  const { error: dup } = await db.from('processed_messages').insert({ id });
  if (dup) { if (dup.code !== '23505') console.error(dup); return; }

  const { data: cust } = await db.from('customers').select('active').eq('phone', phone).maybeSingle();
  if (!cust || !cust.active) {
    return send(phone, `Seu acesso ao ${BOT_NAME} não está ativo. Fale com ${SUPPORT_CONTACT} para contratar.`);
  }
  if (text == null) {
    return send(phone, 'Por enquanto entendo só texto. Escreva, por exemplo: "gastei 45 no mercado".');
  }

  const t = norm(text).trim();

  if (/^(ajuda|menu|oi|ola)/.test(t)) {
    return send(phone, 'Escreva o que entrou ou saiu:\n• gastei 45 no mercado\n• recebi 800 do logo da cliente\n• ontem paguei 30 de uber\n\nComandos: resumo, desfazer');
  }

  if (/^(resumo|saldo|extrato)/.test(t)) {
    const first = isoBR().slice(0, 8) + '01';
    const { data = [] } = await db.from('transactions').select('type,value,category').eq('phone', phone).gte('date', first);
    let a = 0, b = 0; const byCat = {};
    for (const r of data) {
      if (r.type === 'in') a += Number(r.value);
      else { b += Number(r.value); byCat[r.category] = (byCat[r.category] || 0) + Number(r.value); }
    }
    const top = Object.entries(byCat).sort((x, y) => y[1] - x[1]).slice(0, 3)
      .map(([c, v]) => `• ${c}: ${brl(v)}`).join('\n');
    return send(phone, `Resumo do mês\nEntradas: ${brl(a)}\nSaídas: ${brl(b)}\nSaldo: ${brl(a - b)}` + (top ? `\n\nMaiores gastos:\n${top}` : ''));
  }

  if (/^(desfazer|cancelar|apagar)/.test(t)) {
    const { data: last } = await db.from('transactions').select('id,description,value')
      .eq('phone', phone).order('id', { ascending: false }).limit(1).maybeSingle();
    if (!last) return send(phone, 'Não há lançamentos para remover.');
    await db.from('transactions').delete().eq('id', last.id);
    return send(phone, `Lançamento removido: ${last.description} (${brl(last.value)}).`);
  }

  const r = parse(text);
  if (!r) return send(phone, 'Não encontrei um valor na mensagem. Tente assim: "gastei 45 no mercado".');

  const { error } = await db.from('transactions').insert({
    phone, type: r.type, value: r.value, description: r.description, category: r.category, date: r.date,
  });
  if (error) { console.error(error); return send(phone, 'Não consegui salvar agora. Tente de novo em instantes.'); }

  const [y, m, d] = r.date.split('-');
  return send(phone, `${r.type === 'in' ? 'Entrada anotada' : 'Saída anotada'}: ${brl(r.value)}\n${r.description} (${r.category})\nData: ${d}/${m}/${y}\n\nErrou? Digite "desfazer".`);
}
