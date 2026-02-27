import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Regression from './pages/Regression.jsx'
import Classification from './pages/Classification.jsx'
import Clustering from './pages/Clustering.jsx'

export default function App() {
  return (
    <div className="bg-animated min-h-screen">
      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(108, 92, 231, 0.15)',
        background: 'rgba(10, 10, 26, 0.6)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6c5ce7, #4facfe)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
          }}>
            🧠
          </div>
          <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span style={{ fontWeight: 700, fontSize: '18px' }} className="gradient-text">
              ML Model Trainer
            </span>
          </a>
          <span className="badge badge-purple" style={{ marginLeft: '4px' }}>
            sklearn
          </span>
        </div>
      </header>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/regression" element={<Regression />} />
        <Route path="/classification" element={<Classification />} />
        <Route path="/clustering" element={<Clustering />} />
      </Routes>
    </div>
  )
}
