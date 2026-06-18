import React, { useState } from 'react';

export default function ClassesView({ classes, setClasses, trainers }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [className, setClassName] = useState('');
  const [classTime, setClassTime] = useState('');
  const [classPeriod, setClassPeriod] = useState('AM');
  const [classTrainer, setClassTrainer] = useState('None');
  const [classRoom, setClassRoom] = useState('Gym Floor A');
  const [classCapacity, setClassCapacity] = useState('20');

  const handleAddClass = (e) => {
    e.preventDefault();
    if (!className.trim() || !classTime.trim()) return;

    const newClass = {
      id: `c_${Date.now()}`,
      name: className.trim(),
      time: classTime.trim(),
      period: classPeriod,
      trainer: classTrainer,
      room: classRoom,
      booked: 0,
      capacity: parseInt(classCapacity) || 20
    };

    setClasses(prev => [...prev, newClass]);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setClassName('');
    setClassTime('');
    setClassPeriod('AM');
    setClassTrainer('None');
    setClassRoom('Gym Floor A');
    setClassCapacity('20');
  };

  const handleDeleteClass = (id) => {
    if (window.confirm('Are you sure you want to cancel this class?')) {
      setClasses(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div className="view-container">
      <header className="view-header">
        <div>
          <h2>Gym Classes Schedule</h2>
          <p className="gym-tagline">Coordinate group workouts, timeslots, and room capacities</p>
        </div>
        <button className="primary-action-btn" onClick={() => setIsModalOpen(true)}>
          📚 Create New Class
        </button>
      </header>

      <section className="table-card">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Class Name</th>
              <th>Timings</th>
              <th>Trainer Assigned</th>
              <th>Location Room</th>
              <th>Booked / Capacity</th>
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.name}</strong>
                </td>
                <td>
                  <span className="text-primary-accent">{c.time} {c.period}</span>
                </td>
                <td>{c.trainer}</td>
                <td>{c.room}</td>
                <td>
                  <strong>{c.booked}</strong> / {c.capacity} Booked
                  <div className="progress-bar-bg" style={{ width: '80px', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', marginTop: '4px' }}>
                    <div className="progress-bar-fill" style={{ width: `${(c.booked / c.capacity) * 100}%`, height: '100%', backgroundColor: '#2563eb', borderRadius: '2px' }} />
                  </div>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="text-action-btn danger" onClick={() => handleDeleteClass(c.id)}>Cancel Class</button>
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
            <h3>Schedule Gym Class</h3>
            <form onSubmit={handleAddClass} className="modal-form">
              <label>Class Name</label>
              <input type="text" placeholder="e.g. Morning Spin Session" value={className} onChange={(e) => setClassName(e.target.value)} required />

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 2 }}>
                  <label>Start Time</label>
                  <input type="text" placeholder="e.g. 09:30" value={classTime} onChange={(e) => setClassTime(e.target.value)} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Period</label>
                  <select value={classPeriod} onChange={(e) => setClassPeriod(e.target.value)} style={{ marginTop: '28px' }}>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              <label>Assign Trainer</label>
              <select value={classTrainer} onChange={(e) => setClassTrainer(e.target.value)}>
                <option value="None">None</option>
                {trainers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>

              <label>Room / Studio Location</label>
              <input type="text" placeholder="e.g. Studio Room B" value={classRoom} onChange={(e) => setClassRoom(e.target.value)} />

              <label>Room Max Capacity</label>
              <input type="number" placeholder="20" value={classCapacity} onChange={(e) => setClassCapacity(e.target.value)} />

              <div className="modal-actions-buttons">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Schedule Class</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
