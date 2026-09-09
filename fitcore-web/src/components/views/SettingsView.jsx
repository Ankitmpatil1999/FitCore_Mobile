import React, { useState } from 'react';

export default function SettingsView({ gymConfig, setGymConfig }) {
  const [name, setName] = useState(gymConfig.name);
  const [hours, setHours] = useState(gymConfig.hours);
  const [branches, setBranches] = useState(gymConfig.branches);
  const [subscription, setSubscription] = useState(gymConfig.subscription);
  const [taxRate, setTaxRate] = useState(gymConfig.taxRate);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setGymConfig(prev => ({
      ...prev,
      name: name.trim(),
      hours: hours.trim(),
      branches: branches.trim(),
      subscription: subscription.trim(),
      taxRate: taxRate.trim()
    }));

    alert('FitCore configurations updated successfully!');
  };

  return (
    <div className="view-container">
      <header className="view-header">
        <div>
          <h2>Gym Settings Configuration</h2>
          <p className="gym-tagline">Manage workspace operational hours, branch expansions, taxes, and system licenses</p>
        </div>
      </header>

      <div style={{ maxWidth: '600px', width: '100%' }}>
        <div className="content-card">
          <h4>Global Settings</h4>
          <form onSubmit={handleSaveSettings} className="modal-form" style={{ marginTop: '20px' }}>
            <label>Gym Brand Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />

            <label>Working Hours</label>
            <input type="text" placeholder="e.g. 06:00 AM - 10:00 PM" value={hours} onChange={(e) => setHours(e.target.value)} />

            <label>Registered Branches</label>
            <input type="text" placeholder="e.g. Sector 4, Seawood Link Road" value={branches} onChange={(e) => setBranches(e.target.value)} />

            <label>Billing GST Tax Rate</label>
            <input type="text" placeholder="e.g. 18% GST" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />

            <label>FITCore Licensing Tier</label>
            <input type="text" value={subscription} disabled />
            <p className="description-text" style={{ marginTop: '-8px', marginBottom: '16px' }}>Contact FitCore developer support to upgrade licensing limits.</p>

            <button type="submit" className="primary-action-btn" style={{ width: '100%', paddingVertical: '12px' }}>
              Save Settings Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
