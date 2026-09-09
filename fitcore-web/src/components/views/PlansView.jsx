import React, { useState } from 'react';
import { CreditCardIcon } from '../common/Icons';

export default function PlansView({ plans, setPlans }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pName, setPName] = useState('');
  const [pDuration, setPDuration] = useState('1 Month');
  const [pPrice, setPPrice] = useState('');

  const handleAddPlan = (e) => {
    e.preventDefault();
    if (!pName.trim() || !pPrice.trim()) return;

    const newPlan = {
      id: `p_${Date.now()}`,
      name: pName.trim(),
      duration: pDuration,
      price: `₹${pPrice.trim()}`
    };

    setPlans(prev => [...prev, newPlan]);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setPName('');
    setPDuration('1 Month');
    setPPrice('');
  };

  const handleDeletePlan = (id) => {
    if (window.confirm('Are you sure you want to remove this plan?')) {
      setPlans(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="view-container">
      <header className="view-header">
        <div>
          <h2>Membership Plans</h2>
          <p className="gym-tagline">Manage gym subscription durations, pricing, and benefits</p>
        </div>
        <button className="primary-action-btn" onClick={() => setIsModalOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <CreditCardIcon size={14} color="currentColor" /> Create New Plan
        </button>
      </header>

      {/* Plans Grid */}
      <section className="plans-cards-grid">
        {plans.map((p) => (
          <div key={p.id} className="plan-detail-card">
            <div className="plan-badge">MEMBERSHIP</div>
            <h3>{p.name}</h3>
            <div className="plan-price-tag">
              <span className="price">{p.price}</span>
              <span className="duration">/ {p.duration}</span>
            </div>
            <div className="plan-perks-list">
              <div className="perk-item">✓ Unlimited gym floor access</div>
              <div className="perk-item">✓ Free locker & shower access</div>
              <div className="perk-item">✓ Cardio floor & strength zones</div>
            </div>
            <button className="delete-plan-btn" onClick={() => handleDeletePlan(p.id)}>
              Delete Plan
            </button>
          </div>
        ))}
      </section>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>Create Membership Plan</h3>
            <form onSubmit={handleAddPlan} className="modal-form">
              <label>Plan Name</label>
              <input type="text" placeholder="e.g. Platinum Annual Pass" value={pName} onChange={(e) => setPName(e.target.value)} required />

              <label>Plan Duration</label>
              <select value={pDuration} onChange={(e) => setPDuration(e.target.value)}>
                <option value="1 Month">1 Month</option>
                <option value="3 Months">3 Months</option>
                <option value="6 Months">6 Months</option>
                <option value="12 Months">12 Months</option>
              </select>

              <label>Price (INR)</label>
              <input type="number" placeholder="e.g. 5000" value={pPrice} onChange={(e) => setPPrice(e.target.value)} required />

              <div className="modal-actions-buttons">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Create Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
