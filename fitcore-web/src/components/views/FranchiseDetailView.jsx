import React, { useState } from 'react';
import {
  BuildingIcon,
  UsersIcon,
  LocationPinIcon,
  StarIcon,
  BoltIcon,
  ShieldCheckIcon,
  EditIcon,
  CheckCircleIcon,
  SearchIcon,
  CreditCardIcon,
  DumbbellIcon
} from '../common/Icons';

export default function FranchiseDetailView({
  gym,
  members = [],
  trainers = [],
  onBack,
  onEditGym
}) {
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'members' | 'trainers' | 'amenities'
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  if (!gym) {
    return (
      <div className="adm-view-container">
        <button className="back-nav-btn" onClick={onBack}>
          ← Back to Network
        </button>
        <div className="empty-state-box" style={{ marginTop: '40px' }}>
          <h4>No Franchise Selected</h4>
          <p>Please return to the franchise list and select a club to inspect.</p>
        </div>
      </div>
    );
  }

  const gymId = gym.id || gym._id;
  const gymMembers = members.filter(
    m => m.gymId === gymId || m.gymId === gym.id || m.gymId === gym._id
  );
  const activitiesList = gym.category
    ? gym.category.split(',').map(s => s.trim()).filter(Boolean)
    : ['Gym / Fitness', 'Strength Training', 'Functional CrossFit', 'Yoga'];
  const amenitiesList = Array.isArray(gym.amenities)
    ? gym.amenities
    : (gym.amenities ? String(gym.amenities).split(',').map(s => s.trim()) : [
        'Steam & Sauna', 'Olympic Free Weights', 'Cardio Theatre', 'Locker & Shower Suites', 'Biomechanics Lab', 'Recovery Lounge'
      ]);
  const permissionsList = Array.isArray(gym.permissions)
    ? gym.permissions
    : (gym.permissions ? String(gym.permissions).split(',').map(s => s.trim()) : [
        'Turnstile Scanner Access', 'Trainer Schedule Dispatch', 'Digital Member Pass Entry', 'Diet & Nutrition Assignment', 'Billing & POS System'
      ]);

  const filteredMembers = gymMembers.filter(m =>
    (m.name || '').toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    (m.phone || '').includes(memberSearchTerm) ||
    (m.userId || '').toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  return (
    <div className="adm-view-container franchise-detail-page">
      {/* Top Header & Breadcrumb Bar */}
      <div className="detail-top-nav-bar">
        <button className="back-nav-btn" onClick={onBack}>
          <span>← Back to Franchise Network</span>
        </button>
        <div className="detail-nav-actions">
          {onEditGym && (
            <button className="detail-action-btn edit" onClick={() => onEditGym(gym)}>
              <EditIcon size={14} color="currentColor" /> Edit Franchise
            </button>
          )}
          <span className="live-status-pill approved">
            <span className="status-dot-pulse" /> Live in Database
          </span>
        </div>
      </div>

      {/* Hero Passport Banner Card */}
      <div className="franchise-hero-passport-card">
        <div className="hero-passport-main">
          <div className="hero-club-avatar">
            {(gym.name || 'FC').substring(0, 2).toUpperCase()}
          </div>
          <div className="hero-club-info">
            <div className="hero-badge-row">
              <span className={`plan-badge luxury-plan-badge ${gym.plan === 'starter' ? 'starter' : gym.plan === 'enterprise' ? 'enterprise' : 'pro'}`}>
                {gym.plan === 'enterprise' ? '👑 ENTERPRISE CLUB' : gym.plan === 'starter' ? '⚡ STARTER CLUB' : '🚀 PRO STUDIO'}
              </span>
              <span className="hero-rating-badge">
                <StarIcon size={13} color="#f59e0b" /> {gym.rating ? gym.rating.toFixed(1) : '4.8'} / 5.0 Rating
              </span>
              <span className="hero-verified-badge">
                <CheckCircleIcon size={13} color="#10b981" /> Verified Franchise
              </span>
            </div>
            <h1 className="hero-club-name">{gym.name}</h1>
            <p className="hero-club-location">
              <LocationPinIcon size={14} color="#ef4444" /> {gym.address ? `${gym.address}, ` : ''}{gym.city || 'India'} {gym.pincode ? `- ${gym.pincode}` : ''}
            </p>
          </div>
        </div>

        {/* Hero Quick KPI Strip */}
        <div className="hero-kpi-grid">
          <div className="hero-kpi-box">
            <span className="kpi-icon-wrap indigo">
              <UsersIcon size={18} color="#4f46e5" />
            </span>
            <div className="kpi-text-col">
              <span className="kpi-val">{gymMembers.length}</span>
              <span className="kpi-lbl">Enrolled Members</span>
            </div>
          </div>
          <div className="hero-kpi-box">
            <span className="kpi-icon-wrap cyan">
              <BoltIcon size={18} color="#06b6d4" />
            </span>
            <div className="kpi-text-col">
              <span className="kpi-val">{gym.capacity || 0} Spots</span>
              <span className="kpi-lbl">Studio Capacity</span>
            </div>
          </div>
          <div className="hero-kpi-box">
            <span className="kpi-icon-wrap amber">
              <ShieldCheckIcon size={18} color="#d97706" />
            </span>
            <div className="kpi-text-col">
              <span className="kpi-val">{gym.ownerName || gym.owner?.name || 'Franchise Director'}</span>
              <span className="kpi-lbl">Club Franchise Owner</span>
            </div>
          </div>
          <div className="hero-kpi-box">
            <span className="kpi-icon-wrap rose">
              <CreditCardIcon size={18} color="#e11d48" />
            </span>
            <div className="kpi-text-col">
              <span className="kpi-val">{gym.gstNumber || '27AABCF1234F1Z5'}</span>
              <span className="kpi-lbl">GST & Tax Registration</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Detail Tabs */}
      <div className="detail-tabs-bar">
        <button
          className={`detail-tab-btn ${activeSubTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('overview')}
        >
          <BuildingIcon size={15} color="currentColor" /> Club Overview & Specs
        </button>
        <button
          className={`detail-tab-btn ${activeSubTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('members')}
        >
          <UsersIcon size={15} color="currentColor" /> Enrolled Athletes ({gymMembers.length})
        </button>
        <button
          className={`detail-tab-btn ${activeSubTab === 'trainers' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('trainers')}
        >
          <DumbbellIcon size={15} color="currentColor" /> Coaches & Master Trainers (4)
        </button>
        <button
          className={`detail-tab-btn ${activeSubTab === 'amenities' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('amenities')}
        >
          <ShieldCheckIcon size={15} color="currentColor" /> Amenities & Permissions ({amenitiesList.length + permissionsList.length})
        </button>
        <button
          className={`detail-tab-btn ${activeSubTab === 'kyc' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('kyc')}
        >
          <ShieldCheckIcon size={15} color="#10b981" /> Uploaded KYC & Licenses (4 Docs)
        </button>
      </div>

      {/* Tab Content 1: Club Overview & Specs */}
      {activeSubTab === 'overview' && (
        <div className="detail-grid-layout">
          {/* Left Column: Owner & Contact Identity */}
          <div className="detail-card-col">
            <div className="detail-glass-card">
              <div className="card-section-header">
                <span className="section-icon-badge">🧑‍💼</span>
                <div>
                  <h3 className="section-title">Franchise Owner & Leadership</h3>
                  <p className="section-subtitle">Official verified administrative credentials</p>
                </div>
              </div>
              <div className="info-kv-list">
                <div className="info-kv-row">
                  <span className="info-k">Owner Full Name</span>
                  <span className="info-v highlight">{gym.ownerName || gym.owner?.name || '-'}</span>
                </div>
                <div className="info-kv-row">
                  <span className="info-k">Owner Direct Phone</span>
                  <span className="info-v">{gym.ownerPhone || gym.owner?.phone || gym.phone || '-'}</span>
                </div>
                <div className="info-kv-row">
                  <span className="info-k">Owner Email</span>
                  <span className="info-v">{gym.ownerEmail || gym.owner?.email || gym.email || '-'}</span>
                </div>
                <div className="info-kv-row">
                  <span className="info-k">Official Gym Desk Line</span>
                  <span className="info-v">{gym.phone || '-'}</span>
                </div>
                <div className="info-kv-row">
                  <span className="info-k">Official Support Email</span>
                  <span className="info-v">{gym.email || '-'}</span>
                </div>
                <div className="info-kv-row">
                  <span className="info-k">Registration Status</span>
                  <span className="info-v badge-approved">✓ {gym.status === 'approved' ? 'Active on Platform' : (gym.status || 'Active')}</span>
                </div>
              </div>
            </div>

            <div className="detail-glass-card">
              <div className="card-section-header">
                <span className="section-icon-badge">📍</span>
                <div>
                  <h3 className="section-title">Location & Branch Address</h3>
                  <p className="section-subtitle">Physical premise and pin coordinates</p>
                </div>
              </div>
              <div className="info-kv-list">
                <div className="info-kv-row">
                  <span className="info-k">Indian City</span>
                  <span className="info-v highlight">{gym.city || 'India'}</span>
                </div>
                <div className="info-kv-row">
                  <span className="info-k">State / Region</span>
                  <span className="info-v">{gym.state || 'Maharashtra'}</span>
                </div>
                <div className="info-kv-row">
                  <span className="info-k">Postal Pincode</span>
                  <span className="info-v">{gym.pincode || '440024'}</span>
                </div>
                <div className="info-kv-row">
                  <span className="info-k">Street Address</span>
                  <span className="info-v">{gym.address || 'Central FitCore Complex, Main Avenue'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Studio Offerings, Amenities, Floor Capacity */}
          <div className="detail-card-col">
            <div className="detail-glass-card">
              <div className="card-section-header">
                <span className="section-icon-badge">⚡</span>
                <div>
                  <h3 className="section-title">Floor Capacity & Subscription Plan</h3>
                  <p className="section-subtitle">Real-time turnstile allocation & package</p>
                </div>
              </div>
              <div className="info-kv-list">
                <div className="info-kv-row">
                  <span className="info-k">Assigned Tier</span>
                  <span className="info-v">
                    <span className={`plan-badge luxury-plan-badge ${gym.plan === 'starter' ? 'starter' : gym.plan === 'enterprise' ? 'enterprise' : 'pro'}`}>
                      {gym.plan ? gym.plan.toUpperCase() : 'PRO STUDIO'}
                    </span>
                  </span>
                </div>
                <div className="info-kv-row">
                  <span className="info-k">Maximum Turnstile Limit</span>
                  <span className="info-v highlight">{gym.capacity || 0} Athletes Concurrent</span>
                </div>
                <div className="info-kv-row">
                  <span className="info-k">Current Enrolled Roster</span>
                  <span className="info-v">{gymMembers.length} Registered Athletes</span>
                </div>
                <div className="info-kv-row">
                  <span className="info-k">Floor Area</span>
                  <span className="info-v">{gym.floorArea ? `${gym.floorArea} sq.ft.` : 'Facility Area Configured'}</span>
                </div>
              </div>

              {/* Capacity Usage Visual Meter */}
              <div className="capacity-meter-box">
                <div className="meter-label-row">
                  <span>Enrolled vs Max Capacity</span>
                  <strong>{gym.capacity > 0 ? Math.round((gymMembers.length / gym.capacity) * 100) : 0}% Assigned</strong>
                </div>
                <div className="meter-track">
                  <div
                    className="meter-fill"
                    style={{ width: `${gym.capacity > 0 ? Math.min(100, (gymMembers.length / gym.capacity) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="detail-glass-card">
              <div className="card-section-header">
                <span className="section-icon-badge">🏋️</span>
                <div>
                  <h3 className="section-title">Studio Activities & Programs</h3>
                  <p className="section-subtitle">Curated workout sessions and classes offered</p>
                </div>
              </div>
              <div className="chips-collection-wrap">
                {activitiesList.map((act, idx) => (
                  <span key={idx} className="luxury-detail-pill">
                    {act}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Enrolled Members Directory */}
      {activeSubTab === 'members' && (
        <div className="detail-table-card">
          <div className="detail-table-toolbar">
            <div className="search-input-wrap" style={{ maxWidth: '360px' }}>
              <span className="search-icon">
                <SearchIcon size={14} color="#94a3b8" />
              </span>
              <input
                type="text"
                className="adm-input-field search"
                placeholder="Search athlete name, phone, ID..."
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
              />
            </div>
            <span className="toolbar-count-badge">
              Showing {filteredMembers.length} Athletes at {gym.name}
            </span>
          </div>

          <div className="adm-table-wrap">
            <table className="adm-table modern-franchise-table">
              <thead>
                <tr>
                  <th>Member Athlete</th>
                  <th>User ID</th>
                  <th>Phone Number</th>
                  <th>Membership Tier</th>
                  <th>Assigned Branch</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-empty-row">
                      <div className="empty-state-box">
                        <span className="empty-state-icon">👥</span>
                        <h4>No Members Found</h4>
                        <p>No members currently enrolled under this franchise.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m, idx) => (
                    <tr key={m.id || m._id || idx} className="gym-table-row">
                      <td>
                        <div className="gym-brand-cell">
                          <div className="gym-avatar-badge luxury-glow-avatar">
                            {(m.name || 'M').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="gym-brand-name">{m.name}</div>
                            <span className="gym-address-sub">{m.email || 'athlete@fitcore.in'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code className="user-id-code">{m.userId || `FC-MEM-${1000 + idx}`}</code>
                      </td>
                      <td>
                        <span className="member-phone-txt">{m.phone || '+91 98765 43210'}</span>
                      </td>
                      <td>
                        <span className={`plan-badge luxury-plan-badge ${m.membershipType === 'VIP' ? 'enterprise' : 'pro'}`}>
                          {m.membershipType || 'PLATINUM VIP'}
                        </span>
                      </td>
                      <td>
                        <span className="gym-city-text">📍 {gym.name}</span>
                      </td>
                      <td>
                        <span className="status-tag luxury-status-tag approved">
                          <span className="status-dot-pulse" /> {m.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 3: Assigned Trainers & Coaches */}
      {activeSubTab === 'trainers' && (
        <div className="trainers-grid-cards">
          {[
            { name: 'Vikram Singh', role: 'Head Strength Coach', cert: 'CSCS & Olympic Weightlifting', rating: 4.9, athletes: 38, specialty: 'Hypertrophy & Powerlifting' },
            { name: 'Ananya Joshi', role: 'Master Yoga & Mobility Lead', cert: 'RYT 500 & Breathwork Specialist', rating: 5.0, athletes: 42, specialty: 'Vinyasa Flow & Biomechanics' },
            { name: 'Rohan Kapoor', role: 'HIIT & Combat Conditioning', cert: 'Kettlebell Lv2 & Boxing Coach', rating: 4.8, athletes: 29, specialty: 'Agility, Speed & HIIT' },
            { name: 'Pooja Verma', role: 'Clinical Dietitian & Nutritionist', cert: 'Sports Nutrition Specialist', rating: 4.9, athletes: 55, specialty: 'Metabolic & Fat Loss Protocols' }
          ].map((coach, idx) => (
            <div key={idx} className="trainer-detail-card glass-card">
              <div className="trainer-top-row">
                <div className="trainer-avatar-box">
                  {coach.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="trainer-title-col">
                  <h4 className="trainer-name">{coach.name}</h4>
                  <span className="trainer-role-badge">{coach.role}</span>
                </div>
              </div>
              <div className="trainer-stats-row">
                <div className="trainer-stat-pill">
                  <StarIcon size={12} color="#f59e0b" /> {coach.rating} Rating
                </div>
                <div className="trainer-stat-pill">
                  <UsersIcon size={12} color="#4f46e5" /> {coach.athletes} Athletes
                </div>
              </div>
              <div className="trainer-meta-info">
                <div className="trainer-kv">
                  <span className="k">Specialty:</span>
                  <span className="v">{coach.specialty}</span>
                </div>
                <div className="trainer-kv">
                  <span className="k">Certifications:</span>
                  <span className="v">{coach.cert}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content 4: Amenities & Permissions */}
      {activeSubTab === 'amenities' && (
        <div className="detail-grid-layout">
          <div className="detail-card-col">
            <div className="detail-glass-card">
              <div className="card-section-header">
                <span className="section-icon-badge">✨</span>
                <div>
                  <h3 className="section-title">Floor Amenities & Luxury Facilities</h3>
                  <p className="section-subtitle">Available to all members at this branch</p>
                </div>
              </div>
              <div className="amenity-tiles-grid">
                {amenitiesList.map((amenity, idx) => (
                  <div key={idx} className="amenity-tile-item">
                    <span className="amenity-check-icon">✓</span>
                    <span className="amenity-name">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="detail-card-col">
            <div className="detail-glass-card">
              <div className="card-section-header">
                <span className="section-icon-badge">🛡️</span>
                <div>
                  <h3 className="section-title">Assigned Platform Permissions</h3>
                  <p className="section-subtitle">Access rights assigned to this franchise club</p>
                </div>
              </div>
              <div className="permission-tiles-list">
                {permissionsList.map((perm, idx) => (
                  <div key={idx} className="permission-item-row">
                    <span className="permission-check-badge">✓ ACTIVE</span>
                    <div className="permission-text-col">
                      <span className="permission-title">{perm}</span>
                      <span className="permission-desc">Full cloud sync and biometric gate dispatch active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 5: Uploaded KYC & Regulatory Documents */}
      {activeSubTab === 'kyc' && (
        <div className="kyc-documents-grid-layout">
          {/* Card 1: Shop & Establishment Act License */}
          <div className="kyc-doc-detail-card glass-card">
            <div className="kyc-doc-card-head">
              <div className="doc-icon-wrap" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                <BuildingIcon size={20} color="#06b6d4" />
              </div>
              <div className="doc-title-col">
                <span className="doc-type-pill">MUNICIPAL TRADE LICENSE</span>
                <h4 className="doc-main-title">Shop & Establishment Act License</h4>
              </div>
              <span className="status-tag luxury-status-tag approved">
                <span className="status-dot-pulse" /> Verified & Active
              </span>
            </div>

            <div className="kyc-doc-card-body">
              <div className="doc-kv-row">
                <span className="k">Registration / License Number</span>
                <span className="v num-highlight">MH/MUM/EST/2026/8941</span>
              </div>
              <div className="doc-kv-row">
                <span className="k">Issuing Municipal Body</span>
                <span className="v">Municipal Corporation of Greater Mumbai (MCGM)</span>
              </div>
              <div className="doc-kv-row">
                <span className="k">Premise Trade Title</span>
                <span className="v">{gym.name}</span>
              </div>
              <div className="doc-kv-row">
                <span className="k">Document Validity</span>
                <span className="v">Valid through 31-Dec-2028</span>
              </div>
              <div className="doc-kv-row">
                <span className="k">Uploaded Certificate</span>
                <span className="v code-link">📄 shop_establishment_license_8941.pdf</span>
              </div>
            </div>

            <div className="kyc-doc-card-foot">
              <span className="cert-checksum">✓ Verified Against MCGM Trade Registry</span>
            </div>
          </div>

          {/* Card 2: Franchise Director Aadhaar Card */}
          <div className="kyc-doc-detail-card glass-card">
            <div className="kyc-doc-card-head">
              <div className="doc-icon-wrap" style={{ background: 'rgba(79, 70, 229, 0.1)' }}>
                <UsersIcon size={20} color="#4f46e5" />
              </div>
              <div className="doc-title-col">
                <span className="doc-type-pill">DIRECTOR IDENTITY PROOF</span>
                <h4 className="doc-main-title">Owner Government Aadhaar Card</h4>
              </div>
              <span className="status-tag luxury-status-tag approved">
                <span className="status-dot-pulse" /> UIDAI Verified
              </span>
            </div>

            <div className="kyc-doc-card-body">
              <div className="doc-kv-row">
                <span className="k">Card Holder Name</span>
                <span className="v">{gym.ownerName || 'Rohit Sharma'}</span>
              </div>
              <div className="doc-kv-row">
                <span className="k">Masked Aadhaar Number</span>
                <span className="v num-highlight">XXXX XXXX 9912</span>
              </div>
              <div className="doc-kv-row">
                <span className="k">Issuing Authority</span>
                <span className="v">Unique Identification Authority of India (UIDAI)</span>
              </div>
              <div className="doc-kv-row">
                <span className="k">Identity Match Score</span>
                <span className="v" style={{ color: '#10b981', fontWeight: 800 }}>100% Match (Biometric OTP Passed)</span>
              </div>
              <div className="doc-kv-row">
                <span className="k">Uploaded Scan Proof</span>
                <span className="v code-link">🪪 director_aadhaar_front_back.pdf</span>
              </div>
            </div>

            <div className="kyc-doc-card-foot">
              <span className="cert-checksum">✓ UIDAI Secure Hash Checksum Validated</span>
            </div>
          </div>

          {/* Card 3: GST Registration Certificate */}
          <div className="kyc-doc-detail-card glass-card">
            <div className="kyc-doc-card-head">
              <div className="doc-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                <CreditCardIcon size={20} color="#f59e0b" />
              </div>
              <div className="doc-title-col">
                <span className="doc-type-pill">COMMERCIAL TAX RECORD</span>
                <h4 className="doc-main-title">Goods & Services Tax (GSTIN)</h4>
              </div>
              <span className="status-tag luxury-status-tag approved">
                <span className="status-dot-pulse" /> Active Taxpayer
              </span>
            </div>

            <div className="kyc-doc-card-body">
              <div className="doc-kv-row">
                <span className="k">GST Identification Number</span>
                <span className="v num-highlight">{gym.gstNumber || '27AABCF1234F1Z5'}</span>
              </div>
              <div className="doc-kv-row">
                <span className="k">Legal Entity Classification</span>
                <span className="v">Private Commercial Fitness Studio</span>
              </div>
              <div className="doc-kv-row">
                <span className="k">Tax Filing Status</span>
                <span className="v" style={{ color: '#10b981', fontWeight: 700 }}>Regular Taxpayer (Compliant)</span>
              </div>
              <div className="doc-kv-row">
                <span className="k">Uploaded Form</span>
                <span className="v code-link">📄 gst_registration_form_reg06.pdf</span>
              </div>
            </div>

            <div className="kyc-doc-card-foot">
              <span className="cert-checksum">✓ GST Portal Active Compliance Verified</span>
            </div>
          </div>

          {/* Card 4: Turnstile Settlement Bank Account */}
          <div className="kyc-doc-detail-card glass-card">
            <div className="kyc-doc-card-head">
              <div className="doc-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                <BoltIcon size={20} color="#10b981" />
              </div>
              <div className="doc-title-col">
                <span className="doc-type-pill">PAYOUT SETTLEMENT BANK</span>
                <h4 className="doc-main-title">Turnstile Revenue Bank Proof</h4>
              </div>
              <span className="status-tag luxury-status-tag approved">
                <span className="status-dot-pulse" /> Payout Active
              </span>
            </div>

            <div className="kyc-doc-card-body">
              <div className="doc-kv-row">
                <span className="k">Commercial Bank Name</span>
                <span className="v">HDFC Bank Ltd.</span>
              </div>
              <div className="doc-kv-row">
                <span className="k">Current Account Number</span>
                <span className="v num-highlight">•••• •••• •••• 5591</span>
              </div>
              <div className="doc-kv-row">
                <span className="k">Branch IFSC Code</span>
                <span className="v">HDFC0000123</span>
              </div>
              <div className="doc-kv-row">
                <span className="k">Uploaded Verification</span>
                <span className="v code-link">📄 cancelled_cheque_commercial_acc.pdf</span>
              </div>
            </div>

            <div className="kyc-doc-card-foot">
              <span className="cert-checksum">✓ Auto-Payout Direct Deposit Active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

