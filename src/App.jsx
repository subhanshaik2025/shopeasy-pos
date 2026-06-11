import { useState, useEffect, useRef } from 'react';
import AuthPage from './AuthPage';
import { getCurrentUser, isUserLoggedIn, logoutUser } from './auth';
import { INDUSTRIES, TRANSLATIONS } from './config';
import { generateId, calculateTotal } from './utils';
import { initializeAppData } from './loadGoogleSheet';
import { getAllVendorData, saveBillToSheet, getSalesFromSheet, saveProductsToSheet, getProductsFromSheet, saveKhataToSheet, getKhataFromSheet, saveExpensesToSheet, getExpensesFromSheet, saveSettingsToSheet, getSettingsFromSheet } from './salesSheets';
import { queueBill, flushQueue, pendingCount } from './utils/syncQueue';
import { sanitizeProducts, sanitizeKhata, sanitizeExpenses, sanitizeSettings } from './utils/billUtils';
import { GOLD, GOLD_L, BG, BOR, SURF, TX, DIM, MU, inp, goldBtn, ghostBtn, card, sT } from './utils/theme';
import { parseItems } from './utils/billUtils';
import BillingTab from './components/BillingTab';
import HistoryTab from './components/HistoryTab';
import ReportsTab from './components/ReportsTab';

