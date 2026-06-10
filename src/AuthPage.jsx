import { useState } from 'react';
import { registerUser, loginUser } from './auth';
import { verifyPhoneNumberFromSheet } from './googleSheets';
import { INDUSTRIES } from './config';

const GOLD = '#C9A84C';
const BG = '#0F0F0F';
const SURFACE = '#1A1A1A';
const BORDER = '#2A2A2A';
const TEXT = '#DDDDDD';
const MUTED = '#888888';

const inputStyle = {
  width: '100%',
  padding: '13px 16px',
  borderRadius: 10,
  border: '1px solid #333',
  background: '#111',
  color: TEXT,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  marginBottom: 12,
};

const goldBtn = {
  width: '100%',
  padding: 14,
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 700,
  background: GOLD,
  color: '#000',
  border: 'none',
  cursor: 'pointer',
  letterSpacing: 1,
  marginBottom: 10,
};

const ghostBtn = {
  width: '100%',
  padding: 14,
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  background: 'transparent',
  color: GOLD,
  border: '1px solid #333',
  cursor: 'pointer',
  letterSpacing: 0.5,
};

const card = {
  background: SURFACE,
  borderRadius: 20,
  padding: 36,
  maxWidth: 420,
  width: '100%',
  border: '1px solid #2A2A2A',
};

const page = {
  background: BG,
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

const errorBox = {
  background: '#2A1010',
  color: '#FF6B6B',
  padding: '10px 14px',
  borderRadius: 8,
  marginBottom: 14,
  fontSize: 13,
  border: '1px solid #4A2020',
};

export default function AuthPage({ onLoginSuccess }) {
  const [step, setStep] = useState('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [shop, setShop] = useState('');
  const [industry, setIndustry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!phone || !password) { setError('Please fill all fields'); return; }
    setLoading(true); setError('');
    const result = await loginUser(phone, password);
    setLoading(false);
    if (result.success) { onLoginSuccess(result.user); } else { setError(result.error); }
  };

  const handleVerify = async () => {
    if (!phone) { setError('Enter phone number'); return; }
    setLoading(true); setError('');
    const result = await verifyPhoneNumberFromSheet(phone);
    setLoading(false);
    if (result.success) {
      setName(result.user.ownerName);
      setShop(result.user.shopName);
      setIndustry(result.user.industryType);
      setStep('password'); setError('');
    } else { setError(result.error); }
  };

  const handleRegister = async () => {
    if (!phone || !password || !industry) { setError('Please fill all fields'); return; }
    setLoading(true); setError('');
    const result = await registerUser(shop, name, phone, password, industry);
    setLoading(false);
    if (result.success) { onLoginSuccess(result.userData); } else { setError(result.error); }
  };

  if (step === 'login') return (
    <div style={page}>
      <div style={card}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 13, letterSpacing: 4, color: MUTED, marginBottom: 8, textTransform: 'uppercase' }}>Welcome to</div>
          <img src='/logo.png' style={{height:80,objectFit:'contain',marginBottom:8}} alt='FAR POS' />
          <div style={{ fontSize: 12, color: '#555', marginTop: 8, letterSpacing: 2, textTransform: 'uppercase' }}>Point of Sale System</div>
          <div style={{ width: 40, height: 2, background: GOLD, margin: '16px auto 0', borderRadius: 2 }}></div>
        </div>
        {error && <div style={errorBox}>⚠ {error}</div>}
        <input type='tel' placeholder='Phone Number' value={phone} onChange={e=>setPhone(e.target.value)} style={inputStyle} />
        <input type='password' placeholder='Password' value={password} onChange={e=>setPassword(e.target.value)} style={inputStyle} />
        <button onClick={handleLogin} disabled={loading} style={{...goldBtn, background: loading?'#555':GOLD, cursor: loading?'not-allowed':'pointer'}}>
          {loading ? 'Verifying...' : 'Login'}
        </button>
        <button onClick={()=>{setStep('verify');setError('');setPhone('');setPassword('');}} style={ghostBtn}>New User? Register</button>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#444', letterSpacing: 1 }}>POWERED BY FAR TECHNOLOGIES</div>
      </div>
    </div>
  );

  if (step === 'verify') return (
    <div style={page}>
      <div style={card}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Step 1 of 3</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: GOLD, letterSpacing: 1 }}>Verify Phone</div>
          <div style={{ width: 30, height: 2, background: GOLD, marginTop: 10, borderRadius: 2 }}></div>
        </div>
        {error && <div style={errorBox}>⚠ {error}</div>}
        <input type='tel' placeholder='Enter your phone number' value={phone} onChange={e=>setPhone(e.target.value)} style={inputStyle} />
        <button onClick={handleVerify} disabled={loading} style={{...goldBtn, background:loading?'#555':GOLD, cursor:loading?'not-allowed':'pointer'}}>
          {loading ? 'Checking...' : 'Verify Number'}
        </button>
        <button onClick={()=>{setStep('login');setError('');}} style={ghostBtn}>Back to Login</button>
      </div>
    </div>
  );

  if (step === 'password') return (
    <div style={page}>
      <div style={card}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Step 2 of 3</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: GOLD, letterSpacing: 1 }}>Create Password</div>
          <div style={{ width: 30, height: 2, background: GOLD, marginTop: 10, borderRadius: 2 }}></div>
        </div>
        <div style={{ background: '#111', border: '1px solid #C9A84C33', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: 1, marginBottom: 4 }}>✓ VERIFIED</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{name}</div>
          <div style={{ fontSize: 12, color: MUTED }}>{shop} · {phone}</div>
        </div>
        {error && <div style={errorBox}>⚠ {error}</div>}
        <input type='password' placeholder='Create a password' value={password} onChange={e=>setPassword(e.target.value)} style={inputStyle} />
        <button onClick={()=>setStep('industry')} style={goldBtn}>Next →</button>
        <button onClick={()=>{setStep('verify');setError('');}} style={ghostBtn}>Back</button>
      </div>
    </div>
  );

  if (step === 'industry') return (
    <div style={{...page, alignItems: 'flex-start', paddingTop: 40}}>
      <div style={{ maxWidth: 700, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Step 3 of 3</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: GOLD, letterSpacing: 1 }}>Select Business Type</div>
          <div style={{ width: 30, height: 2, background: GOLD, margin: '10px auto 0', borderRadius: 2 }}></div>
        </div>
        {error && <div style={{...errorBox, maxWidth: 420, margin: '0 auto 16px'}}>⚠ {error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
          {Object.entries(INDUSTRIES).map(([key, ind]) => (
            <div key={key} onClick={()=>setIndustry(key)} style={{
              background: industry===key ? '#1E1A10' : SURFACE,
              border: industry===key ? '1.5px solid '+GOLD : '1px solid '+BORDER,
              borderRadius: 16,
              padding: 20,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: 38, marginBottom: 10 }}>{ind.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: industry===key ? GOLD : TEXT }}>{ind.name}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, maxWidth: 420, margin: '0 auto' }}>
          <button onClick={()=>{setStep('password');setError('');}} style={{...ghostBtn, flex:1, marginBottom:0}}>Back</button>
          <button onClick={handleRegister} disabled={loading} style={{...goldBtn, flex:1, marginBottom:0, background:loading?'#555':GOLD, cursor:loading?'not-allowed':'pointer'}}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );

  return null;
}
