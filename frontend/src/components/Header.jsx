import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Warehouse, UserCheck, LogOut, ShieldAlert } from 'lucide-react';

export const Header = () => {
  const { user, usersList, switchRoleUser, logout } = useAuth();

  return (
    <header className="top-navbar">
      <div className="app-brand">
        <div style={{ background: '#1e3a8a', color: '#fff', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>
          <Warehouse size={28} />
        </div>
        <div>
          <span>StoreSync</span>
          <span style={{ fontSize: '0.75rem', display: 'block', color: '#64748b', fontWeight: 500 }}>
            Govt ITI Inventory System
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* Quick Role Switcher Bar */}
        <div className="user-switcher-bar">
          <UserCheck size={18} color="#1e3a8a" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Active Role:</span>
          <select 
            className="form-select" 
            style={{ padding: '0.3rem 0.6rem', minHeight: '36px', width: 'auto', fontWeight: 600, fontSize: '0.85rem' }}
            value={user ? user.id : ''}
            onChange={(e) => switchRoleUser(e.target.value)}
          >
            {usersList.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role}{u.department ? ` - ${u.department}` : ''})
              </option>
            ))}
          </select>
        </div>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{user.name}</div>
              <span className="badge-register badge-bin" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                {user.role}
              </span>
            </div>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={logout}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