export default function POSApp() {
  const [isLoggedIn,setIsLoggedIn]=useState(false);
  const [currentUser,setCurrentUser]=useState(null);
  const [industry,setIndustry]=useState(null);
  const [products,setProducts]=useState([]);
  const [bills,setBills]=useState([]);
  const [cart,setCart]=useState([]);
  const [tab,setTab]=useState('billing');
  const [discount,setDiscount]=useState(0);
  const [discountType,setDiscountType]=useState('percent');
  const [loadingBill,setLoadingBill]=useState(false);
  const [khata,setKhata]=useState([]);
  const [expenses,setExpenses]=useState([]);
  const [showAddProduct,setShowAddProduct]=useState(false);
  const [showAddKhata,setShowAddKhata]=useState(false);
  const [editProduct,setEditProduct]=useState(null);
  const [newProduct,setNewProduct]=useState({name:'',price:'',stock:'',category:''});
  const [newKhata,setNewKhata]=useState({customer:'',phone:'',amount:'',note:''});
  const [shopSettings,setShopSettings]=useState({gstin:'',gstPercent:5,shopAddress:'',shopPhone:''});
  const [editSettings,setEditSettings]=useState(false);
  const [lang,setLang]=useState(localStorage.getItem('far-pos-lang')||'en');
  const [toast,setToast]=useState(null);
  const [appLoading,setAppLoading]=useState(true);
  const [isOnline,setIsOnline]=useState(navigator.onLine);
  const userRef = useRef(null);
  const t=(k)=>(TRANSLATIONS[lang]&&TRANSLATIONS[lang][k])||TRANSLATIONS['en'][k]||k;
  const showToast=(msg,type='success')=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const loadUserData = (user, ind) => {
    setAppLoading(true);
    getSalesFromSheet(user).then(s=>{ if(Array.isArray(s)) setBills(s); }).catch(()=>{});
    getProductsFromSheet(user).then(p=>{ const clean=sanitizeProducts(p); if(clean.length>0) setProducts(clean); else { const sv=localStorage.getItem('pos-products-'+user.id); if(sv) setProducts(sanitizeProducts(JSON.parse(sv))); else setProducts(ind.sampleProducts||[]); } }).catch(()=>{});
    getSettingsFromSheet(user).then(st=>{ const clean=sanitizeSettings(st); if(clean) setShopSettings(clean); else { const sv=localStorage.getItem('pos-settings-'+user.id); if(sv){ const c2=sanitizeSettings(JSON.parse(sv)); if(c2) setShopSettings(c2); } } }).catch(()=>{});
    getKhataFromSheet(user).then(k=>{ const clean=sanitizeKhata(k); if(clean.length>0) setKhata(clean); else { const sv=localStorage.getItem('pos-khata-'+user.id); if(sv) setKhata(sanitizeKhata(JSON.parse(sv))); } }).catch(()=>{});
    getExpensesFromSheet(user).then(e=>{ const clean=sanitizeExpenses(e); if(clean.length>0) setExpenses(clean); else { const sv=localStorage.getItem('pos-expenses-'+user.id); if(sv) setExpenses(sanitizeExpenses(JSON.parse(sv))); } }).catch(()=>{});
    flushQueue(user,(r)=>{ if(r.synced>0) showToast(r.synced+' offline bill(s) synced!','success'); });
    setTimeout(()=>setAppLoading(false), 3000);
  };

  useEffect(()=>{
    const onOnline=()=>{ setIsOnline(true); const u=userRef.current; if(u) flushQueue(u,(r)=>{ if(r.synced>0) showToast(r.synced+' offline bill(s) synced!','success'); }); };
    const onOffline=()=>setIsOnline(false);
    window.addEventListener('online',onOnline);
    window.addEventListener('offline',onOffline);
    initializeAppData();
    if(isUserLoggedIn()){
      const user=getCurrentUser();
      userRef.current=user;
      setCurrentUser(user);
      setIsLoggedIn(true);
      const ind=INDUSTRIES[user.industry_type];
      setIndustry(ind);
      loadUserData(user, ind);
    } else { setAppLoading(false); }
    return ()=>{ window.removeEventListener('online',onOnline); window.removeEventListener('offline',onOffline); };
  },[]);

  const saveProducts=async(p,user)=>{ const u=user||currentUser; setProducts(p); localStorage.setItem('pos-products-'+u.id,JSON.stringify(p)); saveProductsToSheet(p,u); };
  const saveKhata=async(k)=>{ setKhata(k); localStorage.setItem('pos-khata-'+currentUser.id,JSON.stringify(k)); saveKhataToSheet(k,currentUser); };
  const saveExpenses=async(e)=>{ setExpenses(e); localStorage.setItem('pos-expenses-'+currentUser.id,JSON.stringify(e)); saveExpensesToSheet(e,currentUser); };
  const saveSettings=async(s)=>{ setShopSettings(s); localStorage.setItem('pos-settings-'+currentUser.id,JSON.stringify(s)); saveSettingsToSheet(s,currentUser); };

  const handleLoginSuccess=(user)=>{
    userRef.current=user;
    setCurrentUser(user);
    setIsLoggedIn(true);
    const ind=INDUSTRIES[user.industry_type];
    setIndustry(ind);
    loadUserData(user, ind);
  };

  const handleLogout=()=>{ logoutUser(); setIsLoggedIn(false); setCurrentUser(null); setCart([]); setBills([]); setKhata([]); setExpenses([]); setAppLoading(true); };

  if(!isLoggedIn) return <AuthPage onLoginSuccess={handleLoginSuccess}/>;

  const subtotal=cart.reduce((s,c)=>s+(c.price*c.qty),0);
  const discountAmt=discountType==='percent'?Math.round(subtotal*discount/100):Math.min(discount,subtotal);
  const afterDiscount=subtotal-discountAmt;
  const gstPct=shopSettings.gstPercent||5;
  const {grandTotal,gst}=calculateTotal(afterDiscount,gstPct);
  const lowStock=products.filter(p=>p.stock!==undefined&&p.stock<=5);
  const totalKhataOwed=khata.filter(k=>k.type==='given'&&!k.paid).reduce((s,k)=>s+Number(k.amount),0);
  const tabStyle=(a)=>({padding:'8px 20px',borderRadius:'8px 8px 0 0',fontSize:13,cursor:'pointer',border:'none',background:a?SURF:'transparent',color:a?GOLD:'#555',fontWeight:a?600:400,borderTop:a?'2px solid '+GOLD:'2px solid transparent',whiteSpace:'nowrap'});

  const generateBillText=(bill)=>{
    const items=parseItems(bill);
    const time=new Date(bill.timestamp||Date.now()).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
    let msg='🧾 FAR-POS — Bill Receipt\n━━━━━━━━━━━━━━━━━━━━\n';
    msg+='Shop: '+currentUser.shop_name+'\nBill: '+(bill.id||bill.bill_id)+'\nDate: '+bill.date+'\nTime: '+time+'\n━━━━━━━━━━━━━━━━━━━━\nITEMS\n';
    items.forEach(item=>{ msg+=item.name+' x'+item.qty+' .... Rs. '+(Number(item.price||0)*Number(item.qty||1)).toLocaleString()+'\n'; });
    msg+='━━━━━━━━━━━━━━━━━━━━\nSubtotal: Rs. '+Number(bill.subtotal||0).toLocaleString()+'\n';
    if(Number(bill.discount||0)>0) msg+='Discount: - Rs. '+Number(bill.discount).toLocaleString()+'\n';
    msg+='GST: Rs. '+Number(bill.gst||0).toLocaleString()+'\n────────────────────\nTOTAL: Rs. '+Number(bill.total||0).toLocaleString()+'\n────────────────────\nPayment: '+(bill.mode||bill.payment_mode||'').toUpperCase()+'\n\nThank you!\nPowered by FAR-POS';
    return msg;
  };

  const shareOnWhatsApp=(bill)=>{
    const items=parseItems(bill);
    let msg='*'+currentUser.shop_name+'*\nBill: '+(bill.id||bill.bill_id)+'\nDate: '+bill.date+'\n\n';
    items.forEach(i=>{ msg+=i.name+' x'+i.qty+' = Rs.'+(Number(i.price||0)*Number(i.qty||1))+'\n'; });
    msg+='\nTotal: Rs.'+bill.total+'\nPayment: '+(bill.mode||bill.payment_mode||'').toUpperCase();
    window.open('https://wa.me/?text='+encodeURIComponent(msg));
  };

  const generateGSTInvoice=(bill)=>{
    const items=parseItems(bill);
    const billGstPct=Number(bill.gstPercent||shopSettings.gstPercent||5);
    const cgst=Math.round(Number(bill.gst||0)/2);
    const sgst=cgst;
    const numToWords=(n)=>{
      const a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
      const b=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
      if(n===0)return 'Zero'; if(n<20)return a[n]; if(n<100)return b[Math.floor(n/10)]+(n%10?' '+a[n%10]:'');
      if(n<1000)return a[Math.floor(n/100)]+' Hundred'+(n%100?' '+numToWords(n%100):'');
      if(n<100000)return numToWords(Math.floor(n/1000))+' Thousand'+(n%1000?' '+numToWords(n%1000):'');
      return numToWords(Math.floor(n/100000))+' Lakh'+(n%100000?' '+numToWords(n%100000):'');
    };
    const html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>GST Invoice</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;background:#fff;color:#111;font-size:13px;}.page{max-width:700px;margin:0 auto;padding:30px;border:2px solid #111;}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;}.title{text-align:center;font-size:18px;font-weight:700;letter-spacing:2px;border:1px solid #111;padding:6px;margin-bottom:16px;}table{width:100%;border-collapse:collapse;margin-bottom:16px;}th{background:#111;color:#fff;padding:8px;text-align:left;font-size:11px;}td{padding:8px;border-bottom:1px solid #eee;}.totals{display:flex;justify-content:flex-end;margin-bottom:16px;}.totals-table{width:260px;border:1px solid #111;}.totals-table td{padding:6px 10px;border-bottom:1px solid #eee;}.totals-table td:last-child{text-align:right;font-weight:600;}.grand td{background:#111;color:#fff;font-weight:700;}.words-box{background:#f5f5f5;border:1px solid #ddd;padding:10px;margin-bottom:16px;font-size:12px;}.footer{display:flex;justify-content:space-between;margin-top:30px;padding-top:16px;border-top:1px solid #111;}.sign-box{text-align:center;width:200px;}.sign-line{border-top:1px solid #111;margin-top:40px;padding-top:6px;font-size:11px;color:#666;}.stamp{display:inline-block;border:3px solid #C9A84C;color:#C9A84C;font-size:16px;font-weight:700;padding:8px 20px;transform:rotate(-15deg);letter-spacing:3px;}@media print{button{display:none;}}</style></head><body><div class="page"><div class="header"><div><img src="/logo.png" style="height:48px;object-fit:contain;" alt="FAR POS" /><div style="font-size:15px;font-weight:700;margin-top:4px;">'+currentUser.shop_name+'</div><div style="font-size:12px;color:#666;">Owner: '+currentUser.owner_name+'</div><div style="font-size:12px;color:#666;">Ph: '+currentUser.phone+'</div><div style="font-size:11px;color:#888;margin-top:4px;">GSTIN: '+(shopSettings.gstin||'Not Registered')+'</div>'+(shopSettings.shopAddress?'<div style="font-size:11px;color:#888;">'+shopSettings.shopAddress+'</div>':'')+'</div><div style="text-align:right;"><div style="font-size:11px;color:#666;">Invoice No: <strong>'+(bill.id||bill.bill_id||'')+'</strong></div><div style="font-size:11px;color:#666;margin-top:4px;">Date: <strong>'+(bill.date||'')+'</strong></div><div style="font-size:11px;color:#666;margin-top:4px;">Payment: <strong>'+(bill.mode||bill.payment_mode||'').toUpperCase()+'</strong></div><div style="margin-top:12px;"><span class="stamp">PAID</span></div></div></div><div class="title">TAX INVOICE</div><table><thead><tr><th>#</th><th>Item</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>'+items.map((item,i)=>'<tr><td>'+(i+1)+'</td><td>'+(item.name||'')+'</td><td>9999</td><td>'+(item.qty||1)+'</td><td>Rs. '+Number(item.price||0).toLocaleString()+'</td><td>Rs. '+(Number(item.price||0)*Number(item.qty||1)).toLocaleString()+'</td></tr>').join('')+'</tbody></table><div class="totals"><table class="totals-table"><tr><td>Subtotal</td><td>Rs. '+Number(bill.subtotal||0).toLocaleString()+'</td></tr>'+(Number(bill.discount||0)>0?'<tr><td>Discount</td><td>- Rs. '+Number(bill.discount).toLocaleString()+'</td></tr>':'')+'<tr><td>CGST ('+billGstPct/2+'%)</td><td>Rs. '+cgst.toLocaleString()+'</td></tr><tr><td>SGST ('+billGstPct/2+'%)</td><td>Rs. '+sgst.toLocaleString()+'</td></tr><tr class="grand"><td>TOTAL</td><td>Rs. '+Number(bill.total||0).toLocaleString()+'</td></tr></table></div><div class="words-box"><strong>Amount in Words:</strong> '+numToWords(Number(bill.total||0))+' Rupees Only</div><div class="footer"><div><div style="font-size:11px;color:#666;margin-bottom:4px;">Terms & Conditions:</div><div style="font-size:11px;color:#888;">1. Goods once sold will not be taken back.</div><div style="font-size:11px;color:#888;">2. Subject to local jurisdiction.</div><div style="font-size:12px;color:#888;margin-top:8px;">Powered by FAR-POS</div></div><div class="sign-box"><div class="sign-line">Authorised Signatory<br>'+currentUser.shop_name+'</div></div></div><div style="text-align:center;margin-top:16px;"><button onclick="window.print()" style="background:#C9A84C;color:#000;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-right:8px;">Print Invoice</button><button onclick="window.close()" style="background:#333;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer;">Close</button></div></div></body></html>';
    const blob=new Blob([html],{type:'text/html'});
    window.open(URL.createObjectURL(blob),'_blank');
  };

  const sendDailySummary=()=>{
    const today=new Date().toISOString().split('T')[0];
    const todayBills=bills.filter(b=>{ const d=b.timestamp?new Date(b.timestamp).toISOString().split('T')[0]:today; return d===today; });
    const totalSales=todayBills.reduce((s,b)=>s+Number(b.total||0),0);
    const cashTotal=todayBills.filter(b=>(b.mode||b.payment_mode)==='cash').reduce((s,b)=>s+Number(b.total||0),0);
    const upiTotal=todayBills.filter(b=>(b.mode||b.payment_mode)==='upi').reduce((s,b)=>s+Number(b.total||0),0);
    const gstTotal=todayBills.reduce((s,b)=>s+Number(b.gst||0),0);
    const date=new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'});
    let msg='📊 *Daily Sales Summary*\n━━━━━━━━━━━━━━━━━━━━\n🏪 *'+currentUser.shop_name+'*\n📅 '+date+'\n━━━━━━━━━━━━━━━━━━━━\n💰 *Total Sales: Rs. '+totalSales.toLocaleString()+'*\n🧾 Bills: '+todayBills.length+'\n💵 Cash: Rs. '+cashTotal.toLocaleString()+'\n📱 UPI: Rs. '+upiTotal.toLocaleString()+'\n🏛 GST: Rs. '+gstTotal.toLocaleString()+'\n📈 Net Profit: Rs. '+(totalSales-gstTotal).toLocaleString()+'\n━━━━━━━━━━━━━━━━━━━━\n_Powered by FAR-POS_';
    window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
  };

  const completeBill=async(mode)=>{
    if(cart.length===0){showToast('Cart is empty','error');return;}
    const u=userRef.current||currentUser;
    const bill={id:generateId('bill'),items:cart,subtotal:Math.round(subtotal),discount:discountAmt,gst:Math.round(gst),total:Math.round(grandTotal),gstPercent:gstPct,mode,date:new Date().toLocaleDateString('en-IN'),timestamp:new Date().toISOString()};
    // OPTIMISTIC: UI updates instantly, sync happens in background
    setBills(prev=>[...prev,bill]);
    const updatedProducts=products.map(p=>{ const ci=cart.find(c=>c.id===p.id); if(ci&&p.stock!==undefined) return {...p,stock:Math.max(0,p.stock-ci.qty)}; return p; });
    saveProducts(updatedProducts);
    setCart([]); setDiscount(0);
    queueBill(bill,u);
    if(navigator.onLine){ showToast('Bill saved! Rs.'+bill.total,'success'); }
    else { showToast('No internet — bill saved offline, will auto-sync','error'); }
    flushQueue(u,(r)=>{ if(r.pending>0&&navigator.onLine) showToast(r.pending+' bill(s) will retry sync','error'); });
    window.open('https://wa.me/?text='+encodeURIComponent(generateBillText(bill)),'_blank');
  };

  if(appLoading) return (
    <div style={{background:BG,minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}>
      <img src='/logo.png' style={{height:80,objectFit:'contain'}} alt='FAR POS' />
      <div style={{display:'flex',gap:8}}>
        {[0,0.2,0.4].map((d,i)=><div key={i} style={{width:8,height:8,borderRadius:'50%',background:GOLD,animation:'pulse 1s infinite '+d+'s'}}></div>)}
      </div>
      <p style={{fontSize:13,color:MU,letterSpacing:1}}>Loading your data...</p>
      <style>{`@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}`}</style>
    </div>
  );

  return (
    <div style={{fontFamily:'sans-serif',background:BG,minHeight:'100vh',color:TX}}>
      {!isOnline&&<div style={{background:'#2A1000',borderBottom:'1px solid #F97316',padding:'8px 20px',fontSize:12,color:'#F97316',textAlign:'center'}}>⚠ No internet — changes will sync when back online</div>}
      {toast&&<div style={{position:'fixed',top:20,right:20,zIndex:9999,background:toast.type==='success'?'#1A2A1A':'#2A1010',border:'1px solid '+(toast.type==='success'?'#34D399':'#F87171'),borderRadius:10,padding:'12px 20px',fontSize:13,color:toast.type==='success'?'#34D399':'#F87171',boxShadow:'0 4px 20px rgba(0,0,0,0.5)',display:'flex',alignItems:'center',gap:8}}>{toast.type==='success'?'✅':'⚠️'} {toast.msg}</div>}

      <div style={{background:SURF,borderBottom:'1px solid '+BOR,padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <img src='/logo.png' style={{height:36,objectFit:'contain'}} alt='FAR POS' />
          <div style={{fontSize:12,color:MU,marginTop:2}}>{currentUser?.shop_name} · {currentUser?.owner_name}</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {lowStock.length>0&&<div style={{background:'#2A1A00',border:'1px solid #C9A84C44',borderRadius:8,padding:'4px 10px',fontSize:11,color:GOLD}}>⚠ {lowStock.length} low stock</div>}
          <div style={{display:'flex',gap:4}}>
            {['en','te','hi'].map(l=>(
              <button key={l} onClick={()=>{setLang(l);localStorage.setItem('far-pos-lang',l);}} style={{padding:'4px 8px',borderRadius:6,fontSize:11,fontWeight:600,background:lang===l?GOLD:'#2A2A2A',color:lang===l?'#000':MU,border:'none',cursor:'pointer'}}>{l==='en'?'EN':l==='te'?'తె':'हि'}</button>
            ))}
          </div>
          <button onClick={handleLogout} style={{background:'#2A2A2A',border:'1px solid #3A3A3A',color:MU,padding:'6px 14px',borderRadius:8,fontSize:12,cursor:'pointer'}}>Logout</button>
        </div>
      </div>

      <div style={{background:'#141414',display:'flex',gap:4,padding:'10px 20px 0',borderBottom:'1px solid #222',overflowX:'auto'}}>
        {['billing','products','inventory','khata','history','reports','settings'].map(f=>(
          <button key={f} onClick={()=>setTab(f)} style={tabStyle(tab===f)}>{t(f)||f.charAt(0).toUpperCase()+f.slice(1)}</button>
        ))}
      </div>

      <div style={{background:BG,minHeight:'calc(100vh - 115px)',padding:20}}>

        {tab==='billing'&&<BillingTab products={products} cart={cart} setCart={setCart} discount={discount} setDiscount={setDiscount} discountType={discountType} setDiscountType={setDiscountType} subtotal={subtotal} gst={gst} gstPct={gstPct} grandTotal={grandTotal} discountAmt={discountAmt} loadingBill={loadingBill} completeBill={completeBill} showToast={showToast} />}

        {tab==='products'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <p style={{...sT,margin:0}}>Product Manager</p>
              <button onClick={()=>{setNewProduct({name:'',price:'',stock:'',category:''});setEditProduct(null);setShowAddProduct(true);}} style={goldBtn(false)}>+ Add Product</button>
            </div>
            {showAddProduct&&(
              <div style={{...card,borderColor:GOLD+'44',marginBottom:20}}>
                <p style={{...sT,marginBottom:12}}>{editProduct?'Edit Product':'New Product'}</p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                  <input placeholder='Product Name' value={newProduct.name} onChange={e=>setNewProduct({...newProduct,name:e.target.value})} style={inp} />
                  <input placeholder='Category' value={newProduct.category} onChange={e=>setNewProduct({...newProduct,category:e.target.value})} style={inp} />
                  <input type='number' placeholder='Price (Rs.)' value={newProduct.price} onChange={e=>setNewProduct({...newProduct,price:e.target.value})} style={inp} />
                  <input type='number' placeholder='Stock Qty' value={newProduct.stock} onChange={e=>setNewProduct({...newProduct,stock:e.target.value})} style={inp} />
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>{
                    if(!newProduct.name||!newProduct.price){showToast('Name and price required','error');return;}
                    if(editProduct){ saveProducts(products.map(p=>p.id===editProduct.id?{...p,...newProduct,price:Number(newProduct.price),stock:newProduct.stock!==''?Number(newProduct.stock):undefined}:p)); }
                    else { saveProducts([...products,{id:generateId('prod'),name:newProduct.name,price:Number(newProduct.price),stock:newProduct.stock!==''?Number(newProduct.stock):undefined,category:newProduct.category}]); }
                    setShowAddProduct(false);setEditProduct(null);
                  }} style={goldBtn(false)}>Save</button>
                  <button onClick={()=>{setShowAddProduct(false);setEditProduct(null);}} style={ghostBtn}>Cancel</button>
                </div>
              </div>
            )}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
              {products.map(p=>(
                <div key={p.id} style={card}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                    <div><p style={{margin:'0 0 4px',fontSize:14,fontWeight:600,color:TX}}>{p.name}</p>{p.category&&<p style={{margin:0,fontSize:11,color:DIM}}>{p.category}</p>}</div>
                    <span style={{fontSize:15,fontWeight:700,color:GOLD}}>Rs. {p.price}</span>
                  </div>
                  {p.stock!==undefined&&<p style={{fontSize:12,color:p.stock<=5?'#F87171':MU,margin:'0 0 10px'}}>Stock: {p.stock} units</p>}
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>{setEditProduct(p);setNewProduct({name:p.name,price:p.price,stock:p.stock??'',category:p.category||''});setShowAddProduct(true);}} style={{...ghostBtn,flex:1,padding:'6px 0',fontSize:12}}>Edit</button>
                    <button onClick={()=>{if(confirm('Delete '+p.name+'?'))saveProducts(products.filter(x=>x.id!==p.id));}} style={{flex:1,padding:'6px 0',background:'#2A1010',border:'1px solid #4A2020',color:'#F87171',borderRadius:8,fontSize:12,cursor:'pointer'}}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='inventory'&&(
          <div>
            <p style={sT}>Inventory</p>
            {lowStock.length>0&&(
              <div style={{background:'#1A1000',border:'1px solid '+GOLD+'44',borderRadius:12,padding:14,marginBottom:16}}>
                <p style={{margin:'0 0 8px',fontSize:12,color:GOLD,fontWeight:600}}>⚠ Low Stock Alert</p>
                {lowStock.map(p=>(
                  <div key={p.id} style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'4px 0',borderBottom:'1px solid #2A2000'}}>
                    <span style={{color:TX}}>{p.name}</span><span style={{color:'#F87171',fontWeight:600}}>{p.stock} left</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{...card,padding:0,overflow:'hidden'}}>
              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',background:'#111',padding:'10px 16px',borderBottom:'1px solid #222'}}>
                {['Product','Category','Price','Stock'].map(h=><span key={h} style={{fontSize:11,color:MU,letterSpacing:1,textTransform:'uppercase'}}>{h}</span>)}
              </div>
              {products.map((p,i)=>(
                <div key={p.id} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',padding:'12px 16px',borderBottom:i<products.length-1?'1px solid #1A1A1A':'none',alignItems:'center'}}>
                  <span style={{fontSize:13,color:TX,fontWeight:500}}>{p.name}</span>
                  <span style={{fontSize:12,color:DIM}}>{p.category||'—'}</span>
                  <span style={{fontSize:13,color:GOLD}}>Rs. {p.price}</span>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:13,color:p.stock<=5?'#F87171':p.stock===undefined?MU:'#34D399',fontWeight:600}}>{p.stock!==undefined?p.stock:'∞'}</span>
                    {p.stock!==undefined&&(
                      <div style={{display:'flex',gap:4}}>
                        <button onClick={()=>saveProducts(products.map(x=>x.id===p.id?{...x,stock:x.stock+1}:x))} style={{background:'#1A2A1A',border:'1px solid #2A4A2A',color:'#34D399',borderRadius:4,width:22,height:22,cursor:'pointer',fontSize:12}}>+</button>
                        <button onClick={()=>saveProducts(products.map(x=>x.id===p.id?{...x,stock:Math.max(0,x.stock-1)}:x))} style={{background:'#2A1A1A',border:'1px solid #4A2A2A',color:'#F87171',borderRadius:4,width:22,height:22,cursor:'pointer',fontSize:12}}>-</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='khata'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <p style={{...sT,margin:0}}>Customer Khata</p>
              <button onClick={()=>setShowAddKhata(true)} style={goldBtn(false)}>+ Add Entry</button>
            </div>
            <div style={{...card,borderColor:GOLD+'44',marginBottom:16,padding:'14px 18px'}}>
              <p style={{margin:0,fontSize:11,color:MU,letterSpacing:1,textTransform:'uppercase'}}>Total Owed to You</p>
              <p style={{margin:'6px 0 0',fontSize:24,fontWeight:700,color:GOLD}}>Rs. {totalKhataOwed.toLocaleString()}</p>
            </div>
            {showAddKhata&&(
              <div style={{...card,borderColor:GOLD+'44',marginBottom:16}}>
                <p style={{...sT,marginBottom:12}}>New Khata Entry</p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                  <input placeholder='Customer Name' value={newKhata.customer} onChange={e=>setNewKhata({...newKhata,customer:e.target.value})} style={inp} />
                  <input placeholder='Phone (optional)' value={newKhata.phone} onChange={e=>setNewKhata({...newKhata,phone:e.target.value})} style={inp} />
                  <input type='number' placeholder='Amount (Rs.)' value={newKhata.amount} onChange={e=>setNewKhata({...newKhata,amount:e.target.value})} style={inp} />
                  <input placeholder='Note' value={newKhata.note} onChange={e=>setNewKhata({...newKhata,note:e.target.value})} style={inp} />
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>{
                    if(!newKhata.customer||!newKhata.amount){showToast('Customer and amount required','error');return;}
                    const entry={id:generateId('kh'),customer:newKhata.customer,phone:newKhata.phone,amount:Number(newKhata.amount),note:newKhata.note,type:'given',date:new Date().toLocaleDateString('en-IN'),paid:false};
                    saveKhata([...khata,entry]);
                    setNewKhata({customer:'',phone:'',amount:'',note:''});
                    setShowAddKhata(false);
                  }} style={goldBtn(false)}>Credit Given</button>
                  <button onClick={()=>setShowAddKhata(false)} style={ghostBtn}>Cancel</button>
                </div>
              </div>
            )}
            {khata.length===0&&<p style={{color:DIM,fontSize:13}}>No khata entries yet</p>}
            {khata.map(k=>(
              <div key={k.id} style={{...card,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <p style={{margin:'0 0 3px',fontSize:14,fontWeight:600,color:TX}}>{k.customer}</p>
                  <p style={{margin:'0 0 3px',fontSize:11,color:DIM}}>{k.date} {k.note&&'· '+k.note}</p>
                  {k.phone&&<p style={{margin:0,fontSize:11,color:DIM}}>{k.phone}</p>}
                </div>
                <div style={{textAlign:'right'}}>
                  <p style={{margin:'0 0 6px',fontSize:16,fontWeight:700,color:k.paid?'#34D399':'#F87171'}}>Rs. {Number(k.amount||0).toLocaleString()}</p>
                  {!k.paid&&<button onClick={()=>saveKhata(khata.map(x=>x.id===k.id?{...x,paid:true}:x))} style={{...goldBtn(false),padding:'4px 12px',fontSize:11}}>Mark Paid</button>}
                  {k.paid&&<span style={{fontSize:11,color:'#34D399'}}>✓ Paid</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==='history'&&<HistoryTab bills={bills} setBills={setBills} currentUser={currentUser} userRef={userRef} getSalesFromSheet={getSalesFromSheet} shareOnWhatsApp={shareOnWhatsApp} generateGSTInvoice={generateGSTInvoice} sendDailySummary={sendDailySummary} />}

        {tab==='reports'&&<ReportsTab bills={bills} setBills={setBills} expenses={expenses} saveExpenses={saveExpenses} currentUser={currentUser} userRef={userRef} generateId={generateId} showToast={showToast} />}

        {tab==='settings'&&(
          <div style={{maxWidth:500}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <p style={{fontSize:11,letterSpacing:2,color:GOLD,textTransform:'uppercase',margin:0}}>Shop Settings</p>
              {!editSettings&&<button onClick={()=>setEditSettings(true)} style={goldBtn(false)}>Edit</button>}
            </div>
            {!editSettings?(
              <div>
                <div style={{background:SURF,border:'1px solid '+BOR,borderRadius:12,padding:20,marginBottom:12}}>
                  <p style={{fontSize:11,color:DIM,letterSpacing:1.5,textTransform:'uppercase',margin:'0 0 16px'}}>GST Settings</p>
                  {[['GSTIN',shopSettings.gstin||'Not set'],['Default GST %',(shopSettings.gstPercent||5)+'%'],['Shop Address',shopSettings.shopAddress||'Not set'],['Shop Phone',shopSettings.shopPhone||currentUser.phone]].map(([label,val],i,arr)=>(
                    <div key={label} style={{display:'flex',justifyContent:'space-between',marginBottom:10,paddingBottom:10,borderBottom:i<arr.length-1?'1px solid #222':'none'}}>
                      <span style={{fontSize:13,color:MU}}>{label}</span>
                      <span style={{fontSize:13,fontWeight:600,color:TX}}>{val}</span>
                    </div>
                  ))}
                </div>
                <div style={{background:'#1A1000',border:'1px solid '+GOLD+'33',borderRadius:10,padding:12,fontSize:12,color:MU}}>ℹ️ GSTIN and GST % appear on every GST Invoice.</div>
              </div>
            ):(
              <div style={{background:SURF,border:'1px solid '+BOR,borderRadius:12,padding:20}}>
                <p style={{fontSize:11,color:DIM,letterSpacing:1.5,textTransform:'uppercase',margin:'0 0 16px'}}>Edit Settings</p>
                <div style={{marginBottom:12}}>
                  <p style={{fontSize:12,color:MU,margin:'0 0 6px'}}>GSTIN (15 digits)</p>
                  <input placeholder='e.g. 29ABCDE1234F1Z5' value={shopSettings.gstin} onChange={e=>setShopSettings({...shopSettings,gstin:e.target.value.toUpperCase()})} style={{...inp,fontFamily:'monospace',letterSpacing:1}} maxLength={15} />
                  {shopSettings.gstin&&shopSettings.gstin.length!==15&&<p style={{fontSize:11,color:'#F87171',margin:'4px 0 0'}}>GSTIN must be 15 characters</p>}
                </div>
                <div style={{marginBottom:12}}>
                  <p style={{fontSize:12,color:MU,margin:'0 0 6px'}}>Default GST %</p>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {[0,5,12,18,28].map(p=>(
                      <button key={p} onClick={()=>setShopSettings({...shopSettings,gstPercent:p})} style={{padding:'8px 16px',borderRadius:8,fontSize:13,fontWeight:600,background:shopSettings.gstPercent===p?GOLD:SURF,color:shopSettings.gstPercent===p?'#000':MU,border:'1px solid '+(shopSettings.gstPercent===p?GOLD:'#333'),cursor:'pointer'}}>{p}%</button>
                    ))}
                    <input type='number' placeholder='Custom %' value={[0,5,12,18,28].includes(shopSettings.gstPercent)?'':shopSettings.gstPercent} onChange={e=>setShopSettings({...shopSettings,gstPercent:Number(e.target.value)})} style={{...inp,width:100,padding:'8px 12px'}} />
                  </div>
                </div>
                <div style={{marginBottom:12}}>
                  <p style={{fontSize:12,color:MU,margin:'0 0 6px'}}>Shop Address</p>
                  <input placeholder='Full shop address' value={shopSettings.shopAddress} onChange={e=>setShopSettings({...shopSettings,shopAddress:e.target.value})} style={inp} />
                </div>
                <div style={{marginBottom:20}}>
                  <p style={{fontSize:12,color:MU,margin:'0 0 6px'}}>Shop Phone</p>
                  <input placeholder='Phone number' value={shopSettings.shopPhone} onChange={e=>setShopSettings({...shopSettings,shopPhone:e.target.value})} style={inp} />
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>{saveSettings(shopSettings);setEditSettings(false);showToast('Settings saved!','success');}} style={goldBtn(false)}>Save Settings</button>
                  <button onClick={()=>setEditSettings(false)} style={ghostBtn}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
