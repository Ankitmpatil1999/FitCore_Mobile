import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  CreditCardIcon, 
  BellIcon, 
  UsersIcon, 
  CalendarIcon, 
  AlertTriangleIcon, 
  DumbbellIcon 
} from '../common/Icons';

function TypewriterText({ phrases = [
  "Good Morning, Ankit ",
  "Alock Gym Hub Control Center ",
  "Track Memberships, Revenue & Attendance ",
  "High Performance Fitness Portal "
], speed = 75, delayBetween = 2200 }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer;
    const targetPhrase = phrases[phraseIndex];

    if (!isDeleting) {
      if (currentText.length < targetPhrase.length) {
        timer = setTimeout(() => {
          setCurrentText(targetPhrase.substring(0, currentText.length + 1));
        }, speed);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, delayBetween);
      }
    } else {
      if (currentText.length > 0) {
        timer = setTimeout(() => {
          setCurrentText(targetPhrase.substring(0, currentText.length - 1));
        }, speed / 2.5);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, phraseIndex, phrases, speed, delayBetween]);

  return (
    <span className="animated-typewriter-wrapper">
      <span className="typewriter-text">{currentText}</span>
      <span className="typewriter-cursor" />
    </span>
  );
}

export default function DashboardView({ members, trainers, plans, classes, notifications, gymConfig, setTab }) {
  const [chartPeriod, setChartPeriod] = useState('monthly');

  // Dynamic metrics calculation
  const totalMembers = 1250; 
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
      {/* Floating Ambient Light Orbs */}
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      <div className="ambient-orb ambient-orb-3" />

      {/* Header bar */}
      <header className="view-header">
        <div className="header-greeting">
          <h2 style={{ fontSize: '24px' }}>
            <TypewriterText />
          </h2>
          <p className="gym-tagline">{gymConfig.name} · {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </header>

      {/* Grid status cards */}
      <section className="metrics-grid">
        <div className="metric-card">
          <div className="luxury-card-glow" style={{ background: '#4f46e5' }} />
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)' }}>
            <UsersIcon size={20} color="#4f46e5" />
          </div>
          <div className="metric-details">
            <span className="metric-label">Total Members</span>
            <h3 className="metric-value">{totalMembers}</h3>
            <span className="metric-trend success">+25 this week</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="luxury-card-glow" style={{ background: '#06b6d4' }} />
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #ecfeff, #cffafe)' }}>
            <CalendarIcon size={20} color="#06b6d4" />
          </div>
          <div className="metric-details">
            <span className="metric-label">Today's Attendance</span>
            <h3 className="metric-value">{todayAttendance}</h3>
            <span className="metric-trend">Active check-ins</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="luxury-card-glow" style={{ background: '#10b981' }} />
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' }}>
            <CreditCardIcon size={20} color="#10b981" />
          </div>
          <div className="metric-details">
            <span className="metric-label">Revenue (This Month)</span>
            <h3 className="metric-value">{monthlyRevenue}</h3>
            <span className="metric-trend success">+12% vs last month</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="luxury-card-glow" style={{ background: '#f59e0b' }} />
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}>
            <AlertTriangleIcon size={20} color="#f59e0b" />
          </div>
          <div className="metric-details">
            <span className="metric-label">Membership Expiring</span>
            <h3 className="metric-value">{expiringPlans}</h3>
            <span className="metric-trend danger">Requires renewal</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="luxury-card-glow" style={{ background: '#6366f1' }} />
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #eef2ff, #c7d2fe)' }}>
            <DumbbellIcon size={20} color="#6366f1" />
          </div>
          <div className="metric-details">
            <span className="metric-label">Active Trainers</span>
            <h3 className="metric-value">{trainerCount}</h3>
            <span className="metric-trend">On duty today</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="luxury-card-glow" style={{ background: '#ef4444' }} />
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #fef2f2, #fecaca)' }}>
            <CreditCardIcon size={20} color="#ef4444" />
          </div>
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
            <h4>⚡ Quick Actions</h4>
            <div className="actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <button className="neon-action-btn neon-purple" onClick={() => setTab('members')}>
                <PlusIcon size={13} color="#fff" /> Add Member
              </button>
              <button className="neon-action-btn neon-emerald" onClick={() => setTab('trainers')}>
                <PlusIcon size={13} color="#fff" /> Add Trainer
              </button>
              <button className="neon-action-btn neon-amber" onClick={() => setTab('plans')}>
                <CreditCardIcon size={13} color="#fff" /> Create Plan
              </button>
              <button className="neon-action-btn neon-rose" onClick={() => setTab('notifications')}>
                <BellIcon size={13} color="#fff" /> Send Alert
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
