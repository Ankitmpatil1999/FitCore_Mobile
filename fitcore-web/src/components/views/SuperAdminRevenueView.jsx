import React, { useState } from 'react';
import CustomSelect from '../common/CustomSelect.jsx';
import {
  CreditCardIcon,
  BuildingIcon,
  LocationPinIcon,
  ShieldCheckIcon,
  BoltIcon,
  SearchIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshIcon,
  BarChartIcon
} from '../common/Icons';
import { API_ENDPOINTS } from '../../config/api';

export default function SuperAdminRevenueView({ gyms = [], plans = [], onRefresh, setTab }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedGymForInvoice, setSelectedGymForInvoice] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastNotification({ message, type });
    setTimeout(() => setToastNotification(null), 3500);
  };

  // Map package prices as default fallbacks
  const packagePriceMap = {};
  plans.forEach(p => {
    packagePriceMap[p.id] = Number(p.amount) || (p.id === 'starter' ? 14999 : (p.id === 'enterprise' ? 69999 : 34999));
  });

  // Calculate detailed financial items for each franchise
  const franchiseBillings = gyms.map(gym => {
    const planKey = (gym.plan || 'pro').toLowerCase();
    const fallbackAmount = packagePriceMap[planKey] || 34999;
    const billedAmount = Number(gym.subscriptionAmount) || fallbackAmount;
    const cycle = gym.billingCycle || 'yearly';
    const createdAt = gym.createdAt ? new Date(gym.createdAt) : new Date('2026-08-20');
    
    // Calculate renewal date based on cycle
    const renewalDate = new Date(createdAt);
    if (cycle === 'monthly') renewalDate.setMonth(renewalDate.getMonth() + 1);
    else if (cycle === 'quarterly') renewalDate.setMonth(renewalDate.getMonth() + 3);
    else if (cycle === 'half_yearly') renewalDate.setMonth(renewalDate.getMonth() + 6);
    else renewalDate.setFullYear(renewalDate.getFullYear() + 1);

    const isPaid = (gym.status || 'approved') === 'approved';

    return {
      id: gym.id || gym._id,
      gymName: gym.name,
      ownerName: gym.ownerName || gym.owner?.name || 'Franchise Director',
      ownerPhone: gym.ownerPhone || gym.phone || '-',
      city: gym.city || 'Nagpur',
      plan: gym.plan || 'pro',
      planName: plans.find(p => p.id === gym.plan)?.name || (gym.plan === 'enterprise' ? 'Enterprise Flagship' : (gym.plan === 'starter' ? 'Starter Club' : 'Pro Studio')),
      amount: billedAmount,
      cycle: cycle,
      cycleLabel: cycle === 'monthly' ? 'Monthly' : (cycle === 'quarterly' ? 'Quarterly (3 Mo)' : (cycle === 'half_yearly' ? 'Half-Yearly (6 Mo)' : 'Annual (1 Year)')),
      subscriptionNotes: gym.subscriptionNotes || 'Platform License & Turnstile Cloud Sync',
      paymentStatus: isPaid ? 'Settled' : 'Pending',
      paymentMethod: 'UPI / Direct Bank Turnstile Settlement',
      invoiceNumber: `INV-FC-${(gym.id || gym._id || '1001').slice(-6).toUpperCase()}`,
      startDate: createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      renewalDate: renewalDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      capacity: gym.capacity || 250,
      gstNumber: gym.gstNumber || 'Not Registered'
    };
  });

  // Calculate Aggregates
  const totalBilledMRR = franchiseBillings.reduce((sum, item) => sum + item.amount, 0);
  const totalAnnualProjected = franchiseBillings.reduce((sum, item) => {
    if (item.cycle === 'monthly') return sum + (item.amount * 12);
    if (item.cycle === 'quarterly') return sum + (item.amount * 4);
    if (item.cycle === 'half_yearly') return sum + (item.amount * 2);
    return sum + item.amount;
  }, 0);
  const totalSettledCount = franchiseBillings.filter(f => f.paymentStatus === 'Settled').length;
  const totalPendingCount = franchiseBillings.filter(f => f.paymentStatus === 'Pending').length;

  // Filter list
  const filteredBillings = franchiseBillings.filter(item => {
    const matchesSearch = item.gymName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCycle = selectedCycle === 'all' || item.cycle === selectedCycle;
    const matchesStatus = selectedStatus === 'all' || item.paymentStatus.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesCycle && matchesStatus;
  });

  return (
    <div className="adm-view-container">
      {/* Toast Notification */}
      {toastNotification && (
        <div className={`adm-toast-banner ${toastNotification.type}`}>
          <span className="toast-icon">{toastNotification.type === 'success' ? '✓' : '⚠️'}</span>
          <span className="toast-text">{toastNotification.message}</span>
          <button className="toast-close" onClick={() => setToastNotification(null)}>✕</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="adm-view-header-bar" style={{ marginBottom: '18px' }}>
        <div className="adm-view-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'inline-flex', padding: '8px', background: 'rgba(244, 63, 94, 0.12)', borderRadius: '12px', color: '#f43f5e' }}>
              <CreditCardIcon size={24} color="#f43f5e" />
            </span>
            <div>
              <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '800' }}>Platform SaaS Revenue & Franchise Billing</h1>
              <p className="adm-view-subtitle" style={{ margin: '4px 0 0' }}>
                Centralized financial audit, monthly/yearly SaaS software fee collections & franchise invoice settlement ledger
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="wizard-back-btn"
            style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '13px', background: '#fff' }}
            onClick={() => { if (onRefresh) onRefresh(); showToast('Financial ledger refreshed from MongoDB ✓', 'success'); }}
          >
            <RefreshIcon size={14} color="#475569" /> Refresh Ledger
          </button>
        </div>
      </div>

      {/* Hero Financial KPI Cards */}
      <section className="hub-stats-row" style={{ marginTop: '0' }}>
        {/* Metric 1: Total SaaS MRR */}
        <div className="stat-card glass-card card-rose">
          <div className="card-shine-beam" />
          <div className="stat-header">
            <span className="stat-icon-badge ember">
              <CreditCardIcon size={18} color="#f43f5e" />
            </span>
            <span className="stat-pill ember-pill">Active Subscriptions</span>
          </div>
          <div className="stat-body">
            <span className="stat-label">Total Platform MRR (Current Cycle)</span>
            <h2 className="stat-number">₹{totalBilledMRR.toLocaleString()} <span className="stat-unit">INR</span></h2>
            <div className="stat-footer-text">
              <span>Across {gyms.length} onboarded franchise clubs</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Annual Projected Run Rate (ARR) */}
        <div className="stat-card glass-card card-indigo">
          <div className="card-shine-beam" />
          <div className="stat-header">
            <span className="stat-icon-badge lime">
              <BarChartIcon size={18} color="#4f46e5" />
            </span>
            <span className="stat-pill success">Projected Run-Rate</span>
          </div>
          <div className="stat-body">
            <span className="stat-label">Annual Contract Value (ARR)</span>
            <h2 className="stat-number">₹{totalAnnualProjected.toLocaleString()} <span className="stat-unit">ARR</span></h2>
            <div className="stat-footer-text">
              <span>Includes annual & multi-cycle contracts</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Settlement Rate & Direct Gate Sync */}
        <div className="stat-card glass-card card-cyan">
          <div className="card-shine-beam" />
          <div className="stat-header">
            <span className="stat-icon-badge cyan">
              <ShieldCheckIcon size={18} color="#06b6d4" />
            </span>
            <span className="stat-pill cyan-pill">100% Turnstile Uptime</span>
          </div>
          <div className="stat-body">
            <span className="stat-label">Settled Franchise Clubs</span>
            <h2 className="stat-number">{totalSettledCount} <span className="stat-unit">Clubs Active</span></h2>
            <div className="stat-footer-text">
              <span>{totalPendingCount} franchises awaiting billing renewal</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="adm-search-filter-row glass-panel" style={{ marginTop: '18px' }}>
        <div className="search-input-wrap">
          <span className="search-icon">
            <SearchIcon size={15} color="#94a3b8" />
          </span>
          <input
            type="text"
            className="adm-input-field search"
            placeholder="Search franchise, owner, city or invoice #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Cycle Filter */}
        <CustomSelect
          value={selectedCycle}
          onChange={(newVal) => setSelectedCycle(newVal)}
          icon={BoltIcon}
          options={[
            { value: 'all', label: 'All Billing Cycles' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'quarterly', label: 'Quarterly (3 Mo)' },
            { value: 'half_yearly', label: 'Half-Yearly (6 Mo)' },
            { value: 'yearly', label: 'Yearly (Annual)' }
          ]}
          style={{ minWidth: '190px' }}
        />

        {/* Payment Status Filter */}
        <CustomSelect
          value={selectedStatus}
          onChange={(newVal) => setSelectedStatus(newVal)}
          icon={ShieldCheckIcon}
          options={[
            { value: 'all', label: 'All Settlement Statuses' },
            { value: 'settled', label: 'Settled & Paid', icon: <span style={{ color: '#10b981' }}>●</span> },
            { value: 'pending', label: 'Pending Renewal', icon: <span style={{ color: '#f59e0b' }}>●</span> }
          ]}
          style={{ minWidth: '180px' }}
        />
      </div>

      {/* Franchise Billing Ledger Table Panel */}
      <div className="adm-card-panel glass-card franchise-table-panel" style={{ marginTop: '16px' }}>
        <div className="adm-card-header" style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h3 className="adm-card-title">Franchise Subscription Collections & Invoices</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Every amount paid by gym owners to Super Admin platform</span>
          </div>
          <span className="adm-badge approved" style={{ fontSize: '11px', padding: '6px 14px' }}>
            {filteredBillings.length} Subscriptions Active
          </span>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table modern-franchise-table">
            <thead>
              <tr>
                <th>Franchise & Owner</th>
                <th>City</th>
                <th>SaaS Tier</th>
                <th>Billed Amount</th>
                <th>Billing Cycle</th>
                <th>Activation & Renewal</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Invoice & Audit</th>
              </tr>
            </thead>
            <tbody>
              {filteredBillings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="table-empty-row">
                    <div className="empty-state-box">
                      <span className="empty-state-icon">
                        <CreditCardIcon size={38} color="#94a3b8" />
                      </span>
                      <h4>No Franchise Billing Records Found</h4>
                      <p>No gyms matching your financial search criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBillings.map((bill) => (
                  <tr key={bill.id}>
                    <td>
                      <div className="table-primary-cell">
                        <span className="club-avatar-badge" style={{ background: '#f43f5e', color: '#fff' }}>
                          {bill.gymName.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <strong className="club-name-txt">{bill.gymName}</strong>
                          <span className="club-meta-txt">Director: {bill.ownerName} · 📞 {bill.ownerPhone}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="city-pill-tag">
                        <LocationPinIcon size={12} color="#ef4444" /> {bill.city}
                      </span>
                    </td>
                    <td>
                      <span className="plan-badge-pill" style={{ textTransform: 'uppercase' }}>
                        {bill.planName}
                      </span>
                    </td>
                    <td>
                      <div>
                        <strong style={{ fontSize: '15px', color: '#0f172a' }}>₹{bill.amount.toLocaleString()}</strong>
                        <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>Tax Incl.</span>
                      </div>
                    </td>
                    <td>
                      <span className="luxury-detail-pill" style={{ background: '#f1f5f9', color: '#334155', borderColor: '#cbd5e1' }}>
                        {bill.cycleLabel}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        <span style={{ color: '#64748b' }}>Active: {bill.startDate}</span>
                        <span style={{ display: 'block', color: '#f43f5e', fontWeight: '600', marginTop: '2px' }}>
                          Renews: {bill.renewalDate}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-tag ${bill.paymentStatus === 'Settled' ? 'approved' : 'pending'}`}>
                        {bill.paymentStatus === 'Settled' ? '✓ Settled' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="table-action-btn edit-btn"
                        style={{ padding: '6px 14px', borderRadius: '10px', fontSize: '12px', background: 'rgba(79, 70, 229, 0.08)', color: '#4f46e5', borderColor: 'rgba(79, 70, 229, 0.2)' }}
                        onClick={() => setSelectedGymForInvoice(bill)}
                      >
                        📄 View Invoice
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Franchise Tax Invoice Modal */}
      {selectedGymForInvoice && (
        <div className="modal-backdrop-luxury">
          <div className="luxury-wizard-box" style={{ maxWidth: '650px', padding: '0', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #090C14 0%, #1e1b4b 100%)', padding: '24px 28px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase' }}>
                  OFFICIAL TAX INVOICE & RECEIPT
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '20px', color: '#fff' }}>FitCore SaaS Platform License</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Invoice ID: {selectedGymForInvoice.invoiceNumber}</span>
              </div>
              <button className="wizard-close-btn" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }} onClick={() => setSelectedGymForInvoice(null)}>✕</button>
            </div>

            <div style={{ padding: '24px 28px', background: '#fff' }}>
              {/* Invoice Meta Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingBottom: '16px', borderBottom: '1px dashed #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>BILLED TO (FRANCHISE):</span>
                  <h4 style={{ margin: '4px 0 2px', fontSize: '15px', color: '#0f172a' }}>{selectedGymForInvoice.gymName}</h4>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#475569' }}>Director: {selectedGymForInvoice.ownerName}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Location: {selectedGymForInvoice.city}, India</p>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>PLATFORM ISSUER:</span>
                  <h4 style={{ margin: '4px 0 2px', fontSize: '15px', color: '#0f172a' }}>FitCore Central Technologies Ltd</h4>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#475569' }}>HQ: Nagpur Corporate Center</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Turnstile Cloud Node: Active (NFC Sync)</p>
                </div>
              </div>

              {/* Line Items */}
              <div style={{ marginTop: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>Description</th>
                      <th style={{ padding: '10px 12px' }}>Cycle</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>
                        <strong>{selectedGymForInvoice.planName} Platform License</strong>
                        <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          {selectedGymForInvoice.subscriptionNotes}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{selectedGymForInvoice.cycleLabel}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>
                        ₹{selectedGymForInvoice.amount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Box */}
              <div style={{ marginTop: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', textTransform: 'uppercase' }}>
                    ✓ STATUS: {selectedGymForInvoice.paymentStatus.toUpperCase()}
                  </span>
                  <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>Payment Mode: {selectedGymForInvoice.paymentMethod}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Total Paid:</span>
                  <h3 style={{ margin: 0, fontSize: '20px', color: '#4f46e5', fontWeight: '800' }}>
                    ₹{selectedGymForInvoice.amount.toLocaleString()}
                  </h3>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="wizard-back-btn" onClick={() => setSelectedGymForInvoice(null)}>
                  Close
                </button>
                <button className="hub-btn-glow" onClick={() => { window.print(); }}>
                  🖨️ Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
