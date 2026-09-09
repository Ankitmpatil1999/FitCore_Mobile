import React, { useState } from 'react';
import { CreditCardIcon, FileTextIcon, PlusIcon } from '../common/Icons';

export default function PaymentsView({ members, setMembers, plans }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMode, setPaymentMode] = useState('All');
  
  // New transaction modal/form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payMemberId, setPayMemberId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!payMemberId || !payAmount) return;

    const member = members.find(m => m.id === payMemberId);
    if (!member) return;

    const newTx = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleDateString(),
      amount: `₹${payAmount.trim()}`,
      method: payMethod,
      status: 'Paid'
    };

    const updated = {
      ...member,
      status: 'Active',
      payments: [newTx, ...(member.payments || [])]
    };

    setMembers(prev => prev.map(m => m.id === payMemberId ? updated : m));
    setIsModalOpen(false);
    resetForm();
    alert(`Payment of ₹${payAmount} from ${member.name} registered successfully!`);
  };

  const resetForm = () => {
    setPayMemberId('');
    setPayAmount('');
    setPayMethod('UPI');
  };

  // Collect all transactions
  const allTransactions = [];
  members.forEach(m => {
    m.payments?.forEach(p => {
      allTransactions.push({
        txId: p.id,
        memberName: m.name,
        phone: m.phone,
        date: p.date,
        amount: p.amount,
        method: p.method,
        status: p.status
      });
    });
  });

  const totalPaidRevenue = 245000; // Hardcoded from spec, but can calculate dynamically
  const pendingAmount = 35000;

  const filteredTxs = allTransactions.filter(tx => {
    const matchesSearch = tx.memberName.toLowerCase().includes(searchTerm.toLowerCase()) || tx.txId.includes(searchTerm);
    const matchesMethod = paymentMode === 'All' || tx.method === paymentMode;
    return matchesSearch && matchesMethod;
  });

  return (
    <div className="view-container">
      <header className="view-header">
        <div>
          <h2>Payments & Invoicing Ledger</h2>
          <p className="gym-tagline">Track subscriptions revenue, cash, card, and UPI logs</p>
        </div>
        <button className="primary-action-btn" onClick={() => setIsModalOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <PlusIcon size={14} color="currentColor" /> Record New Payment
        </button>
      </header>

      {/* Payment overview */}
      <section className="metrics-grid">
        <div className="metric-card bg-success-light">
          <div className="metric-details">
            <span className="metric-label">Paid Revenue (This Month)</span>
            <h3 className="metric-value">₹{totalPaidRevenue.toLocaleString()}</h3>
            <span className="metric-trend success">Cash / Card / UPI Cleared</span>
          </div>
        </div>
        <div className="metric-card bg-danger-light">
          <div className="metric-details">
            <span className="metric-label">Pending Payments</span>
            <h3 className="metric-value">₹{pendingAmount.toLocaleString()}</h3>
            <span className="metric-trend danger">Requires notifications push</span>
          </div>
        </div>
      </section>

      {/* Transactions list */}
      <section className="table-card">
        <div className="pane-header-row table-header-controls">
          <h4>Transactions Logs Ledger</h4>
          <div className="table-filters-row">
            <input
              type="text"
              placeholder="Search receipt/name..."
              className="search-input compact-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="filter-select compact-select"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
            >
              <option value="All">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
        </div>

        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Receipt ID</th>
              <th>Member</th>
              <th>Billing Date</th>
              <th>Amount Paid</th>
              <th>Payment Method</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTxs.map((tx) => (
              <tr key={tx.txId}>
                <td><strong>{tx.txId}</strong></td>
                <td>{tx.memberName}</td>
                <td>{tx.date}</td>
                <td><strong className="text-primary-accent">{tx.amount}</strong></td>
                <td>{tx.method}</td>
                <td>
                  <span className={`status-tag ${tx.status === 'Paid' ? 'active' : 'pending'}`}>
                    {tx.status}
                  </span>
                </td>
                <td>
                  <button className="text-action-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => alert(`Download invoice mock for ${tx.txId} initiated!`)}>
                    <FileTextIcon size={13} color="currentColor" /> Invoice
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>Record Member Payment</h3>
            <form onSubmit={handleRecordPayment} className="modal-form">
              <label>Select Member</label>
              <select value={payMemberId} onChange={(e) => setPayMemberId(e.target.value)} required>
                <option value="">Choose Member...</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>)}
              </select>

              <label>Payment Amount (INR)</label>
              <input type="number" placeholder="e.g. 8000" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />

              <label>Payment Method</label>
              <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                <option value="UPI">UPI (Google Pay / PhonePe)</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Cash">Cash at Desk</option>
              </select>

              <div className="modal-actions-buttons">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
