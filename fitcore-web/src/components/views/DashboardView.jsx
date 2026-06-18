import React, { useState } from 'react';

export default function DashboardView({ members, trainers, plans, classes, notifications, gymConfig, setTab }) {
  const [chartPeriod, setChartPeriod] = useState('monthly');

  // Dynamic metrics calculation
  const totalMembers = 1250; // Hardcoded from spec, but can add members.length differences
  const todayAttendance = 320;
  const monthlyRevenue = '₹2,45,000';
  const expiringPlans = 18;
  const trainerCount = trainers.length;
  const pendingPayments = '₹35,000';

  // Chart data matching spec
  const chartData = {
    weekly: [
      { label: 'Mon', val: 240 },
      { label: 'Tue', val: 280 },
      { label: 'Wed', val: 320 },
      { label: 'Thu', val: 300 },
      { label: 'Fri', val: 310 },
      { label: 'Sat', val: 290 },
      { label: 'Sun', val: 180 }
    ],
    monthly: [
      { label: 'Jan', val: 750 },
      { label: 'Feb', val: 820 },
      { label: 'Mar', val: 980 },
      { label: 'Apr', val: 1100 },
      { label: 'May', val: 1200 },
      { label: 'Jun', val: 1250 }
    ],
    yearly: [
      { label: '2024', val: 650 },
      { label: '2025', val: 1100 },
      { label: '2026', val: 1250 }
    ]
  };

  const activeChart = chartData[chartPeriod];
  const maxVal = Math.max(...activeChart.map(d => d.val));

  return (
    <div className="view-container">
      {/* Header bar */}
      <header className="view-header">
        <div className="header-greeting">
          <h2>Good Morning, Ankit 👋</h2>
          <p className="gym-tagline">{gymConfig.name} · {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </header>

      {/* Grid status cards */}
      <section className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-details">
            <span className="metric-label">Total Members</span>
            <h3 className="metric-value">{totalMembers}</h3>
            <span className="metric-trend success">+25 this week</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📅</div>
          <div className="metric-details">
            <span className="metric-label">Today's Attendance</span>
            <h3 className="metric-value">{todayAttendance}</h3>
            <span className="metric-trend">Active check-ins</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-details">
            <span className="metric-label">Revenue (This Month)</span>
            <h3 className="metric-value">{monthlyRevenue}</h3>
            <span className="metric-trend success">+12% vs last month</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⚠️</div>
          <div className="metric-details">
            <span className="metric-label">Membership Expiring</span>
            <h3 className="metric-value">{expiringPlans}</h3>
            <span className="metric-trend danger">Requires renewal</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🏋️‍♂️</div>
          <div className="metric-details">
            <span className="metric-label">Active Trainers</span>
            <h3 className="metric-value">{trainerCount}</h3>
            <span className="metric-trend">On duty today</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💳</div>
          <div className="metric-details">
            <span className="metric-label">Pending Payments</span>
            <h3 className="metric-value">{pendingPayments}</h3>
            <span className="metric-trend danger">Overdue reminders</span>
          </div>
        </div>
      </section>

      {/* Main dashboard splits */}
      <div className="dashboard-content-split">
        {/* Left Column: Quick Actions & Charts */}
        <div className="content-left-col">
          {/* Quick Actions */}
          <div className="content-card quick-actions-card">
            <h4>Quick Actions</h4>
            <div className="actions-grid">
              <button className="action-btn" onClick={() => setTab('members')}>
                <span className="btn-icon">➕</span> Add Member
              </button>
              <button className="action-btn" onClick={() => setTab('trainers')}>
                <span className="btn-icon">➕</span> Add Trainer
              </button>
              <button className="action-btn" onClick={() => setTab('plans')}>
                <span className="btn-icon">💳</span> Create Plan
              </button>
              <button className="action-btn" onClick={() => setTab('notifications')}>
                <span className="btn-icon">📢</span> Send Notification
              </button>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="content-card chart-card">
            <div className="chart-card-header">
              <h4>Revenue & Member Chart</h4>
              <div className="chart-toggles">
                <button className={`chart-toggle-btn ${chartPeriod === 'weekly' ? 'active' : ''}`} onClick={() => setChartPeriod('weekly')}>Weekly</button>
                <button className={`chart-toggle-btn ${chartPeriod === 'monthly' ? 'active' : ''}`} onClick={() => setChartPeriod('monthly')}>Monthly</button>
                <button className={`chart-toggle-btn ${chartPeriod === 'yearly' ? 'active' : ''}`} onClick={() => setChartPeriod('yearly')}>Yearly</button>
              </div>
            </div>

            {/* Custom SVG/HTML Bar Chart */}
            <div className="dashboard-bar-chart">
              <div className="bar-chart-track-container">
                {activeChart.map((d, index) => {
                  const barHeight = maxVal > 0 ? (d.val / maxVal) * 100 : 0;
                  return (
                    <div key={index} className="bar-chart-column">
                      <span className="bar-value-label">{d.val}</span>
                      <div className="bar-column-track">
                        <div className="bar-column-fill" style={{ height: `${barHeight}%` }} />
                      </div>
                      <span className="bar-axis-label">{d.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Activities, Classes, Announcements */}
        <div className="content-right-col">
          {/* Recent Member Activity */}
          <div className="content-card activities-card">
            <h4>Recent Member Activity</h4>
            <div className="activities-list">
              <div className="activity-item">
                <span className="activity-dot check-in" />
                <div className="activity-details">
                  <strong>Ankit Kumar</strong> Checked In
                </div>
                <span className="activity-time">8:20 AM</span>
              </div>
              <div className="activity-item">
                <span className="activity-dot renewal" />
                <div className="activity-details">
                  <strong>Rahul Sharma</strong> Membership Renewed
                </div>
                <span className="activity-time">Yesterday</span>
              </div>
              <div className="activity-item">
                <span className="activity-dot signup" />
                <div className="activity-details">
                  <strong>Neha Singh</strong> Joined Today
                </div>
                <span className="activity-time">Just Now</span>
              </div>
            </div>
          </div>

          {/* Upcoming Classes */}
          <div className="content-card classes-card">
            <h4>Upcoming Classes</h4>
            <div className="upcoming-classes-list">
              {classes.slice(0, 2).map((c) => (
                <div key={c.id} className="upcoming-class-item">
                  <div className="class-time-block">
                    <span className="class-time">{c.time}</span>
                    <span className="class-period">{c.period}</span>
                  </div>
                  <div className="class-meta">
                    <strong>{c.name}</strong>
                    <span>with {c.trainer}</span>
                  </div>
                  <div className="class-seats">
                    <span>{c.booked}/{c.capacity}</span>
                    <span className="seats-label">Booked</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements */}
          <div className="content-card announcements-card">
            <h4>Announcements</h4>
            <div className="announcement-item">
              <h5>📢 Extended Weekend Timings</h5>
              <p>Starting next Sunday, the gym will be open until 10 PM. Clean-up begins at 9:45 PM.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
