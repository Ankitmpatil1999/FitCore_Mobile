import React, { useContext, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { OwnerContext } from '../OwnerShell';

const API_BASE = 'http://localhost:7000/api/gym-admin';
const getToken = () => localStorage.getItem('fitcore_token');
const authFetch = (url, opts = {}) => fetch(url, {
  ...opts,
  headers: { Authorization: 'Bearer ' + getToken(), 'Content-Type': 'application/json', ...(opts.headers || {}) }
});

const MOCK_MEMBERS = [
  { id: 'FC-M528', name: 'Rahul Verma', phone: '9876543210', plan: 'Pro Studio', status: 'active', validUntil: '25 Aug 2027', lastVisit: 'Today', av: 'RV', amount: 34999 },
  { id: 'FC-M312', name: 'Sneha Kapoor', phone: '9765432109', plan: 'Pro Studio', status: 'active', validUntil: '12 Jan 2027', lastVisit: 'Yesterday', av: 'SK', amount: 34999 },
  { id: 'FC-M201', name: 'Amit Shukla', phone: '9654321098', plan: 'Starter', status: 'expiring', validUntil: '05 Sep 2026', lastVisit: '2 days ago', av: 'AS', amount: 14999 },
  { id: 'FC-M405', name: 'Priya Mehta', phone: '9543210987', plan: 'Enterprise', status: 'active', validUntil: '01 Mar 2027', lastVisit: 'Today', av: 'PM', amount: 69999 },
  { id: 'FC-M139', name: 'Vikram Desai', phone: '9432109876', plan: 'Pro Studio', status: 'expired', validUntil: '05 Mar 2026', lastVisit: '2 months ago', av: 'VD', amount: 34999 },
  { id: 'FC-M091', name: 'Kiran Joshi', phone: '9321098765', plan: 'Starter', status: 'active', validUntil: '15 Dec 2026', lastVisit: 'Today', av: 'KJ', amount: 14999 },
  { id: 'FC-M274', name: 'Rohit Nair', phone: '9210987654', plan: 'Pro Studio', status: 'expiring', validUntil: '10 Sep 2026', lastVisit: '3 days ago', av: 'RN', amount: 34999 },
  { id: 'FC-M388', name: 'Anjali Singh', phone: '9109876543', plan: 'Starter', status: 'active', validUntil: '20 Nov 2026', lastVisit: 'Yesterday', av: 'AJ', amount: 14999 },
];

export default function MembersView() {
  const { members: ctxMembers, gymId, showToast, trainers, packages } = useContext(OwnerContext);
  const navigate = useNavigate();
  const { filter } = useParams();

  const allMembers = ctxMembers?.length ? ctxMembers : MOCK_MEMBERS;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(filter || 'all');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showAddModal, setShowAddModal] = useState(false);

  const statusCounts = {
    all: allMembers.length,
    active: allMembers.filter(m => m.status === 'active').length,
    expiring: allMembers.filter(m => m.status === 'expiring').length,
    expired: allMembers.filter(m => m.status === 'expired').length,
  };

  let displayed = allMembers
    .filter(m => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (planFilter !== 'all' && !m.plan?.toLowerCase().includes(planFilter.toLowerCase())) return false;
      if (search) {
        const q = search.toLowerCase();
        return m.name?.toLowerCase().includes(q) || m.phone?.includes(q) || m.id?.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => (a[sortBy] || '').toString().localeCompare((b[sortBy] || '').toString()));

  return (
    <div style={{ padding: '26px 28px', overflowY: 'auto', flex: 1 }}>
      {/* Header */}
      <div className="ow-view-header">
        <div>
          <div className="ow-breadcrumb">
            <button onClick={() => navigate('/owner/dashboard')}>Dashboard</button>
            <span>›</span><span>Members</span>
          </div>
          <div className="ow-view-title">👥 Member Management</div>
          <div className="ow-view-subtitle">Manage all gym members, memberships and enrollments.</div>
        </div>
        <button className="ow-btn ow-btn-primary ow-btn-lg" onClick={() => navigate('/owner/members/add')}>
          ＋ Add New Member
        </button>
      </div>

      {/* Status Cards */}
      <div className="ow-status-cards" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 16 }}>
        {[
          { key: 'all', label: 'All Members', icon: '👥' },
          { key: 'active', label: 'Active', icon: '✅' },
          { key: 'expiring', label: 'Expiring Soon', icon: '⚠️' },
          { key: 'expired', label: 'Expired', icon: '❌' },
        ].map(s => (
          <div key={s.key}
            className={`ow-status-card ${statusFilter === s.key ? 'sel' : ''}`}
            onClick={() => setStatusFilter(s.key)}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div className="ow-status-count">{statusCounts[s.key]}</div>
            <div className="ow-status-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="ow-filter-bar">
        <input
          className="ow-filter-input"
          placeholder="🔍 Search by name, phone, member ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="ow-filter-select" value={planFilter} onChange={e => setPlanFilter(e.target.value)}>
          <option value="all">All Plans</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro Studio</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select className="ow-filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="name">Sort: Name</option>
          <option value="validUntil">Sort: Expiry</option>
          <option value="plan">Sort: Plan</option>
        </select>
        <button className="ow-btn ow-btn-secondary ow-btn-sm" onClick={() => showToast('Exported to CSV!', 'info')}>
          📥 Export
        </button>
      </div>

      {/* Table */}
      <div className="ow-table-wrap">
        <table className="ow-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Valid Until</th>
              <th>Last Visit</th>
              <th>Amount Paid</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="ow-empty">
                  <div className="ow-empty-icon">👥</div>
                  <div className="ow-empty-title">No members found</div>
                  <div className="ow-empty-sub">Try adjusting your search or filters.</div>
                </div>
              </td></tr>
            ) : displayed.map(m => (
              <tr key={m.id || m._id}>
                <td>
                  <div className="ow-member-cell">
                    <div className="ow-member-av">{m.av || (m.name || 'M').slice(0, 2).toUpperCase()}</div>
                    <div>
                      <div className="ow-member-name">{m.name}</div>
                      <div className="ow-member-phone">{m.phone} · {m.id || m._id}</div>
                    </div>
                  </div>
                </td>
                <td><span className="ow-badge active">{m.plan || m.membershipPlan || '—'}</span></td>
                <td>
                  <span className={`ow-badge ${m.status}`}>
                    {m.status === 'active' ? '✅ Active' : m.status === 'expiring' ? '⚠️ Expiring' : '❌ Expired'}
                  </span>
                </td>
                <td style={{ fontWeight: 700, fontSize: 12 }}>{m.validUntil || m.membershipExpiry || '—'}</td>
                <td style={{ color: '#64748b', fontSize: 12 }}>{m.lastVisit || 'N/A'}</td>
                <td style={{ fontWeight: 800, color: '#059669' }}>₹{(m.amount || 0).toLocaleString('en-IN')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="ow-btn ow-btn-secondary ow-btn-sm"
                      onClick={() => showToast(`Viewing ${m.name}'s profile`, 'info')}>
                      View
                    </button>
                    {m.status === 'expired' || m.status === 'expiring' ? (
                      <button className="ow-btn ow-btn-sm" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d' }}
                        onClick={() => navigate('/owner/memberships/renewals', { state: { member: m } })}>
                        Renew
                      </button>
                    ) : (
                      <button className="ow-btn ow-btn-sm" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}
                        onClick={() => navigate('/owner/access/checkin', { state: { member: m } })}>
                        Check-in
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
        <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
          Showing {displayed.length} of {allMembers.length} members
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3, '...', 12].map((p, i) => (
            <button key={i} className="ow-btn ow-btn-secondary ow-btn-sm"
              style={{ minWidth: 32, padding: '5px 8px', background: p === 1 ? '#e0e7ff' : undefined, color: p === 1 ? '#4338ca' : undefined }}>
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
