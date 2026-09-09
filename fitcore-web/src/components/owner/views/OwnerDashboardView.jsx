import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerContext } from '../OwnerShell';

const MOCK_RECENT_CHECKINS = [
  { name: 'Rahul Verma', id: 'FC-M528', time: '07:45 AM', plan: 'Pro Studio', gate: 'Main Gate', av: 'RV' },
  { name: 'Sneha Kapoor', id: 'FC-M312', time: '07:42 AM', plan: 'Pro Studio', gate: 'Main Gate', av: 'SK' },
  { name: 'Amit Shukla', id: 'FC-M201', time: '07:30 AM', plan: 'Starter', gate: 'Side Gate', av: 'AS' },
  { name: 'Priya Mehta', id: 'FC-M405', time: '07:15 AM', plan: 'Enterprise', gate: 'Main Gate', av: 'PM' },
  { name: 'Vikram Desai', id: 'FC-M139', time: '07:02 AM', plan: 'Pro Studio', gate: 'Back Gate', av: 'VD' },
];
const MOCK_EXPIRING = [
  { name: 'Rohit Nair', plan: 'Pro Studio', expiry: '05 Sep 2026', daysLeft: 5, av: 'RN' },
  { name: 'Anjali Singh', plan: 'Starter', expiry: '08 Sep 2026', daysLeft: 8, av: 'AS' },
  { name: 'Deepak Patil', plan: 'Enterprise', expiry: '10 Sep 2026', daysLeft: 10, av: 'DP' },
  { name: 'Kiran Joshi', plan: 'Pro Studio', expiry: '12 Sep 2026', daysLeft: 12, av: 'KJ' },
];
const WEEKLY_DATA = [
  { day: 'Mon', count: 287, today: false },
  { day: 'Tue', count: 312, today: false },
  { day: 'Wed', count: 265, today: false },
  { day: 'Thu', count: 341, today: false },
  { day: 'Fri', count: 308, today: false },
  { day: 'Sat', count: 198, today: false },
  { day: 'Sun', count: 312, today: true },
];
const MAX_WEEKLY = 350;
const REVENUE_DATA = [
  { day: 'Mon', amt: 42000 }, { day: 'Tue', amt: 55000 }, { day: 'Wed', amt: 38000 },
  { day: 'Thu', amt: 61000 }, { day: 'Fri', amt: 48920 }, { day: 'Sat', amt: 29000 }, { day: 'Sun', amt: 48920 },
];
const MAX_REV = 65000;

