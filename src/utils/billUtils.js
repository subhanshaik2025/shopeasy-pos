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
