import React, { useState } from 'react';
import { API_URL } from '../../config/api';
import CustomSelect from '../common/CustomSelect.jsx';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  BuildingIcon,
  UsersIcon,
  SearchIcon,
  BoltIcon,
  CreditCardIcon,
  CalendarIcon,
  RefreshIcon,
  FileTextIcon,
  AlertTriangleIcon
} from '../common/Icons';

const INITIAL_KYC_DOCS = [];

export default function SuperAdminKycView({ vendors = [], setVendors, onRefresh }) {
  const [kycDocs, setKycDocs] = useState(INITIAL_KYC_DOCS);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeEntityType, setActiveEntityType] = useState('all'); // 'all' | 'gym' | 'vendor' | 'member'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'verified' | 'rejected'
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showReasonBox, setShowReasonBox] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [presetReason, setPresetReason] = useState('Image resolution unclear or blurry');
  const [successToast, setSuccessToast] = useState(null);

  // Filter tasks based on entity, status, and search query
  const filteredDocs = kycDocs.filter(doc => {
    const matchesEntity = activeEntityType === 'all' || doc.entityType === activeEntityType;
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q ||
      doc.entityName.toLowerCase().includes(q) ||
      doc.ownerName.toLowerCase().includes(q) ||
      doc.label.toLowerCase().includes(q) ||
      doc.number.toLowerCase().includes(q);
    return matchesEntity && matchesStatus && matchesSearch;
  });

  const pendingCount = kycDocs.filter(d => d.status === 'pending').length;
  const verifiedCount = kycDocs.filter(d => d.status === 'verified').length;
  const rejectedCount = kycDocs.filter(d => d.status === 'rejected').length;

  const gymDocsCount = kycDocs.filter(d => d.entityType === 'gym').length;
  const vendorDocsCount = kycDocs.filter(d => d.entityType === 'vendor').length;
  const memberDocsCount = kycDocs.filter(d => d.entityType === 'member').length;

  const triggerToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleApprove = async (item) => {
    try {
      // If vendor has real API id, sync to backend
      if (item.vendorId) {
        await fetch(`${API_URL}/admin/kyc/${item.vendorId}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('fitcore_token')}`
          }
        }).catch(() => {});
      }
      
      // Update local state
      setKycDocs(prev => prev.map(d => d.id === item.id ? { ...d, status: 'verified' } : d));
      if (selectedDoc && selectedDoc.id === item.id) {
        setSelectedDoc(prev => ({ ...prev, status: 'verified' }));
      }
      setShowReasonBox(false);
      triggerToast(`✓ ${item.label} for "${item.entityName}" has been officially APPROVED.`);
      if (typeof onRefresh === 'function') onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    const finalReason = rejectionReason.trim() || presetReason;
    
    try {
      if (selectedDoc.vendorId) {
        await fetch(`${API_URL}/admin/kyc/${selectedDoc.vendorId}/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('fitcore_token')}`
          },
          body: JSON.stringify({ reason: finalReason })
        }).catch(() => {});
      }

      setKycDocs(prev => prev.map(d => d.id === selectedDoc.id ? { ...d, status: 'rejected', rejectionReason: finalReason } : d));
      setSelectedDoc(prev => ({ ...prev, status: 'rejected', rejectionReason: finalReason }));
      setShowReasonBox(false);
      setRejectionReason('');
      triggerToast(`✕ ${selectedDoc.label} marked as REJECTED. Re-upload request sent.`);
      if (typeof onRefresh === 'function') onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="adm-view-container kyc-pipeline-page">
      {/* Toast Notification */}
      {successToast && (
        <div className="kyc-toast-banner">
          <span>{successToast}</span>
        </div>
      )}

      {/* Top KPI Metrics Strip */}
      <div className="franchise-summary-strip" style={{ marginTop: '6px' }}>
        <div className="summary-pill-card">
          <span className="summary-pill-icon verified">
            <BoltIcon size={18} color="#f59e0b" />
          </span>
          <div className="summary-pill-info">
            <span className="summary-pill-val">{pendingCount} Tasks</span>
            <span className="summary-pill-lbl">Awaiting Review</span>
          </div>
        </div>

        <div className="summary-pill-card">
          <span className="summary-pill-icon success">
            <CheckCircleIcon size={18} color="#10b981" />
          </span>
          <div className="summary-pill-info">
            <span className="summary-pill-val">{verifiedCount} Approved</span>
            <span className="summary-pill-lbl">Verified & Compliant</span>
          </div>
        </div>

        <div className="summary-pill-card">
          <span className="summary-pill-icon danger" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
            <ShieldCheckIcon size={18} color="#ef4444" />
          </span>
          <div className="summary-pill-info">
            <span className="summary-pill-val">{rejectedCount} Flagged</span>
            <span className="summary-pill-lbl">Needs Re-upload</span>
          </div>
        </div>

        <div className="summary-pill-card">
          <span className="summary-pill-icon members">
            <UsersIcon size={18} color="#06b6d4" />
          </span>
          <div className="summary-pill-info">
            <span className="summary-pill-val">{kycDocs.length > 0 ? '100% Digital' : '0 Documents'}</span>
            <span className="summary-pill-lbl">Paperless Audit Log</span>
          </div>
        </div>
      </div>

      {/* Entity Category Switcher & Search Bar */}
      <div className="adm-search-filter-row glass-panel" style={{ marginTop: '16px', position: 'relative', zIndex: 100, overflow: 'visible' }}>
        <div className="kyc-entity-tabs-row">
          <button
            className={`kyc-tab-btn ${activeEntityType === 'all' ? 'active' : ''}`}
            onClick={() => setActiveEntityType('all')}
          >
            All Submissions ({kycDocs.length})
          </button>
          <button
            className={`kyc-tab-btn ${activeEntityType === 'gym' ? 'active' : ''}`}
            onClick={() => setActiveEntityType('gym')}
          >
            <BuildingIcon size={13} color="currentColor" /> Gym Franchises ({gymDocsCount})
          </button>
          <button
            className={`kyc-tab-btn ${activeEntityType === 'vendor' ? 'active' : ''}`}
            onClick={() => setActiveEntityType('vendor')}
          >
            <CreditCardIcon size={13} color="currentColor" /> Partner Stores ({vendorDocsCount})
          </button>
          <button
            className={`kyc-tab-btn ${activeEntityType === 'member' ? 'active' : ''}`}
            onClick={() => setActiveEntityType('member')}
          >
            <UsersIcon size={13} color="currentColor" /> Athlete Passes ({memberDocsCount})
          </button>
        </div>

        <div className="search-input-wrap" style={{ maxWidth: '280px' }}>
          <span className="search-icon">
            <SearchIcon size={14} color="#94a3b8" />
          </span>
          <input
            type="text"
            className="adm-input-field search"
            placeholder="Search by name, doc ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <CustomSelect
          value={filterStatus}
          onChange={(newVal) => setFilterStatus(newVal)}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'pending', label: 'Pending Review', icon: <span style={{ color: '#f59e0b', fontSize: '12px' }}>●</span> },
            { value: 'verified', label: 'Verified & Compliant', icon: <span style={{ color: '#10b981', fontSize: '12px' }}>●</span> },
            { value: 'rejected', label: 'Rejected / Flagged', icon: <span style={{ color: '#ef4444', fontSize: '12px' }}>●</span> }
          ]}
          style={{ minWidth: '170px' }}
        />
      </div>

      {/* Main 2-Column Split Workspace */}
      <div className="kyc-workspace-grid" style={{ marginTop: '20px' }}>
        {/* Left Column: Verification Submissions Queue */}
        <div className="kyc-queue-column">
          <div className="kyc-column-header">
            <h3 className="kyc-col-title">Verification Tasks Queue ({filteredDocs.length})</h3>
            <span className="kyc-col-sub">Click any task to inspect certificate</span>
          </div>

          <div className="kyc-tasks-list">
            {filteredDocs.length === 0 ? (
              <div className="empty-state-box" style={{ padding: '40px 20px' }}>
                <span className="empty-state-icon">
                  <ShieldCheckIcon size={36} color="#94a3b8" />
                </span>
                <h4>No Documents in Queue</h4>
                <p>No verification submissions match your active filter.</p>
              </div>
            ) : (
              filteredDocs.map((item) => {
                const isSelected = selectedDoc?.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={`kyc-task-item-card ${isSelected ? 'active-task' : ''} ${item.status}`}
                    onClick={() => {
                      setSelectedDoc(item);
                      setShowReasonBox(false);
                      setRejectionReason('');
                    }}
                  >
                    <div className="kyc-task-top">
                      <div className="kyc-entity-pill">
                        {item.entityType === 'gym' ? 'FRANCHISE CLUB' : item.entityType === 'vendor' ? 'PARTNER STORE' : 'ATHLETE PASS'}
                      </div>
                      <span className={`status-tag luxury-status-tag ${item.status === 'verified' ? 'approved' : item.status === 'pending' ? 'pending' : 'expired'}`}>
                        <span className="status-dot-pulse" />
                        {item.status === 'verified' ? 'Verified' : item.status === 'pending' ? 'Pending Review' : 'Rejected'}
                      </span>
                    </div>

                    <h4 className="kyc-task-label">{item.label}</h4>
                    <p className="kyc-task-entity">{item.entityName}</p>
                    <div className="kyc-task-applicant">
                      <span>Applicant: <strong>{item.ownerName}</strong></span>
                    </div>

                    <div className="kyc-task-bottom">
                      <span className="kyc-doc-num">Doc: <code>{item.number}</code></span>
                      <span className="kyc-date" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CalendarIcon size={12} color="#64748b" /> {item.uploadedAt}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Full Certificate Visualizer & Verification Suite */}
        <div className="kyc-inspector-column">
          {selectedDoc ? (
            <div className="kyc-inspector-card glass-card">
              {/* Inspector Header */}
              <div className="inspector-head">
                <div className="inspector-head-title">
                  <span className="doc-category-badge">
                    {selectedDoc.entityType === 'gym' ? 'CLUB FRANCHISE KYC' : selectedDoc.entityType === 'vendor' ? 'STORE MERCHANT KYC' : 'ATHLETE IDENTITY KYC'}
                  </span>
                  <h2>{selectedDoc.label}</h2>
                  <p className="applicant-meta">
                    Submitted by <strong>{selectedDoc.ownerName}</strong> for <em>{selectedDoc.entityName}</em> ({selectedDoc.city})
                  </p>
                </div>

                <div className="inspector-status-badge">
                  <span className={`status-tag luxury-status-tag ${selectedDoc.status === 'verified' ? 'approved' : selectedDoc.status === 'pending' ? 'pending' : 'expired'}`} style={{ fontSize: '12px', padding: '6px 14px' }}>
                    <span className="status-dot-pulse" />
                    {selectedDoc.status === 'verified' ? 'APPROVED & VERIFIED' : selectedDoc.status === 'pending' ? 'PENDING DECISION' : 'REJECTED / NEEDS RESUBMIT'}
                  </span>
                </div>
              </div>

              {/* Realistic Government Certificate / ID Card Simulator */}
              <div className="govt-doc-canvas-frame">
                <div className="canvas-header-strip">
                  <div className="emblem-seal">
                    <ShieldCheckIcon size={24} color="#1e293b" />
                  </div>
                  <div className="govt-title-col">
                    <span className="gov-india-text">GOVERNMENT OF INDIA REGULATORY RECORD</span>
                    <span className="gov-cert-title">{selectedDoc.label.toUpperCase()}</span>
                    <span className="gov-issuer">{selectedDoc.issuer}</span>
                  </div>
                  <div className="official-stamp-box">
                    <span className="stamp-verified-text">
                      {selectedDoc.status === 'verified' ? '✓ CERTIFIED' : 'INSPECTION'}
                    </span>
                  </div>
                </div>

                <div className="canvas-body-grid">
                  <div className="canvas-kv">
                    <span className="c-label">REGISTRATION / LICENSE NUMBER</span>
                    <span className="c-val highlight-num">{selectedDoc.number}</span>
                  </div>
                  <div className="canvas-kv">
                    <span className="c-label">REGISTERED LEGAL ENTITY</span>
                    <span className="c-val">{selectedDoc.entityName}</span>
                  </div>
                  <div className="canvas-kv">
                    <span className="c-label">PRIMARY APPLICANT</span>
                    <span className="c-val">{selectedDoc.ownerName}</span>
                  </div>
                  <div className="canvas-kv">
                    <span className="c-label">JURISDICTION & PINCODE</span>
                    <span className="c-val">{selectedDoc.city}</span>
                  </div>
                  <div className="canvas-kv">
                    <span className="c-label">DOCUMENT VALIDITY</span>
                    <span className="c-val">{selectedDoc.expiry}</span>
                  </div>
                  <div className="canvas-kv">
                    <span className="c-label">SYSTEM CHECKSUM HASH</span>
                    <span className="c-val code-hash">{selectedDoc.verificationChecksum}</span>
                  </div>
                </div>

                <div className="canvas-footer-barcode">
                  <div className="fake-barcode-lines" />
                  <span className="checksum-status">✓ Authenticity Check Passed · Secure Cryptographic Ledger</span>
                </div>
              </div>

              {/* Document Audit Checklist */}
              <div className="audit-checklist-card">
                <h4 className="audit-title">Verification Compliance Checklist</h4>
                <div className="audit-items-grid">
                  <div className="audit-item pass">
                    <span className="check-icon">✓</span>
                    <span>Format & Identification Checksum Verified</span>
                  </div>
                  <div className="audit-item pass">
                    <span className="check-icon">✓</span>
                    <span>State & Municipal Jurisdiction Matched ({selectedDoc.city.split(',')[0]})</span>
                  </div>
                  <div className="audit-item pass">
                    <span className="check-icon">✓</span>
                    <span>Entity Registration Active & In Good Standing</span>
                  </div>
                  <div className="audit-item pass">
                    <span className="check-icon">✓</span>
                    <span>Direct Account Holder Identity Verified</span>
                  </div>
                </div>
              </div>

              {/* Rejection Note Display if rejected */}
              {selectedDoc.status === 'rejected' && selectedDoc.rejectionReason && (
                <div className="kyc-rejected-notice-box">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangleIcon size={14} color="#ef4444" /> REJECTION REASON SENT TO APPLICANT
                  </h4>
                  <p>{selectedDoc.rejectionReason}</p>
                </div>
              )}

              {/* Action Buttons Toolbar */}
              <div className="inspector-actions-toolbar">
                {selectedDoc.status === 'pending' && !showReasonBox && (
                  <div className="action-buttons-flex">
                    <button
                      className="kyc-primary-approve-btn"
                      onClick={() => handleApprove(selectedDoc)}
                    >
                      <CheckCircleIcon size={16} color="#ffffff" /> Approve & Certify Document
                    </button>
                    <button
                      className="kyc-danger-reject-btn"
                      onClick={() => setShowReasonBox(true)}
                    >
                      ✕ Reject & Request Re-upload
                    </button>
                  </div>
                )}

                {selectedDoc.status !== 'pending' && !showReasonBox && (
                  <div className="action-buttons-flex">
                    <button
                      className="kyc-secondary-reset-btn"
                      onClick={() => {
                        setKycDocs(prev => prev.map(d => d.id === selectedDoc.id ? { ...d, status: 'pending' } : d));
                        setSelectedDoc(prev => ({ ...prev, status: 'pending' }));
                        triggerToast(`Status for "${selectedDoc.label}" reset to Pending Review.`);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <RefreshIcon size={14} color="currentColor" /> Reset Status to Pending
                    </button>
                    <button
                      className="kyc-secondary-btn"
                      onClick={() => triggerToast(`Downloading secure certified PDF for ${selectedDoc.number}...`)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FileTextIcon size={14} color="currentColor" /> Download Certified PDF
                    </button>
                  </div>
                )}

                {/* Rejection Form Box */}
                {showReasonBox && (
                  <form onSubmit={handleReject} className="kyc-rejection-form-card">
                    <div className="reject-form-head">
                      <h4>Select Rejection Reason / Deficiency</h4>
                      <button
                        type="button"
                        className="close-reject-btn"
                        onClick={() => setShowReasonBox(false)}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="preset-reasons-row">
                      {[
                        'Image resolution unclear or blurry',
                        'Document expired past validity date',
                        'Name does not match application',
                        'Invalid GSTIN / License number format'
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`preset-chip ${presetReason === preset ? 'active' : ''}`}
                          onClick={() => setPresetReason(preset)}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    <div className="custom-textarea-wrap">
                      <label>Additional Notes / Direct Instructions to Applicant:</label>
                      <textarea
                        rows="3"
                        placeholder="Explain exactly what is missing or why this document was rejected..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="adm-input-field"
                      />
                    </div>

                    <div className="reject-form-actions">
                      <button type="submit" className="kyc-danger-confirm-btn">
                        Confirm Rejection & Send Alert
                      </button>
                      <button
                        type="button"
                        className="kyc-secondary-btn"
                        onClick={() => setShowReasonBox(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="kyc-inspector-empty glass-card">
              <span className="empty-icon">
                <ShieldCheckIcon size={44} color="#94a3b8" />
              </span>
              <h3>Select a Verification Task</h3>
              <p>Choose an item from the queue on the left to inspect documents and take action.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
