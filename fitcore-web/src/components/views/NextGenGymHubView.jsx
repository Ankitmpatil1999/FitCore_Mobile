import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import {
  StarIcon,
  UsersIcon,
  BuildingIcon,
  LocationPinIcon,
  BoltIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  DumbbellIcon,
  BarChartIcon,
  RefreshIcon,
  CloseIcon,
  SearchIcon,
  FireIcon,
  CalendarIcon,
  TrendingUpIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  ClockIcon,
  CheckCircleIcon,
  SparklesIcon
} from '../common/Icons';

export default function NextGenGymHubView({ 
  gyms = [], 
  vendors = [], 
  members = [], 
  plans = [],
  selectedGymId = 'all',
  setSelectedGymId,
  setTab,
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
  const [passFlipped, setPassFlipped] = useState(false);
  const [telemetry, setTelemetry] = useState(null);
  const [showAllTurnstile, setShowAllTurnstile] = useState(false);
  const [showAllGymsWidget, setShowAllGymsWidget] = useState(false);
  const [showTurnstileModal, setShowTurnstileModal] = useState(false);
  const [turnstileSearch, setTurnstileSearch] = useState('');
  const [turnstileFilterGym, setTurnstileFilterGym] = useState('all');
  const [turnstileFilterStatus, setTurnstileFilterStatus] = useState('all');
  
  // Hierarchical Drilldown states: Gym -> Member -> Calendar & Attendance Analytics
  const [drillViewMode, setDrillViewMode] = useState('hierarchy'); // 'hierarchy' | 'stream'
  const [selectedDrillGym, setSelectedDrillGym] = useState(null);
  const [selectedDrillMember, setSelectedDrillMember] = useState(null);
  const [memberStatsPeriod, setMemberStatsPeriod] = useState('monthly'); // 'weekly' | 'monthly' | 'yearly'
  
  // Table View & Pagination States (handles 1 to 400+ members effortlessly)
  const [gymTableSearch, setGymTableSearch] = useState('');
  const [memberTableSearch, setMemberTableSearch] = useState('');
  const [memberTableFilterStatus, setMemberTableFilterStatus] = useState('all'); // 'all' | 'in_gym' | 'checked_out'
  const [memberTablePage, setMemberTablePage] = useState(1);
  const [memberTablePageSize, setMemberTablePageSize] = useState(25);

  // Calendar View States for Member Attendance Drilldown
  const [calMonth, setCalMonth] = useState(8); // September (0-indexed)
  const [calYear, setCalYear] = useState(2026);
  const [selectedCalDate, setSelectedCalDate] = useState('2026-09-10');
  const [hoveredCalDate, setHoveredCalDate] = useState(null);
  const [showRawLogsAccordion, setShowRawLogsAccordion] = useState(false);

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
    let isMounted = true;
    const fetchTelemetry = async () => {
      try {
        const res = await fetch(`${API_ENDPOINTS.ADMIN_HUB_TELEMETRY}?gymId=${selectedGymId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('fitcore_token')}`
          }
        });
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setTelemetry(json.data);
        }
      } catch (err) {
        console.warn('Telemetry API offline, using live database state:', err);
      }
    };

    fetchTelemetry();
    return () => { isMounted = false; };
  }, [selectedGymId]);

  const filteredMembers = selectedGymId === 'all' 
    ? members 
    : members.filter(m => (m.gymId === selectedGymId || m.gymId === selectedGymId));

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

          {/* Real-time Franchise Gyms Network Stream from API */}
          {(() => {
            const displayedGyms = showAllGymsWidget ? gyms : gyms.slice(0, 5);

            return (
              <div className="bento-panel glass-card" style={{ animationDelay: '0.56s' }}>
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="panel-title-wrap">
                    <span className="panel-icon">
                      <BuildingIcon size={16} color="#06b6d4" />
                    </span>
                    <h3 className="panel-title">Franchise Gyms Network</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="panel-badge-live" style={{ fontSize: '11px', padding: '3px 8px' }}>
                      {gyms.length} Total Gyms
                    </span>
                    <span className="stat-dot-live" />
                  </div>
                </div>

                <div className="ticker-list">
                  {gyms.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                      No franchise gyms registered in the database yet.
                    </div>
                  ) : (
                    displayedGyms.map((gym, idx) => {
                      const gymId = gym._id ? gym._id.toString() : (gym.id || String(idx));
                      const gymLogs = liveCheckIns.filter(l => l.gym === gym.name || String(l.gymId) === String(gym._id || gym.id));
                      const activeInside = gymLogs.filter(l => l.badge?.includes('IN GYM') || l.status === 'in_gym').length;
                      const gymMembers = members.filter(m => String(m.gymId) === String(gym._id || gym.id) || m.gymName === gym.name);

                      return (
                        <div 
                          key={gymId} 
                          className="ticker-item" 
                          style={{ cursor: 'pointer' }} 
                          onClick={() => {
                            setSelectedDrillGym(gym);
                            setSelectedDrillMember(null);
                            setShowTurnstileModal(true);
                          }} 
                          title="Click to inspect this Gym's turnstiles and athletes"
                        >
                          <div className="ticker-avatar" style={{ background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', color: '#ffffff' }}>
                            {(gym.name || 'FC').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="ticker-details">
                            <div className="ticker-top">
                              <strong>{gym.name}</strong>
                              <span className="ticker-time" style={{ color: '#059669', fontWeight: '700' }}>
                                {activeInside > 0 ? `● ${activeInside} In Gym` : `${gymMembers.length} Members`}
                              </span>
                            </div>
                            <p className="ticker-meta">
                              {gym.city || gym.address || 'India'} · <em>Plan: {(gym.plan || 'PRO').toUpperCase()}</em>
                            </p>
                          </div>
                          <span className="ticker-badge" style={{
                            background: gym.status === 'approved' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: gym.status === 'approved' ? '#10b981' : '#d97706',
                            borderColor: gym.status === 'approved' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'
                          }}>
                            {gym.status === 'approved' ? 'ACTIVE' : (gym.status || 'ACTIVE').toUpperCase()}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Interactive Show More / Less & Full Page Navigation Footer */}
                <div style={{ 
                  marginTop: '12px', 
                  paddingTop: '12px', 
                  borderTop: '1px solid rgba(226, 232, 240, 0.7)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {gyms.length > 5 ? (
                    <button 
                      type="button" 
                      onClick={() => setShowAllGymsWidget(!showAllGymsWidget)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#4f46e5',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      {showAllGymsWidget ? '▲ Show Less (Top 5)' : `▼ Show More (${gyms.length - 5} more)`}
                    </button>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                      Showing {gyms.length} {gyms.length === 1 ? 'Franchise Gym' : 'Franchise Gyms'}
                    </span>
                  )}

                  <button 
                    type="button" 
                    onClick={() => {
                      setSelectedDrillGym(null);
                      setSelectedDrillMember(null);
                      setShowTurnstileModal(true);
                    }}
                    style={{
                      background: 'rgba(79, 70, 229, 0.08)',
                      border: '1px solid rgba(79, 70, 229, 0.2)',
                      color: '#4f46e5',
                      fontSize: '12px',
                      fontWeight: '700',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    View Full Details Page <ArrowRightIcon size={12} color="#4f46e5" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* =========================================================================
          DEDICATED FULL TURNSTILE ACTIVITY & TELEMETRY PAGE / MODAL (HIERARCHICAL DRILLDOWN)
          ========================================================================= */}
      {/* =========================================================================
          DEDICATED FULL-SCREEN TURNSTILE ACTIVITY & TELEMETRY HUB (TABLE DIRECTORY FLOW)
          ========================================================================= */}
      {showTurnstileModal && (
        <div 
          className="modal-backdrop-luxury" 
          onClick={() => setShowTurnstileModal(false)} 
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999999,
            background: 'rgba(15, 23, 42, 0.82)',
            backdropFilter: 'blur(10px)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '16px' 
          }}
        >
          <div 
            className="luxury-wizard-box" 
            style={{ 
              maxWidth: '1440px', 
              width: '98vw', 
              height: '94vh', 
              maxHeight: '94vh', 
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '24px',
              overflow: 'hidden',
              background: '#ffffff',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="wizard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 28px', background: 'rgba(248, 250, 252, 0.98)', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              <div className="wizard-title-wrap">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span className="wizard-step-badge" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <BoltIcon size={12} color="#059669" /> Turnstile Telemetry & Directory Hub
                  </span>
                  <div style={{ display: 'inline-flex', background: '#e2e8f0', padding: '2px', borderRadius: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setDrillViewMode('hierarchy')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: '700',
                        borderRadius: '6px',
                        border: 'none',
                        background: drillViewMode === 'hierarchy' ? '#ffffff' : 'transparent',
                        color: drillViewMode === 'hierarchy' ? '#4f46e5' : '#64748b',
                        boxShadow: drillViewMode === 'hierarchy' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <BuildingIcon size={12} color={drillViewMode === 'hierarchy' ? '#4f46e5' : '#64748b'} />
                      Franchises <ArrowRightIcon size={10} color={drillViewMode === 'hierarchy' ? '#4f46e5' : '#64748b'} /> Members Directory <ArrowRightIcon size={10} color={drillViewMode === 'hierarchy' ? '#4f46e5' : '#64748b'} /> Attendance Calendar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrillViewMode('stream')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: '700',
                        borderRadius: '6px',
                        border: 'none',
                        background: drillViewMode === 'stream' ? '#ffffff' : 'transparent',
                        color: drillViewMode === 'stream' ? '#4f46e5' : '#64748b',
                        boxShadow: drillViewMode === 'stream' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <BoltIcon size={12} color={drillViewMode === 'stream' ? '#4f46e5' : '#64748b'} />
                      Live Raw Stream
                    </button>
                  </div>
                </div>

                <h2 className="wizard-title" style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {drillViewMode === 'stream' && 'Global Live Turnstile Stream'}
                  {drillViewMode === 'hierarchy' && !selectedDrillGym && 'Franchise Gyms Directory & Turnstile Gateway Table'}
                  {drillViewMode === 'hierarchy' && selectedDrillGym && !selectedDrillMember && `${selectedDrillGym.name} • Athletes & Turnstile Table Directory`}
                  {drillViewMode === 'hierarchy' && selectedDrillMember && `${selectedDrillMember.name} • Attendance Calendar & Daily Session History`}
                </h2>
              </div>

              <button 
                type="button" 
                className="wizard-close-btn" 
                onClick={() => setShowTurnstileModal(false)}
                aria-label="Close"
                style={{ flexShrink: 0, marginLeft: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <CloseIcon size={16} color="#64748b" />
              </button>
            </div>


            {/* Breadcrumb Navigation Bar */}
            {drillViewMode === 'hierarchy' && (
              <div style={{ padding: '10px 28px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' }}>
                  <button 
                    type="button"
                    onClick={() => { setSelectedDrillGym(null); setSelectedDrillMember(null); setMemberTablePage(1); }}
                    style={{ background: 'none', border: 'none', color: selectedDrillGym ? '#4f46e5' : '#0f172a', fontWeight: '700', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <BuildingIcon size={14} color={selectedDrillGym ? '#4f46e5' : '#0f172a'} /> All Franchises ({gyms.length})
                  </button>
                  {selectedDrillGym && (
                    <>
                      <ChevronRightIcon size={12} color="#94a3b8" />
                      <button 
                        type="button"
                        onClick={() => { setSelectedDrillMember(null); setMemberTablePage(1); }}
                        style={{ background: 'none', border: 'none', color: selectedDrillMember ? '#4f46e5' : '#0f172a', fontWeight: '700', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <BuildingIcon size={13} color={selectedDrillMember ? '#4f46e5' : '#0f172a'} /> {selectedDrillGym.name}
                      </button>
                    </>
                  )}
                  {selectedDrillMember && (
                    <>
                      <ChevronRightIcon size={12} color="#94a3b8" />
                      <span style={{ color: '#0f172a', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <UserIcon size={14} color="#0f172a" /> {selectedDrillMember.name} (Attendance & Calendar)
                      </span>
                    </>
                  )}
                </div>

                {selectedDrillMember ? (
                  <button 
                    type="button"
                    onClick={() => { setSelectedDrillMember(null); setMemberTablePage(1); }}
                    style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '5px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <ArrowLeftIcon size={12} color="#475569" /> Back to {selectedDrillGym.name} Members Table
                  </button>
                ) : selectedDrillGym ? (
                  <button 
                    type="button"
                    onClick={() => { setSelectedDrillGym(null); setSelectedDrillMember(null); }}
                    style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '5px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <ArrowLeftIcon size={12} color="#475569" /> Back to Franchises Table
                  </button>
                ) : null}
              </div>
            )}

            {/* Scrollable Main Content Body */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* ===================================================================
                  VIEW 1: HIERARCHY - STEP 1: ALL GYMS TABLE LIST
                  =================================================================== */}
              {drillViewMode === 'hierarchy' && !selectedDrillGym && (
                <div style={{ padding: '24px 28px' }}>
                  {/* Top Stats Banner */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                        <BuildingIcon size={20} color="#2563eb" />
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Total Registered Gyms</span>
                        <h4 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: '800' }}>{gyms.length} Franchises</h4>
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                        <UsersIcon size={20} color="#059669" />
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Athletes Currently Inside</span>
                        <h4 style={{ margin: 0, fontSize: '20px', color: '#059669', fontWeight: '800' }}>
                          {liveCheckIns.filter(l => l.badge?.includes('IN GYM') || l.status === 'in_gym').length} Active
                        </h4>
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                        <BoltIcon size={20} color="#d97706" />
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Turnstile Log Stream</span>
                        <h4 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: '800' }}>{liveCheckIns.length} Total Logs</h4>
                      </div>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ position: 'relative', width: '340px' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                        <SearchIcon size={14} color="#94a3b8" />
                      </span>
                      <input 
                        type="text" 
                        placeholder="Search franchise gyms by name, city, plan..."
                        value={gymTableSearch}
                        onChange={(e) => setGymTableSearch(e.target.value)}
                        className="form-input"
                        style={{ paddingLeft: '34px', fontSize: '13px' }}
                      />
                    </div>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                      Showing {gyms.filter(g => !gymTableSearch || g.name?.toLowerCase().includes(gymTableSearch.toLowerCase()) || g.city?.toLowerCase().includes(gymTableSearch.toLowerCase())).length} Franchises
                    </span>
                  </div>

                  {/* Franchises Data Table */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>#</th>
                          <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Franchise Gym</th>
                          <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Location</th>
                          <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>SaaS Plan</th>
                          <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Registered Members</th>
                          <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Inside Now</th>
                          <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Turnstile Events</th>
                          <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gyms
                          .filter(g => !gymTableSearch || g.name?.toLowerCase().includes(gymTableSearch.toLowerCase()) || g.city?.toLowerCase().includes(gymTableSearch.toLowerCase()))
                          .map((g, idx) => {
                            const gymIdStr = String(g._id || g.id);
                            const gymLogs = liveCheckIns.filter(l => l.gym === g.name || String(l.gymId) === gymIdStr);
                            const insideCount = gymLogs.filter(l => l.badge?.includes('IN GYM') || l.status === 'in_gym').length;
                            const totalLogs = gymLogs.length;
                            
                            // Member count for this gym
                            const memberCount = members.filter(m => String(m.gymId) === gymIdStr || m.gymName === g.name).length || 
                              new Set(gymLogs.map(l => l.name)).size || 1;

                            return (
                              <tr 
                                key={g._id || g.id || idx}
                                onClick={() => { setSelectedDrillGym(g); setMemberTablePage(1); }}
                                style={{
                                  borderBottom: '1px solid #f1f5f9',
                                  cursor: 'pointer',
                                  transition: 'background 0.15s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                              >
                                <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: '#94a3b8' }}>
                                  {idx + 1}
                                </td>
                                <td style={{ padding: '14px 18px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>
                                      {g.name ? g.name.substring(0, 2).toUpperCase() : 'FC'}
                                    </div>
                                    <div>
                                      <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>{g.name}</strong>
                                      <span style={{ fontSize: '12px', color: '#64748b' }}>ID: {gymIdStr.slice(-6).toUpperCase()}</span>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '14px 18px', fontSize: '13px', color: '#475569' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <LocationPinIcon size={12} color="#ef4444" /> {g.city || 'India'}
                                  </span>
                                </td>
                                <td style={{ padding: '14px 18px' }}>
                                  <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', textTransform: 'uppercase' }}>
                                    {g.plan || 'PRO'}
                                  </span>
                                </td>
                                <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                    <UsersIcon size={13} color="#64748b" /> {memberCount} Athletes
                                  </span>
                                </td>
                                <td style={{ padding: '14px 18px' }}>
                                  <span style={{
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    background: insideCount > 0 ? '#ecfdf5' : '#f1f5f9',
                                    color: insideCount > 0 ? '#059669' : '#64748b',
                                    border: `1px solid ${insideCount > 0 ? '#a7f3d0' : '#e2e8f0'}`
                                  }}>
                                    {insideCount > 0 ? `● ${insideCount} Active Inside` : '0 Active'}
                                  </span>
                                </td>
                                <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                                  {totalLogs} Logs
                                </td>
                                <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                  <button
                                    type="button"
                                    style={{
                                      background: '#4f46e5',
                                      color: '#ffffff',
                                      border: 'none',
                                      padding: '7px 14px',
                                      borderRadius: '8px',
                                      fontSize: '12px',
                                      fontWeight: '700',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px'
                                    }}
                                  >
                                    Inspect Members Roster <ArrowRightIcon size={12} color="#ffffff" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ===================================================================
                  VIEW 2: HIERARCHY - STEP 2: COMPLETE MEMBERS ROSTER TABLE (1 TO 400+ MEMBERS)
                  =================================================================== */}
              {drillViewMode === 'hierarchy' && selectedDrillGym && !selectedDrillMember && (
                <div style={{ padding: '24px 28px' }}>
                  {(() => {
                    const gymIdStr = String(selectedDrillGym._id || selectedDrillGym.id);
                    const gymLogs = liveCheckIns.filter(l => l.gym === selectedDrillGym.name || String(l.gymId) === gymIdStr);
                    
                    // Extract unique members with attendance or matching gym
                    const memberMap = {};
                    
                    // 1. From live logs
                    gymLogs.forEach(l => {
                      const key = l.name;
                      if (!memberMap[key]) {
                        memberMap[key] = {
                          name: l.name,
                          phone: l.phone || '',
                          gym: selectedDrillGym.name,
                          plan: 'Pro Studio',
                          logs: [],
                          totalCheckIns: 0,
                          totalCheckOuts: 0,
                          lastVisit: l.time,
                          lastDate: l.date,
                          isInside: l.badge?.includes('IN GYM') || l.status === 'in_gym',
                          calories: 0
                        };
                      }
                      memberMap[key].logs.push(l);
                      if (l.badge?.includes('IN GYM') || l.status === 'in_gym') {
                        memberMap[key].totalCheckIns++;
                        memberMap[key].isInside = true;
                      } else {
                        memberMap[key].totalCheckOuts++;
                      }
                      memberMap[key].calories += (Number(l.caloriesBurned) || 0);
                    });

                    // 2. Also include members from props registered to this gym
                    members.filter(m => String(m.gymId) === gymIdStr || m.gymName === selectedDrillGym.name).forEach(m => {
                      if (!memberMap[m.name]) {
                        memberMap[m.name] = {
                          name: m.name,
                          phone: m.phone || '',
                          gym: selectedDrillGym.name,
                          plan: m.plan || 'Pro Studio',
                          logs: [],
                          totalCheckIns: 0,
                          totalCheckOuts: 0,
                          lastVisit: 'No scans yet',
                          lastDate: '-',
                          isInside: false,
                          calories: 0
                        };
                      }
                    });

                    const allMembersList = Object.values(memberMap);

                    // Filters & Search
                    const filteredMembers = allMembersList.filter(m => {
                      const matchSearch = !memberTableSearch || 
                        m.name?.toLowerCase().includes(memberTableSearch.toLowerCase()) || 
                        m.phone?.includes(memberTableSearch) ||
                        m.plan?.toLowerCase().includes(memberTableSearch.toLowerCase());
                      
                      const matchStatus = memberTableFilterStatus === 'all' ||
                        (memberTableFilterStatus === 'in_gym' && m.isInside) ||
                        (memberTableFilterStatus === 'checked_out' && !m.isInside);

                      return matchSearch && matchStatus;
                    });

                    // Pagination
                    const pageSize = memberTablePageSize === 'all' ? filteredMembers.length : Number(memberTablePageSize);
                    const totalPages = Math.ceil(filteredMembers.length / (pageSize || 1)) || 1;
                    const currentPage = Math.min(memberTablePage, totalPages);
                    const startIndex = (currentPage - 1) * pageSize;
                    const paginatedMembers = filteredMembers.slice(startIndex, startIndex + pageSize);

                    const insideCount = allMembersList.filter(m => m.isInside).length;
                    const checkedOutCount = allMembersList.length - insideCount;

                    return (
                      <div>
                        {/* Header Controls: Search, Status Filter Tabs & Page Size */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            {/* Search Bar */}
                            <div style={{ position: 'relative', width: '300px' }}>
                              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                <SearchIcon size={14} color="#94a3b8" />
                              </span>
                              <input 
                                type="text" 
                                placeholder={`Search members in ${selectedDrillGym.name}...`}
                                value={memberTableSearch}
                                onChange={(e) => { setMemberTableSearch(e.target.value); setMemberTablePage(1); }}
                                className="form-input"
                                style={{ paddingLeft: '34px', fontSize: '13px' }}
                              />
                            </div>

                            {/* Status Filter Tabs */}
                            <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px' }}>
                              {[
                                { id: 'all', label: `All Members (${allMembersList.length})` },
                                { id: 'in_gym', label: `● Inside Gym (${insideCount})` },
                                { id: 'checked_out', label: `Checked Out (${checkedOutCount})` }
                              ].map(tab => (
                                <button
                                  key={tab.id}
                                  type="button"
                                  onClick={() => { setMemberTableFilterStatus(tab.id); setMemberTablePage(1); }}
                                  style={{
                                    padding: '5px 12px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    borderRadius: '7px',
                                    border: 'none',
                                    background: memberTableFilterStatus === tab.id ? '#ffffff' : 'transparent',
                                    color: memberTableFilterStatus === tab.id ? '#4f46e5' : '#64748b',
                                    boxShadow: memberTableFilterStatus === tab.id ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Items Per Page Selector */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Rows per page:</span>
                            <select
                              className="form-input"
                              value={memberTablePageSize}
                              onChange={(e) => { setMemberTablePageSize(e.target.value); setMemberTablePage(1); }}
                              style={{ fontSize: '12px', padding: '5px 10px', width: 'auto' }}
                            >
                              <option value="10">10</option>
                              <option value="25">25</option>
                              <option value="50">50</option>
                              <option value="100">100</option>
                              <option value="all">All (400+)</option>
                            </select>
                          </div>
                        </div>

                        {/* Members Data Table */}
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', width: '50px' }}>#</th>
                                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Athlete / Member</th>
                                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Franchise Branch</th>
                                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Plan</th>
                                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Check-Ins</th>
                                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Check-Outs</th>
                                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Calories</th>
                                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Last Turnstile Visit</th>
                                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedMembers.length === 0 ? (
                                <tr>
                                  <td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                    No members found matching your search and filter criteria in {selectedDrillGym.name}.
                                  </td>
                                </tr>
                              ) : (
                                paginatedMembers.map((mem, idx) => {
                                  const rowNumber = startIndex + idx + 1;
                                  return (
                                    <tr 
                                      key={mem.name || idx}
                                      onClick={() => setSelectedDrillMember(mem)}
                                      style={{
                                        borderBottom: '1px solid #f1f5f9',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s ease'
                                      }}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                                    >
                                      <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: '#94a3b8' }}>
                                        {rowNumber}
                                      </td>
                                      <td style={{ padding: '14px 18px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <div className="ticker-avatar" style={{ width: '38px', height: '38px', fontSize: '13px' }}>
                                            {mem.name.substring(0, 2).toUpperCase()}
                                          </div>
                                          <div>
                                            <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>{mem.name}</strong>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>{mem.phone || 'Athlete Pass'}</span>
                                          </div>
                                        </div>
                                      </td>
                                      <td style={{ padding: '14px 18px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                                        {selectedDrillGym.name}
                                      </td>
                                      <td style={{ padding: '14px 18px' }}>
                                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', background: '#f1f5f9', color: '#475569' }}>
                                          {mem.plan || 'Pro Studio'}
                                        </span>
                                      </td>
                                      <td style={{ padding: '14px 18px' }}>
                                        <span style={{
                                          padding: '3px 8px',
                                          borderRadius: '6px',
                                          fontSize: '11px',
                                          fontWeight: '800',
                                          background: mem.isInside ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                                          color: mem.isInside ? '#10b981' : '#64748b',
                                          border: `1px solid ${mem.isInside ? 'rgba(16, 185, 129, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`
                                        }}>
                                          {mem.isInside ? '● IN GYM' : 'CHECKED OUT'}
                                        </span>
                                      </td>
                                      <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: '800', color: '#059669' }}>
                                        {mem.totalCheckIns || mem.logs.length}
                                      </td>
                                      <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: '800', color: '#64748b' }}>
                                        {mem.totalCheckOuts}
                                      </td>
                                      <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '800', color: '#f59e0b' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                          <FireIcon size={12} color="#f59e0b" /> {mem.calories} kcal
                                        </span>
                                      </td>
                                      <td style={{ padding: '14px 18px', fontSize: '12px', color: '#0f172a', fontWeight: '600' }}>
                                        {mem.lastVisit} {mem.lastDate ? `(${mem.lastDate})` : ''}
                                      </td>
                                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                        <button
                                          type="button"
                                          style={{
                                            background: '#4f46e5',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '7px 14px',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                          }}
                                        >
                                          Attendance Calendar <ArrowRightIcon size={12} color="#ffffff" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Table Pagination Footer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
                          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                            Showing <strong>{filteredMembers.length > 0 ? startIndex + 1 : 0}</strong> to <strong>{Math.min(startIndex + (pageSize || filteredMembers.length), filteredMembers.length)}</strong> of <strong>{filteredMembers.length}</strong> Athletes in {selectedDrillGym.name}
                          </span>

                          {totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setMemberTablePage(prev => Math.max(prev - 1, 1))}
                                style={{
                                  background: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  padding: '5px 12px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                  opacity: currentPage === 1 ? 0.5 : 1,
                                  color: '#334155'
                                }}
                              >
                                Previous
                              </button>

                              <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                                Page {currentPage} of {totalPages}
                              </span>

                              <button
                                type="button"
                                disabled={currentPage === totalPages}
                                onClick={() => setMemberTablePage(prev => Math.min(prev + 1, totalPages))}
                                style={{
                                  background: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  padding: '5px 12px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                  opacity: currentPage === totalPages ? 0.5 : 1,
                                  color: '#334155'
                                }}
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}


            {/* ===================================================================
                VIEW 3: HIERARCHY - STEP 3: INTERACTIVE MONTHLY ATTENDANCE CALENDAR & SESSIONS
                =================================================================== */}
            {drillViewMode === 'hierarchy' && selectedDrillMember && (
              <div style={{ padding: '24px 32px' }}>
                {/* Member Profile Banner */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: 'linear-gradient(135deg, #f8fafc, #edf2f7)', borderRadius: '18px', border: '1px solid #e2e8f0', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #4f46e5, #818cf8)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800', boxShadow: '0 8px 16px rgba(79, 70, 229, 0.25)' }}>
                      {selectedDrillMember.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{selectedDrillMember.name}</h3>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '800',
                          background: selectedDrillMember.isInside ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                          color: selectedDrillMember.isInside ? '#10b981' : '#64748b',
                          border: `1px solid ${selectedDrillMember.isInside ? 'rgba(16, 185, 129, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`
                        }}>
                          {selectedDrillMember.isInside ? '● IN GYM' : 'CHECKED OUT'}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        Franchise: <strong>{selectedDrillGym.name}</strong> {selectedDrillMember.phone ? `• Phone: ${selectedDrillMember.phone}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Quick Stat Badges */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ background: '#ffffff', padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>TOTAL LOGS</span>
                      <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '800' }}>{selectedDrillMember.logs.length}</h4>
                    </div>
                    <div style={{ background: '#ffffff', padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#059669', fontWeight: '700' }}>CHECK-INS</span>
                      <h4 style={{ margin: 0, fontSize: '16px', color: '#059669', fontWeight: '800' }}>{selectedDrillMember.totalCheckIns || selectedDrillMember.logs.length}</h4>
                    </div>
                    <div style={{ background: '#ffffff', padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>CHECK-OUTS</span>
                      <h4 style={{ margin: 0, fontSize: '16px', color: '#64748b', fontWeight: '800' }}>{selectedDrillMember.totalCheckOuts || 0}</h4>
                    </div>
                    <div style={{ background: '#ffffff', padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '700' }}>CALORIES</span>
                      <h4 style={{ margin: 0, fontSize: '16px', color: '#f59e0b', fontWeight: '800' }}>{selectedDrillMember.calories || 0} kcal</h4>
                    </div>
                  </div>
                </div>

                {/* ===============================================================
                    CALENDAR & MORNING / EVENING SESSION DATA PARSER
                    =============================================================== */}
                {(() => {
                  const monthNames = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ];
                  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

                  // Organize logs by normalized date string (YYYY-MM-DD)
                  const sessionMap = {};

                  selectedDrillMember.logs.forEach(log => {
                    let d = new Date(log.date || log.time);
                    let dateKey = '';
                    if (!isNaN(d.getTime())) {
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      dateKey = `${y}-${m}-${day}`;
                    } else if (log.date && typeof log.date === 'string' && log.date.includes('-')) {
                      dateKey = log.date.substring(0, 10);
                    } else {
                      const today = new Date();
                      const y = today.getFullYear();
                      const m = String(today.getMonth() + 1).padStart(2, '0');
                      const day = String(today.getDate()).padStart(2, '0');
                      dateKey = `${y}-${m}-${day}`;
                    }

                    if (!sessionMap[dateKey]) {
                      sessionMap[dateKey] = {
                        dateKey,
                        morning: null,
                        evening: null,
                        allLogs: [],
                        totalCalories: 0,
                        totalDurationMin: 0,
                        isInside: false
                      };
                    }

                    sessionMap[dateKey].allLogs.push(log);
                    const cal = Number(log.caloriesBurned) || 0;
                    sessionMap[dateKey].totalCalories += cal;

                    let durM = 0;
                    if (typeof log.durationMinutes === 'number') {
                      durM = log.durationMinutes;
                    } else if (typeof log.durationMinutes === 'string') {
                      durM = parseInt(log.durationMinutes) || 0;
                    }
                    sessionMap[dateKey].totalDurationMin += durM;

                    if (log.badge?.includes('IN GYM') || log.status === 'in_gym') {
                      sessionMap[dateKey].isInside = true;
                    }

                    // Check if morning or evening
                    const isMorning = 
                      (log.type && log.type.toLowerCase().includes('morning')) ||
                      (log.time && log.time.toLowerCase().includes('am'));

                    const isEvening = 
                      (log.type && log.type.toLowerCase().includes('evening')) ||
                      (log.time && log.time.toLowerCase().includes('pm'));

                    const isAutoOut = log.autoCheckedOut || log.status === 'AUTO_CHECKED_OUT' || log.status === 'auto_checked_out' || log.badge?.includes('AUTO');

                    if (isMorning) {
                      if (!sessionMap[dateKey].morning) {
                        sessionMap[dateKey].morning = {
                          inTime: log.time || 'Check-in',
                          outTime: log.outTime || (isAutoOut ? '01:00 pm (Auto-Checkout)' : (log.badge?.includes('IN GYM') ? 'Active In Gym' : 'Checked Out')),
                          duration: log.durationMinutes ? `${log.durationMinutes}m` : (durM ? `${durM}m` : '--'),
                          calories: log.caloriesBurned || 0,
                          gate: log.method || 'Smart QR Pass',
                          isAutoOut,
                          autoReason: log.autoCheckoutReason || 'Morning Shift Cutoff (13:00)',
                          status: (log.badge?.includes('IN GYM') || log.status === 'in_gym') ? 'In Progress' : (isAutoOut ? 'Auto-Checked Out (13:00)' : 'Completed')
                        };
                      }
                    } else if (isEvening) {
                      if (!sessionMap[dateKey].evening) {
                        sessionMap[dateKey].evening = {
                          inTime: log.time || 'Check-in',
                          outTime: log.outTime || (log.badge?.includes('IN GYM') ? 'In Progress' : (isAutoOut ? '11:00 pm (Auto-Checkout)' : 'Checked Out')),
                          duration: log.durationMinutes ? `${log.durationMinutes}m` : (durM ? `${durM}m` : '--'),
                          calories: log.caloriesBurned || 0,
                          gate: log.method || 'Smart QR Pass',
                          isAutoOut,
                          autoReason: log.autoCheckoutReason || 'Evening Shift Cutoff (23:00)',
                          status: (log.badge?.includes('IN GYM') || log.status === 'in_gym') ? 'Active In Gym' : (isAutoOut ? 'Auto-Checked Out (23:00)' : 'Completed')
                        };
                      }
                    } else {
                      // Default to evening session if unspecified
                      if (!sessionMap[dateKey].evening) {
                        sessionMap[dateKey].evening = {
                          inTime: log.time || 'Check-in',
                          outTime: log.outTime || (isAutoOut ? 'Auto-Checkout' : (log.badge?.includes('IN GYM') ? 'Active In Gym' : 'Checked Out')),
                          duration: log.durationMinutes ? `${log.durationMinutes}m` : (durM ? `${durM}m` : '--'),
                          calories: log.caloriesBurned || 0,
                          gate: log.method || 'Smart QR Pass',
                          isAutoOut,
                          autoReason: log.autoCheckoutReason || 'Session Cutoff',
                          status: (log.badge?.includes('IN GYM') || log.status === 'in_gym') ? 'Active In Gym' : (isAutoOut ? 'Auto-Checked Out' : 'Completed')
                        };
                      }
                    }
                  });


                  // Calendar Grid Calculation
                  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
                  const totalDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                  const prevMonthTotalDays = new Date(calYear, calMonth, 0).getDate();

                  const calendarCells = [];

                  // Previous Month Offset
                  for (let i = firstDayIndex - 1; i >= 0; i--) {
                    const dayNum = prevMonthTotalDays - i;
                    calendarCells.push({
                      dayNum,
                      isCurrentMonth: false,
                      dateKey: null
                    });
                  }

                  // Current Month Days
                  for (let d = 1; d <= totalDaysInMonth; d++) {
                    const mStr = String(calMonth + 1).padStart(2, '0');
                    const dStr = String(d).padStart(2, '0');
                    const dateKey = `${calYear}-${mStr}-${dStr}`;
                    calendarCells.push({
                      dayNum: d,
                      isCurrentMonth: true,
                      dateKey,
                      data: sessionMap[dateKey] || null
                    });
                  }

                  // Next Month Filler to complete 35 or 42 grid cells
                  const remainingCells = (calendarCells.length <= 35 ? 35 : 42) - calendarCells.length;
                  for (let i = 1; i <= remainingCells; i++) {
                    calendarCells.push({
                      dayNum: i,
                      isCurrentMonth: false,
                      dateKey: null
                    });
                  }

                  // Find active focused date data
                  const activeFocusDate = hoveredCalDate || selectedCalDate || '2026-09-10';
                  const activeDayData = sessionMap[activeFocusDate] || null;

                  const handlePrevMonth = () => {
                    if (calMonth === 0) {
                      setCalMonth(11);
                      setCalYear(prev => prev - 1);
                    } else {
                      setCalMonth(prev => prev - 1);
                    }
                  };

                  const handleNextMonth = () => {
                    if (calMonth === 11) {
                      setCalMonth(0);
                      setCalYear(prev => prev + 1);
                    } else {
                      setCalMonth(prev => prev + 1);
                    }
                  };

                  return (
                    <div>
                      {/* ===============================================================
                          INTERACTIVE CALENDAR CONTAINER
                          =============================================================== */}
                      <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '20px',
                        padding: '24px',
                        marginBottom: '24px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                      }}>
                        {/* Calendar Header with Navigation */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ display: 'inline-flex', padding: '6px', background: '#eff6ff', borderRadius: '8px', color: '#2563eb' }}>
                                <CalendarIcon size={16} color="#2563eb" />
                              </span>
                              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                                {monthNames[calMonth]} {calYear} Attendance Calendar
                              </h3>
                            </div>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                              Hover over any date to inspect Morning and Evening session turnstile timings
                            </p>
                          </div>

                          {/* Legend & Month Controls */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            {/* Legend */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '6px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#d97706', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <SunIcon size={12} color="#d97706" /> Morning Session
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <MoonIcon size={12} color="#6366f1" /> Evening Session
                              </span>
                            </div>

                            {/* Month Switcher Controls */}
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                              <button
                                type="button"
                                onClick={handlePrevMonth}
                                style={{
                                  background: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  padding: '5px 10px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#334155'
                                }}
                                title="Previous Month"
                              >
                                <ArrowLeftIcon size={12} color="#334155" />
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => { setCalMonth(8); setCalYear(2026); setSelectedCalDate('2026-09-10'); }}
                                style={{
                                  background: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  padding: '4px 12px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  color: '#4f46e5'
                                }}
                              >
                                Sept 2026 (Today)
                              </button>

                              <button
                                type="button"
                                onClick={handleNextMonth}
                                style={{
                                  background: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  padding: '5px 10px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#334155'
                                }}
                                title="Next Month"
                              >
                                <ArrowRightIcon size={12} color="#334155" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Responsive Scroll Wrapper for Calendar Grid */}
                        <div style={{ overflowX: 'auto', paddingBottom: '6px' }}>
                          <div style={{ minWidth: '680px' }}>
                            {/* Calendar Grid Header (Days of Week) */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px', textAlign: 'center' }}>
                              {dayNames.map(day => (
                                <div key={day} style={{ padding: '8px 0', fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em' }}>
                                  {day}
                                </div>
                              ))}
                            </div>

                            {/* Calendar Days Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                              {calendarCells.map((cell, idx) => {
                                const isSelected = cell.dateKey === selectedCalDate;
                                const isHovered = cell.dateKey === hoveredCalDate;
                                const hasData = !!cell.data;
                                const hasMorning = cell.data?.morning;
                                const hasEvening = cell.data?.evening;
                                const isInsideNow = cell.data?.isInside;

                                if (!cell.isCurrentMonth) {
                                  return (
                                <div
                                  key={idx}
                                  style={{
                                    minHeight: '84px',
                                    padding: '8px',
                                    borderRadius: '12px',
                                    background: '#f8fafc',
                                    border: '1px dashed #e2e8f0',
                                    opacity: 0.45
                                  }}
                                >
                                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>{cell.dayNum}</span>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={idx}
                                onClick={() => cell.dateKey && setSelectedCalDate(cell.dateKey)}
                                onMouseEnter={() => cell.dateKey && setHoveredCalDate(cell.dateKey)}
                                onMouseLeave={() => setHoveredCalDate(null)}
                                style={{
                                  minHeight: '88px',
                                  padding: '10px',
                                  borderRadius: '14px',
                                  background: isSelected 
                                    ? '#eff6ff' 
                                    : (isHovered ? '#f8fafc' : (hasData ? '#ffffff' : '#fcfcfd')),
                                  border: isSelected 
                                    ? '2px solid #3b82f6' 
                                    : (isHovered ? '2px solid #818cf8' : (hasData ? '1px solid #cbd5e1' : '1px solid #f1f5f9')),
                                  cursor: 'pointer',
                                  transition: 'all 0.18s ease',
                                  position: 'relative',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  boxShadow: isSelected 
                                    ? '0 6px 16px rgba(59, 130, 246, 0.15)' 
                                    : (hasData ? '0 2px 6px rgba(0,0,0,0.02)' : 'none')
                                }}
                              >
                                {/* Top Row: Day Number + Active Badge */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{
                                    fontSize: '13px',
                                    fontWeight: hasData ? '800' : '600',
                                    color: isSelected ? '#1d4ed8' : (hasData ? '#0f172a' : '#94a3b8'),
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '6px',
                                    background: isSelected ? '#dbeafe' : 'transparent'
                                  }}>
                                    {cell.dayNum}
                                  </span>

                                  {isInsideNow && (
                                    <span style={{
                                      fontSize: '9px',
                                      fontWeight: '800',
                                      padding: '2px 5px',
                                      borderRadius: '4px',
                                      background: '#ecfdf5',
                                      color: '#059669',
                                      border: '1px solid #a7f3d0'
                                    }}>
                                      ● LIVE
                                    </span>
                                  )}
                                </div>

                                {/* Sessions Content */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
                                  {hasMorning && (
                                    <div style={{
                                      fontSize: '10px',
                                      fontWeight: '700',
                                      color: '#92400e',
                                      background: '#fef3c7',
                                      borderRadius: '5px',
                                      padding: '2px 5px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}>
                                      <SunIcon size={10} color="#d97706" /> {cell.data.morning.inTime}
                                    </div>
                                  )}

                                  {hasEvening && (
                                    <div style={{
                                      fontSize: '10px',
                                      fontWeight: '700',
                                      color: '#3730a3',
                                      background: '#e0e7ff',
                                      borderRadius: '5px',
                                      padding: '2px 5px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}>
                                      <MoonIcon size={10} color="#4f46e5" /> {cell.data.evening.inTime}
                                    </div>
                                  )}

                                  {!hasMorning && !hasEvening && hasData && (
                                    <div style={{
                                      fontSize: '10px',
                                      fontWeight: '700',
                                      color: '#059669',
                                      background: '#ecfdf5',
                                      borderRadius: '5px',
                                      padding: '2px 5px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}>
                                      <CheckCircleIcon size={10} color="#059669" /> {cell.data.allLogs.length} Visits
                                    </div>
                                  )}
                                </div>

                                {/* Mini Footer Calories */}
                                {hasData && (
                                  <div style={{ fontSize: '9px', fontWeight: '700', color: '#f59e0b', marginTop: '4px', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                                    <FireIcon size={9} color="#f59e0b" /> {cell.data.totalCalories} kcal
                                  </div>
                                )}
                              </div>
                            );
                          })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ===============================================================
                          HOVER / SELECTED DATE DRILLDOWN CARD (MORNING & EVENING BREAKDOWN)
                          =============================================================== */}
                      <div style={{
                        background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
                        border: '2px solid #e0e7ff',
                        borderRadius: '20px',
                        padding: '24px',
                        marginBottom: '24px',
                        boxShadow: '0 8px 24px rgba(79, 70, 229, 0.06)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#4f46e5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ClockIcon size={20} color="#ffffff" />
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                                Daily Turnstile Breakdown: {activeFocusDate}
                              </h4>
                              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                                {hoveredCalDate ? 'Inspecting Hovered Date' : 'Inspecting Selected Date'} • Morning vs Evening attendance for {selectedDrillMember.name}
                              </p>
                            </div>
                          </div>

                          {activeDayData && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: '#059669', background: '#ecfdf5', padding: '5px 12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                                {activeDayData.allLogs.length} Turnstile Logs Recorded
                              </span>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: '#d97706', background: '#fef3c7', padding: '5px 12px', borderRadius: '8px', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <FireIcon size={13} color="#d97706" /> {activeDayData.totalCalories} kcal burned
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Morning & Evening Cards Comparison */}
                        {activeDayData ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                            {/* Morning Session Card */}
                            <div style={{
                              background: activeDayData.morning ? '#fffbeb' : '#fafafa',
                              border: activeDayData.morning ? '1.5px solid #fde68a' : '1px dashed #e2e8f0',
                              borderRadius: '16px',
                              padding: '18px',
                              position: 'relative'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: activeDayData.morning ? '#fef3c7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <SunIcon size={16} color={activeDayData.morning ? '#d97706' : '#94a3b8'} />
                                  </div>
                                  <h5 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: activeDayData.morning ? '#92400e' : '#64748b' }}>
                                    Morning Workout Session
                                  </h5>
                                </div>

                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: '800',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: activeDayData.morning ? '#d97706' : '#e2e8f0',
                                  color: activeDayData.morning ? '#ffffff' : '#64748b'
                                }}>
                                  {activeDayData.morning ? activeDayData.morning.status : 'No Morning Visit'}
                                </span>
                              </div>

                              {activeDayData.morning ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
                                  <div style={{ background: '#ffffff', padding: '10px', borderRadius: '10px', border: '1px solid #fef3c7' }}>
                                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Check-In Time</span>
                                    <h6 style={{ margin: '3px 0 0 0', fontSize: '14px', color: '#0f172a', fontWeight: '800' }}>{activeDayData.morning.inTime}</h6>
                                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>Gate: {activeDayData.morning.gate}</span>
                                  </div>
                                  <div style={{ background: '#ffffff', padding: '10px', borderRadius: '10px', border: '1px solid #fef3c7' }}>
                                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Check-Out Time</span>
                                    <h6 style={{ margin: '3px 0 0 0', fontSize: '14px', color: '#0f172a', fontWeight: '800' }}>{activeDayData.morning.outTime}</h6>
                                    <span style={{ fontSize: '10px', color: '#d97706', fontWeight: '700' }}>Duration: {activeDayData.morning.duration}</span>
                                  </div>
                                </div>
                              ) : (
                                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                                  Member did not scan turnstiles during the morning hours (05:00 AM - 12:00 PM).
                                </p>
                              )}
                            </div>

                            {/* Evening Session Card */}
                            <div style={{
                              background: activeDayData.evening ? '#eef2ff' : '#fafafa',
                              border: activeDayData.evening ? '1.5px solid #c7d2fe' : '1px dashed #e2e8f0',
                              borderRadius: '16px',
                              padding: '18px',
                              position: 'relative'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: activeDayData.evening ? '#e0e7ff' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MoonIcon size={16} color={activeDayData.evening ? '#4f46e5' : '#94a3b8'} />
                                  </div>
                                  <h5 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: activeDayData.evening ? '#3730a3' : '#64748b' }}>
                                    Evening Workout Session
                                  </h5>
                                </div>

                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: '800',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: activeDayData.evening ? '#4f46e5' : '#e2e8f0',
                                  color: activeDayData.evening ? '#ffffff' : '#64748b'
                                }}>
                                  {activeDayData.evening ? activeDayData.evening.status : 'No Evening Visit'}
                                </span>
                              </div>

                              {activeDayData.evening ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
                                  <div style={{ background: '#ffffff', padding: '10px', borderRadius: '10px', border: '1px solid #e0e7ff' }}>
                                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Check-In Time</span>
                                    <h6 style={{ margin: '3px 0 0 0', fontSize: '14px', color: '#0f172a', fontWeight: '800' }}>{activeDayData.evening.inTime}</h6>
                                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>Gate: {activeDayData.evening.gate}</span>
                                  </div>
                                  <div style={{ background: '#ffffff', padding: '10px', borderRadius: '10px', border: '1px solid #e0e7ff' }}>
                                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Check-Out Time</span>
                                    <h6 style={{ margin: '3px 0 0 0', fontSize: '14px', color: '#0f172a', fontWeight: '800' }}>{activeDayData.evening.outTime}</h6>
                                    <span style={{ fontSize: '10px', color: '#4f46e5', fontWeight: '700' }}>Duration: {activeDayData.evening.duration}</span>
                                  </div>
                                </div>
                              ) : (
                                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                                  Member did not scan turnstiles during the evening hours (04:00 PM - 11:59 PM).
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                              No workout sessions recorded on <strong>{activeFocusDate}</strong>. Select an active date on the calendar above.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* ===============================================================
                          RAW EVENT LOGS ACCORDION / TOGGLE (KEEPS VIEW CLEAN)
                          =============================================================== */}
                      <div style={{ marginTop: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                            Turnstile Audit Stream ({selectedDrillMember.logs.length} Total Records)
                          </h4>

                          <button
                            type="button"
                            onClick={() => setShowRawLogsAccordion(prev => !prev)}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              padding: '6px 14px',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: '#4f46e5',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            {showRawLogsAccordion ? 'Hide Raw Logs' : `Expand Full Raw Event Logs (${selectedDrillMember.logs.length})`}
                            <ChevronRightIcon size={12} color="#4f46e5" />
                          </button>
                        </div>

                        {showRawLogsAccordion && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                            {selectedDrillMember.logs.map((log, idx) => {
                              const isInside = log.badge?.includes('IN GYM') || log.status === 'in_gym';
                              return (
                                <div 
                                  key={log.id || idx}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 16px',
                                    background: '#ffffff',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    flexWrap: 'wrap',
                                    gap: '12px'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isInside ? '#ecfdf5' : '#f1f5f9', color: isInside ? '#059669' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px' }}>
                                      #{selectedDrillMember.logs.length - idx}
                                    </div>
                                    <div>
                                      <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                                        {log.type || 'Workout Entry'} • {log.method || 'Smart QR Pass'}
                                      </strong>
                                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                                        Date: {log.date || '10 Sept 2026'} • Check-in: <strong>{log.time}</strong>
                                      </span>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ textAlign: 'right' }}>
                                      <span style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700', display: 'block' }}>
                                        {isInside ? 'Session In Progress' : `Check-out: ${log.outTime || '10:43 pm'}`}
                                      </span>
                                      <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                        <FireIcon size={11} color="#f59e0b" /> {log.caloriesBurned || 6} kcal ({log.durationMinutes || '7m'})
                                      </span>
                                    </div>

                                    <span style={{
                                      padding: '4px 10px',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      fontWeight: '800',
                                      background: isInside ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                                      color: isInside ? '#10b981' : '#64748b',
                                      border: `1px solid ${isInside ? 'rgba(16, 185, 129, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`
                                    }}>
                                      {log.badge}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}


            {/* ===================================================================
                VIEW 4: GLOBAL FLAT STREAM (WHEN TOGGLED)
                =================================================================== */}
            {drillViewMode === 'stream' && (
              <div style={{ padding: '24px 32px' }}>
                {/* Search and Filters */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ position: 'relative', flex: '1 1 240px' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                      <SearchIcon size={14} color="#94a3b8" />
                    </span>
                    <input 
                      type="text" 
                      placeholder="Search live stream logs..."
                      value={turnstileSearch}
                      onChange={(e) => setTurnstileSearch(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '34px', fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      className="form-input" 
                      value={turnstileFilterGym} 
                      onChange={(e) => setTurnstileFilterGym(e.target.value)}
                      style={{ fontSize: '12px', padding: '8px 12px' }}
                    >
                      <option value="all">All Franchises</option>
                      {gyms.map(g => (
                        <option key={g._id || g.id} value={g.name}>{g.name}</option>
                      ))}
                    </select>

                    <select 
                      className="form-input" 
                      value={turnstileFilterStatus} 
                      onChange={(e) => setTurnstileFilterStatus(e.target.value)}
                      style={{ fontSize: '12px', padding: '8px 12px' }}
                    >
                      <option value="all">All Status</option>
                      <option value="in_gym">In Gym</option>
                      <option value="checked_out">Checked Out</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {liveCheckIns
                    .filter(item => {
                      const matchSearch = !turnstileSearch || item.name?.toLowerCase().includes(turnstileSearch.toLowerCase()) || item.gym?.toLowerCase().includes(turnstileSearch.toLowerCase());
                      const matchGym = turnstileFilterGym === 'all' || item.gym === turnstileFilterGym;
                      const matchStatus = turnstileFilterStatus === 'all' || 
                        (turnstileFilterStatus === 'in_gym' && (item.badge?.includes('IN GYM') || item.status === 'in_gym')) ||
                        (turnstileFilterStatus === 'checked_out' && (item.badge?.includes('CHECKED OUT') || item.status === 'checked_out'));
                      return matchSearch && matchGym && matchStatus;
                    })
                    .map((item, idx) => {
                      const isInside = item.badge?.includes('IN GYM') || item.status === 'in_gym';
                      return (
                        <div 
                          key={item.id || idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '14px 18px',
                            background: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            flexWrap: 'wrap',
                            gap: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="ticker-avatar" style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                              {item.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>{item.name}</strong>
                              <span style={{ fontSize: '12px', color: '#4f46e5', fontWeight: '600' }}>{item.gym}</span>
                            </div>
                          </div>

                          <div>
                            <span style={{ fontSize: '12px', color: '#334155', fontWeight: '600', display: 'block' }}>{item.type}</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>Gate: {item.method || 'Smart QR Pass'}</span>
                          </div>

                          <div>
                            <span style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700', display: 'block' }}>
                              {item.time} ({item.date || 'Today'})
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              {isInside ? 'Session Active' : `Out: ${item.outTime || 'Logged'}`}
                            </span>
                          </div>

                          <span style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '800',
                            background: isInside ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                            color: isInside ? '#10b981' : '#64748b',
                            border: `1px solid ${isInside ? 'rgba(16, 185, 129, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`
                          }}>
                            {item.badge}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

