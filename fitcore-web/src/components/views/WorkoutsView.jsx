import React, { useState } from 'react';

export default function WorkoutsView({ members, setMembers }) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  
  // Exercise inputs
  const [chestEx, setChestEx] = useState('');
  const [backEx, setBackEx] = useState('');
  const [legEx, setLegEx] = useState('');
  const [shoulderEx, setShoulderEx] = useState('');
  const [cardioEx, setCardioEx] = useState('');

  const handleAssignWorkout = (e) => {
    e.preventDefault();
    if (!selectedMemberId) return;

    const member = members.find(m => m.id === selectedMemberId);
    if (!member) return;

    const workoutPlan = {
      Chest: chestEx.trim() || 'Rest Day',
      Back: backEx.trim() || 'Rest Day',
      Leg: legEx.trim() || 'Rest Day',
      Shoulder: shoulderEx.trim() || 'Rest Day',
      Cardio: cardioEx.trim() || 'No Cardio'
    };

    const updated = {
      ...member,
      workoutPlan,
      history: `${member.history || ''}\nAssigned new workout plan on ${new Date().toLocaleDateString()}`
    };

    setMembers(prev => prev.map(m => m.id === selectedMemberId ? updated : m));
    alert(`Workout plan assigned to ${member.name} successfully!`);
    resetForm();
  };

  const resetForm = () => {
    setSelectedMemberId('');
    setChestEx('');
    setBackEx('');
    setLegEx('');
    setShoulderEx('');
    setCardioEx('');
  };

  return (
    <div className="view-container">
      <header className="view-header">
        <div>
          <h2>Workout Management</h2>
          <p className="gym-tagline">Create custom muscle routine plans and assign them to members</p>
        </div>
      </header>

      <div className="attendance-split-layout">
        {/* Left Side: Creation Form */}
        <div className="attendance-left-pane">
          <div className="content-card">
            <h4>Assign Workout Routine</h4>
            <form onSubmit={handleAssignWorkout} className="modal-form">
              <label>Select Gym Member</label>
              <select value={selectedMemberId} onChange={(e) => {
                setSelectedMemberId(e.target.value);
                const mem = members.find(m => m.id === e.target.value);
                if (mem && mem.workoutPlan) {
                  setChestEx(mem.workoutPlan.Chest || '');
                  setBackEx(mem.workoutPlan.Back || '');
                  setLegEx(mem.workoutPlan.Leg || '');
                  setShoulderEx(mem.workoutPlan.Shoulder || '');
                  setCardioEx(mem.workoutPlan.Cardio || '');
                } else {
                  setChestEx('');
                  setBackEx('');
                  setLegEx('');
                  setShoulderEx('');
                  setCardioEx('');
                }
              }} required>
                <option value="">Choose Member...</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>

              <label>Chest Routine</label>
              <input type="text" placeholder="e.g. Bench Press (4x10), Chest Flyes (3x12)" value={chestEx} onChange={(e) => setChestEx(e.target.value)} />

              <label>Back Routine</label>
              <input type="text" placeholder="e.g. Lat Pulldowns (4x10), Deadlifts (3x8)" value={backEx} onChange={(e) => setBackEx(e.target.value)} />

              <label>Legs Routine</label>
              <input type="text" placeholder="e.g. Squats (4x10), Leg Press (3x12)" value={legEx} onChange={(e) => setLegEx(e.target.value)} />

              <label>Shoulders Routine</label>
              <input type="text" placeholder="e.g. Shoulder Press (4x10), Lateral Raises (3x15)" value={shoulderEx} onChange={(e) => setShoulderEx(e.target.value)} />

              <label>Cardio Routine</label>
              <input type="text" placeholder="e.g. 15 mins HIIT Treadmill Sprints" value={cardioEx} onChange={(e) => setCardioEx(e.target.value)} />

              <button type="submit" className="submit-btn" style={{ marginTop: 16 }}>
                Assign Workout Plan
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Quick view list */}
        <div className="attendance-right-pane">
          <div className="content-card">
            <h4>Assigned Workout Summaries</h4>
            <div className="quick-checkin-member-list">
              {members.map(m => (
                <div key={m.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <strong>{m.name}</strong>
                  {m.workoutPlan && Object.keys(m.workoutPlan).length > 0 ? (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Chest: {m.workoutPlan.Chest} | Back: {m.workoutPlan.Back}
                    </div>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                      No workout plan assigned yet.
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
