import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import {
  StarIcon,
  UsersIcon,
  BuildingIcon,
  LocationPinIcon,
  BoltIcon,
  ShieldCheckIcon,
  FireIcon,
  CreditCardIcon,
  DumbbellIcon,
  BarChartIcon,
  RefreshIcon
} from '../common/Icons';

export default function NextGenGymHubView({ 
  gyms = [], 
  vendors = [], 
  members = [], 
  trainers = [], 
  classes = [], 
  plans = [],
  selectedGymId = 'all',
  setSelectedGymId,
  setTab,
  onRefresh,
  onInspectGym
}) {
  // Read logged-in user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('fitcore_user') || '{}');
  const roleLabels = {
    super_admin: 'SUPER ADMINISTRATOR',
    admin: 'ADMINISTRATOR',
    gym_owner: 'GYM OWNER',
  };
  const passRoleTitle = roleLabels[currentUser.role] || 'ADMINISTRATOR';
  const passHolderName = currentUser.name || 'FitCore Admin';
  const passId = `FC-${(currentUser.id || 'XXXXXX').slice(-6).toUpperCase()}`;
  const [chartPeriod, setChartPeriod] = useState('monthly');
  const [liveBpm, setLiveBpm] = useState(0);
  const [liveCalories, setLiveCalories] = useState(0);
  const [passFlipped, setPassFlipped] = useState(false);
  const [telemetry, setTelemetry] = useState(null);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);

  // Calculate dynamic SaaS subscription revenue from MongoDB packages
  const planPriceMap = {};
  plans.forEach(p => {
    planPriceMap[p.id] = Number(p.amount) || (p.id === 'starter' ? 14999 : (p.id === 'enterprise' ? 69999 : 34999));
  });

  const totalSaaSRevenue = gyms.reduce((acc, g) => {
    const planKey = (g.plan || 'pro').toLowerCase();
    const amount = planPriceMap[planKey] || 34999;
    return acc + amount;
  }, 0);

  // Fetch Live Telemetry from Backend API
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        setIsLoadingTelemetry(true);
        const res = await fetch(`${API_ENDPOINTS.ADMIN_HUB_TELEMETRY}?gymId=${selectedGymId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('fitcore_token')}`
          }
        });
        const json = await res.json();
        if (json.success && json.data) {
          setTelemetry(json.data);
          setLiveCalories(json.data.caloriesBurnedToday || 0);
          setLiveBpm(json.data.currentOccupancy > 0 ? 128 : 0);
        }
      } catch (err) {
        console.warn('Telemetry API offline, using live state.');
      } finally {
        setIsLoadingTelemetry(false);
      }
    };

    fetchTelemetry();
  }, [selectedGymId]);

  // Live heart-rate pulse simulation if gym is active
  useEffect(() => {
    if (members.length === 0) {
      setLiveBpm(0);
      setLiveCalories(0);
      return;
    }
    const bpmInterval = setInterval(() => {
      setLiveBpm((prev) => Math.floor(124 + Math.random() * 9));
      setLiveCalories((prev) => prev + Math.floor(1 + Math.random() * 3));
    }, 2400);
    return () => clearInterval(bpmInterval);
  }, [members.length]);

  // Filter calculations based on selected gym
  const filteredGyms = selectedGymId === 'all' 
    ? gyms 
    : gyms.filter(g => (g.id === selectedGymId || g._id === selectedGymId));

  const filteredMembers = selectedGymId === 'all' 
    ? members 
    : members.filter(m => (m.gymId === selectedGymId || m.gymId === selectedGymId));

  const totalGymsCount = gyms.length;
  const totalMembersCount = members.length;
  const activeMembersCount = filteredMembers.filter(m => m.status?.toLowerCase() === 'active').length;
  const pendingGyms = gyms.filter(g => g.status === 'pending').length;
  const pendingVendors = vendors.filter(v => v.status === 'pending').length;

  // Real-time capacity from API or live calculation
  const maxCapacity = telemetry?.maxCapacity ?? gyms.reduce((sum, g) => sum + (Number(g.capacity) || 0), 0);
  const currentOccupancy = telemetry?.currentOccupancy ?? 0;
  const occupancyPercentage = maxCapacity > 0 ? Math.round((currentOccupancy / maxCapacity) * 100) : 0;

  // Live Chart datasets from API
  const defaultChartDatasets = {
    weekly: [
      { label: 'Mon', val: 0, rev: '₹0' },
      { label: 'Tue', val: 0, rev: '₹0' },
      { label: 'Wed', val: 0, rev: '₹0' },
      { label: 'Thu', val: 0, rev: '₹0' },
      { label: 'Fri', val: 0, rev: '₹0' },
      { label: 'Sat', val: 0, rev: '₹0' },
      { label: 'Sun', val: 0, rev: '₹0' }
    ],
    monthly: [
      { label: 'Jan', val: 0, rev: '₹0' },
      { label: 'Feb', val: 0, rev: '₹0' },
      { label: 'Mar', val: 0, rev: '₹0' },
      { label: 'Apr', val: 0, rev: '₹0' },
      { label: 'May', val: 0, rev: '₹0' },
      { label: 'Jun', val: 0, rev: '₹0' }
    ],
    yearly: [
      { label: '2024', val: 0, rev: '₹0' },
      { label: '2025', val: 0, rev: '₹0' },
      { label: '2026', val: 0, rev: '₹0' }
    ]
  };

  const chartDatasets = telemetry?.chartDatasets || defaultChartDatasets;
  const activeChart = chartDatasets[chartPeriod] || chartDatasets.monthly;
  const maxVal = Math.max(...activeChart.map(d => d.val), 1);

  // Live real-time check-in stream from API
  const liveCheckIns = telemetry?.liveCheckIns || [];

  // Studio Schedule from API
  const studioSchedule = telemetry?.studioSchedule || [];

  return (
    <div className="nextgen-hub-container">
      {/* Dynamic Animated Background Multi-Layers */}
      <div className="animated-bg-layer">
        <div className="ambient-glow glow-1" />
        <div className="ambient-glow glow-2" />
        <div className="ambient-glow glow-3" />
        <div className="ambient-glow glow-4" />
        
        {/* Animated Moving Geometric Glass Rings */}
        <div className="floating-geo-ring ring-1" />
        <div className="floating-geo-ring ring-2" />
        <div className="floating-geo-ring ring-3" />

        {/* Animated Flowing SVG Waves */}
        <svg className="bg-flow-svg" viewBox="0 0 1440 600" fill="none" preserveAspectRatio="none">
          <path className="flow-path path-1" d="M0,160 C320,300, 420,60, 720,180 C1020,300, 1180,90, 1440,200" stroke="url(#grad1)" strokeWidth="2.5" strokeDasharray="8 8" />
          <path className="flow-path path-2" d="M0,280 C360,100, 600,400, 960,220 C1200,80, 1380,320, 1440,260" stroke="url(#grad2)" strokeWidth="1.8" />
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#818CF8" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#EC4899" stopOpacity="0.35" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating Dynamic Luminous Particles */}
        <div className="bg-particle p1" />
        <div className="bg-particle p2" />
        <div className="bg-particle p3" />
        <div className="bg-particle p4" />
        <div className="bg-particle p5" />
      </div>

      {/* Metric Cards Row - Glassmorphic Super Admin Business HUD */}
      <section className="hub-stats-row" style={{ marginTop: '4px' }}>
        {/* Metric 1: Franchise Gyms Network */}
        <div className="stat-card glass-card card-indigo" style={{ animationDelay: '0.05s' }} onClick={() => setTab('gyms')}>
          <div className="card-shine-beam" />
          <div className="stat-header">
            <span className="stat-icon-badge lime">
              <BuildingIcon size={18} color="#4f46e5" />
            </span>
            <span className="stat-pill success">{gyms.length > 0 ? `${gyms.length} Franchises` : '0 Franchises'}</span>
          </div>
          <div className="stat-body">
            <span className="stat-label">Franchise Gyms Network</span>
            <div className="stat-val-spark-row">
              <h2 className="stat-number">{gyms.length} <span className="stat-unit">Clubs</span></h2>
              {/* Mini Sparkline Graph */}
              <div className="mini-sparkline">
                <svg width="70" height="32" viewBox="0 0 70 32" fill="none">
                  <path d="M2 28 C 15 24, 25 15, 38 18 C 50 12, 58 6, 68 3" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M2 28 C 15 24, 25 15, 38 18 C 50 12, 58 6, 68 3 V 32 H 2 Z" fill="url(#sparkGrad)" opacity="0.18" />
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" />
                      <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <div className="stat-footer-text">
              <span>{pendingGyms > 0 ? `${pendingGyms} Pending Review` : 'All Franchises Active'}</span>
              <span className="stat-dot-live" />
            </div>
          </div>
        </div>

        {/* Metric 2: Total Active Athletes / Members Network */}
        <div className="stat-card glass-card card-cyan" style={{ animationDelay: '0.12s' }} onClick={() => setTab('members')}>
          <div className="card-shine-beam" />
          <div className="stat-header">
            <span className="stat-icon-badge cyan">
              <UsersIcon size={18} color="#06b6d4" />
            </span>
            <span className="stat-pill cyan-pill">{activeMembersCount} Active Passes</span>
          </div>
          <div className="stat-body">
            <span className="stat-label">Pan-India Athlete Base</span>
            <div className="stat-occupancy-row">
              <h2 className="stat-number">{filteredMembers.length} <span className="stat-unit">Athletes</span></h2>
              {/* Circular SVG Ring */}
              <div className="circular-progress-wrap">
                <svg className="progress-ring" width="48" height="48">
                  <circle className="progress-ring-bg" strokeWidth="4.5" cx="24" cy="24" r="19" />
                  <circle 
                    className="progress-ring-fill" 
                    strokeWidth="4.5" 
                    strokeDasharray="119" 
                    strokeDashoffset={119 - (119 * occupancyPercentage) / 100}
                    cx="24" 
                    cy="24" 
                    r="19" 
                  />
                </svg>
                <span className="ring-center-pct">{occupancyPercentage}%</span>
              </div>
            </div>
            <div className="stat-footer-text">
              <span>{maxCapacity > 0 ? `${currentOccupancy} / ${maxCapacity} Turnstile Spots Filled` : 'Turnstile Gates Online'}</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Platform Subscription Revenue */}
        <div className="stat-card glass-card card-rose" style={{ animationDelay: '0.19s', cursor: 'pointer' }} onClick={() => setTab('revenue')} title="Click to view detailed Franchise SaaS Revenue & Invoices">
          <div className="card-shine-beam" />
          <div className="stat-header">
            <span className="stat-icon-badge ember">
              <CreditCardIcon size={18} color="#f43f5e" />
            </span>
            <span className="stat-pill ember-pill">Franchise ARR / MRR</span>
          </div>
          <div className="stat-body">
            <span className="stat-label">Platform SaaS Revenue</span>
            <h2 className="stat-number">₹{totalSaaSRevenue.toLocaleString()} <span className="stat-unit">MRR</span></h2>
            <div className="stat-footer-text">
              <span>Automated Settlement · 100% Payout Rate</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Partner Stores & KYC Compliance */}
        <div className="stat-card glass-card card-amber" style={{ animationDelay: '0.26s' }} onClick={() => setTab('kyc')}>
          <div className="card-shine-beam" />
          <div className="stat-header">
            <span className="stat-icon-badge violet">
              <ShieldCheckIcon size={18} color="#8b5cf6" />
            </span>
            {pendingVendors > 0 || pendingGyms > 0 ? (
              <span className="stat-pill warning-pill">{pendingGyms + pendingVendors} Pending Verification</span>
            ) : (
              <span className="stat-pill success">{vendors.length > 0 ? '✓ All Verified' : '0 Pending'}</span>
            )}
          </div>
          <div className="stat-body">
            <span className="stat-label">KYC Compliance & Partner Stores</span>
            <h2 className="stat-number">{vendors.length} <span className="stat-unit">Stores</span></h2>
            <div className="stat-footer-text">
              <span>{vendors.length > 0 ? vendors.map(v => v.storeName).slice(0, 2).join(' · ') : 'No partner stores registered'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Bento Grid Layout */}
      <div className="hub-bento-grid">
        {/* Left Column: Franchise Radar & Interactive Bar Chart */}
        <div className="bento-col-left">
          {/* Franchise Quick Radar Cards */}
          <div className="bento-panel glass-card" style={{ animationDelay: '0.32s' }}>
            <div className="card-shine-beam" />
            <div className="panel-header">
              <div className="panel-title-wrap">
                <span className="panel-icon">
                  <BuildingIcon size={16} color="#4f46e5" />
                </span>
                <div>
                  <h3 className="panel-title">Franchise Clubs Network</h3>
                  <p className="panel-subtitle">Live status across registered Indian branches</p>
                </div>
              </div>
              <button className="panel-link-btn" onClick={() => setTab('gyms')}>Manage All →</button>
            </div>

            <div className="franchise-radar-grid">
              {gyms.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13.5px' }}>
                  No franchise clubs registered yet. Click <strong>"+ Onboard Franchise"</strong> in the top bar to add your first branch.
                </div>
              ) : (
                gyms.map((gym) => {
                  const gymId = gym.id || gym._id;
                  const gymMemberCount = members.filter(m => (m.gymId === gymId || m.gymId === gym.id || m.gymId === gym._id)).length;
                  const gymCap = Number(gym.capacity) || 100;
                  const capPct = Math.min(Math.round((gymMemberCount / gymCap) * 100), 100);
                  return (
                    <div 
                      key={gymId} 
                      className={`franchise-card glass-panel ${selectedGymId === gymId ? 'active-franchise' : ''}`}
                      onClick={() => {
                        setSelectedGymId(gymId);
                        if (onInspectGym) onInspectGym(gym);
                      }}
                      style={{ cursor: 'pointer' }}
                      title="Click to inspect full club details, owner & members"
                    >
                      <div className="franchise-top">
                        <div className="franchise-badge-icon">{(gym.name || 'FC').substring(0, 2).toUpperCase()}</div>
                        <span className={`status-tag ${gym.status || 'approved'}`}>
                          {gym.status === 'approved' ? '✓ Verified' : (gym.status || 'approved')}
                        </span>
                      </div>
                      <h4 className="franchise-name">{gym.name}</h4>
                      <p className="franchise-loc">
                        <LocationPinIcon size={12} color="#ef4444" /> {gym.address || gym.city || 'India'}
                      </p>
                      
                      {/* Mini Floor Capacity Bar */}
                      <div className="franchise-mini-cap">
                        <div className="cap-bar-track">
                          <div className="cap-bar-fill" style={{ width: `${capPct}%` }} />
                        </div>
                      </div>

                      <div className="franchise-bottom">
                        <span className="franchise-rating">
                          <StarIcon size={12} color="#f59e0b" /> {gym.rating || 5.0}
                        </span>
                        <span className="franchise-members">
                          <UsersIcon size={13} color="#4f46e5" /> {gymMemberCount} Members
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Revenue & Growth Neon Bar Chart */}
          <div className="bento-panel glass-card" style={{ animationDelay: '0.38s' }}>
            <div className="panel-header">
              <div className="panel-title-wrap">
                <span className="panel-icon">
                  <BarChartIcon size={16} color="#06b6d4" />
                </span>
                <div>
                  <h3 className="panel-title">Member Attendance & Revenue Flow</h3>
                  <p className="panel-subtitle">Real-time check-in and membership turnover</p>
                </div>
              </div>
              <div className="chart-period-tabs">
                <button 
                  className={`period-pill ${chartPeriod === 'weekly' ? 'active' : ''}`}
                  onClick={() => setChartPeriod('weekly')}
                >
                  Weekly
                </button>
                <button 
                  className={`period-pill ${chartPeriod === 'monthly' ? 'active' : ''}`}
                  onClick={() => setChartPeriod('monthly')}
                >
                  Monthly
                </button>
                <button 
                  className={`period-pill ${chartPeriod === 'yearly' ? 'active' : ''}`}
                  onClick={() => setChartPeriod('yearly')}
                >
                  Yearly
                </button>
              </div>
            </div>

            {/* Glowing Neon Chart Visualization */}
            <div className="neon-bar-chart-container">
              <div className="neon-chart-grid-lines">
                <div className="grid-line" />
                <div className="grid-line" />
                <div className="grid-line" />
              </div>
              <div className="neon-bars-wrap">
                {activeChart.map((item, idx) => {
                  const barHeight = maxVal > 0 ? (item.val / maxVal) * 100 : 0;
                  return (
                    <div key={idx} className="neon-bar-item">
                      <div className="bar-tooltip">
                        <span className="tip-val">{item.val} visits</span>
                        <span className="tip-rev">{item.rev}</span>
                      </div>
                      <div className="bar-track">
                        <div 
                          className="bar-glow-fill" 
                          style={{ height: `${barHeight}%` }}
                        />
                      </div>
                      <span className="bar-label">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Holographic Digital Pass, Live Classes & Ticker */}
        <div className="bento-col-right">
          {/* Holographic 3D Digital VIP Gym Pass */}
          <div className="bento-panel glass-card pass-panel" style={{ animationDelay: '0.44s' }}>
            <div className="panel-header">
              <div className="panel-title-wrap">
                <span className="panel-icon">
                  <CreditCardIcon size={16} color="#4f46e5" />
                </span>
                <h3 className="panel-title">FitCore Digital Turnstile Pass</h3>
              </div>
              <button className="flip-btn" onClick={() => setPassFlipped(!passFlipped)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <RefreshIcon size={12} color="currentColor" /> {passFlipped ? 'Show Front' : 'Show QR'}
              </button>
            </div>

            <div className={`holo-pass-card ${passFlipped ? 'flipped' : ''}`}>
              {/* Front Side */}
              <div className="pass-face pass-front">
                <div className="pass-chip-row">
                  <div className="holo-chip" />
                  <span className="pass-tier-badge">VIP PLATINUM PASS</span>
                </div>
                <div className="pass-qr-preview">
                  <div className="qr-box">
                    {/* Simulated SVG QR */}
                    <svg viewBox="0 0 100 100" width="60" height="60">
                      <rect width="100" height="100" fill="#090C14" rx="6" />
                      <rect x="10" y="10" width="25" height="25" fill="#38BDF8" />
                      <rect x="15" y="15" width="15" height="15" fill="#090C14" />
                      <rect x="65" y="10" width="25" height="25" fill="#38BDF8" />
                      <rect x="70" y="15" width="15" height="15" fill="#090C14" />
                      <rect x="10" y="65" width="25" height="25" fill="#38BDF8" />
                      <rect x="15" y="70" width="15" height="15" fill="#090C14" />
                      <rect x="42" y="42" width="16" height="16" fill="#4F46E5" />
                      <rect x="42" y="15" width="8" height="20" fill="#38BDF8" />
                      <rect x="15" y="42" width="20" height="8" fill="#38BDF8" />
                      <rect x="42" y="70" width="18" height="15" fill="#38BDF8" />
                      <rect x="70" y="45" width="15" height="40" fill="#38BDF8" />
                    </svg>
                  </div>
                  <div className="pass-info-meta">
                    <span className="pass-holder-title">{passRoleTitle}</span>
                    <h4 className="pass-holder-name">{passHolderName}</h4>
                    <p className="pass-uid">ID: {passId}</p>
                  </div>
                </div>
                <div className="pass-bottom-shine">
                  <span>Unlimited All-Nagpur Turnstile Access</span>
                  <span className="nfc-icon">NFC Sync</span>
                </div>
              </div>

              {/* Back Side */}
              <div className="pass-face pass-back">
                <div className="pass-back-content">
                  <span className="qr-large-title">SCAN AT ENTRANCE</span>
                  <div className="qr-large-box">
                    <svg viewBox="0 0 100 100" width="100" height="100">
                      <rect width="100" height="100" fill="#090C14" rx="8" />
                      <rect x="10" y="10" width="25" height="25" fill="#38BDF8" />
                      <rect x="15" y="15" width="15" height="15" fill="#090C14" />
                      <rect x="65" y="10" width="25" height="25" fill="#38BDF8" />
                      <rect x="70" y="15" width="15" height="15" fill="#090C14" />
                      <rect x="10" y="65" width="25" height="25" fill="#38BDF8" />
                      <rect x="15" y="70" width="15" height="15" fill="#090C14" />
                      <rect x="42" y="42" width="16" height="16" fill="#4F46E5" />
                    </svg>
                  </div>
                  <p className="pass-expiry">Valid Thru: DEC 2027 · Turnstile Gate 1/2/3</p>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Live Studio Classes */}
          <div className="bento-panel glass-card" style={{ animationDelay: '0.5s' }}>
            <div className="panel-header">
              <div className="panel-title-wrap">
                <span className="panel-icon">
                  <DumbbellIcon size={16} color="#4f46e5" />
                </span>
                <h3 className="panel-title">Today's Studio Schedule</h3>
              </div>
              <span className="panel-badge-live">{studioSchedule.length} Sessions</span>
            </div>

            <div className="live-classes-list">
              {studioSchedule.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  No scheduled studio sessions for today
                </div>
              ) : (
                studioSchedule.map((c, idx) => (
                  <div key={c.id || idx} className="class-strip glass-panel">
                    <div className="class-time-col">
                      <span className="class-time-txt">{c.time}</span>
                      <span className="class-badge-pill">{c.tag}</span>
                    </div>
                    <div className="class-mid-col">
                      <h5 className="class-title">{c.name}</h5>
                      <span className="class-trainer">{c.coach || `Coach: ${c.trainer}`}</span>
                      <div className="class-capacity-bar">
                        <div 
                          className="capacity-fill" 
                          style={{ width: `${(c.booked / (c.capacity || c.cap || 20)) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="class-booked-col">
                      <span className="booked-num">{c.booked}/{c.capacity || c.cap || 20}</span>
                      <span className="booked-lbl">Spots</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Real-time Turnstile Check-in Stream from Database */}
          <div className="bento-panel glass-card" style={{ animationDelay: '0.56s' }}>
            <div className="panel-header">
              <div className="panel-title-wrap">
                <span className="panel-icon">
                  <BoltIcon size={16} color="#06b6d4" />
                </span>
                <h3 className="panel-title">Live Turnstile Activity</h3>
              </div>
              <span className="stat-dot-live" />
            </div>

            <div className="ticker-list">
              {liveCheckIns.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  No real-time turnstile entries logged
                </div>
              ) : (
                liveCheckIns.map((item, idx) => (
                  <div key={item.id || idx} className="ticker-item">
                    <div className="ticker-avatar">{item.name.substring(0, 2).toUpperCase()}</div>
                    <div className="ticker-details">
                      <div className="ticker-top">
                        <strong>{item.name}</strong>
                        <span className="ticker-time">{item.time}</span>
                      </div>
                      <p className="ticker-meta">{item.type} · <em>{item.gym}</em></p>
                    </div>
                    <span className="ticker-badge">{item.badge}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
