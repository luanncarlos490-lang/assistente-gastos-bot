const CATS = {
  'Alimentação': ['mercado','supermercado','almoco','jantar','lanche','restaurante','padaria','ifood','comida','cafe','pizza'],
  'Transporte': ['uber','99','gasolina','combustivel','onibus','passagem','estacionamento','pedagio','moto'],
  'Saúde': ['farmacia','remedio','medico','consulta','dentista','exame'],
  'Moradia': ['aluguel','luz','agua','internet','condominio','energia','gas'],
  'Trabalho': ['adobe','canva','software','impressao','dominio','hospedagem','material','anuncio','trafego','licenca','freela'],
  'Lazer': ['cinema','netflix','spotify','bar','viagem','festa','jogo','show'],
};
const INCATS = {
  'Serviços': ['logo','arte','design','cliente','projeto','identidade','social','video','banner'],
  'Vendas': ['venda','vendi','produto'],
};

export const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Data de hoje no fuso de Brasilia (YYYY-MM-DD), com deslocamento em dias
export function isoBR(offset = 0) {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function category(t, income) {
  const map = income ? INCATS : CATS;
  for (const c in map) {
    if (map[c].some((k) => new RegExp('\\b' + k + '\\b').test(t))) return c;
  }
  return income ? 'Outras entradas' : 'Outros';
}

// "gastei 45 no mercado" -> { type, value, description, category, date } | null
export function parse(text) {
  const t = norm(text).replace(/(\d)\.(\d{3})(?!\d)/g, '$1$2');
  const m = t.match(/(\d+(?:[.,]\d{1,2})?)/);
  if (!m) return null;
  const value = parseFloat(m[1].replace(',', '.'));
  if (!(value > 0)) return null;

  const income = /\b(recebi|ganhei|entrou|entrada|receita|vendi|venda|caiu|recebimento)\b/.test(t);
  let off = 0;
  if (/\banteontem\b/.test(t)) off = 2;
  else if (/\bontem\b/.test(t)) off = 1;

  const semValor = t.replace(m[1], ' ');
  let description = semValor
    .replace(/r\$|reais|real/g, ' ')
    .replace(/\b(gastei|paguei|comprei|recebi|ganhei|vendi|hoje|ontem|anteontem|de|do|da|no|na|em|com|por|um|uma|pra|para|o|a|e)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const cat = category(semValor, income); // sem o valor, para "99" nao virar categoria
  if (!description) description = cat;
  description = description.charAt(0).toUpperCase() + description.slice(1);

  return { type: income ? 'in' : 'out', value, description, category: cat, date: isoBR(off) };
}
