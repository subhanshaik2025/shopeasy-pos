import { useState, useEffect } from 'react';
import AuthPage from './AuthPage';
import { getCurrentUser, isUserLoggedIn, logoutUser } from './auth';
import { INDUSTRIES } from './config';
import { generateId, calculateTotal } from './utils';
import { initializeAppData } from './loadGoogleSheet';
import { saveBillToSheet, getSalesFromSheet } from './salesSheets';

const GOLD = '#C9A84C';
const GOLD_LIGHT = '#E8C97A';
const BG = '#0F0F0F';
const SURFACE = '#1A1A1A';
const BORDER = '#2A2A2A';
const TEXT = '#DDDDDD';
const MUTED = '#888888';
const DIM = '#555555';

export default function POSApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [industry, setIndustry] = useState(null);
  const [products, setProducts] = useState([]);
  const [bills, setBills] = useState([]);
  const [cart, setCart] = useState([]);
  const [tab, setTab] = useState('billing');
  const [reportView, setReportView] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingBill, setLoadingBill] = useState(false);

  useEffect(() => {
    initializeAppData();
    if (isUserLoggedIn()) {
      const user = getCurrentUser();
      setCurrentUser(user);
      setIsLoggedIn(true);
      const ind = INDUSTRIES[user.industry_type];
      setIndustry(ind);
      setProducts(ind.sampleProducts || []);
      getSalesFromSheet(user.shop_name).then(sales => setBills(sales));
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    const ind = INDUSTRIES[user.industry_type];
    setIndustry(ind);
    setProducts(ind.sampleProducts || []);
    getSalesFromSheet(user.shop_name).then(sales => setBills(sales));
  };

  const handleLogout = () => {
    logoutUser();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCart([]);
    setBills([]);
  };

  if (!isLoggedIn) return <AuthPage onLoginSuccess={handleLoginSuccess} />;

  const subtotal = cart.reduce((s, c) => s + (c.price * c.qty), 0);
  const { grandTotal, gst } = calculateTotal(subtotal, 5);

  const completeBill = async (mode) => {
    if (cart.length === 0) { alert('Cart is empty'); return; }
    setLoadingBill(true);
    const bill = {
      id: generateId('bill'),
      items: cart,
      subtotal: Math.round(subtotal),
      gst: Math.round(gst),
      total: Math.round(grandTotal),
      mode,
      date: new Date().toLocaleDateString('en-IN'),
      timestamp: new Date().toISOString(),
    };
    await saveBillToSheet(bill, currentUser);
    const updated = [...bills, bill];
    setBills(updated);
    localStorage.setItem('pos-bills', JSON.stringify(updated));
    setCart([]);
    setLoadingBill(false);
    alert('Bill saved! Total: Rs.' + bill.total);
  };

  const parseBillDate = (b) => b.timestamp ? new Date(b.timestamp) : b.date ? new Date(b.date) : new Date();

  const filterByDate = (bills, dateStr) => bills.filter(b => parseBillDate(b).toISOString().split('T')[0] === dateStr);
  const filterByWeek = (bills) => { const w = new Date(Date.now() - 7*86400000); return bills.filter(b => parseBillDate(b) >= w); };
  const filterByMonth = (bills) => { const n = new Date(); return bills.filter(b => { const d = parseBillDate(b); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear(); }); };

  const getTopProducts = (bs) => {
    const map = {};
    bs.forEach(b => {
      const items = typeof b.items_json === 'string' ? JSON.parse(b.items_json) : (b.items||[]);
      items.forEach(item => {
        if (!map[item.name]) map[item.name] = { name: item.name, qty: 0, revenue: 0 };
        map[item.name].qty += item.qty;
        map[item.name].revenue += item.price * item.qty;
      });
    });
    return Object.values(map).sort((a,b) => b.revenue - a.revenue).slice(0,5);
  };

  const getDayWise = (bs) => {
    const map = {};
    bs.forEach(b => {
      const d = parseBillDate(b).toISOString().split('T')[0];
      if (!map[d]) map[d] = { date: d, total: 0, cash: 0, upi: 0, count: 0 };
      map[d].total += Number(b.total);
      map[d].count++;
      if ((b.mode||b.payment_mode)==='cash') map[d].cash += Number(b.total);
      else map[d].upi += Number(b.total);
    });
    return Object.values(map).sort((a,b) => b.date.localeCompare(a.date));
  };

  const selectedBills = reportView==='daily' ? filterByDate(bills,selectedDate) : reportView==='weekly' ? filterByWeek(bills) : filterByMonth(bills);
  const totalSales = selectedBills.reduce((s,b)=>s+Number(b.total),0);
  const cashSales = selectedBills.filter(b=>(b.mode||b.payment_mode)==='cash').reduce((s,b)=>s+Number(b.total),0);
  const upiSales = selectedBills.filter(b=>(b.mode||b.payment_mode)==='upi').reduce((s,b)=>s+Number(b.total),0);
  const gstTotal = selectedBills.reduce((s,b)=>s+Number(b.gst||0),0);
  const netProfit = totalSales - gstTotal;
  const topProducts = getTopProducts(selectedBills);
  const dayWise = getDayWise(reportView==='weekly' ? filterByWeek(bills) : filterByMonth(bills));
  const maxDay = Math.max(...dayWise.map(d=>d.total),1);

  const s = {
    root: { fontFamily: 'sans-serif', background: BG, minHeight: '100vh', color: TEXT },
    header: { background: SURFACE, borderBottom: '1px solid '+BORDER, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    logo: { fontSize: 20, fontWeight: 600, letterSpacing: 3, color: GOLD },
    shopName: { fontSize: 12, color: MUTED, marginTop: 2 },
    logoutBtn: { background: '#2A2A2A', border: '1px solid #3A3A3A', color: MUTED, padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer' },
    tabBar: { background: '#141414', display: 'flex', gap: 4, padding: '10px 20px 0', borderBottom: '1px solid #222', overflowX: 'auto' },
    tab: (active) => ({ padding: '8px 20px', borderRadius: '8px 8px 0 0', fontSize: 13, cursor: 'pointer', border: 'none', background: active ? SURFACE : 'transparent', color: active ? GOLD : '#555', fontWeight: active ? 600 : 400, borderTop: active ? '2px solid '+GOLD : '2px solid transparent', whiteSpace: 'nowrap' }),
    body: { background: BG, minHeight: 'calc(100vh - 115px)', padding: 20 },
    sectionTitle: { fontSize: 11, letterSpacing: 2, color: GOLD, textTransform: 'uppercase', margin: '0 0 14px' },
    productCard: { background: SURFACE, border: '1px solid '+BORDER, borderRadius: 12, padding: '12px 16px', marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    productName: { fontSize: 13, color: TEXT },
    productPrice: { fontSize: 14, fontWeight: 600, color: GOLD },
    cartItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #222' },
    cartName: { fontSize: 13, color: '#CCC', margin: 0 },
    cartQty: { fontSize: 11, color: DIM, margin: '2px 0 0' },
    cartTotal: { fontSize: 13, fontWeight: 500, color: TEXT },
    removeBtn: { background: '#2A1010', border: '1px solid #4A2020', color: '#CC4444', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 12, marginLeft: 8 },
    summaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: MUTED },
    grandRow: { display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 600, margin: '14px 0' },
    cashBtn: { flex: 1, padding: 14, background: GOLD, color: '#000', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5 },
    upiBtn: { flex: 1, padding: 14, background: 'transparent', color: GOLD, border: '1px solid '+GOLD+'66', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 10, marginBottom: 20 },
    statCard: (accent) => ({ background: SURFACE, border: '1px solid '+(accent ? GOLD+'44' : BORDER), borderRadius: 12, padding: 16 }),
    statLabel: { fontSize: 11, color: DIM, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 6px' },
    statValue: (color) => ({ fontSize: 22, fontWeight: 600, color: color||GOLD, margin: 0 }),
    statSub: { fontSize: 11, color: DIM, margin: '4px 0 0' },
    reportToggle: { display: 'flex', gap: 6, marginBottom: 16 },
    toggleBtn: (active) => ({ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: active?600:400, background: active ? GOLD : '#1A1A1A', color: active ? '#000' : MUTED, border: active?'none':'1px solid #2A2A2A', cursor: 'pointer', textTransform: 'capitalize' }),
    dateInput: { padding: '8px 12px', borderRadius: 8, border: '1px solid #333', background: '#1A1A1A', color: TEXT, fontSize: 14, marginBottom: 16 },
    topProductRow: (i) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: i===0 ? '#1E1A10' : SURFACE, border: '1px solid '+(i===0?GOLD+'33':BORDER), borderRadius: 10, marginBottom: 6 }),
    barBg: { background: '#222', borderRadius: 4, height: 6, marginTop: 4 },
  };

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div>
          <div style={s.logo}>FAR — POS</div>
          <div style={s.shopName}>{currentUser?.shop_name} &nbsp;·&nbsp; {currentUser?.owner_name}</div>
        </div>
        <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
      </div>

      <div style={s.tabBar}>
        {industry?.features?.map(f => (
          <button key={f} onClick={() => setTab(f)} style={s.tab(tab===f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
        ))}
      </div>

      <div style={s.body}>

        {tab === 'billing' && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <p style={s.sectionTitle}>Products</p>
              {products.map(p => (
                <div key={p.id} onClick={() => { const ex=cart.find(c=>c.id===p.id); setCart(ex?cart.map(c=>c.id===p.id?{...c,qty:c.qty+1}:c):[...cart,{...p,qty:1}]); }} style={s.productCard}>
                  <span style={s.productName}>{p.name}</span>
                  <span style={s.productPrice}>Rs. {p.price}</span>
                </div>
              ))}
            </div>

            <div style={{ flex: 1, minWidth: 260 }}>
              <p style={s.sectionTitle}>Cart</p>
              {cart.length === 0 && <p style={{ color: DIM, fontSize: 13 }}>No items added yet</p>}
              {cart.map(item => (
                <div key={item.id} style={s.cartItem}>
                  <div>
                    <p style={s.cartName}>{item.name}</p>
                    <p style={s.cartQty}>Rs. {item.price} × {item.qty}</p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center' }}>
                    <span style={s.cartTotal}>Rs. {(item.price*item.qty).toLocaleString()}</span>
                    <button onClick={() => setCart(cart.filter(c=>c.id!==item.id))} style={s.removeBtn}>×</button>
                  </div>
                </div>
              ))}
              {cart.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ borderTop: '1px solid #222', paddingTop: 14 }}>
                    <div style={s.summaryRow}><span>Subtotal</span><span style={{color:TEXT}}>Rs. {subtotal.toLocaleString()}</span></div>
                    <div style={s.summaryRow}><span>GST (5%)</span><span style={{color:TEXT}}>Rs. {Math.round(gst).toLocaleString()}</span></div>
                    <div style={s.grandRow}><span>Total</span><span style={{color:GOLD}}>Rs. {Math.round(grandTotal).toLocaleString()}</span></div>
                    <div style={{ display:'flex', gap:10 }}>
                      <button onClick={()=>completeBill('cash')} disabled={loadingBill} style={{...s.cashBtn, background:loadingBill?'#555':GOLD}}>
                        {loadingBill ? 'Saving...' : 'Cash'}
                      </button>
                      <button onClick={()=>completeBill('upi')} disabled={loadingBill} style={{...s.upiBtn, opacity:loadingBill?0.5:1}}>
                        {loadingBill ? '...' : 'UPI'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <p style={{...s.sectionTitle, margin:0}}>Reports</p>
              <button onClick={()=>getSalesFromSheet(currentUser.shop_name).then(s=>setBills(s))} style={{ background:'#1A1A1A', border:'1px solid #333', color:GOLD, padding:'6px 14px', borderRadius:8, fontSize:12, cursor:'pointer' }}>Refresh</button>
            </div>

            <div style={s.reportToggle}>
              {['daily','weekly','monthly'].map(v => (
                <button key={v} onClick={()=>setReportView(v)} style={s.toggleBtn(reportView===v)}>{v.charAt(0).toUpperCase()+v.slice(1)}</button>
              ))}
            </div>

            {reportView==='daily' && (
              <input type='date' value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} style={s.dateInput} />
            )}

            <div style={s.statGrid}>
              <div style={s.statCard(true)}>
                <p style={s.statLabel}>Total Sales</p>
                <p style={s.statValue(GOLD)}>Rs. {totalSales.toLocaleString()}</p>
                <p style={s.statSub}>{selectedBills.length} bills</p>
              </div>
              <div style={s.statCard(false)}>
                <p style={s.statLabel}>Net Profit</p>
                <p style={s.statValue('#A3E635')}>Rs. {netProfit.toLocaleString()}</p>
                <p style={s.statSub}>GST Rs. {gstTotal.toLocaleString()}</p>
              </div>
              <div style={s.statCard(false)}>
                <p style={s.statLabel}>Cash</p>
                <p style={s.statValue('#34D399')}>Rs. {cashSales.toLocaleString()}</p>
              </div>
              <div style={s.statCard(false)}>
                <p style={s.statLabel}>UPI</p>
                <p style={s.statValue('#FBBF24')}>Rs. {upiSales.toLocaleString()}</p>
              </div>
            </div>

            {topProducts.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={s.sectionTitle}>Top Products</p>
                {topProducts.map((p,i) => (
                  <div key={p.name} style={s.topProductRow(i)}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ fontSize:16, fontWeight:700, color:GOLD, minWidth:28 }}>#{i+1}</span>
                      <div>
                        <p style={{ margin:0, fontSize:13, color:TEXT }}>{p.name}</p>
                        <p style={{ margin:0, fontSize:11, color:DIM }}>Qty: {p.qty}</p>
                      </div>
                    </div>
                    <span style={{ fontWeight:600, color:GOLD }}>Rs. {p.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {(reportView==='weekly'||reportView==='monthly') && dayWise.length > 0 && (
              <div>
                <p style={s.sectionTitle}>Day Wise Sales</p>
                {dayWise.map(d => (
                  <div key={d.date} style={{ marginBottom:14, background:SURFACE, border:'1px solid '+BORDER, borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:12, color:MUTED }}>{new Date(d.date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</span>
                      <span style={{ fontSize:12, fontWeight:600, color:TEXT }}>Rs. {d.total.toLocaleString()} <span style={{color:DIM}}>({d.count} bills)</span></span>
                    </div>
                    <div style={s.barBg}>
                      <div style={{ background:'linear-gradient(90deg,'+GOLD+','+GOLD_LIGHT+')', borderRadius:4, height:6, width:(d.total/maxDay*100)+'%' }}></div>
                    </div>
                    <div style={{ display:'flex', gap:16, marginTop:6 }}>
                      <span style={{ fontSize:11, color:'#34D399' }}>Cash Rs. {d.cash.toLocaleString()}</span>
                      <span style={{ fontSize:11, color:'#FBBF24' }}>UPI Rs. {d.upi.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedBills.length === 0 && (
              <div style={{ textAlign:'center', padding:'60px 0', color:DIM }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📊</div>
                <p style={{ fontSize:14 }}>No sales data for this period</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
