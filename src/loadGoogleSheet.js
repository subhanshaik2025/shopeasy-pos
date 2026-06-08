export function initializeAppData() {
  const users = [
    { phone: '9533360607', ownerName: 'Subhan', shopName: 'Far', industryType: 'salon', plan: 'pro', status: 'active' },
    { phone: '9876543210', ownerName: 'Subhan', shopName: 'My Kirana Store', industryType: 'kirana', plan: 'pro', status: 'active' },
    { phone: '9988776655', ownerName: 'Ramesh', shopName: 'Hotel XYZ', industryType: 'restaurant', plan: 'starter', status: 'active' },
    { phone: '9123456789', ownerName: 'Priya', shopName: 'Cloth Boutique', industryType: 'cloth', plan: 'pro', status: 'active' },
    { phone: '9876543211', ownerName: 'Raj', shopName: 'Pharmacy Plus', industryType: 'pharmacy', plan: 'starter', status: 'active' },
  ];
  localStorage.setItem('far-pos-allowed-users', JSON.stringify(users));
  console.log('✅ All users loaded!');
}
