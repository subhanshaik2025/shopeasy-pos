import { useState, useEffect } from 'react';
import AuthPage from './AuthPage';
import { getCurrentUser, isUserLoggedIn, logoutUser } from './auth';
import { INDUSTRIES, TRANSLATIONS } from './config';
import { generateId, calculateTotal, sum } from './utils';
import { initializeAppData } from './loadGoogleSheet';

export default function POSApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [industry, setIndustry] = useState(null);
  const [products, setProducts] = useState([]);
  const [bills, setBills] = useState([]);
  const [cart, setCart] = useState([]);
  const [tab, setTab] = useState('billing');

  useEffect(() => {
    initializeAppData();
    if (isUserLoggedIn()) {
      const user = getCurrentUser();
      setCurrentUser(user);
      setIsLoggedIn(true);
      const ind = INDUSTRIES[user.industry_type];
      setIndustry(ind);
      setProducts(ind.sampleProducts || []);
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    const ind = INDUSTRIES[user.industry_type];
    setIndustry(ind);
    setProducts(ind.sampleProducts || []);
  };

  const handleLogout = () => {
    logoutUser();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCart([]);
  };

  if (!isLoggedIn) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  const subtotal = cart.reduce((s, c) => s + (c.price * c.qty), 0);
  const { grandTotal, gst } = calculateTotal(subtotal, 5);

  const completeBill = (mode) => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }
    const bill = {
      id: generateId('bill'),
      items: cart,
      total: Math.round(grandTotal),
      mode: mode,
      date: new Date().toLocaleDateString(),
    };
    setBills([...bills, bill]);
    setCart([]);
    alert(`✅ Bill completed! Total: ₹${bill.total}`);
  };

  return (
    <div style={{ fontFamily: "'Noto Sans', sans-serif", background: '#F3F3EE', minHeight: '100vh', color: '#1a1a1a' }}>
      <div style={{ background: '#0D9488', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 24 }}>{industry?.icon}</div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{currentUser?.shop_name}</h1>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,.65)' }}>FAR-POS v2</p>
          </div>
        </div>
        <button onClick={handleLogout} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'rgba(220,38,38,.3)', color: '#fff', border: '1px solid rgba(220,38,38,.5)', cursor: 'pointer' }}>🚪 Logout</button>
      </div>

      <div style={{ display: 'flex', gap: 2, padding: '6px 12px 0', background: '#E8E8E3', overflowX: 'auto' }}>
        {industry?.features?.map((feature) => (
          <button key={feature} onClick={() => setTab(feature)} style={{ padding: '9px 16px', borderRadius: '8px 8px 0 0', fontSize: 13, fontWeight: tab === feature ? 700 : 500, background: tab === feature ? '#fff' : 'transparent', color: tab === feature ? '#0D9488' : '#999', border: 'none', cursor: 'pointer', textTransform: 'capitalize' }}>
            {feature}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', minHeight: 'calc(100vh - 120px)', padding: 16 }}>
        {tab === 'billing' && (
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <h3>Products</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                {products.map((p) => (
                  <div key={p.id} onClick={() => { const ex = cart.find(c => c.id === p.id); setCart(ex ? cart.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c) : [...cart, { ...p, qty: 1 }]); }} style={{ background: '#f9f9f9', borderRadius: 12, padding: 12, cursor: 'pointer', border: '1px solid #eee' }}>
                    <p style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0D9488' }}>₹{p.price}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <h3>Cart</h3>
              <div style={{ marginBottom: 12 }}>
                {cart.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600 }}>{item.name}</p>
                      <p style={{ fontSize: 10, color: '#999' }}>₹{item.price} × {item.qty}</p>
                    </div>
                    <span style={{ fontWeight: 700 }}>₹{(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div style={{ paddingTop: 12, borderTop: '2px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span>GST</span><span>₹{Math.round(gst).toLocaleString()}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, marginBottom: 12 }}><span>Total</span><span style={{ color: '#0D9488' }}>₹{Math.round(grandTotal).toLocaleString()}</span></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => completeBill('cash')} style={{ flex: 1, padding: 12, borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#0D9488', color: '#fff', border: 'none', cursor: 'pointer' }}>💵 Cash</button>
                  <button onClick={() => completeBill('upi')} style={{ flex: 1, padding: 12, borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#F59E0B', color: '#fff', border: 'none', cursor: 'pointer' }}>📱 UPI</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <div>
            <h3>Reports</h3>
            <p>Total Bills: {bills.length}</p>
            <p>Total Sales: ₹{sum(bills, 'total').toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
