import React, { useState } from 'react';
import CustomSelect from '../common/CustomSelect.jsx';
import {
  UsersIcon,
  BuildingIcon,
  LocationPinIcon,
  CheckCircleIcon,
  SearchIcon,
  BoltIcon,
  ShieldCheckIcon,
  EditIcon,
  CreditCardIcon,
  SettingsIcon,
  AlertTriangleIcon
} from '../common/Icons';

export default function SuperAdminMembersView({ members = [], setMembers, gyms = [], plans = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGymId, setSelectedGymId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter members
  const filteredMembers = members.filter(member => {
    const nameStr = member.name || '';
    const phoneStr = member.phone || '';
    const emailStr = member.email || '';
    const matchesSearch = nameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          phoneStr.includes(searchTerm) ||
                          emailStr.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGym = selectedGymId === 'all' || member.gymId === selectedGymId || member.gymId === selectedGymId.toString();
    const memberStatus = (member.status || 'Active').toLowerCase();
    const matchesStatus = selectedStatus === 'all' || memberStatus === selectedStatus.toLowerCase();
    return matchesSearch && matchesGym && matchesStatus;
  });

  const getGymName = (gymId) => {
    const gym = gyms.find(g => (g.id === gymId || g._id === gymId || g.id === String(gymId)));
    return gym ? gym.name : 'All-India Member Pass';
  };

  const handleStatusChange = (memberId, newStatus) => {
    // Standardize status format (Active, Expired, Pending)
    const formattedStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase();
    if (setMembers) {
      setMembers(prev => prev.map(m => (m.id === memberId || m._id === memberId) ? { ...m, status: formattedStatus } : m));
    }
    if (selectedMember && (selectedMember.id === memberId || selectedMember._id === memberId)) {
      setSelectedMember(prev => ({ ...prev, status: formattedStatus }));
    }
  };

  // Helper selectors to update query and reset page index
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleGymChange = (e) => {
    setSelectedGymId(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1);
  };

  // Pagination logic
  const totalEntries = filteredMembers.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const activePage = Math.min(Math.max(currentPage, 1), totalPages);
  
  const startIndex = (activePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

  return (
    <div className="adm-view-container">
      {/* KPI Summary Strip */}
      <div className="franchise-summary-strip" style={{ marginTop: '6px' }}>
        <div className="summary-pill-card">
          <span className="summary-pill-icon members">
            <UsersIcon size={18} color="#06b6d4" />
          </span>
          <div className="summary-pill-info">
            <span className="summary-pill-val">{members.length} Athletes</span>
            <span className="summary-pill-lbl">Total Enrolled</span>
          </div>
        </div>
        <div className="summary-pill-card">
          <span className="summary-pill-icon success">
            <CheckCircleIcon size={18} color="#10b981" />
          </span>
          <div className="summary-pill-info">
            <span className="summary-pill-val">
              {members.filter(m => (m.status || 'Active').toLowerCase() === 'active').length} Active
            </span>
            <span className="summary-pill-lbl">Live Access Passes</span>
          </div>
        </div>
        <div className="summary-pill-card">
          <span className="summary-pill-icon">
            <BuildingIcon size={18} color="#4f46e5" />
          </span>
          <div className="summary-pill-info">
            <span className="summary-pill-val">{gyms.length} Franchises</span>
            <span className="summary-pill-lbl">Participating Clubs</span>
          </div>
        </div>
        <div className="summary-pill-card">
          <span className="summary-pill-icon verified">
            <BoltIcon size={18} color="#f59e0b" />
          </span>
          <div className="summary-pill-info">
            <span className="summary-pill-val">{members.length > 0 ? '96.8%' : '0%'}</span>
            <span className="summary-pill-lbl">Monthly Retention</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="adm-search-filter-row glass-panel">
        <div className="search-input-wrap">
          <span className="search-icon">
            <SearchIcon size={15} color="#94a3b8" />
          </span>
          <input
            type="text"
            className="adm-input-field search"
            placeholder="Search athlete by Name, Phone, Email, or User ID..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <CustomSelect
          value={selectedGymId}
          onChange={(newVal) => { setSelectedGymId(newVal); setCurrentPage(1); }}
          icon={BuildingIcon}
          options={[
            { value: 'all', label: `All Gym Franchises (${gyms.length} Clubs)` },
            ...gyms.map(gym => ({
              value: gym.id || gym._id,
              label: gym.name
            }))
          ]}
          style={{ minWidth: '220px' }}
        />

        <CustomSelect
          value={selectedStatus}
          onChange={(newVal) => { setSelectedStatus(newVal); setCurrentPage(1); }}
          icon={BoltIcon}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'active', label: 'Active Pass', icon: <span style={{ color: '#10b981', fontSize: '12px' }}>●</span> },
            { value: 'expired', label: 'Expired', icon: <span style={{ color: '#ef4444', fontSize: '12px' }}>●</span> },
            { value: 'pending', label: 'Pending Verification', icon: <span style={{ color: '#f59e0b', fontSize: '12px' }}>●</span> }
          ]}
          style={{ minWidth: '175px' }}
        />
      </div>

      {/* Members Directory Table Card Panel */}
      <div className="adm-card-panel glass-card franchise-table-panel">
        <div className="adm-table-wrap">
          <table className="adm-table modern-franchise-table">
            <thead>
              <tr>
                <th>Member Athlete</th>
                <th>Contact Details</th>
                <th>Franchise Club</th>
                <th>Joined Date</th>
                <th>Membership Plan</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty-row">
                    <div className="empty-state-box">
                      <span className="empty-state-icon">
                        <UsersIcon size={36} color="#94a3b8" />
                      </span>
                      <h4>No Members Found</h4>
                      <p>No member athletes registered in the database yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => {
                  const memberId = member.id || member._id;
                  return (
                    <tr key={memberId} className="gym-table-row">
                      <td>
                        <div className="gym-brand-cell">
                          <div className="gym-avatar-badge luxury-glow-avatar">
                            {(member.name || 'M').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="gym-brand-name">{member.name || 'Athlete'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="gym-location-box">
                          <span className="gym-city-text">{member.phone || '-'}</span>
                          <span className="gym-address-sub">{member.email || '-'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="gym-city-text">
                          <LocationPinIcon size={12} color="#ef4444" /> {getGymName(member.gymId)}
                        </div>
                      </td>
                      <td>
                        <span className="gym-address-sub">{member.joinedDate || member.joinDate || '-'}</span>
                      </td>
                      <td>
                        <span className={`plan-badge luxury-plan-badge ${(member.plan || member.membershipType || '').toLowerCase().includes('vip') ? 'enterprise' : 'pro'}`}>
                          {member.plan || member.membershipType || 'Standard'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-tag luxury-status-tag ${(member.status || 'Active').toLowerCase() === 'active' ? 'approved' : 'expired'}`}>
                          <span className="status-dot-pulse" />
                          {member.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons-wrap">
                          <button 
                            className="table-action-btn view-btn" 
                            onClick={() => setSelectedMember(member)}
                            title="Inspect Athlete Details"
                          >
                            <SettingsIcon size={13} color="currentColor" /> Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modern Luxury Pagination Bar */}
        <div className="table-pagination-footer">
          <div className="pagination-info">
            <span>
              Showing <strong>{totalEntries > 0 ? startIndex + 1 : 0}</strong> to <strong>{endIndex}</strong> of <strong>{totalEntries}</strong> athletes
            </span>
            <span className="pagination-divider">·</span>
            <span>Page <strong>{activePage}</strong> of <strong>{totalPages}</strong></span>
          </div>

          <div className="pagination-controls">
            <div className="page-size-selector">
              <span className="page-size-label">Rows:</span>
              <select 
                value={pageSize} 
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="page-size-select"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <button 
              className="page-nav-btn prev-btn" 
              disabled={activePage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              ‹ Previous
            </button>

            <div className="page-numbers-list">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  className={`page-num-btn ${activePage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button 
              className="page-nav-btn next-btn" 
              disabled={activePage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              Next ›
            </button>
          </div>
        </div>
      </div>

      {/* Member Details Side Drawer */}
      {selectedMember && (
        <div className="adm-drawer-overlay" onClick={() => setSelectedMember(null)}>
          <div className="adm-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="adm-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="adm-profile-avatar" style={{ width: '48px', height: '48px', fontSize: '18px' }}>
                  {selectedMember.avatar || (selectedMember.name || 'M').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{selectedMember.name}</h2>
                  <span style={{ fontSize: '12px', color: 'var(--adm-text-sub)' }}>ID: {selectedMember.userId || selectedMember.id || selectedMember._id}</span>
                </div>
              </div>
              <button className="adm-close-btn" onClick={() => setSelectedMember(null)}>×</button>
            </div>

            <div className="adm-drawer-body">
              <div>
                <h3 className="adm-card-title" style={{ fontSize: '14px', marginBottom: '12px' }}>Membership Status</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`adm-badge ${selectedMember.status.toLowerCase()}`} style={{ fontSize: '12px', padding: '6px 12px' }}>
                    {selectedMember.status}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="adm-btn secondary" onClick={() => handleStatusChange(selectedMember.id, 'active')} disabled={selectedMember.status.toLowerCase() === 'active'}>
                      Activate
                    </button>
                    <button className="adm-btn secondary" onClick={() => handleStatusChange(selectedMember.id, 'expired')} disabled={selectedMember.status.toLowerCase() === 'expired'}>
                      Expire
                    </button>
                  </div>
                </div>
              </div>

              <div className="adm-sidebar-divider" style={{ margin: 0 }} />

              <div>
                <h3 className="adm-card-title" style={{ fontSize: '14px', marginBottom: '12px' }}>Personal Profile</h3>
                <div className="adm-item-details" style={{ border: 'none', padding: 0 }}>
                  <div className="adm-detail-row">
                    <span className="adm-detail-lbl">Full Name</span>
                    <span className="adm-detail-val">{selectedMember.name}</span>
                  </div>
                  <div className="adm-detail-row" style={{ marginTop: '8px' }}>
                    <span className="adm-detail-lbl">Phone Number</span>
                    <span className="adm-detail-val">{selectedMember.phone}</span>
                  </div>
                  <div className="adm-detail-row" style={{ marginTop: '8px' }}>
                    <span className="adm-detail-lbl">Email Address</span>
                    <span className="adm-detail-val">{selectedMember.email || 'Not Provided'}</span>
                  </div>
                  <div className="adm-detail-row" style={{ marginTop: '8px' }}>
                    <span className="adm-detail-lbl">Gym Franchise</span>
                    <span className="adm-detail-val">{getGymName(selectedMember.gymId)}</span>
                  </div>
                  <div className="adm-detail-row" style={{ marginTop: '8px' }}>
                    <span className="adm-detail-lbl">Joined Date</span>
                    <span className="adm-detail-val">{selectedMember.joinedDate || selectedMember.joinDate}</span>
                  </div>
                </div>
              </div>

              <div className="adm-sidebar-divider" style={{ margin: 0 }} />

              <div>
                <h3 className="adm-card-title" style={{ fontSize: '14px', marginBottom: '12px' }}>Membership Details</h3>
                <div className="adm-item-details" style={{ border: 'none', padding: 0 }}>
                  <div className="adm-detail-row">
                    <span className="adm-detail-lbl">Active Plan</span>
                    <span className="adm-detail-val">{selectedMember.plan || 'No Active Plan'}</span>
                  </div>
                  <div className="adm-detail-row" style={{ marginTop: '8px' }}>
                    <span className="adm-detail-lbl">Assigned Trainer</span>
                    <span className="adm-detail-val">{selectedMember.trainer || 'None Assigned'}</span>
                  </div>
                </div>
              </div>

              {selectedMember.measurements && (
                <>
                  <div className="adm-sidebar-divider" style={{ margin: 0 }} />
                  <div>
                    <h3 className="adm-card-title" style={{ fontSize: '14px', marginBottom: '12px' }}>Fitness Stats</h3>
                    <div className="adm-item-details" style={{ border: 'none', padding: 0 }}>
                      <div className="adm-detail-row">
                        <span className="adm-detail-lbl">Weight</span>
                        <span className="adm-detail-val">{selectedMember.measurements.weight || 'N/A'}</span>
                      </div>
                      <div className="adm-detail-row" style={{ marginTop: '8px' }}>
                        <span className="adm-detail-lbl">Height</span>
                        <span className="adm-detail-val">{selectedMember.measurements.height || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedMember.medicalNotes && selectedMember.medicalNotes !== 'None' && (
                <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '16px', borderRadius: '16px', marginTop: '12px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <AlertTriangleIcon size={14} color="#b45309" /> MEDICAL NOTICE
                  </h4>
                  <p style={{ fontSize: '12px', color: '#78350f', lineHeight: 1.4, margin: 0 }}>{selectedMember.medicalNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
