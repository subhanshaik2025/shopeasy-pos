const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxi0p_VAIWPC0nZ-ybCK4aKL1wLevrRciBOBC7TtXOxHXr6KAoOXivNlCZXNQRKQMvEYQ/exec';

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
    const params = new URLSearchParams({
      action: 'registerUser',
      id: userData.id,
      phone: userData.phone,
      password: userData.password,
      owner_name: userData.owner_name,
      shop_name: userData.shop_name,
      industry_type: userData.industry_type,
    });
    const res = await fetch(APPS_SCRIPT_URL + '?' + params.toString());
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('saveRegisteredUser error:', err);
    return { success: false, error: 'Network error' };
  }
}