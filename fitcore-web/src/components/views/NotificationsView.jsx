import React, { useState } from 'react';

export default function NotificationsView({ notifications, setNotifications, members, trainers }) {
  const [notiTitle, setNotiTitle] = useState('');
  const [notiMessage, setNotiMessage] = useState('');
  const [notiTarget, setNotiTarget] = useState('All Members');
  const [notiType, setNotiType] = useState('Push Notification');

  const handleSendNotification = (e) => {
    e.preventDefault();
    if (!notiTitle.trim() || !notiMessage.trim()) return;

    const newNoti = {
      id: `n_${Date.now()}`,
      title: notiTitle.trim(),
      message: notiMessage.trim(),
      target: notiTarget,
      type: notiType,
      date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
    };

    setNotifications(prev => [newNoti, ...prev]);
    alert(`Notification dispatched successfully via ${notiType}!`);
    setNotiTitle('');
    setNotiMessage('');
  };

  return (
    <div className="view-container">
      <header className="view-header">
        <div>
          <h2>Push Notifications & Broadcasting</h2>
          <p className="gym-tagline">Send announcements, SMS triggers, and emails to your clients and coaches</p>
        </div>
      </header>

      <div className="attendance-split-layout">
        {/* Left Side: Broadcast Creator */}
        <div className="attendance-left-pane">
          <div className="content-card">
            <h4>Dispatch Broadcast Alert</h4>
            <form onSubmit={handleSendNotification} className="modal-form">
              <label>Target Audience</label>
              <select value={notiTarget} onChange={(e) => setNotiTarget(e.target.value)}>
                <option value="All Members">All Members</option>
                <option value="All Trainers">All Personal Trainers</option>
                {members.map(m => <option key={m.id} value={m.name}>Specific Member: {m.name}</option>)}
                {trainers.map(t => <option key={t.id} value={t.name}>Specific Trainer: {t.name}</option>)}
              </select>

              <label>Delivery Channel</label>
              <select value={notiType} onChange={(e) => setNotiType(e.target.value)}>
                <option value="Push Notification">Push App Notification 📱</option>
                <option value="Email Alert">Email Broadcast 📧</option>
                <option value="SMS Trigger">SMS text Message 💬</option>
              </select>

              <label>Notification Title</label>
              <input type="text" placeholder="e.g. FitCore Floor Sanitation Closure" value={notiTitle} onChange={(e) => setNotiTitle(e.target.value)} required />

              <label>Message Content</label>
              <textarea placeholder="Write alert description here..." style={{ height: '100px' }} value={notiMessage} onChange={(e) => setNotiMessage(e.target.value)} required />

              <button type="submit" className="submit-btn" style={{ marginTop: 16 }}>
                🚀 Send Announcement
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Sent logs ledger */}
        <div className="attendance-right-pane">
          <div className="content-card">
            <h4>Announcements Log History</h4>
            <div className="activities-list">
              {notifications.map(n => (
                <div key={n.id} className="activity-item" style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)', display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong>{n.title}</strong>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{n.date}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '16px' }}>{n.message}</p>
                  <div style={{ marginTop: '6px' }}>
                    <span className="status-tag active" style={{ fontSize: '8px', padding: '2px 6px' }}>{n.type}</span>
                    <span className="status-tag pending" style={{ fontSize: '8px', padding: '2px 6px', marginLeft: '6px' }}>{n.target}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
