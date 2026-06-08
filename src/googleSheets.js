const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbygYlpYQz5CR3s0mn0gZrb8jrgkPc7Y8GeL2tmSG7PLgLh1i5BNrB39ezZm-iRNiZEYUQ/exec';

export async function fetchAllowedUsers() {
  try {
    const res = await fetch(APPS_SCRIPT_URL + '?action=getAllowedUsers');
    const data = await res.json();
    if (data.success) {
      const users = data.users.map(u => ({
        phone: String(u['Phone Number'] || u['phone'] || '').trim(),
        ownerName: u['Owner Name'] || u['ownerName'] || '',
        shopName: u['Shop Name'] || u['shopName'] || '',
        industryType: u['Industry Type'] || u['industryType'] || '',
        plan: u['Plan'] || u['plan'] || 'starter',
        status: u['Status'] || u['status'] || 'active',
      }));
      localStorage.setItem('far-pos-allowed-users', JSON.stringify(users));
      return users;
    }
  } catch (err) {
    console.error('fetchAllowedUsers error:', err);
  }
  return JSON.parse(localStorage.getItem('far-pos-allowed-users') || '[]');
}

export async function verifyPhoneNumberFromSheet(phoneNumber) {
  const users = await fetchAllowedUsers();
  const user = users.find(u => String(u.phone).trim() === String(phoneNumber).trim());
  if (!user) return { success: false, error: 'Phone not authorized' };
  return { success: true, user };
}

export async function fetchRegisteredUsers() {
  try {
    const res = await fetch(APPS_SCRIPT_URL + '?action=getRegisteredUsers');
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('pos-users', JSON.stringify(data.users));
      return data.users;
    }
  } catch (err) {
    console.error('fetchRegisteredUsers error:', err);
  }
  return JSON.parse(localStorage.getItem('pos-users') || '[]');
}

export async function saveRegisteredUser(userData) {
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'registerUser', ...userData }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('saveRegisteredUser error:', err);
    return { success: false, error: 'Network error' };
  }
}