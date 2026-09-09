import React, { useState } from 'react';
import { PlusIcon } from '../common/Icons';

export default function MembersView({ members, setMembers, trainers, plans }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Selection / Modal states
  const [selectedMember, setSelectedMember] = useState(null);
  const [detailTab, setDetailTab] = useState('profile');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState(null);

  // Add Member Form States
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberPlan, setNewMemberPlan] = useState('Gold Pass');
  const [newMemberTrainer, setNewMemberTrainer] = useState('None');
  const [newMemberStatus, setNewMemberStatus] = useState('Active');
  const [newMemberNotes, setNewMemberNotes] = useState('');

  // Edit / Add actions
  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberPhone.trim()) return;

    const newMember = {
      id: `m_${Date.now()}`,
      name: newMemberName.trim(),
      phone: newMemberPhone.trim(),
      joinedDate: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }),
      plan: newMemberPlan,
      trainer: newMemberTrainer,
      status: newMemberStatus,
      avatar: newMemberName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      attendance: [],
      payments: [
        { id: `TX-${Math.floor(1000 + Math.random() * 9000)}`, date: new Date().toLocaleDateString(), amount: '₹4,500', method: 'UPI', status: 'Paid' }
      ],
      workoutPlan: {},
      dietPlan: {},
      measurements: { weight: '70 kg', height: '175 cm' },
      progress: [],
      medicalNotes: newMemberNotes.trim() || 'None',
      history: 'Registered via Admin console.'
    };

    setMembers(prev => [newMember, ...prev]);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleEditMemberSubmit = (e) => {
    e.preventDefault();
    if (!memberToEdit.name.trim() || !memberToEdit.phone.trim()) return;

    setMembers(prev => prev.map(m => m.id === memberToEdit.id ? memberToEdit : m));
    setIsEditModalOpen(false);
    if (selectedMember && selectedMember.id === memberToEdit.id) {
      setSelectedMember(memberToEdit);
    }
  };

  const handleDeleteMember = (id) => {
    if (window.confirm('Are you sure you want to delete this member profile?')) {
      setMembers(prev => prev.filter(m => m.id !== id));
      if (selectedMember && selectedMember.id === id) {
        setSelectedMember(null);
      }
    }
  };

  const handleRenewMember = (member) => {
    const renewed = {
      ...member,
      status: 'Active',
      history: `${member.history || ''}\nRenewed plan on ${new Date().toLocaleDateString()}`
    };
    setMembers(prev => prev.map(m => m.id === member.id ? renewed : m));
    alert(`Membership for ${member.name} renewed successfully!`);
  };

  const resetForm = () => {
    setNewMemberName('');
    setNewMemberPhone('');
    setNewMemberPlan('Gold Pass');
    setNewMemberTrainer('None');
    setNewMemberStatus('Active');
    setNewMemberNotes('');
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="view-container">
      <header className="view-header">
        <div>
          <h2>Members Directory</h2>
          <p className="gym-tagline">Manage client profiles, checkout history, and plans</p>
        </div>
        <button className="primary-action-btn" onClick={() => setIsAddModalOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <PlusIcon size={15} color="currentColor" /> Add New Member
        </button>
      </header>

      {/* Filters & Search */}
      <section className="filters-bar">
        <input
          type="text"
          placeholder="Search by name or phone..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Expired">Expired</option>
        </select>
      </section>

      {/* Members Table */}
      <section className="table-card">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Phone</th>
              <th>Joined Date</th>
              <th>Membership</th>
              <th>Trainer</th>
              <th>Status</th>
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="table-member-cell" onClick={() => setSelectedMember(m)}>
                    <div className="avatar-circle small-circle">{m.avatar}</div>
                    <span className="member-name-link">{m.name}</span>
                  </div>
                </td>
                <td>{m.phone}</td>
                <td>{m.joinedDate}</td>
                <td>{m.plan}</td>
                <td>{m.trainer}</td>
                <td>
                  <span className={`status-tag ${m.status.toLowerCase()}`}>
                    {m.status}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="text-action-btn" onClick={() => setSelectedMember(m)}>View</button>
                    <button className="text-action-btn" onClick={() => {
                      setMemberToEdit({ ...m });
                      setIsEditModalOpen(true);
                    }}>Edit</button>
                    <button className="text-action-btn renew" onClick={() => handleRenewMember(m)}>Renew</button>
                    <button className="text-action-btn danger" onClick={() => handleDeleteMember(m.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>Add Member Profile</h3>
            <form onSubmit={handleAddMember} className="modal-form">
              <label>Full Name</label>
              <input type="text" placeholder="e.g. John Doe" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} required />
              
              <label>Mobile Number</label>
              <input type="tel" placeholder="e.g. 9876543210" value={newMemberPhone} onChange={(e) => setNewMemberPhone(e.target.value)} required />

              <label>Membership Plan</label>
              <select value={newMemberPlan} onChange={(e) => setNewMemberPlan(e.target.value)}>
                {plans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>

              <label>Assign Personal Trainer</label>
              <select value={newMemberTrainer} onChange={(e) => setNewMemberTrainer(e.target.value)}>
                <option value="None">None</option>
                {trainers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>

              <label>Account Status</label>
              <select value={newMemberStatus} onChange={(e) => setNewMemberStatus(e.target.value)}>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
              </select>

              <label>Medical Notes</label>
              <textarea placeholder="Any medical issues, operations, or notes..." value={newMemberNotes} onChange={(e) => setNewMemberNotes(e.target.value)} />

              <div className="modal-actions-buttons">
                <button type="button" className="cancel-btn" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {isEditModalOpen && memberToEdit && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>Edit Member Profile</h3>
            <form onSubmit={handleEditMemberSubmit} className="modal-form">
              <label>Full Name</label>
              <input type="text" value={memberToEdit.name} onChange={(e) => setMemberToEdit({ ...memberToEdit, name: e.target.value })} required />
              
              <label>Mobile Number</label>
              <input type="tel" value={memberToEdit.phone} onChange={(e) => setMemberToEdit({ ...memberToEdit, phone: e.target.value })} required />

              <label>Membership Plan</label>
              <select value={memberToEdit.plan} onChange={(e) => setMemberToEdit({ ...memberToEdit, plan: e.target.value })}>
                {plans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>

              <label>Assign Personal Trainer</label>
              <select value={memberToEdit.trainer} onChange={(e) => setMemberToEdit({ ...memberToEdit, trainer: e.target.value })}>
                <option value="None">None</option>
                {trainers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>

              <label>Account Status</label>
              <select value={memberToEdit.status} onChange={(e) => setMemberToEdit({ ...memberToEdit, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
              </select>

              <label>Medical Notes</label>
              <textarea value={memberToEdit.medicalNotes} onChange={(e) => setMemberToEdit({ ...memberToEdit, medicalNotes: e.target.value })} />

              <div className="modal-actions-buttons">
                <button type="button" className="cancel-btn" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Details Panel */}
      {selectedMember && (
        <div className="modal-backdrop">
          <div className="details-panel-box">
            <header className="details-panel-header">
              <div className="header-meta">
                <div className="avatar-circle large-circle">{selectedMember.avatar}</div>
                <div>
                  <h3>{selectedMember.name}</h3>
                  <p>{selectedMember.plan} · {selectedMember.phone}</p>
                </div>
              </div>
              <button className="close-panel-btn" onClick={() => setSelectedMember(null)}>✖</button>
            </header>

            <nav className="panel-tab-menu">
              {['profile', 'attendance', 'payments', 'workout', 'diet', 'progress'].map(t => (
                <button
                  key={t}
                  className={`panel-tab-btn ${detailTab === t ? 'active' : ''}`}
                  onClick={() => setDetailTab(t)}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </nav>

            <div className="panel-tab-content">
              {detailTab === 'profile' && (
                <div className="tab-profile-view">
                  <div className="profile-item"><strong>Joined Date:</strong> {selectedMember.joinedDate}</div>
                  <div className="profile-item"><strong>Personal Trainer:</strong> {selectedMember.trainer}</div>
                  <div className="profile-item"><strong>Status:</strong> {selectedMember.status}</div>
                  <div className="profile-item"><strong>Medical Notes:</strong> {selectedMember.medicalNotes || 'None'}</div>
                  <div className="profile-item"><strong>History Logs:</strong> {selectedMember.history || 'No logs.'}</div>
                </div>
              )}

              {detailTab === 'attendance' && (
                <div className="tab-attendance-view">
                  {selectedMember.attendance && selectedMember.attendance.length > 0 ? (
                    <table className="panel-table-data">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Check-in</th>
                          <th>Check-out</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMember.attendance.map((att, i) => (
                          <tr key={i}>
                            <td>{att.date}</td>
                            <td>{att.checkIn}</td>
                            <td>{att.checkOut}</td>
                            <td><span className="status-tag active">{att.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-data-alert">No attendance records for this member yet.</p>
                  )}
                </div>
              )}

              {detailTab === 'payments' && (
                <div className="tab-payments-view">
                  {selectedMember.payments && selectedMember.payments.length > 0 ? (
                    <table className="panel-table-data">
                      <thead>
                        <tr>
                          <th>Tx ID</th>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMember.payments.map((p, i) => (
                          <tr key={i}>
                            <td>{p.id}</td>
                            <td>{p.date}</td>
                            <td>{p.amount}</td>
                            <td>{p.method}</td>
                            <td><span className="status-tag active">{p.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-data-alert">No payment records found.</p>
                  )}
                </div>
              )}

              {detailTab === 'workout' && (
                <div className="tab-workout-view">
                  {selectedMember.workoutPlan && Object.keys(selectedMember.workoutPlan).length > 0 ? (
                    <div className="workout-plan-container">
                      {Object.entries(selectedMember.workoutPlan).map(([day, ex]) => (
                        <div key={day} className="workout-day-block">
                          <strong>🏋️‍♂️ {day}:</strong> <span>{ex || 'Rest Day'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data-alert">No workout plan assigned. Go to Workout module to assign.</p>
                  )}
                </div>
              )}

              {detailTab === 'diet' && (
                <div className="tab-diet-view">
                  {selectedMember.dietPlan && Object.keys(selectedMember.dietPlan).length > 0 ? (
                    <div className="diet-plan-container">
                      {Object.entries(selectedMember.dietPlan).map(([meal, desc]) => (
                        <div key={meal} className="diet-meal-block">
                          <strong>🥗 {meal}:</strong> <span>{desc}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data-alert">No diet plan assigned. Go to Diet module to assign.</p>
                  )}
                </div>
              )}

              {detailTab === 'progress' && (
                <div className="tab-progress-view">
                  <div className="measurements-grid">
                    <div className="measure-card">
                      <span className="measure-name">Weight</span>
                      <strong className="measure-val">{selectedMember.measurements?.weight || 'N/A'}</strong>
                    </div>
                    <div className="measure-card">
                      <span className="measure-name">Height</span>
                      <strong className="measure-val">{selectedMember.measurements?.height || 'N/A'}</strong>
                    </div>
                    <div className="measure-card">
                      <span className="measure-name">Chest Size</span>
                      <strong className="measure-val">{selectedMember.measurements?.chest || 'N/A'}</strong>
                    </div>
                    <div className="measure-card">
                      <span className="measure-name">Biceps</span>
                      <strong className="measure-val">{selectedMember.measurements?.biceps || 'N/A'}</strong>
                    </div>
                  </div>
                  {selectedMember.progress && selectedMember.progress.length > 0 && (
                    <div className="progress-history-log">
                      <h4>Weight History</h4>
                      {selectedMember.progress.map((pr, i) => (
                        <div key={i} className="progress-log-item">
                          <span>{pr.date}:</span> <strong>{pr.weight}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
