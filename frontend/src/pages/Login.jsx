import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Warehouse, ShieldCheck, User, KeyRound } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('storekeeper');
  const [password, setPassword] = useState('store123');
  const [error, setError] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          login(data.user);
        } else {
          setError(data.error || 'Login failed');
        }
      })
      .catch(err => setError('Server error connecting to backend: ' + err.message));
  };

  const demoAccounts = [
    { username: 'storekeeper', role: 'Storekeeper', name: 'Rajesh Sharma', desc: 'Main Store Inventory & Issue Manager' },
    { username: 'fitter_inst', role: 'Instructor (Fitter)', name: 'Amit Kumar', desc: 'Practical Requisition & Practical Jobs' },
    { username: 'elec_inst', role: 'Instructor (Electrician)', name: 'Suresh Patel', desc: 'Practical Requisition & Wiring Labs' },
    { username: 'approver', role: 'Approver', name: 'Dr. V. K. Singh', desc: 'Vice-Principal / Requisition Approval' },
    { username: 'admin', role: 'System Admin', name: 'System Admin', desc: 'Full System Control & Audit' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '960px', background: '#fff', borderRadius: '16px', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        
        {/* Left Branding Box */}
        <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)', padding: '3rem 2.5rem', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.15)', padding: '0.8rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <Warehouse size={42} color="#fff" />
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.75rem', lineHeight: 1.2 }}>StoreSync ITI</h1>
            <p style={{ color: '#93c5fd', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Centralized Store & Inventory Management System for Government Industrial Training Institutes.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1.25rem', borderRadius: '12px', fontSize: '0.9rem', color: '#e0f2fe' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={18} /> Digitized Register Standard
            </div>
            Replaces Bin Cards, Miscellaneous Registers, and Dead Stock Registers (DSR) with automated stock reconciliation.
          </div>
        </div>

        {/* Right Login Form */}
        <div style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Sign In to StoreSync</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Select role or enter login credentials</p>

          {error && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', minHeight: '50px' }}>
              Sign In
            </button>
          </form>

          {/* Quick Demo Role Picker Buttons */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Quick Demo One-Click Sign In
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {demoAccounts.map(account => (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => {
                    setUsername(account.username);
                    setPassword(account.username === 'storekeeper' ? 'store123' : account.username === 'approver' ? 'app123' : 'inst123');
                    fetch('/api/auth/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username: account.username, password: account.username === 'storekeeper' ? 'store123' : account.username === 'approver' ? 'app123' : 'inst123' })
                    })
                      .then(r => r.json())
                      .then(d => d.success && login(d.user));
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    padding: '0.6rem 0.85rem',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{account.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{account.role}</div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb' }}>Select &rarr;</span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
