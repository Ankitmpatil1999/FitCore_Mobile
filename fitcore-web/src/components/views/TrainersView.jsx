import React, { useState } from 'react';

export default function TrainersView({ trainers, setTrainers, members }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tName, setTName] = useState('');
  const [tSpec, setTSpec] = useState('');
  const [tExp, setTExp] = useState('');
  const [tSalary, setTSalary] = useState('');
  const [tStatus, setTStatus] = useState('Available');

  const handleAddTrainer = (e) => {
    e.preventDefault();
    if (!tName.trim() || !tSpec.trim()) return;

    const newTrainer = {
      id: `t_${Date.now()}`,
      name: tName.trim(),
      specialization: tSpec.trim(),
      experience: tExp.trim() || '1 Year',
      assignedMembers: 0,
      salary: tSalary.trim() ? `₹${tSalary.trim()}` : '₹20,000',
      status: tStatus
    };

    setTrainers(prev => [...prev, newTrainer]);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTName('');
    setTSpec('');
    setTExp('');
    setTSalary('');
    setTStatus('Available');
  };

  const handleDeleteTrainer = (id) => {
    if (window.confirm('Are you sure you want to remove this trainer profile?')) {
      setTrainers(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="view-container">
      <header className="view-header">
        <div>
          <h2>Personal Trainers</h2>
          <p className="gym-tagline">Manage gym fitness coaches, specializations, and availability</p>
        </div>
        <button className="primary-action-btn" onClick={() => setIsModalOpen(true)}>
          ➕ Add Trainer Profile
        </button>
      </header>

      <section className="table-card">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Trainer Name</th>
              <th>Specialization</th>
              <th>Experience</th>
              <th>Assigned Members</th>
              <th>Salary</th>
              <th>Status</th>
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trainers.map((t) => (
              <tr key={t.id}>
                <td>
                  <strong>{t.name}</strong>
                </td>
                <td>{t.specialization}</td>
                <td>{t.experience}</td>
                <td>{t.assignedMembers} Members</td>
                <td>{t.salary}</td>
                <td>
                  <span className={`status-tag ${t.status === 'Available' ? 'active' : 'pending'}`}>
                    {t.status}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="text-action-btn danger" onClick={() => handleDeleteTrainer(t.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>Add Trainer Profile</h3>
            <form onSubmit={handleAddTrainer} className="modal-form">
              <label>Trainer Full Name</label>
              <input type="text" placeholder="e.g. Vikram Singh" value={tName} onChange={(e) => setTName(e.target.value)} required />

              <label>Specialization</label>
              <input type="text" placeholder="e.g. Strength Conditioning" value={tSpec} onChange={(e) => setTSpec(e.target.value)} required />

              <label>Experience Duration</label>
              <input type="text" placeholder="e.g. 5 Years" value={tExp} onChange={(e) => setTExp(e.target.value)} />

              <label>Salary (Monthly)</label>
              <input type="number" placeholder="e.g. 30000" value={tSalary} onChange={(e) => setTSalary(e.target.value)} />

              <label>Availability Status</label>
              <select value={tStatus} onChange={(e) => setTStatus(e.target.value)}>
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
              </select>

              <div className="modal-actions-buttons">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Add Trainer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
