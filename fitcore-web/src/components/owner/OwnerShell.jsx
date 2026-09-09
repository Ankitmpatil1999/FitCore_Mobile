import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './OwnerDashboard.css';

const API_BASE = 'http://localhost:7000/api/gym-admin';

const getToken = () => localStorage.getItem('fitcore_token');
const authFetch = (url, opts = {}) => fetch(url, {
  ...opts,
  headers: { Authorization: 'Bearer ' + getToken(), ...(opts.headers || {}) }
});

export const OwnerContext = React.createContext({});

export default function OwnerShell({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = JSON.parse(localStorage.getItem('fitcore_user') || '{}');

  // Global state shared across views via context
  const [gymId, setGymId] = useState(storedUser.gymId || '');
  const [overview, setOverview] = useState(null);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [attendanceToday, setAttendanceToday] = useState({ records: [], stats: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [notifCount] = useState(8);
  const [expandedSection, setExpandedSection] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    if (!gymId) return;
    setIsLoading(true);
    try {
      const [ovR, mR, tR, pR] = await Promise.all([
        authFetch(`${API_BASE}/overview?gymId=${gymId}`),
        authFetch(`${API_BASE}/members?gymId=${gymId}`),
        authFetch(`${API_BASE}/trainers?gymId=${gymId}`),
        authFetch(`${API_BASE}/packages?gymId=${gymId}`),
      ]);
      const [ov, m, t, p] = await Promise.all([ovR.json(), mR.json(), tR.json(), pR.json()]);
      if (ov.success) setOverview(ov.data);
      if (m.success) setMembers(m.data);
      if (t.success) setTrainers(t.data);
      if (p.success) setPackages(p.data);
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => {
    if (!gymId) {
      authFetch('http://localhost:7000/api/admin/gyms')
        .then(r => r.json()).then(d => {
          if (d.success && d.data?.length) setGymId(d.data[0].id || d.data[0]._id);
        }).catch(() => {});
    }
  }, []);

  useEffect(() => { loadData(); }, [gymId]);

  const nav = (path) => navigate(path);
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const NAV = [
    { path: '/owner/dashboard', icon: '🏠', label: 'Dashboard' },
    {
      id: 'members', icon: '👥', label: 'Members', sub: [
        { path: '/owner/members', label: 'All Members' },
        { path: '/owner/members/add', label: 'Add Member' },
        { path: '/owner/members/active', label: 'Active' },
        { path: '/owner/members/expiring', label: 'Expiring Soon' },
        { path: '/owner/members/expired', label: 'Expired' },
      ]
    },
    {
      id: 'access', icon: '🚪', label: 'Turnstile & Access', sub: [
        { path: '/owner/access/live', label: 'Live Occupancy' },
        { path: '/owner/access/checkin', label: 'Check-in' },
        { path: '/owner/access/checkout', label: 'Check-out' },
        { path: '/owner/access/gates', label: 'Gate Status' },
      ]
    },
    { path: '/owner/attendance', icon: '📅', label: 'Visits & Attendance' },
    {
      id: 'memberships', icon: '💳', label: 'Memberships', sub: [
        { path: '/owner/memberships', label: 'All Plans' },
        { path: '/owner/memberships/active', label: 'Active' },
        { path: '/owner/memberships/renewals', label: 'Renewals' },
        { path: '/owner/memberships/payments', label: 'Payments' },
      ]
    },
    {
      id: 'notifications', icon: '🔔', label: 'Notifications', sub: [
        { path: '/owner/notifications/send', label: 'Send Notification' },
        { path: '/owner/notifications/broadcast', label: 'Broadcast' },
        { path: '/owner/notifications/history', label: 'History' },
      ]
    },
    { path: '/owner/classes', icon: '🏋️', label: 'Classes & Schedules' },
    { path: '/owner/pos', icon: '🛒', label: 'Nutrition Store (POS)' },
    { path: '/owner/payments', icon: '💰', label: 'Orders & Payments' },
    { path: '/owner/reports', icon: '📊', label: 'Reports & Analytics' },
    { path: '/owner/expenses', icon: '💸', label: 'Expenses' },
    { path: '/owner/settings', icon: '⚙️', label: 'Settings' },
    { path: '/owner/support', icon: '❓', label: 'Support' },
  ];

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good Morning' : greetingHour < 17 ? 'Good Afternoon' : 'Good Evening';
  const ownerName = storedUser.name?.split(' ')[0] || 'Owner';
  const initials = storedUser.name ? storedUser.name.slice(0, 2).toUpperCase() : 'AY';

  return (
    <OwnerContext.Provider value={{
      gymId, overview, members, trainers, packages, attendanceToday,
      isLoading, showToast, loadData, setMembers
    }}>
      <div className="ow-shell">
        {/* ── SIDEBAR ─────────────────────────────────────── */}
        <aside className="ow-sidebar">
          <div className="ow-sidebar-logo">
            <div className="ow-logo-brand">Fit<span>Core</span></div>
            <div className="ow-logo-sub">Owner Intelligence Suite</div>
          </div>

          <div className="ow-branch-box">
            <div className="ow-branch-label">Active Branch</div>
            <div className="ow-branch-name">SRGS Fitness, Nagpur <span>▾</span></div>
          </div>

          <nav className="ow-nav">
            {NAV.map((item) => {
              if (item.sub) {
                const open = expandedSection === item.id || item.sub.some(s => isActive(s.path));
                return (
                  <div key={item.id}>
                    <button
                      className={`ow-nav-item ${item.sub.some(s => isActive(s.path)) ? 'active' : ''}`}
                      onClick={() => setExpandedSection(open ? null : item.id)}
                    >
                      <span className="ow-nav-icon">{item.icon}</span>
                      {item.label}
                      <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.6 }}>{open ? '▴' : '▾'}</span>
                    </button>
                    {open && (
                      <div className="ow-nav-sub">
                        {item.sub.map(s => (
                          <button
                            key={s.path}
                            className={`ow-nav-item ${isActive(s.path) ? 'active' : ''}`}
                            onClick={() => nav(s.path)}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <button
                  key={item.path}
                  className={`ow-nav-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => nav(item.path)}
                >
                  <span className="ow-nav-icon">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="ow-sidebar-footer">
            <div className="ow-plan-upgrade">
              <div className="ow-plan-upgrade-label">Current Plan</div>
              <div className="ow-plan-upgrade-tier">👑 Pro Studio</div>
              <button className="ow-plan-upgrade-btn" onClick={() => showToast('Upgrade request sent!', 'info')}>
                ⚡ Upgrade to Enterprise
              </button>
            </div>
            <div className="ow-user-row">
              <div className="ow-user-av">{initials}</div>
              <div>
                <div className="ow-user-name">{storedUser.name || 'Ayushi Patil'}</div>
                <div className="ow-user-role">Franchise Owner</div>
              </div>
            </div>
            <button className="ow-logout-btn" onClick={onLogout}>🚪 Sign Out</button>
          </div>
        </aside>

        {/* ── MAIN ────────────────────────────────────────── */}
        <main className="ow-main">
          {/* TOPBAR */}
          <header className="ow-topbar">
            <div className="ow-topbar-left">
              <div className="ow-topbar-greeting">{greeting}, {ownerName}! 👋</div>
              <div className="ow-topbar-sub">Here's what's happening at your gym today.</div>
            </div>
            <div className="ow-topbar-right">
              <div className="ow-search-box">
                <span>🔍</span>
                <input type="text" placeholder="Search members, plans..." />
              </div>
              <div className="ow-date-chip">
                📅 {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </div>
              <div className="ow-icon-btn" title="Notifications" onClick={() => nav('/owner/notifications/history')}>
                🔔
                {notifCount > 0 && <span className="ow-noti-badge">{notifCount}</span>}
              </div>
              <div className="ow-icon-btn" title="Help" onClick={() => nav('/owner/support')}>❓</div>
              <button className="ow-qa-btn" onClick={() => nav('/owner/members/add')}>
                ＋ Quick Action
              </button>
            </div>
          </header>

          {/* VIEW OUTLET */}
          <div className="ow-view" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Outlet />
          </div>
        </main>

        {/* TOAST */}
        {toast && (
          <div className={`ow-toast ${toast.type}`}>{toast.msg}</div>
        )}
      </div>
    </OwnerContext.Provider>
  );
}
