const URL = 'https://script.google.com/macros/s/AKfycbyWh7fm7c7C_LcwzVdf70Utn-09-h7EVs7O-IX-tkPsaI-T9hWToBrJZX-G4wPJ0PcelQ/exec';

const call = async (params) => {
  try {
    const res = await fetch(URL + '?' + new URLSearchParams(params).toString());
    return await res.json();
  } catch(e) { console.error('Sheet error:', e); return { success: false }; }
};

export async function getAllVendorData(user) {
  const data = await call({ action:'getAllVendorData', vendor_id:user.id, shop_name:user.shop_name });
  if (data.success) return data;
  return { products:[], khata:[], expenses:[], settings:null, sales:[] };
}

export async function saveBillToSheet(bill, user) {
  return call({ action:'saveBill', vendor_id:user.id, bill_id:bill.id, shop_phone:user.phone, shop_name:user.shop_name, items_json:JSON.stringify(bill.items), subtotal:bill.subtotal, discount:bill.discount||0, gst:bill.gst, gst_percent:bill.gstPercent||5, total:bill.total, payment_mode:bill.mode, date:bill.date, timestamp:bill.timestamp });
}

export async function getSalesFromSheet(user) {
  const data = await call({ action:'getSales', vendor_id:user.id, shop_name:user.shop_name });
  return data.success ? (data.sales||[]) : [];
}

export async function saveProductsToSheet(products, user) {
  return call({ action:'saveProducts', vendor_id:user.id, shop_phone:user.phone, shop_name:user.shop_name, products_json:JSON.stringify(products) });
}

export async function getProductsFromSheet(user) {
  const data = await call({ action:'getProducts', vendor_id:user.id });
  return data.success ? (data.products||[]) : [];
}

export async function saveKhataToSheet(khata, user) {
  return call({ action:'saveKhata', vendor_id:user.id, shop_phone:user.phone, shop_name:user.shop_name, khata_json:JSON.stringify(khata) });
}

export async function getKhataFromSheet(user) {
  const data = await call({ action:'getKhata', vendor_id:user.id });
  return data.success ? (data.khata||[]) : [];
}

export async function saveExpensesToSheet(expenses, user) {
  return call({ action:'saveExpenses', vendor_id:user.id, shop_phone:user.phone, shop_name:user.shop_name, expenses_json:JSON.stringify(expenses) });
}

export async function getExpensesFromSheet(user) {
  const data = await call({ action:'getExpenses', vendor_id:user.id });
  return data.success ? (data.expenses||[]) : [];
}

export async function saveSettingsToSheet(settings, user) {
  return call({ action:'saveSettings', vendor_id:user.id, shop_phone:user.phone, shop_name:user.shop_name, settings_json:JSON.stringify(settings) });
}

export async function getSettingsFromSheet(user) {
  const data = await call({ action:'getSettings', vendor_id:user.id });
  return data.success ? (data.settings||null) : null;
}
