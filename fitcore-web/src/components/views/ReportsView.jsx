import React from 'react';

export default function ReportsView({ members, trainers, plans }) {
  
  const reportCategories = [
    { name: 'Monthly Revenue Report', icon: '💰', desc: 'Summary of paid transactions, billing methods, and invoice clearings.' },
    { name: 'Member Attendance Audit', icon: '📅', desc: 'Logs of check-ins, check-outs, average training hours, and late entries.' },
    { name: 'Expired Subscriptions Ledger', icon: '⚠️', desc: 'List of members whose passes have lapsed or will expire in 7 days.' },
    { name: 'Trainer Performance Review', icon: '👨‍🏫', desc: 'Assigned personal training numbers and coaching availability stats.' }
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
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>{r.icon}</div>
            <h3>{r.name}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '18px', margin: '12px 0 20px', minHeight: '54px' }}>
              {r.desc}
            </p>
            <button className="primary-action-btn" style={{ width: '100%' }} onClick={() => handleExportCSV(r.name)}>
              📥 Export Excel Sheet
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
