// Offline-first sync queue with retry
import { saveBillToSheet } from '../salesSheets';

const KEY = (vendorId) => 'far-pos-queue-' + vendorId;

export function getQueue(vendorId) {
  try { return JSON.parse(localStorage.getItem(KEY(vendorId)) || '[]'); } catch(e) { return []; }
}

function setQueue(vendorId, q) {
  try { localStorage.setItem(KEY(vendorId), JSON.stringify(q)); } catch(e) {}
}

export function queueBill(bill, user) {
  if (!user || !user.id) return;
  const q = getQueue(user.id);
  q.push({ bill, attempts: 0, queuedAt: new Date().toISOString() });
  setQueue(user.id, q);
}

export function pendingCount(user) {
  if (!user || !user.id) return 0;
  return getQueue(user.id).length;
}

let flushing = false;
export async function flushQueue(user, onResult) {
  if (flushing || !user || !user.id) return;
  if (!navigator.onLine) { if (onResult) onResult({ synced: 0, pending: getQueue(user.id).length }); return; }
  flushing = true;
  const q = getQueue(user.id);
  const remaining = [];
  let synced = 0;
  for (const entry of q) {
    try {
      const res = await saveBillToSheet(entry.bill, user);
      if (res && res.success) { synced++; }
      else { entry.attempts = (entry.attempts || 0) + 1; remaining.push(entry); }
    } catch(e) {
      entry.attempts = (entry.attempts || 0) + 1;
      remaining.push(entry);
    }
  }
  setQueue(user.id, remaining);
  flushing = false;
  if (onResult) onResult({ synced, pending: remaining.length });
}
