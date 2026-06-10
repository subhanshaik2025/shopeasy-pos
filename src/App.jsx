import { useState, useEffect } from 'react';
import AuthPage from './AuthPage';
import { getCurrentUser, isUserLoggedIn, logoutUser } from './auth';
import { INDUSTRIES, TRANSLATIONS } from './config';
import { generateId, calculateTotal } from './utils';
import { initializeAppData } from './loadGoogleSheet';
import { saveBillToSheet, getSalesFromSheet, saveProductsToSheet, getProductsFromSheet, saveKhataToSheet, getKhataFromSheet, saveExpensesToSheet, getExpensesFromSheet, saveSettingsToSheet, getSettingsFromSheet } from './salesSheets';

const GOLD='#C9A84C',GOLD_L='#E8C97A',BG='#0F0F0F',SURF='#1A1A1A',BOR='#2A2A2A',TX='#DDDDDD',MU='#888',DIM='#555';

const inp = { width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #333', background:'#111', color:TX, fontSize:13, outline:'none', boxSizing:'border-box' };
const goldBtn = (dis) => ({ padding:'10px 18px', background:dis?'#333':GOLD, color:dis?MU:'#000', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:dis?'not-allowed':'pointer' });
const ghostBtn = { padding:'10px 18px', background:'transparent', color:GOLD, border:'1px solid #333', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' };

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
  const [reportView,setReportView]=useState('daily');
  const [selectedDate,setSelectedDate]=useState(new Date().toISOString().split('T')[0]);
  const [loadingBill,setLoadingBill]=useState(false);
  const [billSearch,setBillSearch]=useState('');
  const [khata,setKhata]=useState([]);
  const [expenses,setExpenses]=useState([]);
  const [showAddProduct,setShowAddProduct]=useState(false);
  const [showAddKhata,setShowAddKhata]=useState(false);
  const [showAddExpense,setShowAddExpense]=useState(false);
  const [editProduct,setEditProduct]=useState(null);
  const [newProduct,setNewProduct]=useState({name:'',price:'',stock:'',category:''});
  const [newKhata,setNewKhata]=useState({customer:'',phone:'',amount:'',note:''});
  const [newExpense,setNewExpense]=useState({title:'',amount:'',category:'rent'});
  const [showBillDetail,setShowBillDetail]=useState(null);
  const [shopSettings,setShopSettings]=useState({gstin:'',gstPercent:5,shopAddress:'',shopPhone:''});
  const [editSettings,setEditSettings]=useState(false);
  const [lang,setLang]=useState(localStorage.getItem('far-pos-lang')||'en');
  const t=(k)=>(TRANSLATIONS[lang]&&TRANSLATIONS[lang][k])||TRANSLATIONS['en'][k]||k;
  const [toast,setToast]=useState(null);
  const [appLoading,setAppLoading]=useState(true);
  const [isOnline,setIsOnline]=useState(navigator.onLine);
  const showToast=(msg,type='success')=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(()=>{
    const onOnline=()=>setIsOnline(true);
    const onOffline=()=>setIsOnline(false);
    window.addEventListener('online',onOnline);
    window.addEventListener('offline',onOffline);
    initializeAppData();
    if(isUserLoggedIn()){
      const user=getCurrentUser();
      setCurrentUser(user);
      setIsLoggedIn(true);
      const ind=INDUSTRIES[user.industry_type];
      setIndustry(ind);
      Promise.all([
        getSalesFromSheet(user).then(s=>setBills(s)),
        getProductsFromSheet(user).then(p=>{ if(p&&p.length>0) setProducts(p); else { const sv=localStorage.getItem('pos-products-'+user.id); if(sv) setProducts(JSON.parse(sv)); else setProducts(ind.sampleProducts||[]); } }),
        getSettingsFromSheet(user).then(st=>{ if(st) setShopSettings(st); else { const sv=localStorage.getItem('pos-settings-'+user.id); if(sv) setShopSettings(JSON.parse(sv)); } }),
        getKhataFromSheet(user).then(k=>{ if(k&&k.length>0) setKhata(k); else { const sv=localStorage.getItem('pos-khata-'+user.id); if(sv) setKhata(JSON.parse(sv)); } }),
        getExpensesFromSheet(user).then(e=>{ if(e&&e.length>0) setExpenses(e); else { const sv=localStorage.getItem('pos-expenses-'+user.id); if(sv) setExpenses(JSON.parse(sv)); } }),
      ]).finally(()=>setAppLoading(false));






    }
  },[]);

  const saveProducts=async(p,user)=>{
    setProducts(p);
    localStorage.setItem('pos-products-'+(user||currentUser).id,JSON.stringify(p));
    await saveProductsToSheet(p, user||currentUser);
  };
  const saveKhata=async(k)=>{ setKhata(k); localStorage.setItem('pos-khata-'+currentUser.id,JSON.stringify(k)); await saveKhataToSheet(k,currentUser); };
  const saveExpenses=async(e)=>{ setExpenses(e); localStorage.setItem('pos-expenses-'+currentUser.id,JSON.stringify(e)); await saveExpensesToSheet(e,currentUser); };
  const saveSettings=async(s)=>{ setShopSettings(s); localStorage.setItem('pos-settings-'+currentUser.id,JSON.stringify(s)); await saveSettingsToSheet(s,currentUser); };

  const handleLoginSuccess=(user)=>{
    setCurrentUser(user);
    setIsLoggedIn(true);
    const ind=INDUSTRIES[user.industry_type];
    setIndustry(ind);
    setAppLoading(true);
    Promise.all([
      getSalesFromSheet(user).then(s=>setBills(s)),
      getProductsFromSheet(user).then(p=>{ if(p&&p.length>0) setProducts(p); else { const sv=localStorage.getItem('pos-products-'+user.id); if(sv) setProducts(JSON.parse(sv)); else setProducts(ind.sampleProducts||[]); } }),
      getSettingsFromSheet(user).then(st=>{ if(st) setShopSettings(st); else { const sv=localStorage.getItem('pos-settings-'+user.id); if(sv) setShopSettings(JSON.parse(sv)); } }),
      getKhataFromSheet(user).then(k=>{ if(k&&k.length>0) setKhata(k); else { const sv=localStorage.getItem('pos-khata-'+user.id); if(sv) setKhata(JSON.parse(sv)); } }),
      getExpensesFromSheet(user).then(e=>{ if(e&&e.length>0) setExpenses(e); else { const sv=localStorage.getItem('pos-expenses-'+user.id); if(sv) setExpenses(JSON.parse(sv)); } }),
    ]).finally(()=>setAppLoading(false));



  };

  const handleLogout=()=>{ logoutUser(); setIsLoggedIn(false); setCurrentUser(null); setCart([]); setBills([]); };

  if(!isLoggedIn) return <AuthPage onLoginSuccess={handleLoginSuccess}/>;

  const subtotal=cart.reduce((s,c)=>s+(c.price*c.qty),0);
  const discountAmt=discountType==='percent'?Math.round(subtotal*discount/100):Math.min(discount,subtotal);
  const afterDiscount=subtotal-discountAmt;
  const gstPct=shopSettings.gstPercent||5;
  const {grandTotal,gst}=calculateTotal(afterDiscount,gstPct);

  const addToCart=(p)=>{
    if(p.stock!==undefined && p.stock<=0){ showToast('Out of stock','error'); return; }
    const ex=cart.find(c=>c.id===p.id);
    setCart(ex?cart.map(c=>c.id===p.id?{...c,qty:c.qty+1}:c):[...cart,{...p,qty:1}]);
  };

  const updateCartQty=(id,qty)=>{
    if(qty<=0) setCart(cart.filter(c=>c.id!==id));
    else setCart(cart.map(c=>c.id===id?{...c,qty}:c));
  };

  const generateBillText=(bill)=>{
    const items=(typeof bill.items_json==='string'?JSON.parse(bill.items_json):(bill.items||[]));
    const time=new Date(bill.timestamp).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
    let msg='';
    msg+='🧾 FAR-POS — Bill Receipt\n';
    msg+='━━━━━━━━━━━━━━━━━━━━\n';
    msg+='Shop: '+currentUser.shop_name+'\n';
    msg+='Bill: '+bill.id+'\n';
    msg+='Date: '+bill.date+'\n';
    msg+='Time: '+time+'\n';
    msg+='━━━━━━━━━━━━━━━━━━━━\n';
    msg+='ITEMS\n';
    items.forEach(item=>{
      const total=(item.price*item.qty).toLocaleString();
      const dots='.'.repeat(Math.max(2,20-item.name.length-String(item.qty).length));
      msg+=item.name+' x'+item.qty+' '+dots+' Rs. '+total+'\n';
    });
    msg+='━━━━━━━━━━━━━━━━━━━━\n';
    msg+='Subtotal: Rs. '+Number(bill.subtotal).toLocaleString()+'\n';
    if(bill.discount>0) msg+='Discount: - Rs. '+Number(bill.discount).toLocaleString()+'\n';
    msg+='GST (5%): Rs. '+Number(bill.gst).toLocaleString()+'\n';
    msg+='────────────────────\n';
    msg+='TOTAL: Rs. '+Number(bill.total).toLocaleString()+'\n';
    msg+='────────────────────\n';
    msg+='Payment: '+bill.mode.toUpperCase()+'\n';
    msg+='\nThank you for visiting!\n';
    msg+='Powered by FAR-POS';
    return msg;
  };

  const generateGSTInvoice=(bill)=>{
    const items=(typeof bill.items_json==='string'?JSON.parse(bill.items_json):(bill.items||[]));
    const billGstPct=bill.gstPercent||shopSettings.gstPercent||5;
    const cgst=Math.round(Number(bill.gst||0)/2);
    const sgst=cgst;
    const numToWords=(n)=>{
      const a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
      const b=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
      if(n===0)return 'Zero';
      if(n<20)return a[n];
      if(n<100)return b[Math.floor(n/10)]+(n%10?' '+a[n%10]:'');
      if(n<1000)return a[Math.floor(n/100)]+' Hundred'+(n%100?' '+numToWords(n%100):'');
      if(n<100000)return numToWords(Math.floor(n/1000))+' Thousand'+(n%1000?' '+numToWords(n%1000):'');
      return numToWords(Math.floor(n/100000))+' Lakh'+(n%100000?' '+numToWords(n%100000):'');
    };
    const totalInWords=numToWords(Number(bill.total))+' Rupees Only';
    const html=`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>GST Invoice - ${bill.id}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Arial,sans-serif;background:#fff;color:#111;font-size:13px;}
  .page{max-width:700px;margin:0 auto;padding:30px;border:2px solid #111;}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;}
  .logo{font-size:24px;font-weight:700;letter-spacing:3px;color:#C9A84C;}
  .title{text-align:center;font-size:18px;font-weight:700;letter-spacing:2px;border:1px solid #111;padding:6px;margin-bottom:16px;}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-bottom:16px;border:1px solid #111;}
  .info-box{padding:10px;border-right:1px solid #111;}
  .info-box:last-child{border-right:none;}
  .info-label{font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
  .info-value{font-size:13px;font-weight:600;}
  table{width:100%;border-collapse:collapse;margin-bottom:16px;}
  th{background:#111;color:#fff;padding:8px;text-align:left;font-size:11px;letter-spacing:1px;text-transform:uppercase;}
  td{padding:8px;border-bottom:1px solid #eee;font-size:13px;}
  tr:nth-child(even) td{background:#f9f9f9;}
  .totals{display:flex;justify-content:flex-end;margin-bottom:16px;}
  .totals-table{width:260px;border:1px solid #111;}
  .totals-table td{padding:6px 10px;border-bottom:1px solid #eee;}
  .totals-table td:last-child{text-align:right;font-weight:600;}
  .grand td{background:#111;color:#fff;font-weight:700;font-size:14px;}
  .words-box{background:#f5f5f5;border:1px solid #ddd;padding:10px;margin-bottom:16px;font-size:12px;}
  .footer{display:flex;justify-content:space-between;margin-top:30px;padding-top:16px;border-top:1px solid #111;}
  .sign-box{text-align:center;width:200px;}
  .sign-line{border-top:1px solid #111;margin-top:40px;padding-top:6px;font-size:11px;color:#666;}
  .stamp{display:inline-block;border:3px solid #C9A84C;color:#C9A84C;font-size:16px;font-weight:700;padding:8px 20px;transform:rotate(-15deg);letter-spacing:3px;}
  @media print{body{padding:0;}button{display:none;}}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <img src='https://far-pos.vercel.app/logo.png' style='height:48px;object-fit:contain;' alt='FAR POS' />
      <div style="font-size:15px;font-weight:700;margin-top:4px;">${currentUser.shop_name}</div>
      <div style="font-size:12px;color:#666;">Owner: ${currentUser.owner_name}</div>
      <div style="font-size:12px;color:#666;">Ph: ${currentUser.phone}</div>
      <div style="font-size:11px;color:#888;margin-top:4px;">GSTIN: ${shopSettings.gstin||'Not Registered'}</div>
      ${shopSettings.shopAddress?'<div style="font-size:11px;color:#888;">'+shopSettings.shopAddress+'</div>':''}
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;color:#666;">Invoice No: <strong>${bill.id}</strong></div>
      <div style="font-size:11px;color:#666;margin-top:4px;">Date: <strong>${bill.date}</strong></div>
      <div style="font-size:11px;color:#666;margin-top:4px;">Payment: <strong>${(bill.mode||bill.payment_mode||'').toUpperCase()}</strong></div>
      <div style="margin-top:12px;"><span class="stamp">PAID</span></div>
    </div>
  </div>

  <div class="title">TAX INVOICE</div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Item Description</th>
        <th>HSN</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item,i)=>`
      <tr>
        <td>${i+1}</td>
        <td>${item.name}</td>
        <td>9999</td>
        <td>${item.qty}</td>
        <td>Rs. ${Number(item.price).toLocaleString()}</td>
        <td>Rs. ${(item.price*item.qty).toLocaleString()}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tr><td>Subtotal</td><td>Rs. ${Number(bill.subtotal).toLocaleString()}</td></tr>
      ${bill.discount>0?`<tr><td>Discount</td><td>- Rs. ${Number(bill.discount).toLocaleString()}</td></tr>`:''}
      <tr><td>CGST (${billGstPct/2}%)</td><td>Rs. ${cgst.toLocaleString()}</td></tr>
      <tr><td>SGST (${billGstPct/2}%)</td><td>Rs. ${sgst.toLocaleString()}</td></tr>
      <tr class="grand"><td>TOTAL</td><td>Rs. ${Number(bill.total).toLocaleString()}</td></tr>
    </table>
  </div>

  <div class="words-box">
    <strong>Amount in Words:</strong> ${totalInWords}
  </div>

  <div class="footer">
    <div>
      <div style="font-size:11px;color:#666;margin-bottom:4px;">Terms & Conditions:</div>
      <div style="font-size:11px;color:#888;">1. Goods once sold will not be taken back.</div>
      <div style="font-size:11px;color:#888;">2. Subject to local jurisdiction.</div>
      <div style="font-size:12px;color:#888;margin-top:8px;">Powered by FAR-POS</div>
    </div>
    <div class="sign-box">
      <div class="sign-line">Authorised Signatory<br>${currentUser.shop_name}</div>
    </div>
  </div>

  <div style="text-align:center;margin-top:16px;">
    <button onclick="window.print()" style="background:#C9A84C;color:#000;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-right:8px;">Print Invoice</button>
    <button onclick="window.close()" style="background:#333;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer;">Close</button>
  </div>
</div>
</body>
</html>`;
    const blob=new Blob([html],{type:'text/html'});
    const url=URL.createObjectURL(blob);
    window.open(url,'_blank');
  };

  const sendDailySummary=()=>{
    const today=new Date().toISOString().split('T')[0];
    const todayBills=bills.filter(b=>{
      const d=b.timestamp?new Date(b.timestamp).toISOString().split('T')[0]:today;
      return d===today;
    });
    const totalSales=todayBills.reduce((s,b)=>s+Number(b.total),0);
    const cashTotal=todayBills.filter(b=>(b.mode||b.payment_mode)==='cash').reduce((s,b)=>s+Number(b.total),0);
    const upiTotal=todayBills.filter(b=>(b.mode||b.payment_mode)==='upi').reduce((s,b)=>s+Number(b.total),0);
    const gstTotal=todayBills.reduce((s,b)=>s+Number(b.gst||0),0);
    const topItem=getTopProducts(todayBills)[0];
    const date=new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'});
    let msg='';
    msg+='📊 *Daily Sales Summary*\n';
    msg+='━━━━━━━━━━━━━━━━━━━━\n';
    msg+='🏪 *'+currentUser.shop_name+'*\n';
    msg+='📅 '+date+'\n';
    msg+='━━━━━━━━━━━━━━━━━━━━\n';
    msg+='💰 *Total Sales: Rs. '+totalSales.toLocaleString()+'*\n';
    msg+='🧾 Bills: '+todayBills.length+'\n';
    msg+='💵 Cash: Rs. '+cashTotal.toLocaleString()+'\n';
    msg+='📱 UPI: Rs. '+upiTotal.toLocaleString()+'\n';
    msg+='🏛 GST: Rs. '+gstTotal.toLocaleString()+'\n';
    msg+='📈 Net Profit: Rs. '+(totalSales-gstTotal).toLocaleString()+'\n';
    if(topItem) msg+='⭐ Top Product: '+topItem.name+' (Rs. '+topItem.revenue.toLocaleString()+')\n';
    msg+='━━━━━━━━━━━━━━━━━━━━\n';
    msg+='_Powered by FAR-POS_';
    window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
  };

  const completeBill=async(mode)=>{
    if(cart.length===0){showToast('Cart is empty','error');return;}
    setLoadingBill(true);
    const bill={
      id:generateId('bill'),items:cart,subtotal:Math.round(subtotal),
      discount:discountAmt,gst:Math.round(gst),total:Math.round(grandTotal),
      gstPercent:gstPct,
      mode,date:new Date().toLocaleDateString('en-IN'),timestamp:new Date().toISOString(),
    };
    await saveBillToSheet(bill,currentUser);
    const updatedProducts=products.map(p=>{
      const cartItem=cart.find(c=>c.id===p.id);
      if(cartItem && p.stock!==undefined) return {...p,stock:Math.max(0,p.stock-cartItem.qty)};
      return p;
    });
    saveProducts(updatedProducts);
    const updated=[...bills,bill];
    setBills(updated);
    localStorage.setItem('pos-bills',JSON.stringify(updated));
    setCart([]); setDiscount(0); setLoadingBill(false);
    const billText=generateBillText(bill);
    window.open('https://wa.me/?text='+encodeURIComponent(billText),'_blank');
  };

  const shareOnWhatsApp=(bill)=>{
    const items=(typeof bill.items_json==='string'?JSON.parse(bill.items_json):(bill.items||[]));
    let msg='*'+currentUser.shop_name+'*\nBill: '+bill.id+'\nDate: '+bill.date+'\n\n';
    items.forEach(i=>{ msg+=i.name+' x'+i.qty+' = Rs.'+i.price*i.qty+'\n'; });
    msg+='\nTotal: Rs.'+bill.total+'\nPayment: '+(bill.mode||bill.payment_mode).toUpperCase();
    window.open('https://wa.me/?text='+encodeURIComponent(msg));
  };

  const parseBillDate=(b)=>{ try { if(b.timestamp&&String(b.timestamp).length>8) return new Date(b.timestamp); if(b.date) { const p=String(b.date).split("/"); if(p.length===3) return new Date(p[2]+"-"+p[1].padStart(2,"0")+"-"+p[0].padStart(2,"0")); return new Date(b.date); } return new Date(); } catch(e){return new Date();} };
  const filterByDate=(bills,d)=>bills.filter(b=>parseBillDate(b).toISOString().split('T')[0]===d);
  const filterByWeek=(bills)=>{const w=new Date(Date.now()-7*86400000);return bills.filter(b=>parseBillDate(b)>=w);};
  const filterByMonth=(bills)=>{const n=new Date();return bills.filter(b=>{const d=parseBillDate(b);return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();});};

  const getTopProducts=(bs)=>{
    const map={};
    bs.forEach(b=>{
      const items=typeof b.items_json==='string'?JSON.parse(b.items_json):(b.items||[]);
      items.forEach(item=>{
        if(!map[item.name])map[item.name]={name:item.name,qty:0,revenue:0};
        map[item.name].qty+=item.qty; map[item.name].revenue+=item.price*item.qty;
      });
    });
    return Object.values(map).sort((a,b)=>b.revenue-a.revenue).slice(0,5);
  };

  const getDayWise=(bs)=>{
    const map={};
    bs.forEach(b=>{
      const d=parseBillDate(b).toISOString().split('T')[0];
      if(!map[d])map[d]={date:d,total:0,cash:0,upi:0,count:0};
      map[d].total+=Number(b.total); map[d].count++;
      if((b.mode||b.payment_mode)==='cash')map[d].cash+=Number(b.total);
      else map[d].upi+=Number(b.total);
    });
    return Object.values(map).sort((a,b)=>b.date.localeCompare(a.date));
  };

  const selectedBills=reportView==='daily'?filterByDate(bills,selectedDate):reportView==='weekly'?filterByWeek(bills):filterByMonth(bills);
  const totalSales=selectedBills.reduce((s,b)=>s+Number(b.total),0);
  const cashSales=selectedBills.filter(b=>(b.mode||b.payment_mode)==='cash').reduce((s,b)=>s+Number(b.total),0);
  const upiSales=selectedBills.filter(b=>(b.mode||b.payment_mode)==='upi').reduce((s,b)=>s+Number(b.total),0);
  const gstTotal=selectedBills.reduce((s,b)=>s+Number(b.gst||0),0);
  const totalExpenses=expenses.filter(e=>{
    const d=new Date(e.date);
    if(reportView==='daily') return e.date===selectedDate;
    if(reportView==='weekly') return new Date(e.date)>=new Date(Date.now()-7*86400000);
    return d.getMonth()===new Date().getMonth()&&d.getFullYear()===new Date().getFullYear();
  }).reduce((s,e)=>s+Number(e.amount),0);
  const netProfit=totalSales-gstTotal-totalExpenses;
  const topProducts=getTopProducts(selectedBills);
  const dayWise=getDayWise(reportView==='weekly'?filterByWeek(bills):filterByMonth(bills));
  const maxDay=Math.max(...dayWise.map(d=>d.total),1);
  const lowStock=products.filter(p=>p.stock!==undefined&&p.stock<=5);
  const totalKhataOwed=khata.filter(k=>k.type==='given').reduce((s,k)=>s+Number(k.amount),0);

  const sT={ fontSize:11,letterSpacing:2,color:GOLD,textTransform:'uppercase',margin:'0 0 14px' };
  const card={ background:SURF,border:'1px solid '+BOR,borderRadius:12,padding:16,marginBottom:10 };
  const tabStyle=(a)=>({ padding:'8px 20px',borderRadius:'8px 8px 0 0',fontSize:13,cursor:'pointer',border:'none',background:a?SURF:'transparent',color:a?GOLD:'#555',fontWeight:a?600:400,borderTop:a?'2px solid '+GOLD:'2px solid transparent',whiteSpace:'nowrap' });

  if(appLoading && isLoggedIn) return (
    <div style={{background:BG,minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}>
      <img src='/logo.png' style={{height:80,objectFit:'contain'}} alt='FAR POS' />
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <div style={{width:8,height:8,borderRadius:'50%',background:GOLD,animation:'pulse 1s infinite'}}></div>
        <div style={{width:8,height:8,borderRadius:'50%',background:GOLD,animation:'pulse 1s infinite 0.2s'}}></div>
        <div style={{width:8,height:8,borderRadius:'50%',background:GOLD,animation:'pulse 1s infinite 0.4s'}}></div>
      </div>
      <p style={{fontSize:13,color:MU,letterSpacing:1}}>Loading your data...</p>
      <style>{`@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}`}</style>
    </div>
  );

  return (
    <div style={{fontFamily:'sans-serif',background:BG,minHeight:'100vh',color:TX}}>
      {!isOnline&&<div style={{background:'#2A1000',borderBottom:'1px solid #F97316',padding:'8px 20px',fontSize:12,color:'#F97316',textAlign:'center',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>⚠ No internet connection — changes will sync when back online</div>}
      {toast&&<div style={{position:'fixed',top:20,right:20,zIndex:9999,background:toast.type==='success'?'#1A2A1A':'#2A1010',border:'1px solid '+(toast.type==='success'?'#34D399':'#F87171'),borderRadius:10,padding:'12px 20px',fontSize:13,color:toast.type==='success'?'#34D399':'#F87171',boxShadow:'0 4px 20px rgba(0,0,0,0.5)',display:'flex',alignItems:'center',gap:8}}>
        {toast.type==='success'?'✅':'⚠️'} {toast.msg}
      </div>}
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

        {tab==='billing'&&(
          <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
            <div style={{flex:1,minWidth:260}}>
              <p style={sT}>Products</p>
              <input placeholder='Search products...' style={{...inp,marginBottom:12}} onChange={e=>{}} />
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8}}>
                {products.map(p=>(
                  <div key={p.id} onClick={()=>addToCart(p)} style={{background:SURF,border:'1px solid '+(p.stock<=0?'#4A2020':BOR),borderRadius:12,padding:'12px 14px',cursor:p.stock<=0?'not-allowed':'pointer',opacity:p.stock<=0?0.5:1}}>
                    <p style={{fontWeight:600,fontSize:13,margin:'0 0 4px',color:TX}}>{p.name}</p>
                    <p style={{fontSize:14,fontWeight:700,color:GOLD,margin:'0 0 4px'}}>Rs. {p.price}</p>
                    {p.stock!==undefined&&<p style={{fontSize:10,color:p.stock<=5?'#F87171':DIM,margin:0}}>Stock: {p.stock}</p>}
                  </div>
                ))}
              </div>
            </div>
            <div style={{flex:1,minWidth:260}}>
              <p style={sT}>Cart</p>
              {cart.length===0&&<p style={{color:DIM,fontSize:13}}>No items added yet</p>}
              {cart.map(item=>(
                <div key={item.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #222'}}>
                  <div style={{flex:1}}>
                    <p style={{fontSize:13,color:'#CCC',margin:0}}>{item.name}</p>
                    <p style={{fontSize:11,color:DIM,margin:'2px 0 0'}}>Rs. {item.price} each</p>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <button onClick={()=>updateCartQty(item.id,item.qty-1)} style={{background:'#222',border:'1px solid #333',color:TX,width:26,height:26,borderRadius:6,cursor:'pointer',fontSize:14}}>-</button>
                    <span style={{fontSize:13,fontWeight:600,minWidth:20,textAlign:'center'}}>{item.qty}</span>
                    <button onClick={()=>updateCartQty(item.id,item.qty+1)} style={{background:'#222',border:'1px solid #333',color:TX,width:26,height:26,borderRadius:6,cursor:'pointer',fontSize:14}}>+</button>
                    <span style={{fontWeight:600,fontSize:13,color:TX,minWidth:60,textAlign:'right'}}>Rs. {(item.price*item.qty).toLocaleString()}</span>
                    <button onClick={()=>setCart(cart.filter(c=>c.id!==item.id))} style={{background:'#2A1010',border:'1px solid #4A2020',color:'#CC4444',borderRadius:6,padding:'2px 7px',cursor:'pointer',fontSize:12}}>×</button>
                  </div>
                </div>
              ))}
              {cart.length>0&&(
                <div style={{marginTop:16}}>
                  <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}>
                    <span style={{fontSize:12,color:MU}}>Discount:</span>
                    <input type='number' value={discount} onChange={e=>setDiscount(Number(e.target.value))} style={{...inp,width:80,padding:'6px 10px'}} placeholder='0' />
                    <button onClick={()=>setDiscountType(discountType==='percent'?'flat':'percent')} style={{...ghostBtn,padding:'6px 12px',fontSize:12}}>{discountType==='percent'?'%':'Rs'}</button>
                  </div>
                  <div style={{borderTop:'1px solid #222',paddingTop:14}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:13,color:MU}}><span>Subtotal</span><span style={{color:TX}}>Rs. {subtotal.toLocaleString()}</span></div>
                    {discountAmt>0&&<div style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:13,color:MU}}><span>Discount</span><span style={{color:'#F87171'}}>- Rs. {discountAmt.toLocaleString()}</span></div>}
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13,color:MU}}><span>GST ({gstPct}%)</span><span style={{color:TX}}>Rs. {Math.round(gst).toLocaleString()}</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:20,fontWeight:600,margin:'14px 0'}}><span>Total</span><span style={{color:GOLD}}>Rs. {Math.round(grandTotal).toLocaleString()}</span></div>
                    <div style={{display:'flex',gap:10}}>
                      <button onClick={()=>completeBill('cash')} disabled={loadingBill} style={{flex:1,padding:14,background:loadingBill?'#555':GOLD,color:'#000',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:loadingBill?'not-allowed':'pointer'}}>{loadingBill?'Saving...':'Cash'}</button>
                      <button onClick={()=>completeBill('upi')} disabled={loadingBill} style={{flex:1,padding:14,background:'transparent',color:GOLD,border:'1px solid '+GOLD+'66',borderRadius:10,fontSize:14,fontWeight:600,cursor:loadingBill?'not-allowed':'pointer'}}>{loadingBill?'...':'UPI'}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
                    if(editProduct){
                      const updated=products.map(p=>p.id===editProduct.id?{...p,...newProduct,price:Number(newProduct.price),stock:newProduct.stock!==''?Number(newProduct.stock):undefined}:p);
                      saveProducts(updated);
                    } else {
                      const p={id:generateId('prod'),name:newProduct.name,price:Number(newProduct.price),stock:newProduct.stock!==''?Number(newProduct.stock):undefined,category:newProduct.category};
                      saveProducts([...products,p]);
                    }
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
                    <div>
                      <p style={{margin:'0 0 4px',fontSize:14,fontWeight:600,color:TX}}>{p.name}</p>
                      {p.category&&<p style={{margin:0,fontSize:11,color:DIM}}>{p.category}</p>}
                    </div>
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
                    <span style={{color:TX}}>{p.name}</span>
                    <span style={{color:'#F87171',fontWeight:600}}>{p.stock} left</span>
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
                        <button onClick={()=>saveProducts(products.map(x=>x.id===p.id?{...x,stock:x.stock+1}:x))} style={{background:'#1A2A1A',border:'1px solid #2A4A2A',color:'#34D399',borderRadius:4,width:22,height:22,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                        <button onClick={()=>saveProducts(products.map(x=>x.id===p.id?{...x,stock:Math.max(0,x.stock-1)}:x))} style={{background:'#2A1A1A',border:'1px solid #4A2A2A',color:'#F87171',borderRadius:4,width:22,height:22,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>-</button>
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
                <div style={{display:'flex',gap:8,marginBottom:8}}>
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
                  <p style={{margin:'0 0 6px',fontSize:16,fontWeight:700,color:k.paid?'#34D399':'#F87171'}}>Rs. {k.amount.toLocaleString()}</p>
                  {!k.paid&&(
                    <button onClick={()=>saveKhata(khata.map(x=>x.id===k.id?{...x,paid:true}:x))} style={{...goldBtn(false),padding:'4px 12px',fontSize:11}}>Mark Paid</button>
                  )}
                  {k.paid&&<span style={{fontSize:11,color:'#34D399'}}>✓ Paid</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==='history'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <p style={{...sT,margin:0}}>Bill History</p>
              <button onClick={sendDailySummary} style={{...goldBtn(false),fontSize:12,padding:'6px 14px'}}>📊 WhatsApp Summary</button>
              <button onClick={()=>getSalesFromSheet(currentUser).then(s=>setBills(s))} style={ghostBtn}>Refresh</button>
            </div>
            <input placeholder='Search by bill ID, amount or date...' value={billSearch} onChange={e=>setBillSearch(e.target.value)} style={{...inp,marginBottom:16}} />
            {showBillDetail&&(
              <div style={{...card,borderColor:GOLD+'44',marginBottom:16}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                  <p style={{...sT,margin:0}}>Bill Detail</p>
                  <button onClick={()=>setShowBillDetail(null)} style={ghostBtn}>Close</button>
                </div>
                <p style={{fontSize:12,color:MU,margin:'0 0 4px'}}>ID: {showBillDetail.id}</p>
                <p style={{fontSize:12,color:MU,margin:'0 0 12px'}}>Date: {showBillDetail.date} · {(showBillDetail.mode||showBillDetail.payment_mode||'').toUpperCase()}</p>
                {(typeof showBillDetail.items_json==='string'?JSON.parse(showBillDetail.items_json):(showBillDetail.items||[])).map((item,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #222'}}>
                    <span style={{fontSize:13,color:TX}}>{item.name} × {item.qty}</span>
                    <span style={{fontSize:13,color:GOLD}}>Rs. {(item.price*item.qty).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid #333'}}>
                  {showBillDetail.discount>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:MU,marginBottom:4}}><span>Discount</span><span style={{color:'#F87171'}}>- Rs. {showBillDetail.discount}</span></div>}
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:MU,marginBottom:4}}><span>GST</span><span>Rs. {showBillDetail.gst||0}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:18,fontWeight:700}}><span>Total</span><span style={{color:GOLD}}>Rs. {showBillDetail.total}</span></div>
                </div>
                <div style={{display:'flex',gap:8,marginTop:12}}>
                  <button onClick={()=>shareOnWhatsApp(showBillDetail)} style={{...goldBtn(false),flex:1,textAlign:'center'}}>WhatsApp</button>
                  <button onClick={()=>generateGSTInvoice(showBillDetail)} style={{flex:1,padding:'10px 18px',background:'transparent',color:GOLD,border:'1px solid #333',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>GST Invoice</button>
                </div>
              </div>
            )}
            {[...bills].reverse().filter(b=>{
              if(!billSearch) return true;
              const q=billSearch.toLowerCase();
              return b.id?.toLowerCase().includes(q)||String(b.total).includes(q)||b.date?.includes(q);
            }).map(b=>(
              <div key={b.id} onClick={()=>setShowBillDetail(b)} style={{...card,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <p style={{margin:'0 0 3px',fontSize:13,fontWeight:600,color:TX}}>{b.id}</p>
                  <p style={{margin:0,fontSize:11,color:DIM}}>{b.date} · {(b.mode||b.payment_mode||'').toUpperCase()}</p>
                </div>
                <span style={{fontSize:16,fontWeight:700,color:GOLD}}>Rs. {Number(b.total).toLocaleString()}</span>
              </div>
            ))}
            {bills.length===0&&<p style={{color:DIM,fontSize:13}}>No bills yet</p>}
          </div>
        )}

        {tab==='reports'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <p style={{...sT,margin:0}}>Reports</p>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setShowAddExpense(true)} style={ghostBtn}>+ Expense</button>
                <button onClick={()=>getSalesFromSheet(currentUser).then(s=>setBills(s))} style={ghostBtn}>Refresh</button>
              </div>
            </div>
            {showAddExpense&&(
              <div style={{...card,borderColor:GOLD+'44',marginBottom:16}}>
                <p style={{...sT,marginBottom:12}}>Add Expense</p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
                  <input placeholder='Title' value={newExpense.title} onChange={e=>setNewExpense({...newExpense,title:e.target.value})} style={inp} />
                  <input type='number' placeholder='Amount' value={newExpense.amount} onChange={e=>setNewExpense({...newExpense,amount:e.target.value})} style={inp} />
                  <select value={newExpense.category} onChange={e=>setNewExpense({...newExpense,category:e.target.value})} style={{...inp}}>
                    {['rent','salary','utilities','supplies','other'].map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>{
                    if(!newExpense.title||!newExpense.amount){showToast('Fill all fields','error');return;}
                    const e={id:generateId('exp'),title:newExpense.title,amount:Number(newExpense.amount),category:newExpense.category,date:new Date().toISOString().split('T')[0]};
                    saveExpenses([...expenses,e]);
                    setNewExpense({title:'',amount:'',category:'rent'});
                    setShowAddExpense(false);
                  }} style={goldBtn(false)}>Save Expense</button>
                  <button onClick={()=>setShowAddExpense(false)} style={ghostBtn}>Cancel</button>
                </div>
              </div>
            )}
            <div style={{display:'flex',gap:6,marginBottom:16}}>
              {['daily','weekly','monthly'].map(v=>(
                <button key={v} onClick={()=>setReportView(v)} style={{padding:'8px 18px',borderRadius:8,fontSize:13,fontWeight:reportView===v?600:400,background:reportView===v?GOLD:'#1A1A1A',color:reportView===v?'#000':MU,border:reportView===v?'none':'1px solid #2A2A2A',cursor:'pointer',textTransform:'capitalize'}}>{v}</button>
              ))}
            </div>
            {reportView==='daily'&&<input type='date' value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} style={{...inp,width:'auto',marginBottom:16}} />}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginBottom:20}}>
              {[
                {label:'Total Sales',value:'Rs. '+totalSales.toLocaleString(),sub:selectedBills.length+' bills',color:GOLD,accent:true},
                {label:'Net Profit',value:'Rs. '+netProfit.toLocaleString(),sub:'After GST & expenses',color:'#A3E635'},
                {label:'Cash',value:'Rs. '+cashSales.toLocaleString(),color:'#34D399'},
                {label:'UPI',value:'Rs. '+upiSales.toLocaleString(),color:'#FBBF24'},
                {label:'GST Collected',value:'Rs. '+gstTotal.toLocaleString(),color:MU},
                {label:'Expenses',value:'Rs. '+totalExpenses.toLocaleString(),color:'#F87171'},
              ].map(s=>(
                <div key={s.label} style={{background:SURF,border:'1px solid '+(s.accent?GOLD+'44':BOR),borderRadius:12,padding:16}}>
                  <p style={{fontSize:11,color:DIM,letterSpacing:1.5,textTransform:'uppercase',margin:'0 0 6px'}}>{s.label}</p>
                  <p style={{fontSize:20,fontWeight:600,color:s.color,margin:0}}>{s.value}</p>
                  {s.sub&&<p style={{fontSize:11,color:DIM,margin:'4px 0 0'}}>{s.sub}</p>}
                </div>
              ))}
            </div>
            {topProducts.length>0&&(
              <div style={{marginBottom:20}}>
                <p style={sT}>Top Products</p>
                {topProducts.map((p,i)=>(
                  <div key={p.name} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:i===0?'#1E1A10':SURF,border:'1px solid '+(i===0?GOLD+'33':BOR),borderRadius:10,marginBottom:6}}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <span style={{fontSize:16,fontWeight:700,color:GOLD,minWidth:28}}>#{i+1}</span>
                      <div>
                        <p style={{margin:0,fontSize:13,color:TX}}>{p.name}</p>
                        <p style={{margin:0,fontSize:11,color:DIM}}>Qty: {p.qty}</p>
                      </div>
                    </div>
                    <span style={{fontWeight:600,color:GOLD}}>Rs. {p.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
            {(reportView==='weekly'||reportView==='monthly')&&dayWise.length>0&&(
              <div>
                <p style={sT}>Day Wise Sales</p>
                {dayWise.map(d=>(
                  <div key={d.date} style={{marginBottom:14,background:SURF,border:'1px solid '+BOR,borderRadius:10,padding:'12px 14px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                      <span style={{fontSize:12,color:MU}}>{new Date(d.date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</span>
                      <span style={{fontSize:12,fontWeight:600,color:TX}}>Rs. {d.total.toLocaleString()} <span style={{color:DIM}}>({d.count} bills)</span></span>
                    </div>
                    <div style={{background:'#222',borderRadius:4,height:6}}>
                      <div style={{background:'linear-gradient(90deg,'+GOLD+','+GOLD_L+')',borderRadius:4,height:6,width:(d.total/maxDay*100)+'%'}}></div>
                    </div>
                    <div style={{display:'flex',gap:16,marginTop:6}}>
                      <span style={{fontSize:11,color:'#34D399'}}>Cash Rs. {d.cash.toLocaleString()}</span>
                      <span style={{fontSize:11,color:'#FBBF24'}}>UPI Rs. {d.upi.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selectedBills.length===0&&(
              <div style={{textAlign:'center',padding:'60px 0',color:DIM}}>
                <div style={{fontSize:48,marginBottom:12}}>📊</div>
                <p style={{fontSize:14}}>No sales data for this period</p>
              </div>
            )}
            {expenses.length>0&&(
              <div style={{marginTop:20}}>
                <p style={sT}>Expenses</p>
                {expenses.slice().reverse().map(e=>(
                  <div key={e.id} style={{...card,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <p style={{margin:'0 0 3px',fontSize:13,fontWeight:600,color:TX}}>{e.title}</p>
                      <p style={{margin:0,fontSize:11,color:DIM}}>{e.date} · {e.category}</p>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{fontSize:15,fontWeight:700,color:'#F87171'}}>Rs. {e.amount.toLocaleString()}</span>
                      <button onClick={()=>saveExpenses(expenses.filter(x=>x.id!==e.id))} style={{background:'#2A1010',border:'1px solid #4A2020',color:'#F87171',borderRadius:6,padding:'2px 8px',cursor:'pointer',fontSize:12}}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:10,paddingBottom:10,borderBottom:'1px solid #222'}}>
                    <span style={{fontSize:13,color:MU}}>GSTIN</span>
                    <span style={{fontSize:13,fontWeight:600,color:shopSettings.gstin?TX:'#F87171'}}>{shopSettings.gstin||'Not set'}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:10,paddingBottom:10,borderBottom:'1px solid #222'}}>
                    <span style={{fontSize:13,color:MU}}>Default GST %</span>
                    <span style={{fontSize:13,fontWeight:600,color:GOLD}}>{shopSettings.gstPercent||5}%</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:10,paddingBottom:10,borderBottom:'1px solid #222'}}>
                    <span style={{fontSize:13,color:MU}}>Shop Address</span>
                    <span style={{fontSize:13,fontWeight:600,color:shopSettings.shopAddress?TX:'#F87171'}}>{shopSettings.shopAddress||'Not set'}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{fontSize:13,color:MU}}>Shop Phone</span>
                    <span style={{fontSize:13,fontWeight:600,color:TX}}>{shopSettings.shopPhone||currentUser.phone}</span>
                  </div>
                </div>
                <div style={{background:'#1A1000',border:'1px solid '+GOLD+'33',borderRadius:10,padding:12,fontSize:12,color:MU}}>
                  ℹ️ GSTIN and GST % will automatically appear on every GST Invoice you generate.
                </div>
              </div>
            ):(
              <div style={{background:SURF,border:'1px solid '+BOR,borderRadius:12,padding:20}}>
                <p style={{fontSize:11,color:DIM,letterSpacing:1.5,textTransform:'uppercase',margin:'0 0 16px'}}>Edit Settings</p>
                <div style={{marginBottom:12}}>
                  <p style={{fontSize:12,color:MU,margin:'0 0 6px'}}>GSTIN (15-digit GST Number)</p>
                  <input
                    placeholder='e.g. 29ABCDE1234F1Z5'
                    value={shopSettings.gstin}
                    onChange={e=>setShopSettings({...shopSettings,gstin:e.target.value.toUpperCase()})}
                    style={{...inp,fontFamily:'monospace',letterSpacing:1}}
                    maxLength={15}
                  />
                  {shopSettings.gstin&&shopSettings.gstin.length!==15&&<p style={{fontSize:11,color:'#F87171',margin:'4px 0 0'}}>GSTIN must be exactly 15 characters</p>}
                </div>
                <div style={{marginBottom:12}}>
                  <p style={{fontSize:12,color:MU,margin:'0 0 6px'}}>Default GST % (applied to all bills)</p>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {[0,5,12,18,28].map(p=>(
                      <button key={p} onClick={()=>setShopSettings({...shopSettings,gstPercent:p})} style={{padding:'8px 16px',borderRadius:8,fontSize:13,fontWeight:600,background:shopSettings.gstPercent===p?GOLD:SURF,color:shopSettings.gstPercent===p?'#000':MU,border:'1px solid '+(shopSettings.gstPercent===p?GOLD:'#333'),cursor:'pointer'}}>
                        {p}%
                      </button>
                    ))}
                    <input
                      type='number'
                      placeholder='Custom %'
                      value={[0,5,12,18,28].includes(shopSettings.gstPercent)?'':shopSettings.gstPercent}
                      onChange={e=>setShopSettings({...shopSettings,gstPercent:Number(e.target.value)})}
                      style={{...inp,width:100,padding:'8px 12px'}}
                    />
                  </div>
                </div>
                <div style={{marginBottom:12}}>
                  <p style={{fontSize:12,color:MU,margin:'0 0 6px'}}>Shop Address</p>
                  <input
                    placeholder='Full shop address'
                    value={shopSettings.shopAddress}
                    onChange={e=>setShopSettings({...shopSettings,shopAddress:e.target.value})}
                    style={inp}
                  />
                </div>
                <div style={{marginBottom:20}}>
                  <p style={{fontSize:12,color:MU,margin:'0 0 6px'}}>Shop Phone (for invoice)</p>
                  <input
                    placeholder='Phone number'
                    value={shopSettings.shopPhone}
                    onChange={e=>setShopSettings({...shopSettings,shopPhone:e.target.value})}
                    style={inp}
                  />
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
