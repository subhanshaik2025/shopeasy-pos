// Robust bill utilities - single source of truth
export function localDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return y + '-' + m + '-' + day;
}

export function parseBillDate(b) {
  // 1. ISO timestamp is unambiguous - always prefer it
  const ts = b.timestamp || b.Timestamp || '';
  if (ts) {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) return d;
  }
  // 2. date field - handle Indian dd/mm/yyyy explicitly
  const dt = String(b.date || b.Date || '').trim();
  if (dt) {
    if (dt.includes('/')) {
      const p = dt.split('/');
      if (p.length === 3) {
        const d = new Date(Number(p[2]), Number(p[1])-1, Number(p[0]));
        if (!isNaN(d.getTime())) return d;
      }
    }
    const d2 = new Date(dt);
    if (!isNaN(d2.getTime())) return d2;
  }
  return new Date();
}

export function parseItems(bill) {
  try {
    if (typeof bill.items_json === 'string' && bill.items_json.trim().startsWith('[')) return JSON.parse(bill.items_json);
    if (Array.isArray(bill.items)) return bill.items;
  } catch(e) {}
  return [];
}

export function normalizeBill(b) {
  return {
    ...b,
    _id: String(b.id || b.bill_id || ''),
    _total: Number(b.total || 0),
    _gst: Number(b.gst || 0),
    _discount: Number(b.discount || 0),
    _mode: String(b.mode || b.payment_mode || '').toLowerCase().trim(),
    _date: parseBillDate(b),
    _items: parseItems(b),
  };
}

// ── Validation layer: every byte from Sheets gets sanitized ──
export function sanitizeProducts(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(p => p && typeof p === 'object' && p.name).map(p => ({
    ...p,
    id: String(p.id || ('prod_' + Math.random().toString(36).slice(2,9))),
    name: String(p.name),
    price: Number(p.price) || 0,
    stock: (p.stock === undefined || p.stock === null || p.stock === '') ? undefined : (Number(p.stock) || 0),
    category: p.category ? String(p.category) : '',
  }));
}

export function sanitizeKhata(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(k => k && typeof k === 'object' && k.customer).map(k => ({
    ...k,
    id: String(k.id || ('kh_' + Math.random().toString(36).slice(2,9))),
    customer: String(k.customer),
    phone: k.phone ? String(k.phone) : '',
    amount: Number(k.amount) || 0,
    note: k.note ? String(k.note) : '',
    type: k.type === 'received' ? 'received' : 'given',
    paid: k.paid === true,
    date: k.date ? String(k.date) : '',
  }));
}

export function sanitizeExpenses(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(e => e && typeof e === 'object' && e.title).map(e => ({
    ...e,
    id: String(e.id || ('exp_' + Math.random().toString(36).slice(2,9))),
    title: String(e.title),
    amount: Number(e.amount) || 0,
    category: e.category ? String(e.category) : 'other',
    date: e.date ? String(e.date) : '',
  }));
}

export function sanitizeSettings(s) {
  if (!s || typeof s !== 'object') return null;
  return {
    gstin: s.gstin ? String(s.gstin) : '',
    gstPercent: Number(s.gstPercent) >= 0 ? Number(s.gstPercent) : 5,
    shopAddress: s.shopAddress ? String(s.shopAddress) : '',
    shopPhone: s.shopPhone ? String(s.shopPhone) : '',
  };
}
