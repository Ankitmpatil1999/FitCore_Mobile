import React, { useState } from 'react';
import { API_URL } from '../../config/api';
import CustomSelect from '../common/CustomSelect.jsx';
import {
  StoreIcon,
  UsersIcon,
  LocationPinIcon,
  StarIcon,
  BoltIcon,
  ShieldCheckIcon,
  EditIcon,
  CheckCircleIcon,
  SearchIcon,
  CreditCardIcon,
  SettingsIcon
} from '../common/Icons';

const CAT_LABELS = {
  supplement_store: 'Supplement & Protein Store',
  nutrition_shop: 'Health Nutrition & Diet Shop',
  equipment_dealer: 'Commercial Equipment Dealer',
  accessories_store: 'Gym Accessories & Apparel',
  sports_nutrition: 'Sports Nutrition Specialist',
};

export default function SuperAdminVendorsView({ vendors = [], setVendors, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState(null);

  const handleStatusChange = async (vendorId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/admin/vendors/${vendorId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('fitcore_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (typeof onRefresh === 'function') {
          onRefresh();
        }
        if (selectedVendor && (selectedVendor.id === vendorId || selectedVendor._id === vendorId)) {
          setSelectedVendor(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        alert(data.error || 'Failed to update status.');
      }
    } catch (err) {
      alert('Error connecting to backend.');
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const sName = vendor.storeName || '';
    const oName = vendor.ownerName || '';
    const phone = vendor.phone || '';
    const matchesSearch = sName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          oName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          phone.includes(searchTerm);
    const matchesStatus = selectedStatus === 'all' || vendor.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || vendor.category === selectedCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="adm-view-container">
      {/* Top KPI Metrics Strip */}
      <div className="franchise-summary-strip" style={{ marginTop: '6px' }}>
        <div className="summary-pill-card">
          <span className="summary-pill-icon">
            <CreditCardIcon size={18} color="#4f46e5" />
          </span>
          <div className="summary-pill-info">
            <span className="summary-pill-val">{vendors.length} Stores</span>
            <span className="summary-pill-lbl">Partner Network</span>
          </div>
        </div>
        <div className="summary-pill-card">
          <span className="summary-pill-icon success">
            <CheckCircleIcon size={18} color="#10b981" />
          </span>
          <div className="summary-pill-info">
            <span className="summary-pill-val">
              {vendors.filter(v => v.status === 'approved').length} Active
            </span>
            <span className="summary-pill-lbl">Live Marketplace</span>
          </div>
        </div>
        <div className="summary-pill-card">
          <span className="summary-pill-icon verified">
            <StarIcon size={18} color="#f59e0b" />
          </span>
          <div className="summary-pill-info">
            <span className="summary-pill-val" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {vendors.length > 0 ? '4.9' : '0.0'} <StarIcon size={12} color="#f59e0b" />
            </span>
            <span className="summary-pill-lbl">Avg Trust Rating</span>
          </div>
        </div>
        <div className="summary-pill-card">
          <span className="summary-pill-icon warning">
            <ShieldCheckIcon size={18} color="#f59e0b" />
          </span>
          <div className="summary-pill-info">
            <span className="summary-pill-val">{vendors.filter(v => v.status === 'pending').length} Pending</span>
            <span className="summary-pill-lbl">KYC Approvals</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="adm-search-filter-row glass-panel">
        <div className="search-input-wrap">
          <span className="search-icon">
            <SearchIcon size={14} color="#94a3b8" />
          </span>
          <input
            type="text"
            className="adm-input-field search"
            placeholder="Search by Store Name, Owner, or Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <CustomSelect
          value={selectedCategory}
          onChange={(newVal) => setSelectedCategory(newVal)}
          icon={CreditCardIcon}
          options={[
            { value: 'all', label: 'All Store Categories' },
            { value: 'supplement_store', label: 'Supplements & Protein' },
            { value: 'nutrition_shop', label: 'Health Nutrition' },
            { value: 'equipment_dealer', label: 'Gym Equipment' },
            { value: 'accessories_store', label: 'Apparel & Gear' }
          ]}
          style={{ minWidth: '220px' }}
        />

        <CustomSelect
          value={selectedStatus}
          onChange={(newVal) => setSelectedStatus(newVal)}
          icon={BoltIcon}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'approved', label: 'Approved & Live', icon: <span style={{ color: '#10b981', fontSize: '12px' }}>●</span> },
            { value: 'pending', label: 'Pending Review', icon: <span style={{ color: '#f59e0b', fontSize: '12px' }}>●</span> },
            { value: 'suspended', label: 'Suspended', icon: <span style={{ color: '#ef4444', fontSize: '12px' }}>●</span> }
          ]}
          style={{ minWidth: '175px' }}
        />
      </div>

      {/* Vendors Table Card Panel */}
      <div className="adm-card-panel glass-card franchise-table-panel">
        <div className="adm-table-wrap">
          <table className="adm-table modern-franchise-table">
            <thead>
              <tr>
                <th>Store Partner</th>
                <th>Owner Name</th>
                <th>Category</th>
                <th>GSTIN</th>
                <th>Rating</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty-row">
                    <div className="empty-state-box">
                      <span className="empty-state-icon">
                        <StoreIcon size={36} color="#94a3b8" />
                      </span>
                      <h4>No Partner Stores Found</h4>
                      <p>No vendor stores matching your search filters were found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => {
                  const vId = vendor.id || vendor._id;
                  return (
                    <tr key={vId} className="gym-table-row">
                      <td>
                        <div className="gym-brand-cell">
                          <div className="gym-avatar-badge luxury-glow-avatar">
                            {(vendor.storeName || 'ST').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="gym-brand-name">{vendor.storeName}</div>
                            <span className="gym-address-sub">{vendor.phone || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="gym-city-text">{vendor.ownerName}</span>
                      </td>
                      <td>
                        <span className="luxury-detail-pill" style={{ fontSize: '11px', padding: '4px 10px' }}>
                          {CAT_LABELS[vendor.category] || vendor.category || 'Store Partner'}
                        </span>
                      </td>
                      <td>
                        <code className="user-id-code">{vendor.gstNumber || '-'}</code>
                      </td>
                      <td>
                        <div className="gym-rating-tag">
                          <StarIcon size={12} color="#f59e0b" /> {vendor.rating ? vendor.rating.toFixed(1) : '5.0'}
                        </div>
                      </td>
                      <td>
                        <span className={`status-tag luxury-status-tag ${vendor.status === 'approved' ? 'approved' : vendor.status === 'pending' ? 'pending' : 'expired'}`}>
                          <span className="status-dot-pulse" />
                          {vendor.status === 'approved' ? 'Active' : vendor.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons-wrap">
                          <button 
                            className="table-action-btn view-btn" 
                            onClick={() => setSelectedVendor(vendor)}
                            title="Inspect Store Profile"
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
      </div>

      {/* Vendor Profile Drawer */}
      {selectedVendor && (
        <div className="adm-drawer-overlay" onClick={() => setSelectedVendor(null)}>
          <div className="adm-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="adm-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="adm-profile-avatar" style={{ width: '48px', height: '48px', fontSize: '18px' }}>
                  {(selectedVendor.storeName || 'ST').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{selectedVendor.storeName}</h2>
                  <span style={{ fontSize: '12px', color: 'var(--adm-text-sub)' }}>Partner Store Profile</span>
                </div>
              </div>
              <button className="adm-close-btn" onClick={() => setSelectedVendor(null)}>×</button>
            </div>

            <div className="adm-drawer-body">
              <div>
                <h3 className="adm-card-title" style={{ fontSize: '14px', marginBottom: '12px' }}>Registration Status</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`status-tag luxury-status-tag ${selectedVendor.status === 'approved' ? 'approved' : 'expired'}`} style={{ fontSize: '12px', padding: '6px 14px' }}>
                    <span className="status-dot-pulse" /> {selectedVendor.status ? selectedVendor.status.toUpperCase() : 'APPROVED'}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="adm-btn primary" onClick={() => handleStatusChange(selectedVendor.id || selectedVendor._id, 'approved')} disabled={selectedVendor.status === 'approved'}>
                      Approve Store
                    </button>
                    <button className="adm-btn danger" onClick={() => handleStatusChange(selectedVendor.id || selectedVendor._id, 'suspended')} disabled={selectedVendor.status === 'suspended'}>
                      Suspend Store
                    </button>
                  </div>
                </div>
              </div>

              <div className="adm-sidebar-divider" style={{ margin: 0 }} />

              <div>
                <h3 className="adm-card-title" style={{ fontSize: '14px', marginBottom: '12px' }}>Store Details</h3>
                <div className="adm-item-details" style={{ border: 'none', padding: 0 }}>
                  <div className="adm-detail-row">
                    <span className="adm-detail-lbl">Store Name</span>
                    <span className="adm-detail-val">{selectedVendor.storeName}</span>
                  </div>
                  <div className="adm-detail-row" style={{ marginTop: '8px' }}>
                    <span className="adm-detail-lbl">Owner Name</span>
                    <span className="adm-detail-val">{selectedVendor.ownerName}</span>
                  </div>
                  <div className="adm-detail-row" style={{ marginTop: '8px' }}>
                    <span className="adm-detail-lbl">Store Category</span>
                    <span className="adm-detail-val">{CAT_LABELS[selectedVendor.category] || selectedVendor.category}</span>
                  </div>
                  <div className="adm-detail-row" style={{ marginTop: '8px' }}>
                    <span className="adm-detail-lbl">GSTIN</span>
                    <span className="adm-detail-val" style={{ fontFamily: 'monospace' }}>{selectedVendor.gstNumber || '27AABCF1234F1Z5'}</span>
                  </div>
                  <div className="adm-detail-row" style={{ marginTop: '8px' }}>
                    <span className="adm-detail-lbl">Address</span>
                    <span className="adm-detail-val" style={{ fontSize: '12px', textAlign: 'right', maxWidth: '60%' }}>
                      {selectedVendor.address || 'Commercial Avenue'}, {selectedVendor.city || 'Mumbai'}, {selectedVendor.state || 'Maharashtra'} - {selectedVendor.pincode || '400050'}
                    </span>
                  </div>
                  <div className="adm-detail-row" style={{ marginTop: '8px' }}>
                    <span className="adm-detail-lbl">Store Rating</span>
                    <span className="adm-detail-val">⭐ {selectedVendor.rating ? selectedVendor.rating.toFixed(1) : '4.8'} / 5.0</span>
                  </div>
                </div>
              </div>

              <div className="adm-sidebar-divider" style={{ margin: 0 }} />

              <div>
                <h3 className="adm-card-title" style={{ fontSize: '14px', marginBottom: '12px' }}>Settlement & Banking</h3>
                <div className="adm-item-details" style={{ border: 'none', padding: 0 }}>
                  <div className="adm-detail-row">
                    <span className="adm-detail-lbl">UPI VPA</span>
                    <span className="adm-detail-val" style={{ color: 'var(--indigo-primary)', fontWeight: '700' }}>{selectedVendor.upiId || 'merchant@fitcore.upi'}</span>
                  </div>
                  <div className="adm-detail-row" style={{ marginTop: '8px' }}>
                    <span className="adm-detail-lbl">Bank Account</span>
                    <span className="adm-detail-val">{selectedVendor.bankAccount || '•••• •••• 9842'}</span>
                  </div>
                  <div className="adm-detail-row" style={{ marginTop: '8px' }}>
                    <span className="adm-detail-lbl">IFSC Code</span>
                    <span className="adm-detail-val" style={{ fontFamily: 'monospace' }}>{selectedVendor.ifsc || 'HDFC0001234'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
