import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AdminApp from './AdminApp'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{background:'#0F0F0F',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#DDD',fontFamily:'sans-serif',padding:20}}>
          <img src='/logo.png' style={{height:60,marginBottom:20}} alt='FAR POS' />
          <p style={{color:'#F87171',marginBottom:8}}>Something went wrong</p>
          <p style={{color:'#555',fontSize:12,marginBottom:20}}>{String(this.state.error)}</p>
          <button onClick={()=>window.location.reload()} style={{background:'#C9A84C',color:'#000',border:'none',padding:'10px 24px',borderRadius:8,cursor:'pointer',fontWeight:600}}>Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const isAdmin = window.location.pathname.startsWith('/admin');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      {isAdmin ? <AdminApp /> : <App />}
    </ErrorBoundary>
  </React.StrictMode>
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(r => console.log('SW registered'))
      .catch(e => console.log('SW error', e));
  });
}
