import React, { useState } from 'react';

export default function DietsView({ members, setMembers }) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  
  // Diet inputs
  const [breakfast, setBreakfast] = useState('');
  const [lunch, setLunch] = useState('');
  const [dinner, setDinner] = useState('');
  const [snacks, setSnacks] = useState('');
  const [waterIntake, setWaterIntake] = useState('3 Liters');

  const handleAssignDiet = (e) => {
    e.preventDefault();
    if (!selectedMemberId) return;

    const member = members.find(m => m.id === selectedMemberId);
    if (!member) return;

    const dietPlan = {
      Breakfast: breakfast.trim() || 'No breakfast logged',
      Lunch: lunch.trim() || 'No lunch logged',
      Dinner: dinner.trim() || 'No dinner logged',
      Snacks: snacks.trim() || 'No snacks logged',
      WaterIntake: waterIntake.trim() || '3 Liters'
    };

    const updated = {
      ...member,
      dietPlan,
      history: `${member.history || ''}\nAssigned new diet plan on ${new Date().toLocaleDateString()}`
    };

    setMembers(prev => prev.map(m => m.id === selectedMemberId ? updated : m));
    alert(`Diet plan assigned to ${member.name} successfully!`);
    resetForm();
  };

  const resetForm = () => {
    setSelectedMemberId('');
    setBreakfast('');
    setLunch('');
    setDinner('');
    setSnacks('');
    setWaterIntake('3 Liters');
  };

  return (
    <div className="view-container">
      <header className="view-header">
        <div>
          <h2>Diet Management</h2>
          <p className="gym-tagline">Create custom nutrition sheets and assign them to members</p>
        </div>
      </header>

      <div className="attendance-split-layout">
        {/* Left Side: Creation Form */}
        <div className="attendance-left-pane">
          <div className="content-card">
            <h4>Assign Diet Sheet</h4>
            <form onSubmit={handleAssignDiet} className="modal-form">
              <label>Select Gym Member</label>
              <select value={selectedMemberId} onChange={(e) => {
                setSelectedMemberId(e.target.value);
                const mem = members.find(m => m.id === e.target.value);
                if (mem && mem.dietPlan) {
                  setBreakfast(mem.dietPlan.Breakfast || '');
                  setLunch(mem.dietPlan.Lunch || '');
                  setDinner(mem.dietPlan.Dinner || '');
                  setSnacks(mem.dietPlan.Snacks || '');
                  setWaterIntake(mem.dietPlan.WaterIntake || '3 Liters');
                } else {
                  setBreakfast('');
                  setLunch('');
                  setDinner('');
                  setSnacks('');
                  setWaterIntake('3 Liters');
                }
              }} required>
                <option value="">Choose Member...</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>

              <label>Breakfast Intake</label>
              <input type="text" placeholder="e.g. Oats with milk, scoop of whey, 1 banana" value={breakfast} onChange={(e) => setBreakfast(e.target.value)} />

              <label>Lunch Intake</label>
              <input type="text" placeholder="e.g. 200g Grilled Chicken, Rice, Broccoli" value={lunch} onChange={(e) => setLunch(e.target.value)} />

              <label>Dinner Intake</label>
              <input type="text" placeholder="e.g. Salmon Paneer, Sweet Potato, Mixed Greens" value={dinner} onChange={(e) => setDinner(e.target.value)} />

              <label>Snacks & Extras</label>
              <input type="text" placeholder="e.g. Almonds, Apple, Green Tea" value={snacks} onChange={(e) => setSnacks(e.target.value)} />

              <label>Water Intake Target</label>
              <input type="text" placeholder="e.g. 4 Liters" value={waterIntake} onChange={(e) => setWaterIntake(e.target.value)} />

              <button type="submit" className="submit-btn" style={{ marginTop: 16 }}>
                Assign Diet Sheet
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Quick view list */}
        <div className="attendance-right-pane">
          <div className="content-card">
            <h4>Assigned Nutrition Summaries</h4>
            <div className="quick-checkin-member-list">
              {members.map(m => (
                <div key={m.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <strong>{m.name}</strong>
                  {m.dietPlan && Object.keys(m.dietPlan).length > 0 ? (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      🥗 breakfast: {m.dietPlan.Breakfast} | Lunch: {m.dietPlan.Lunch}
                    </div>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                      No nutrition plan assigned yet.
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
