import { useState } from 'react';
import { registerUser, loginUser } from './auth';
import { verifyPhoneNumberFromSheet } from './googleSheets';
import { INDUSTRIES } from './config';

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
    if (!phone || !password) { setError('Fill all fields'); return; }
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
    if (!phone || !password || !industry) { setError('Fill all fields'); return; }
    setLoading(true); setError('');
    const result = await registerUser(shop, name, phone, password, industry);
    setLoading(false);
    if (result.success) { onLoginSuccess(result.userData); } else { setError(result.error); }
  };

  if (step === 'login') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #E6F7F5, #F3F3EE)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 400, width: '100%' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0D9488', marginBottom: 8, textAlign: 'center' }}>FAR-POS</h1>
          <p style={{ fontSize: 13, color: '#999', marginBottom: 24, textAlign: 'center' }}>Point of Sale</p>
          <div style={{ marginBottom: 16 }}>
            <input type='tel' placeholder='Phone Number' value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <input type='password' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14 }} />
          </div>
          {error && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '10px 12px', borderRadius: 8, marginBottom: 16, fontSize: 12 }}>{error}</div>}
          <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, background: loading ? '#aaa' : '#0D9488', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 12 }}>
            {loading ? 'Please wait...' : 'Login'}
          </button>
          <button onClick={() => { setStep('verify'); setError(''); setPhone(''); setPassword(''); }} style={{ width: '100%', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#f0f0f0', color: '#0D9488', border: 'none', cursor: 'pointer' }}>New User? Register</button>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #E6F7F5, #F3F3EE)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 400, width: '100%' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0D9488', marginBottom: 20 }}>Verify Phone</h2>
          <div style={{ marginBottom: 16 }}>
            <input type='tel' placeholder='Phone Number' value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14 }} />
          </div>
          {error && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '10px 12px', borderRadius: 8, marginBottom: 16, fontSize: 12 }}>{error}</div>}
          <button onClick={handleVerify} disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, background: loading ? '#aaa' : '#0D9488', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 12 }}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
          <button onClick={() => { setStep('login'); setError(''); }} style={{ width: '100%', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#f0f0f0', color: '#666', border: 'none', cursor: 'pointer' }}>Back</button>
        </div>
      </div>
    );
  }

  if (step === 'password') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #E6F7F5, #F3F3EE)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 400, width: '100%' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0D9488', marginBottom: 20 }}>Create Password</h2>
          <div style={{ background: '#E6F7F5', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#0D9488', fontWeight: 600 }}>Verified: {phone}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{name} - {shop}</p>
          </div>
          <div style={{ marginBottom: 16 }}>
            <input type='password' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14 }} />
          </div>
          <button onClick={() => setStep('industry')} style={{ width: '100%', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#0D9488', color: '#fff', border: 'none', cursor: 'pointer', marginBottom: 12 }}>Next</button>
          <button onClick={() => { setStep('verify'); setError(''); }} style={{ width: '100%', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#f0f0f0', color: '#666', border: 'none', cursor: 'pointer' }}>Back</button>
        </div>
      </div>
    );
  }

  if (step === 'industry') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #E6F7F5, #F3F3EE)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 900, width: '100%' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0D9488', marginBottom: 20, textAlign: 'center' }}>Select Business Type</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            {Object.entries(INDUSTRIES).map(([key, ind]) => (
              <div key={key} onClick={() => setIndustry(key)} style={{ background: industry === key ? '#E6F7F5' : '#fff', borderRadius: 16, padding: 20, cursor: 'pointer', border: industry === key ? '2px solid #0D9488' : '2px solid #eee', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{ind.icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{ind.name}</h3>
              </div>
            ))}
          </div>
          {error && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '10px 12px', borderRadius: 8, marginBottom: 16, fontSize: 12 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setStep('password')} style={{ flex: 1, padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#f0f0f0', color: '#666', border: 'none', cursor: 'pointer' }}>Back</button>
            <button onClick={handleRegister} disabled={loading} style={{ flex: 1, padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, background: loading ? '#aaa' : '#0D9488', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}