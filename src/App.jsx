import { useState, useEffect } from 'react';
import { INDUSTRIES, TRANSLATIONS } from './config';
import { generateId, calculateTotal, formatCurrency } from './utils';

export default function POSApp() {
  const [industry, setIndustry] = useState(null);
  const [shop, setShop] = useState(null);
  const [lang, setLang] = useState('en');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [tab, setTab] = useState('billing');

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const saved = localStorage.getItem('pos-industry');
    if (saved) {
      setIndustry(JSON.parse(saved));
      const savedShop = localStorage.getItem('pos-shop');
      if (savedShop) setShop(JSON.parse(savedShop));
      const savedProducts = localStorage.getItem('pos-products');
      if (savedProducts) setProducts(JSON.parse(savedProducts));
    }
  }, []);

  const selectIndustry = (key) => {
    const ind = INDUSTRIES[key];
    localStorage.setItem('pos-industry', JSON.stringify(ind));
    setIndustry(ind);
    setProducts(ind.sampleProducts || []);
  };

  const setupShop = (e) => {
    e.preventDefault();
    const shopData = {
      id: generateId('shop'),
      name: e.target.shopName.value,
      owner: e.target.ownerName.value,
      industry: industry.id,
      createdAt: new Date(),
    };
    localStorage.setItem('pos-shop', JSON.stringify(shopData));
    setShop(shopData);
  };

  if (!industry) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #E6F7F5, #F3F3EE)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Noto Sans', sans-serif" }}>
        <div style={{ maxWidth: 900, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: '#0D9488', marginBottom: 8 }}>🏪 ShopEasy POS v2</h1>
            <p style={{ fontSize: 16, color: '#666', lineHeight: 1.6 }}>{t.welcome}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {Object.entries(INDUSTRIES).map(([key, ind]) => (
              <div key={key} onClick={() => selectIndustry(key)} style={{ background: '#fff', borderRadius: 16, padding: 24, cursor: 'pointer', border: '2px solid #eee', transition: 'all 0.2s', textAlign: 'center' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0D9488'; e.currentTarget.style.transform = 'translateY(-4px)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{ind.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>{ind.name}</h3>
                <p style={{ fontSize: 12, color: '#999', lineHeight: 1.5, marginBottom: 14 }}>{ind.description}</p>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {ind.features.slice(0, 3).map((f) => (
                    <span key={f} style={{ fontSize: 10, background: '#E6F7F5', color: '#0D9488', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div style={{ background: '#F3F3EE', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Noto Sans', sans-serif" }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 400, width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ fontSize: 32 }}>{industry.icon}</div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0D9488' }}>Setup Your Shop</h2>
              <p style={{ fontSize: 12, color: '#999' }}>{industry.name}</p>
            </div>
          </div>
          <form onSubmit={setupShop}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>Shop Name</label>
              <input type="text" name="shopName" required style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14 }} placeholder="My Shop" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>Owner Name</label>
              <input type="text" name="ownerName" required style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14 }} placeholder="Your Name" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>Language</label>
              <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14 }}>
                <option value="en">English</option>
                <option value="te">తెలుగు (Telugu)</option>
              </select>
            </div>
            <button type="submit" style={{ width: '100%', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#0D9488', color: '#fff', border: 'none', cursor: 'pointer' }}>Get Started</button>
          </form>
        </div>
      </div>
    );
  }

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const { grandTotal, gst } = calculateTotal(subtotal, 5);

  return (
    <div style={{ fontFamily: "'Noto Sans', sans-serif", background: '#F3F3EE', minHeight: '100vh', color: '#1a1a1a' }}>
      <div style={{ background: '#0D9488', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 24 }}>{industry.icon}</div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{shop.name}</h1>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,.65)' }}>ShopEasy POS v2</p>
          </div>
        </div>
        <button onClick={() => setLang(lang === 'en' ? 'te' : 'en')} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,.2)', color: '#fff', border: 'none', cursor: 'pointer' }}>
          {lang === 'en' ? 'తెలుగు' : 'EN'}
        </button>
      </div>

      <div style={{ background: '#fff', minHeight: 'calc(100vh - 120px)', padding: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 55%', minWidth: 250 }}>
            <input type="text" placeholder={t.search} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', marginBottom: 12, fontSize: 14 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
              {products.map((p) => (
                <div key={p.id} onClick={() => setCart(prev => {
                  const ex = prev.find(c => c.id === p.id);
                  return ex ? prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c) : [...prev, { ...p, qty: 1 }];
                })} style={{ background: '#f9f9f9', borderRadius: 12, padding: 12, cursor: 'pointer', border: '1.5px solid #eee', transition: 'all 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0D9488'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <p style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{p.name}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0D9488' }}>₹{p.price}</p>
                  {p.stock !== undefined && <p style={{ fontSize: 10, color: '#999' }}>{p.stock} left</p>}
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: '1 1 40%', minWidth: 250, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>🧾 {t.cart}</h3>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 320px)', marginBottom: 12 }}>
              {cart.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600 }}>{item.name}</p>
                    <p style={{ fontSize: 10, color: '#999' }}>₹{item.price} × {item.qty}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button onClick={() => setCart(prev => prev.map(c => c.id === item.id ? { ...c, qty: c.qty - 1 } : c).filter(c => c.qty > 0))} style={{ width: 28, height: 28, borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>−</button>
                    <span style={{ fontSize: 12, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => setCart(prev => prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c))} style={{ width: 28, height: 28, borderRadius: '50%', background: '#E6F7F5', color: '#0D9488', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>+</button>
                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 55, textAlign: 'right' }}>₹{(item.price * item.qty).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ paddingTop: 12, borderTop: '2px solid #eee', marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999', marginBottom: 3 }}>
                <span>{t.subtotal}</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999', marginBottom: 8 }}>
                <span>{t.gst}</span>
                <span>₹{gst.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, margin: '8px 0 12px' }}>
                <span>{t.grandTotal}</span>
                <span style={{ color: '#0D9488' }}>₹{grandTotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ flex: 2, padding: 12, borderRadius: 10, fontSize: 13, fontWeight: 700, background: cart.length ? '#0D9488' : '#ddd', color: '#fff', border: 'none', cursor: 'pointer' }}>💵 {t.pay}</button>
                <button style={{ flex: 1, padding: 12, borderRadius: 10, fontSize: 13, fontWeight: 700, background: cart.length ? '#F59E0B' : '#e5e5e5', color: '#fff', border: 'none', cursor: 'pointer' }}>📒 {t.credit}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
