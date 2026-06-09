import { generateId } from './utils';
import { saveRegisteredUser, fetchRegisteredUsers } from './googleSheets';

export async function registerUser(shopName, ownerName, phoneNumber, password, industryType) {
  const userId = generateId('user');
  const userData = { id:userId, phone:String(phoneNumber).trim(), password:String(password), owner_name:ownerName, shop_name:shopName, industry_type:industryType, status:'active' };
  const result = await saveRegisteredUser(userData);
  if (!result.success) return result;
  const users = JSON.parse(localStorage.getItem('pos-users') || '[]');
  users.push(userData);
  localStorage.setItem('pos-users', JSON.stringify(users));
  localStorage.setItem('pos-user-token', userId);
  localStorage.setItem('pos-current-user', JSON.stringify(userData));
  return { success: true, userData };
}

export async function loginUser(phoneNumber, password) {
  const users = await fetchRegisteredUsers();
  const phone = String(phoneNumber).replace(/[^0-9]/g,'').trim();
  const raw = users.find(u => String(u.phone).replace(/[^0-9]/g,'').trim() === phone);
  if (!raw) return { success: false, error: 'Phone not registered' };
  if (String(raw.password).trim() !== String(password).trim()) return { success: false, error: 'Wrong password' };
  const user = {
    id: String(raw.id||'').trim(),
    phone: String(raw.phone||'').trim(),
    password: String(raw.password||'').trim(),
    owner_name: String(raw.owner_name||'').trim(),
    shop_name: String(raw.shop_name||'').trim(),
    industry_type: String(raw.industry_type||'').trim(),
    status: String(raw.status||'active').trim(),
  };
  if (!user.id) return { success: false, error: 'Account error - contact support' };
  localStorage.setItem('pos-user-token', user.id);
  localStorage.setItem('pos-current-user', JSON.stringify(user));
  return { success: true, user };
}

export function getCurrentUser() {
  const user = localStorage.getItem('pos-current-user');
  return user ? JSON.parse(user) : null;
}

export function isUserLoggedIn() {
  return !!localStorage.getItem('pos-user-token');
}

export function logoutUser() {
  localStorage.removeItem('pos-user-token');
  localStorage.removeItem('pos-current-user');
  return { success: true };
}