import { generateId } from './utils';

export function registerUser(shopName, ownerName, phoneNumber, password, industryType) {
  const userId = generateId('user');
  const userData = {
    id: userId,
    phone: phoneNumber,
    password: password,
    owner_name: ownerName,
    shop_name: shopName,
    industry_type: industryType,
    status: 'active',
  };
  const users = JSON.parse(localStorage.getItem('pos-users') || '[]');
  if (users.find(u => u.phone === phoneNumber)) {
    return { success: false, error: 'Phone already registered' };
  }
  users.push(userData);
  localStorage.setItem('pos-users', JSON.stringify(users));
  localStorage.setItem('pos-user-token', userId);
  localStorage.setItem('pos-current-user', JSON.stringify(userData));
  return { success: true, userData };
}

export function loginUser(phoneNumber, password) {
  const users = JSON.parse(localStorage.getItem('pos-users') || '[]');
  const user = users.find(u => u.phone === phoneNumber);
  if (!user) return { success: false, error: 'Phone not registered' };
  if (user.password !== password) return { success: false, error: 'Wrong password' };
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
  localStorage.clear();
  return { success: true };
}
