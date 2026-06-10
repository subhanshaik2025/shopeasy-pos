import { useState, useRef, useEffect } from 'react';
import { GOLD, BOR, SURF, TX, DIM, MU, inp, goldBtn, ghostBtn, card, sT } from '../utils/theme';

function parseItems(bill) {
  try {
    if (typeof bill.items_json === 'string' && bill.items_json) return JSON.parse(bill.items_json);
    if (Array.isArray(bill.items)) return bill.items;
  } catch(e) {}
  return [];
}

function getBillId(b) { return String(b.id || b.bill_id || '—'); }
function getBillTotal(b) { return Number(b.total || 0); }
function getBillGst(b) { return Number(b.gst || 0); }
function getBillDiscount(b) { return Number(b.discount || 0); }
function getBillMode(b) { return String(b.mode || b.payment_mode || ''); }
function getBillDate(b) {
  const d = b.date || b.timestamp || '';
  try {
    const dt = new Date(d);
    if (!isNaN(dt)) return dt.toLocaleDateString('en-IN');
  } catch(e) {}
  return String(d).split('T')[0];
}

export default function HistoryTab({ bills, setBills, currentUser, userRef, getSalesFromSheet, shareOnWhatsApp, generateGSTInvoice, sendDailySummary }) {
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const detailRef = useRef(null);

  useEffect(() => {
    if (detail && detailRef.current) {
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior:'smooth', block:'nearest' }), 100);
    }
  }, [detail]);

  const filtered = [...bills].reverse().filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return getBillId(b).toLowerCase().includes(q) ||
           String(getBillTotal(b)).includes(q) ||
           getBillDate(b).includes(q);
  });

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
        <p style={{...sT,margin:0}}>Bill History</p>
        <div style={{display:'flex',gap:8}}>
          <button onClick={sendDailySummary} style={{...goldBtn(false),fontSize:12,padding:'6px 14px'}}>📊 WhatsApp Summary</button>
          <button onClick={()=>getSalesFromSheet(userRef.current||currentUser).then(s=>{if(s&&s.length>0)setBills(s);})} style={ghostBtn}>Refresh</button>
        </div>
      </div>

      <input placeholder='Search by bill ID, amount or date...' value={search} onChange={e=>setSearch(e.target.value)} style={{...inp,marginBottom:16}} />

      {filtered.map((b,idx)=>(
        <div key={getBillId(b)+idx}>
          <div onClick={()=>setDetail(detail&&getBillId(detail)===getBillId(b)?null:b)} style={{...card,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:detail&&getBillId(detail)===getBillId(b)?0:10,borderRadius:detail&&getBillId(detail)===getBillId(b)?'12px 12px 0 0':12,border:'1px solid '+(detail&&getBillId(detail)===getBillId(b)?GOLD+'66':BOR)}}>
            <div>
              <p style={{margin:'0 0 3px',fontSize:13,fontWeight:600,color:TX}}>{getBillId(b)}</p>
              <p style={{margin:0,fontSize:11,color:DIM}}>{getBillDate(b)} · {getBillMode(b).toUpperCase()}</p>
            </div>
            <span style={{fontSize:16,fontWeight:700,color:GOLD}}>Rs. {getBillTotal(b).toLocaleString()}</span>
          </div>

          {detail&&getBillId(detail)===getBillId(b)&&(
            <div ref={detailRef} style={{background:SURF,border:'1px solid '+GOLD+'66',borderTop:'none',borderRadius:'0 0 12px 12px',padding:16,marginBottom:10}}>
              <p style={{fontSize:12,color:MU,margin:'0 0 4px'}}>ID: {getBillId(detail)}</p>
              <p style={{fontSize:12,color:MU,margin:'0 0 12px'}}>Date: {getBillDate(detail)} · {getBillMode(detail).toUpperCase()}</p>
              {parseItems(detail).length > 0 ? parseItems(detail).map((item,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #222'}}>
                  <span style={{fontSize:13,color:TX}}>{item.name||'Item'} × {Number(item.qty||1)}</span>
                  <span style={{fontSize:13,color:GOLD}}>Rs. {(Number(item.price||0)*Number(item.qty||1)).toLocaleString()}</span>
                </div>
              )) : <p style={{fontSize:12,color:DIM}}>No item details available</p>}
              <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid #333'}}>
                {getBillDiscount(detail)>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:MU,marginBottom:4}}><span>Discount</span><span style={{color:'#F87171'}}>- Rs. {getBillDiscount(detail).toLocaleString()}</span></div>}
                <div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:MU,marginBottom:4}}><span>GST</span><span style={{color:TX}}>Rs. {getBillGst(detail).toLocaleString()}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:18,fontWeight:700,marginTop:8}}><span>Total</span><span style={{color:GOLD}}>Rs. {getBillTotal(detail).toLocaleString()}</span></div>
              </div>
              <div style={{display:'flex',gap:8,marginTop:12}}>
                <button onClick={()=>shareOnWhatsApp(detail)} style={{...goldBtn(false),flex:1,textAlign:'center'}}>WhatsApp</button>
                <button onClick={()=>generateGSTInvoice(detail)} style={{flex:1,padding:'10px 18px',background:'transparent',color:GOLD,border:'1px solid #333',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>GST Invoice</button>
              </div>
              <button onClick={()=>setDetail(null)} style={{...ghostBtn,width:'100%',marginTop:8,textAlign:'center'}}>Close</button>
            </div>
          )}
        </div>
      ))}
      {bills.length===0&&<p style={{color:DIM,fontSize:13}}>No bills yet</p>}
    </div>
  );
}