export default function OwnerDashboardView() {
  const { overview, members, showToast } = useContext(OwnerContext);
  const navigate = useNavigate();

  const stats = {
    totalMembers: overview?.totalMembers ?? 528,
    activeMembers: overview?.activeMembers ?? 486,
    checkinsToday: overview?.checkinsToday ?? 312,
    insideNow: overview?.insideNow ?? 186,
    capacity: overview?.capacity ?? 600,
    revenueToday: overview?.revenueToday ?? 48920,
    pendingDues: overview?.pendingDues ?? 124500,
    expiringCount: overview?.expiringCount ?? 18,
  };

  const occupancyPct = Math.round((stats.insideNow / stats.capacity) * 100);
  // SVG arc calc
  const R = 56, C = 2 * Math.PI * R;
  const filled = C * (1 - occupancyPct / 100);

  const QUICK_ACTIONS = [
    { icon: '👤', label: 'Add Member', color: '#e0e7ff', path: '/owner/members/add' },
    { icon: '✅', label: 'Check-in', color: '#d1fae5', path: '/owner/access/checkin' },
    { icon: '🚪', label: 'Check-out', color: '#fef3c7', path: '/owner/access/checkout' },
    { icon: '💵', label: 'Collect Payment', color: '#fce7f3', path: '/owner/payments' },
    { icon: '🔄', label: 'Renew Membership', color: '#f3e8ff', path: '/owner/memberships/renewals' },
    { icon: '🔔', label: 'Send Notification', color: '#e0f2fe', path: '/owner/notifications/send' },
    { icon: '📢', label: 'Create Broadcast', color: '#fff7ed', path: '/owner/notifications/broadcast' },
    { icon: '📊', label: 'View Reports', color: '#f1f5f9', path: '/owner/reports' },
  ];

  return (
    <div style={{ padding: '26px 28px', overflowY: 'auto', flex: 1 }}>
      {/* KPI CARDS */}
      <div className="ow-kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 18 }}>
        {[
          { label: 'Total Members', value: stats.totalMembers.toLocaleString('en-IN'), icon: '👥', color: 'purple', delta: '+12 this week', up: true },
          { label: 'Check-ins Today', value: stats.checkinsToday.toLocaleString('en-IN'), icon: '✅', color: 'green', delta: '+8% vs yesterday', up: true },
          { label: 'Inside Gym Now', value: stats.insideNow.toLocaleString('en-IN'), icon: '🏋️', color: 'blue', delta: `${occupancyPct}% capacity`, up: null },
          { label: "Today's Revenue", value: `₹${stats.revenueToday.toLocaleString('en-IN')}`, icon: '💰', color: 'orange', delta: '+₹4,280 vs yesterday', up: true },
        ].map(k => (
          <div className="ow-kpi-card" key={k.label}>
            <div className={`ow-kpi-icon-wrap ${k.color}`}>{k.icon}</div>
            <div className="ow-kpi-label">{k.label}</div>
            <div className="ow-kpi-value">{k.value}</div>
            {k.delta && <div className={`ow-kpi-delta ${k.up === true ? 'up' : k.up === false ? 'down' : ''}`}>{k.up === true ? '↑' : k.up === false ? '↓' : ''} {k.delta}</div>}
          </div>
        ))}
      </div>

      {/* QUICK ACTIONS */}
      <div className="ow-quick-actions" style={{ marginBottom: 18 }}>
        {QUICK_ACTIONS.map(q => (
          <div className="ow-qa-tile" key={q.label} onClick={() => navigate(q.path)}>
            <div className="ow-qa-tile-icon" style={{ background: q.color }}>{q.icon}</div>
            <div className="ow-qa-tile-label">{q.label}</div>
          </div>
        ))}
      </div>

      {/* MAIN GRID: Occupancy + Chart + Expiring + Checkins */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 18, marginBottom: 18 }}>
        {/* LIVE OCCUPANCY */}
        <div className="ow-card">
          <div className="ow-card-title">🔴 Live Occupancy
            <span style={{ fontSize: 10, fontWeight: 600, color: '#10b981', background: '#d1fae5', padding: '2px 8px', borderRadius: 6 }}>● LIVE</span>
          </div>
          <div className="ow-occ-wrap">
            <svg width="140" height="140" viewBox="0 0 140 140" style={{ filter: 'drop-shadow(0 4px 16px rgba(99,102,241,0.22))' }}>
              <circle cx="70" cy="70" r={R} fill="none" stroke="#e0e7ff" strokeWidth="10" />
              <circle cx="70" cy="70" r={R} fill="none" stroke="url(#occ-grad)" strokeWidth="10"
                strokeDasharray={`${C}`} strokeDashoffset={filled}
                strokeLinecap="round" transform="rotate(-90 70 70)" />
              <defs>
                <linearGradient id="occ-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a5b4fc" />
                </linearGradient>
              </defs>
              <text x="70" y="66" textAnchor="middle" fontSize="22" fontWeight="900" fill="#0f172a">{occupancyPct}%</text>
              <text x="70" y="84" textAnchor="middle" fontSize="10" fontWeight="600" fill="#64748b">Occupied</text>
            </svg>
            <div className="ow-occ-value">{stats.insideNow} <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>/ {stats.capacity}</span></div>
            <div className="ow-occ-sub">Members currently inside</div>
            <div className="ow-occ-status">● Gates Online · System Healthy</div>
          </div>
          <div className="ow-gate-strip">
            {[['Main', 102], ['Side', 84], ['Back', 26]].map(([n, c]) => (
              <div className="ow-gate-pill" key={n}>
                <div className="ow-gate-pill-name">{n} Gate</div>
                <div className="ow-gate-pill-count">{c}</div>
                <div className="ow-gate-pill-status">🟢 Online</div>
              </div>
            ))}
          </div>
        </div>

        {/* WEEKLY CHECK-IN CHART */}
        <div className="ow-card">
          <div className="ow-card-title">📈 Weekly Check-ins
            <button className="ow-btn ow-btn-secondary ow-btn-sm" onClick={() => navigate('/owner/attendance')}>Full Report →</button>
          </div>
          <div style={{ display: 'flex', gap: 24, marginBottom: 10 }}>
            {[
              { label: 'Week Total', val: '2,023', color: '#6366f1' },
              { label: 'Daily Avg', val: '289', color: '#10b981' },
              { label: 'Peak Day', val: 'Thursday', color: '#f59e0b' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.7px' }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div className="ow-bar-chart">
            {WEEKLY_DATA.map(d => (
              <div className="ow-bar-col" key={d.day}>
                <div className="ow-bar-count">{d.count}</div>
                <div className={`ow-bar ${d.today ? 'today' : ''}`} style={{ height: Math.round((d.count / MAX_WEEKLY) * 80) + 'px' }} />
                <div className="ow-bar-day" style={{ color: d.today ? '#10b981' : undefined, fontWeight: d.today ? 800 : 600 }}>{d.day}</div>
              </div>
            ))}
          </div>

          <div className="ow-divider" />

          {/* Revenue mini chart */}
          <div className="ow-card-title" style={{ marginBottom: 8 }}>💰 Weekly Revenue
            <span style={{ fontWeight: 700, fontSize: 13, color: '#059669' }}>₹{(48920).toLocaleString('en-IN')} today</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, height: 60 }}>
            {REVENUE_DATA.map(d => (
              <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: 'linear-gradient(180deg,#10b981,#34d399)', height: Math.round((d.amt / MAX_REV) * 52) + 'px', minHeight: 4 }} />
                <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM GRID: Recent Checkins + Expiring + Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* RECENT CHECK-INS */}
        <div className="ow-card">
          <div className="ow-card-title">⚡ Recent Check-ins
            <button className="ow-btn ow-btn-secondary ow-btn-sm" onClick={() => navigate('/owner/access/checkin')}>Check-in Member →</button>
          </div>
          <table className="ow-table">
            <thead>
              <tr><th>Member</th><th>Plan</th><th>Time</th><th>Gate</th></tr>
            </thead>
            <tbody>
              {MOCK_RECENT_CHECKINS.map(r => (
                <tr key={r.id}>
                  <td><div className="ow-member-cell">
                    <div className="ow-member-av" style={{ width: 28, height: 28, fontSize: 10 }}>{r.av}</div>
                    <div>
                      <div className="ow-member-name" style={{ fontSize: 12 }}>{r.name}</div>
                      <div className="ow-member-phone">{r.id}</div>
                    </div>
                  </div></td>
                  <td><span className="ow-badge active" style={{ fontSize: 10 }}>{r.plan}</span></td>
                  <td style={{ fontWeight: 700, color: '#6366f1', fontSize: 12 }}>{r.time}</td>
                  <td style={{ fontSize: 11, color: '#64748b' }}>{r.gate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* EXPIRING MEMBERSHIPS + MINI STATS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="ow-card">
            <div className="ow-card-title">⚠️ Expiring Soon
              <button className="ow-btn ow-btn-secondary ow-btn-sm" onClick={() => navigate('/owner/memberships/renewals')}>Renew All →</button>
            </div>
            {MOCK_EXPIRING.map(m => (
              <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 9, paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                <div className="ow-member-av" style={{ background: '#fef3c7', color: '#92400e', fontSize: 11 }}>{m.av}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{m.plan} · Expires {m.expiry}</div>
                </div>
                <span className="ow-badge expiring" style={{ fontSize: 10 }}>{m.daysLeft}d</span>
              </div>
            ))}
            <button className="ow-btn ow-btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
              onClick={() => navigate('/owner/notifications/send')}>
              🔔 Notify All Expiring
            </button>
          </div>

          {/* Mini stats */}
          <div className="ow-card" style={{ padding: 14 }}>
            <div className="ow-card-title" style={{ marginBottom: 10 }}>📊 Membership Health</div>
            {[
              { label: 'Active Members', val: 486, color: '#10b981', pct: 92 },
              { label: 'Expiring in 7d', val: 18, color: '#f59e0b', pct: 3.5 },
              { label: 'Expired', val: 24, color: '#ef4444', pct: 4.5 },
              { label: 'Pending Dues', val: 12, color: '#6366f1', pct: 2.3 },
            ].map(s => (
              <div key={s.label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                  <span>{s.label}</span><span style={{ color: s.color }}>{s.val}</span>
                </div>
                <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3 }}>
                  <div style={{ height: 5, background: s.color, borderRadius: 3, width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PENDING DUES + SYSTEM STATUS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <div className="ow-card" style={{ background: 'linear-gradient(135deg,#fef3c7,#fffbeb)', border: '1.5px solid #fcd34d' }}>
          <div className="ow-card-title" style={{ color: '#92400e' }}>⚠️ Pending Dues</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#b45309' }}>₹{(124500).toLocaleString('en-IN')}</div>
          <div style={{ fontSize: 11, color: '#92400e', marginTop: 4 }}>From 12 members · Oldest: 45 days</div>
          <button className="ow-btn ow-btn-sm" style={{ marginTop: 12, background: '#fbbf24', color: '#92400e', border: 'none' }}
            onClick={() => navigate('/owner/payments')}>View Pending →</button>
        </div>
        <div className="ow-card" style={{ background: 'linear-gradient(135deg,#d1fae5,#ecfdf5)', border: '1.5px solid #6ee7b7' }}>
          <div className="ow-card-title" style={{ color: '#064e3b' }}>💰 Membership Revenue</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#047857' }}>₹38,920</div>
          <div style={{ fontSize: 11, color: '#065f46', marginTop: 4 }}>Today · POS: ₹10,000 additional</div>
          <button className="ow-btn ow-btn-sm" style={{ marginTop: 12, background: '#10b981', color: '#fff', border: 'none' }}
            onClick={() => navigate('/owner/reports')}>Full Report →</button>
        </div>
        <div className="ow-card" style={{ background: 'linear-gradient(135deg,#e0e7ff,#eef2ff)', border: '1.5px solid #a5b4fc' }}>
          <div className="ow-card-title" style={{ color: '#3730a3' }}>🔌 System Status</div>
          {[['🟢', 'API Server', 'Healthy'], ['🟢', 'Database', 'Connected'], ['🟢', 'NFC/QR Gate', '3/3 Online'], ['🟢', 'Notifications', 'Active']].map(([dot, name, status]) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 600, marginBottom: 6 }}>
              <span>{dot} {name}</span><span style={{ color: '#059669' }}>{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
