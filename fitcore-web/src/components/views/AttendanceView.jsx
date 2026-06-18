import React, { useState } from 'react';

export default function AttendanceView({ members, setMembers }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Collect today's logs (matching date 2026-06-17)
  const todayStr = '2026-06-17';
  
  const todayAttendanceLogs = [];
  members.forEach(m => {
    const todayLog = m.attendance?.find(a => a.date === todayStr);
    if (todayLog) {
      todayAttendanceLogs.push({
        memberId: m.id,
        name: m.name,
        avatar: m.avatar,
        phone: m.phone,
        checkIn: todayLog.checkIn,
        checkOut: todayLog.checkOut || 'Active',
        status: todayLog.status
      });
    }
  });

  const presentCount = todayAttendanceLogs.length;
  const absentCount = members.length - presentCount;
  const lateCount = todayAttendanceLogs.filter(a => a.checkIn > '09:00 AM').length;

  const handleManualCheckIn = (memberId) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const hasLog = member.attendance?.some(a => a.date === todayStr);
    if (hasLog) {
      alert(`${member.name} is already checked in today!`);
      return;
    }

    const newLog = {
      date: todayStr,
      checkIn: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      checkOut: '',
      status: 'Present'
    };

    const updated = {
      ...member,
      attendance: [newLog, ...(member.attendance || [])]
    };

    setMembers(prev => prev.map(m => m.id === memberId ? updated : m));
    alert(`${member.name} checked in successfully!`);
  };

  const handleManualCheckOut = (memberId) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const todayLogIdx = member.attendance?.findIndex(a => a.date === todayStr);
    if (todayLogIdx === -1) return;

    const updatedAttendance = [...member.attendance];
    updatedAttendance[todayLogIdx] = {
      ...updatedAttendance[todayLogIdx],
      checkOut: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };

    const updated = {
      ...member,
      attendance: updatedAttendance
    };

    setMembers(prev => prev.map(m => m.id === memberId ? updated : m));
    alert(`${member.name} checked out successfully!`);
  };

  const filteredLogs = todayAttendanceLogs.filter(log =>
    log.name.toLowerCase().includes(searchTerm.toLowerCase()) || log.phone.includes(searchTerm)
  );

  return (
    <div className="view-container">
      <header className="view-header">
        <div>
          <h2>Gym Attendance Console</h2>
          <p className="gym-tagline">Track live client entries, exit times, and absentees</p>
        </div>
      </header>

      {/* Attendance Stats Cards */}
      <section className="metrics-grid">
        <div className="metric-card bg-success-light">
          <div className="metric-details">
            <span className="metric-label">Present Today</span>
            <h3 className="metric-value">{presentCount} Members</h3>
          </div>
        </div>
        <div className="metric-card bg-danger-light">
          <div className="metric-details">
            <span className="metric-label">Absent Members</span>
            <h3 className="metric-value">{absentCount} Members</h3>
          </div>
        </div>
        <div className="metric-card bg-warning-light">
          <div className="metric-details">
            <span className="metric-label">Late Arrivals (Post 9 AM)</span>
            <h3 className="metric-value">{lateCount} Members</h3>
          </div>
        </div>
      </section>

      {/* Manual Check-in Override Panel */}
      <div className="attendance-split-layout">
        {/* Left Side: Live Check-Ins Table */}
        <div className="attendance-left-pane">
          <div className="content-card">
            <div className="pane-header-row">
              <h4>Today's Entry Registry ({todayStr})</h4>
              <input
                type="text"
                placeholder="Search log..."
                className="search-input compact-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <table className="dashboard-table attendance-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.memberId}>
                      <td>
                        <div className="table-member-cell">
                          <div className="avatar-circle small-circle">{log.avatar}</div>
                          <span>{log.name}</span>
                        </div>
                      </td>
                      <td>{log.checkIn}</td>
                      <td>{log.checkOut}</td>
                      <td><span className="status-tag active">{log.status}</span></td>
                      <td>
                        {log.checkOut === 'Active' ? (
                          <button className="text-action-btn danger" onClick={() => handleManualCheckOut(log.memberId)}>Check-Out</button>
                        ) : (
                          <span className="text-muted">Cleared</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">No active entries matching search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Manual Check-In Trigger Console */}
        <div className="attendance-right-pane">
          <div className="content-card">
            <h4>Quick Desk Check-In</h4>
            <p className="description-text">Type member name below to manually log their check-in time.</p>
            <div className="quick-checkin-member-list">
              {members.map(m => {
                const checkedInToday = m.attendance?.some(a => a.date === todayStr);
                return (
                  <div key={m.id} className="checkin-trigger-row">
                    <span>{m.name} ({m.phone})</span>
                    {checkedInToday ? (
                      <span className="checked-in-check">✓ Checked In</span>
                    ) : (
                      <button className="compact-action-btn" onClick={() => handleManualCheckIn(m.id)}>
                        🔑 Log Entry
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
