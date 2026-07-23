import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/auth';

function IconDashboard() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 10a8 8 0 1 1 16 0A8 8 0 0 1 2 10Zm8-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  );
}
function IconServer() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v2.5A2.25 2.25 0 0 0 4.25 9h11.5A2.25 2.25 0 0 0 18 6.75v-2.5A2.25 2.25 0 0 0 15.75 2H4.25Zm0 9A2.25 2.25 0 0 0 2 13.25v2.5A2.25 2.25 0 0 0 4.25 18h11.5A2.25 2.25 0 0 0 18 15.75v-2.5A2.25 2.25 0 0 0 15.75 11H4.25Zm8.25-5.5a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5h-1.5Zm0 9a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5h-1.5ZM6.75 5a.75.75 0 0 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9a.75.75 0 0 0 0 1.5.75.75 0 0 0 0-1.5Z" clipRule="evenodd" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Zm12.97 4.22a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06l.97-.97H8a.75.75 0 0 1 0-1.5h8.94l-.97-.97a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
  );
}

export default function Sidebar() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = (username ?? 'A').slice(0, 2).toUpperCase();

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⛏</div>
        <div>
          <div className="sidebar-logo-text">MC Panel</div>
          <div className="sidebar-logo-sub">Server Manager</div>
        </div>
      </div>

      <div className="sidebar-nav">
        <div className="sidebar-section-label">General</div>
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <IconDashboard /> Dashboard
        </NavLink>
        <div className="sidebar-section-label">System</div>
        <div className="sidebar-link" style={{ opacity: 0.4, cursor: 'not-allowed' }}>
          <IconServer /> Multi-node
          <span style={{ marginLeft: 'auto', fontSize: '0.55rem', background: 'var(--yellow-dim)', color: 'var(--yellow)', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>SOON</span>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div>
            <div className="sidebar-username">{username}</div>
            <div className="sidebar-role">Administrator</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm w-full" onClick={handleLogout} style={{ justifyContent: 'center', gap: '6px' }}>
          <IconLogout /> Sign Out
        </button>
      </div>
    </nav>
  );
}
