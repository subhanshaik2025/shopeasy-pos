const URL = 'https://script.google.com/macros/s/AKfycbyHJlHFsUS7ePK5HWQ_7VZaCtHgSbEXuQ4v85mCifEKDYQiGD-Ispyxnw3hBYUxbG_JeA/exec';

const get = async (params) => {
  try {
    const res = await fetch(URL + '?' + new URLSearchParams(params).toString());
    return await res.json();
  } catch(e) { console.error('GET error:', e); return { success: false }; }
};

export async function saveBillToSheet(bill, user) {
  return get({
    action: 'saveBill',
    bill_id: bill.id,
    shop_phone: user.phone,
    shop_name: user.shop_name,
    items_json: JSON.stringify(bill.items),
    subtotal: bill.subtotal,
    gst: bill.gst,
    total: bill.total,
    payment_mode: bill.mode,
    date: bill.date,
    timestamp: bill.timestamp,
    discount: bill.discount || 0,
    gstPercent: bill.gstPercent || 5,
  });
}

export async function getSalesFromSheet(shopName) {
  const data = await get({ action: 'getSales', shop_name: shopName });
  if (data.success) return data.sales || [];
  return [];
}

export async function saveProductsToSheet(products, user) {
  return get({
    action: 'saveProducts',
    shop_phone: user.phone,
    shop_name: user.shop_name,
    products_json: JSON.stringify(products),
  });
}

export async function getProductsFromSheet(phone) {
  const data = await get({ action: 'getProducts', shop_phone: phone });
  if (data.success) return data.products || [];
  return [];
}

export async function saveKhataToSheet(khata, user) {
  return get({
    action: 'saveKhata',
    shop_phone: user.phone,
    shop_name: user.shop_name,
    khata_json: JSON.stringify(khata),
  });
}

export async function getKhataFromSheet(phone) {
  const data = await get({ action: 'getKhata', shop_phone: phone });
  if (data.success) return data.khata || [];
  return [];
}

export async function saveExpensesToSheet(expenses, user) {
  return get({
    action: 'saveExpenses',
    shop_phone: user.phone,
    shop_name: user.shop_name,
    expenses_json: JSON.stringify(expenses),
  });
}

export async function getExpensesFromSheet(phone) {
  const data = await get({ action: 'getExpenses', shop_phone: phone });
  if (data.success) return data.expenses || [];
  return [];
}

export async function saveSettingsToSheet(settings, user) {
  return get({
    action: 'saveSettings',
    shop_phone: user.phone,
    shop_name: user.shop_name,
    settings_json: JSON.stringify(settings),
  });
}

export async function getSettingsFromSheet(phone) {
  const data = await get({ action: 'getSettings', shop_phone: phone });
  if (data.success) return data.settings || null;
  return null;
}
