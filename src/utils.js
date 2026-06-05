// ==========================================
// ShopEasy POS v2 — Utility Functions
// Calculations, formatting, ID generation
// ==========================================

export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function calculateGST(amount, gstRate) {
  return Math.round(amount * (gstRate / 100));
}

export function calculateTotal(subtotal, gstRate = 5, discount = 0) {
  const discountAmount = (subtotal * discount) / 100;
  const afterDiscount = subtotal - discountAmount;
  const gst = calculateGST(afterDiscount, gstRate);
  return {
    subtotal,
    discount: discountAmount,
    afterDiscount,
    gst,
    grandTotal: afterDiscount + gst,
  };
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date, format = 'DD/MM/YYYY') {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  if (format === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
  if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  return date.toString();
}

export function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getToday() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateProfit(totalAmount, costAmount, gstAmount) {
  return totalAmount - costAmount - gstAmount;
}

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePhone(phone) {
  const re = /^[0-9]{10}$/;
  return re.test(phone);
}

export function isLowStock(stock, lowStockAlert) {
  return stock <= (lowStockAlert || 10);
}

export function generateBillNumber(counter, prefix = 'BILL') {
  return `${prefix}${String(counter).padStart(6, '0')}`;
}

export function calculateAverage(numbers) {
  if (!numbers || numbers.length === 0) return 0;
  return Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length);
}

export function calculatePercentage(current, total) {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}

export function getTopItems(items, key, limit = 5) {
  return items
    .sort((a, b) => (b[key] || 0) - (a[key] || 0))
    .slice(0, limit);
}

export function groupByKey(items, key) {
  return items.reduce((acc, item) => {
    const k = item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

export function sum(items, key) {
  return items.reduce((acc, item) => acc + (item[key] || 0), 0);
}

export function countBy(items, key) {
  return items.reduce((acc, item) => {
    const k = item[key];
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

export function roundTo(value, decimals = 2) {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export const storage = {
  get(key, fallback = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      console.error('Storage get error:', e);
      return fallback;
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Storage remove error:', e);
      return false;
    }
  },
  
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('Storage clear error:', e);
      return false;
    }
  },
};

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export async function checkInternetConnection() {
  try {
    const response = await fetch('https://www.google.com', { mode: 'no-cors' });
    return true;
  } catch (e) {
    return false;
  }
}

export function getBrowserInfo() {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    onLine: navigator.onLine,
    deviceMemory: navigator.deviceMemory,
    cores: navigator.hardwareConcurrency,
  };
}

export function printBillToConsole(bill) {
  console.log('=== BILL ===');
  console.log(`Bill #: ${bill.num}`);
  console.log(`Date: ${bill.date}`);
  console.log(`Time: ${bill.time}`);
  console.log('Items:');
  bill.items?.forEach(item => {
    console.log(`  ${item.name} x${item.qty} = ₹${item.total}`);
  });
  console.log(`Subtotal: ₹${bill.subtotal}`);
  console.log(`GST: ₹${bill.gst}`);
  console.log(`Total: ₹${bill.total}`);
  console.log(`Payment: ${bill.mode}`);
  console.log('=============');
}

export function exportToCSV(data, filename = 'export.csv') {
  if (!data || !data.length) return;
  
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(field =>
        JSON.stringify(row[field] || '')
      ).join(',')
    ),
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function retry(func, times = 3, delay = 1000) {
  let lastError;
  for (let i = 0; i < times; i++) {
    try {
      return await func();
    } catch (e) {
      lastError = e;
      if (i < times - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

export function objectToFormData(obj) {
  const formData = new FormData();
  Object.keys(obj).forEach(key => {
    if (obj[key] !== null && obj[key] !== undefined) {
      if (obj[key] instanceof File) {
        formData.append(key, obj[key]);
      } else if (typeof obj[key] === 'object') {
        formData.append(key, JSON.stringify(obj[key]));
      } else {
        formData.append(key, obj[key]);
      }
    }
  });
  return formData;
}
