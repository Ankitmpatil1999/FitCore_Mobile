import React from 'react';
import {
  CreditCardIcon,
  CalendarIcon,
  AlertTriangleIcon,
  UsersIcon,
  FileTextIcon
} from '../common/Icons';

export default function ReportsView({ members, trainers, plans }) {
  
  const reportCategories = [
    { name: 'Monthly Revenue Report', icon: <CreditCardIcon size={28} color="#10b981" />, desc: 'Summary of paid transactions, billing methods, and invoice clearings.' },
    { name: 'Member Attendance Audit', icon: <CalendarIcon size={28} color="#06b6d4" />, desc: 'Logs of check-ins, check-outs, average training hours, and late entries.' },
    { name: 'Expired Subscriptions Ledger', icon: <AlertTriangleIcon size={28} color="#f59e0b" />, desc: 'List of members whose passes have lapsed or will expire in 7 days.' },
    { name: 'Trainer Performance Review', icon: <UsersIcon size={28} color="#6366f1" />, desc: 'Assigned personal training numbers and coaching availability stats.' }
  ];

  const handleExportCSV = (reportName) => {
    alert(`Exporting high-fidelity ${reportName} spreadsheet log to CSV...`);
  };

  return (
    <div className="view-container">
      <header className="view-header">
        <div>
          <h2>Executive Business Reports</h2>
          <p className="gym-tagline">Export payment history sheet records, attendance logs, and performance metrics</p>
        </div>
      </header>

      <div className="plans-cards-grid">
        {reportCategories.map((r, i) => (
          <div key={i} className="plan-detail-card report-card">
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              {r.icon}
            </div>
            <h3>{r.name}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '18px', margin: '12px 0 20px', minHeight: '54px' }}>
              {r.desc}
            </p>
            <button className="primary-action-btn" style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => handleExportCSV(r.name)}>
              <FileTextIcon size={14} color="currentColor" /> Export Excel Sheet
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

