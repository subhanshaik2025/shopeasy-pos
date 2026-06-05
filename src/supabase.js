import { createClient } from '@supabase/supabase-js';
import { generateId } from './utils';

const SUPABASE_URL = 'https://ilypzedibfylgzyayfqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlseXB6ZWRpYmZ5bGd6eWF5ZnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzYyNTIsImV4cCI6MjA5NjI1MjI1Mn0.bU_a_KBJTM7meUxrLmZ_q5p-pjanYPORhwBFX7yjF6g';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function loadShop() {
  try {
    const { data } = await supabase.from('shops').select('*').limit(1).single();
    if (data) {
      localStorage.setItem('pos-shop', JSON.stringify(data));
      return data;
    }
  } catch (e) {
    console.log('Load shop failed:', e);
  }
  try {
    const local = localStorage.getItem('pos-shop');
    return local ? JSON.parse(local) : null;
  } catch {
    return null;
  }
}

export async function saveShop(shop) {
  localStorage.setItem('pos-shop', JSON.stringify(shop));
  try {
    const { data: existing } = await supabase.from('shops').select('id').limit(1).single();
    if (existing) {
      await supabase.from('shops').update({ ...shop, updated_at: new Date() }).eq('id', existing.id);
    } else {
      await supabase.from('shops').insert({ id: generateId('shop'), ...shop });
    }
  } catch (e) {
    console.log('Save shop error:', e);
  }
}

export async function loadProducts(shopId) {
  try {
    const { data } = await supabase.from('products').select('*').eq('shop_id', shopId).order('name');
    if (data && data.length > 0) {
      localStorage.setItem('pos-products', JSON.stringify(data));
      return data;
    }
  } catch (e) {
    console.log('Load products error:', e);
  }
  const local = localStorage.getItem('pos-products');
  return local ? JSON.parse(local) : [];
}

export async function saveProduct(shopId, product) {
  try {
    if (!product.id) product.id = generateId('prod');
    const { data: existing } = await supabase.from('products').select('id').eq('id', product.id).eq('shop_id', shopId).single();
    if (existing) {
      await supabase.from('products').update({ ...product, updated_at: new Date() }).eq('id', product.id);
    } else {
      await supabase.from('products').insert({ shop_id: shopId, ...product });
    }
    return product;
  } catch (e) {
    console.log('Save product error:', e);
    throw e;
  }
}

export async function deleteProduct(productId) {
  try {
    await supabase.from('products').delete().eq('id', productId);
  } catch (e) {
    console.log('Delete product error:', e);
  }
}

export async function updateProductStock(productId, newStock) {
  try {
    await supabase.from('products').update({ stock: newStock, updated_at: new Date() }).eq('id', productId);
  } catch (e) {
    console.log('Update stock error:', e);
  }
}

export async function loadCustomers(shopId) {
  try {
    const { data } = await supabase.from('customers').select('*').eq('shop_id', shopId).order('name');
    if (data && data.length > 0) {
      localStorage.setItem('pos-customers', JSON.stringify(data));
      return data;
    }
  } catch (e) {
    console.log('Load customers error:', e);
  }
  const local = localStorage.getItem('pos-customers');
  return local ? JSON.parse(local) : [];
}

export async function saveCustomer(shopId, customer) {
  try {
    if (!customer.id) customer.id = generateId('cust');
    const { data: existing } = await supabase.from('customers').select('id').eq('id', customer.id).eq('shop_id', shopId).single();
    if (existing) {
      await supabase.from('customers').update(customer).eq('id', customer.id);
    } else {
      await supabase.from('customers').insert({ shop_id: shopId, ...customer });
    }
    return customer;
  } catch (e) {
    console.log('Save customer error:', e);
    throw e;
  }
}

export async function updateCustomerCredit(customerId, creditAmount) {
  try {
    await supabase.from('customers').update({ credit_balance: creditAmount }).eq('id', customerId);
  } catch (e) {
    console.log('Update credit error:', e);
  }
}

export async function saveBill(shopId, bill) {
  try {
    if (!bill.id) bill.id = generateId('bill');
    await supabase.from('bills').insert({ shop_id: shopId, ...bill });
    if (bill.items && Array.isArray(bill.items)) {
      for (const item of bill.items) {
        const { data: product } = await supabase.from('products').select('stock').eq('id', item.id).single();
        if (product) {
          const newStock = (product.stock || 0) - (item.qty || 0);
          await updateProductStock(item.id, newStock);
        }
      }
    }
    if (bill.mode === 'credit' && bill.customer_id) {
      const { data: customer } = await supabase.from('customers').select('credit_balance').eq('id', bill.customer_id).single();
      if (customer) {
        const newCredit = (customer.credit_balance || 0) + bill.total;
        await updateCustomerCredit(bill.customer_id, newCredit);
      }
    }
    return bill;
  } catch (e) {
    console.log('Save bill error:', e);
    throw e;
  }
}

export async function loadBills(shopId, limit = 100) {
  try {
    const { data } = await supabase.from('bills').select('*').eq('shop_id', shopId).order('created_at', { ascending: false }).limit(limit);
    if (data && data.length > 0) {
      localStorage.setItem('pos-bills', JSON.stringify(data));
      return data;
    }
  } catch (e) {
    console.log('Load bills error:', e);
  }
  const local = localStorage.getItem('pos-bills');
  return local ? JSON.parse(local) : [];
}

export async function recordPayment(shopId, customerId, amount, paymentMode) {
  try {
    const { data: customer } = await supabase.from('customers').select('credit_balance').eq('id', customerId).single();
    const newBalance = Math.max(0, (customer?.credit_balance || 0) - amount);
    await supabase.from('credit_ledger').insert({
      id: generateId('ledger'),
      shop_id: shopId,
      customer_id: customerId,
      type: 'payment_received',
      amount: amount,
      balance_after: newBalance,
      payment_mode: paymentMode,
    });
    await updateCustomerCredit(customerId, newBalance);
    return newBalance;
  } catch (e) {
    console.log('Record payment error:', e);
    throw e;
  }
}

export function isConnected() {
  return navigator.onLine;
}

export function clearAllCache() {
  localStorage.removeItem('pos-shop');
  localStorage.removeItem('pos-products');
  localStorage.removeItem('pos-customers');
  localStorage.removeItem('pos-bills');
}
