import { useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';

export default function NotificationsView({ notifications, setNotifications, members, trainers }) {
  const [notiTitle, setNotiTitle] = useState('');
  const [notiMessage, setNotiMessage] = useState('');
  const [notiTarget, setNotiTarget] = useState('All Members');
  const [notiType, setNotiType] = useState('Push Notification');

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notiTitle.trim() || !notiMessage.trim()) return;

    try {
      let targetRole = 'all';
      if (notiTarget === 'All Members') targetRole = 'member';
      else if (notiTarget === 'All Trainers') targetRole = 'gym_owner';

      const token = localStorage.getItem('fitcore_token');
      const response = await fetch(API_ENDPOINTS.NOTIFICATIONS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: notiTitle.trim(),
          message: notiMessage.trim(),
          target: targetRole,
          type: notiType === 'Push Notification' ? 'push' : notiType === 'Email Alert' ? 'email' : 'sms'
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setNotifications(prev => [data.data, ...prev]);
        alert(`Notification dispatched successfully via ${notiType}!`);
        setNotiTitle('');
        setNotiMessage('');
      } else {
        alert(data.error || 'Failed to dispatch notification.');
      }
    } catch (err) {
      console.error('Error sending notification:', err);
      alert('Error connecting to notifications API.');
    }
  };

  return (
    <div className="adm-view-container">
      {/* View Header */}
      <div className="adm-view-header-bar">
        <div className="adm-view-title">
          <h1>Push Notifications & Broadcasting</h1>
          <p className="adm-view-subtitle">Send announcements, dispatch app push updates, and log broadcast logs</p>
        </div>
      </div>

      <div className="adm-grid-2" style={{ alignItems: 'start' }}>
        {/* Left Side: Broadcast Creator */}
        <div className="adm-card-panel">
          <h3 className="adm-card-title">Dispatch Broadcast Alert</h3>
          
          <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="adm-detail-lbl" style={{ fontSize: '12px', fontWeight: '700' }}>Target Audience</label>
              <select 
                className="adm-input-field" 
                value={notiTarget} 
                onChange={(e) => setNotiTarget(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="All Members">All Members</option>
                <option value="All Trainers">All Personal Trainers</option>
                {members.map(m => <option key={m.id} value={m.name}>Specific Member: {m.name}</option>)}
                {trainers.map(t => <option key={t.id} value={t.name}>Specific Trainer: {t.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="adm-detail-lbl" style={{ fontSize: '12px', fontWeight: '700' }}>Delivery Channel</label>
              <select 
                className="adm-input-field" 
                value={notiType} 
                onChange={(e) => setNotiType(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="Push Notification">Push App Notification</option>
                <option value="Email Alert">Email Broadcast</option>
                <option value="SMS Trigger">SMS Text Message</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="adm-detail-lbl" style={{ fontSize: '12px', fontWeight: '700' }}>Notification Title</label>
              <input 
                type="text" 
                className="adm-input-field"
                placeholder="e.g. FitCore Floor Sanitation Closure" 
                value={notiTitle} 
                onChange={(e) => setNotiTitle(e.target.value)} 
                required 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="adm-detail-lbl" style={{ fontSize: '12px', fontWeight: '700' }}>Message Content</label>
              <textarea 
                className="adm-input-field"
                placeholder="Write alert description here..." 
                rows="4"
                style={{ resize: 'none', fontFamily: 'inherit' }}
                value={notiMessage} 
                onChange={(e) => setNotiMessage(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="adm-btn primary" style={{ marginTop: '8px' }}>
              Send Announcement
            </button>
          </form>
        </div>

        {/* Right Side: Sent logs ledger */}
        <div className="adm-card-panel">
          <h3 className="adm-card-title">Announcements Log History</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '530px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--adm-text-sub)' }}>
                No broadcast history logs found.
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  style={{ 
                    padding: '16px', 
                    backgroundColor: 'var(--adm-bg-main)', 
                    borderRadius: '20px',
                    border: '1px solid var(--adm-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--adm-accent-dark)' }}>{n.title}</strong>
                    <span style={{ fontSize: '10px', color: 'var(--adm-text-sub)' }}>{n.date}</span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'var(--adm-text-sub)', lineHeight: 1.4, margin: 0 }}>{n.message}</p>
                  
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <span className="adm-badge approved" style={{ fontSize: '8px', padding: '2px 6px' }}>{n.type}</span>
                    <span className="adm-badge pending" style={{ fontSize: '8px', padding: '2px 6px' }}>{n.target}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
