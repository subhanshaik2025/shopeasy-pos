import { useState, useEffect } from 'react';
import AuthPage from './AuthPage';
import { getCurrentUser, isUserLoggedIn, logoutUser } from './auth';
import { INDUSTRIES } from './config';
import { generateId, calculateTotal } from './utils';
import { initializeAppData } from './loadGoogleSheet';
import { saveBillToSheet, getSalesFromSheet } from './salesSheets';

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

  useEffect(()=>{
    initializeAppData();
    if(isUserLoggedIn()){
      const user=getCurrentUser();
      setCurrentUser(user);
      setIsLoggedIn(true);
      const ind=INDUSTRIES[user.industry_type];
      setIndustry(ind);
      const saved=localStorage.getItem('pos-products-'+user.id);
      if(saved) setProducts(JSON.parse(saved));
      else setProducts(ind.sampleProducts||[]);
      getSalesFromSheet(user.shop_name).then(s=>setBills(s));
      const k=localStorage.getItem('pos-khata-'+user.id);
      if(k) setKhata(JSON.parse(k));
      const e=localStorage.getItem('pos-expenses-'+user.id);
      if(e) setExpenses(JSON.parse(e));
    }
  },[]);

  const saveProducts=(p,user)=>{
    setProducts(p);
    localStorage.setItem('pos-products-'+(user||currentUser).id,JSON.stringify(p));
  };
  const saveKhata=(k)=>{ setKhata(k); localStorage.setItem('pos-khata-'+currentUser.id,JSON.stringify(k)); };
  const saveExpenses=(e)=>{ setExpenses(e); localStorage.setItem('pos-expenses-'+currentUser.id,JSON.stringify(e)); };

  const handleLoginSuccess=(user)=>{
    setCurrentUser(user);
    setIsLoggedIn(true);
    const ind=INDUSTRIES[user.industry_type];
    setIndustry(ind);
    const saved=localStorage.getItem('pos-products-'+user.id);
    if(saved) setProducts(JSON.parse(saved));
    else setProducts(ind.sampleProducts||[]);
    getSalesFromSheet(user.shop_name).then(s=>setBills(s));
    const k=localStorage.getItem('pos-khata-'+user.id);
    if(k) setKhata(JSON.parse(k));
    const e=localStorage.getItem('pos-expenses-'+user.id);
    if(e) setExpenses(JSON.parse(e));
  };

  const handleLogout=()=>{ logoutUser(); setIsLoggedIn(false); setCurrentUser(null); setCart([]); setBills([]); };

  if(!isLoggedIn) return <AuthPage onLoginSuccess={handleLoginSuccess}/>;

  const subtotal=cart.reduce((s,c)=>s+(c.price*c.qty),0);
  const discountAmt=discountType==='percent'?Math.round(subtotal*discount/100):Math.min(discount,subtotal);
  const afterDiscount=subtotal-discountAmt;
  const {grandTotal,gst}=calculateTotal(afterDiscount,5);

  const addToCart=(p)=>{
    if(p.stock!==undefined && p.stock<=0){ alert('Out of stock'); return; }
    const ex=cart.find(c=>c.id===p.id);
    setCart(ex?cart.map(c=>c.id===p.id?{...c,qty:c.qty+1}:c):[...cart,{...p,qty:1}]);
  };

  const updateCartQty=(id,qty)=>{
    if(qty<=0) setCart(cart.filter(c=>c.id!==id));
    else setCart(cart.map(c=>c.id===id?{...c,qty}:c));
  };

  const completeBill=async(mode)=>{
    if(cart.length===0){alert('Cart is empty');return;}
    setLoadingBill(true);
    const bill={
      id:generateId('bill'),items:cart,subtotal:Math.round(subtotal),
      discount:discountAmt,gst:Math.round(gst),total:Math.round(grandTotal),
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
    alert('Bill saved! Total: Rs.'+bill.total);
  };

  const shareOnWhatsApp=(bill)=>{
    const items=(typeof bill.items_json==='string'?JSON.parse(bill.items_json):(bill.items||[]));
    let msg='*'+currentUser.shop_name+'*\nBill: '+bill.id+'\nDate: '+bill.date+'\n\n';
    items.forEach(i=>{ msg+=i.name+' x'+i.qty+' = Rs.'+i.price*i.qty+'\n'; });
    msg+='\nTotal: Rs.'+bill.total+'\nPayment: '+(bill.mode||bill.payment_mode).toUpperCase();
    window.open('https://wa.me/?text='+encodeURIComponent(msg));
  };

  const parseBillDate=(b)=>b.timestamp?new Date(b.timestamp):b.date?new Date(b.date):new Date();
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

  return (
    <div style={{fontFamily:'sans-serif',background:BG,minHeight:'100vh',color:TX}}>
      <div style={{background:SURF,borderBottom:'1px solid '+BOR,padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:20,fontWeight:600,letterSpacing:3,color:GOLD}}>FAR — POS</div>
          <div style={{fontSize:12,color:MU,marginTop:2}}>{currentUser?.shop_name} · {currentUser?.owner_name}</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {lowStock.length>0&&<div style={{background:'#2A1A00',border:'1px solid #C9A84C44',borderRadius:8,padding:'4px 10px',fontSize:11,color:GOLD}}>⚠ {lowStock.length} low stock</div>}
          <button onClick={handleLogout} style={{background:'#2A2A2A',border:'1px solid #3A3A3A',color:MU,padding:'6px 14px',borderRadius:8,fontSize:12,cursor:'pointer'}}>Logout</button>
        </div>
      </div>

      <div style={{background:'#141414',display:'flex',gap:4,padding:'10px 20px 0',borderBottom:'1px solid #222',overflowX:'auto'}}>
        {['billing','products','inventory','khata','history','reports'].map(f=>(
          <button key={f} onClick={()=>setTab(f)} style={tabStyle(tab===f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
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
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13,color:MU}}><span>GST (5%)</span><span style={{color:TX}}>Rs. {Math.round(gst).toLocaleString()}</span></div>
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
                    if(!newProduct.name||!newProduct.price){alert('Name and price required');return;}
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
                    if(!newKhata.customer||!newKhata.amount){alert('Customer and amount required');return;}
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
              <button onClick={()=>getSalesFromSheet(currentUser.shop_name).then(s=>setBills(s))} style={ghostBtn}>Refresh</button>
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
                <button onClick={()=>shareOnWhatsApp(showBillDetail)} style={{...goldBtn(false),width:'100%',marginTop:12,textAlign:'center'}}>Share on WhatsApp</button>
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
                <button onClick={()=>getSalesFromSheet(currentUser.shop_name).then(s=>setBills(s))} style={ghostBtn}>Refresh</button>
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
                    if(!newExpense.title||!newExpense.amount){alert('Fill all fields');return;}
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
      </div>
    </div>
  );
}
