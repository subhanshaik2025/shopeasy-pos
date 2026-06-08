export function verifyPhoneNumberFromSheet(phoneNumber) {
  const allowedUsers = JSON.parse(localStorage.getItem('far-pos-allowed-users') || '[]');
  const user = allowedUsers.find(u => u.phone === phoneNumber);
  if (!user) {
    return { success: false, error: 'Phone not authorized' };
  }
  return { success: true, user };
}
