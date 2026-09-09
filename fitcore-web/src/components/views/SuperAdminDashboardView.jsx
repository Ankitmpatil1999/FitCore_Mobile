import React, { useState, useEffect } from 'react';
import {
  BuildingIcon,
  UsersIcon,
  StoreIcon,
  ShieldCheckIcon,
  BarChartIcon
} from '../common/Icons';

function TypewriterText({ phrases = [
  "Ecosystem Control Console ⚡",
  "Alock Central Gym & Franchise Suite 🚀",
  "Real-Time Member, Store & KYC Network 💎",
  "Automated Compliance & License Audit 🛡️"
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

export default function SuperAdminDashboardView({ gyms, vendors, members, setTab }) {
  // Calculate aggregate metrics
  const totalGymsCount = gyms.length;
  const totalMembersCount = members.length;
  const totalVendorsCount = vendors.length;

  // Calculate pending KYC documents count from vendors
  const pendingKycCount = vendors.reduce((acc, v) => {
    const docs = v.kycDocuments || [];
    const pendingInVendor = docs.filter(d => d.status === 'pending').length;
    return acc + pendingInVendor;
  }, 0);

  // Calculate pending gym approvals
  const pendingGymsCount = gyms.filter(g => g.status === 'pending').length;

  // Get active members distribution by gym
  const gymStats = gyms.map(gym => {
    const gymMembers = members.filter(m => m.gymId === gym.id);
    return {
      name: gym.name,
      city: gym.city,
      membersCount: gymMembers.length,
      status: gym.status,
    };
  });

  return (
    <div className="adm-view-container">
      {/* Title Header */}
      <div className="adm-view-header-bar">
        <div className="adm-view-title">
          <h1 style={{ fontSize: '26px' }}>
            <TypewriterText />
          </h1>
          <p className="adm-view-subtitle">Central Verification and Franchise Operations Control Console</p>
        </div>
        <span className="adm-badge approved" style={{ fontSize: '12px', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheckIcon size={14} color="#10b981" /> System status: Healthy
        </span>
      </div>

      {/* KPI Metrics row */}
      <section className="adm-metrics-grid">
        <div className="adm-metric-card" onClick={() => setTab('gyms')}>
          <div>
            <div className="adm-metric-value">{totalGymsCount}</div>
            <div className="adm-metric-label">Franchise Gyms</div>
            <div className="adm-metric-subtext">{pendingGymsCount} pending approval</div>
          </div>
          <div className="adm-metric-icon-wrap" style={{ color: '#2e7d32' }}>
            <BuildingIcon size={24} color="#2e7d32" />
          </div>
        </div>

        <div className="adm-metric-card" onClick={() => setTab('members')}>
          <div>
            <div className="adm-metric-value">{totalMembersCount}</div>
            <div className="adm-metric-label">Active Members</div>
            <div className="adm-metric-subtext">Across {totalGymsCount} locations</div>
          </div>
          <div className="adm-metric-icon-wrap" style={{ color: '#1565c0' }}>
            <UsersIcon size={24} color="#1565c0" />
          </div>
        </div>

        <div className="adm-metric-card" onClick={() => setTab('vendors')}>
          <div>
            <div className="adm-metric-value">{totalVendorsCount}</div>
            <div className="adm-metric-label">Partner Stores</div>
            <div className="adm-metric-subtext">Verified vendor partners</div>
          </div>
          <div className="adm-metric-icon-wrap" style={{ color: '#ef6c00' }}>
            <StoreIcon size={24} color="#ef6c00" />
          </div>
        </div>

        <div className="adm-metric-card" onClick={() => setTab('kyc')}>
          <div>
            <div className="adm-metric-value">{pendingKycCount}</div>
            <div className="adm-metric-label">KYC Verifications</div>
            <div className="adm-metric-subtext">Aadhaar, PAN & licenses</div>
          </div>
          <div className="adm-metric-icon-wrap" style={{ color: '#c62828' }}>
            <ShieldCheckIcon size={24} color="#c62828" />
          </div>
        </div>
      </section>

      {/* Highlight Plan Banner */}
      <section className="adm-highlight-banner">
        <div className="adm-banner-bg-lines">
          <svg width="100%" height="100%" viewBox="0 0 1000 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M-100 150 C 200 50, 400 350, 1100 100" stroke="white" strokeWidth="1.5" strokeDasharray="10 10" />
            <path d="M-50 220 C 300 100, 500 280, 1200 180" stroke="white" strokeWidth="0.8" />
          </svg>
        </div>

        <div className="adm-banner-left">
          <div className="adm-banner-img-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChartIcon size={28} color="#ffffff" />
          </div>
          <div className="adm-banner-content">
            <span className="adm-banner-lbl">Expansion Targets</span>
            <h2 className="adm-banner-title">Nagpur Franchise Target Plan</h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
              <div className="adm-banner-progress-bar">
                <div className="adm-banner-progress-fill" style={{ width: '80%' }} />
              </div>
              <span className="adm-banner-progress-txt">80% of targets met</span>
            </div>
          </div>
        </div>

        <div className="adm-banner-right">
          <button className="adm-action-btn" onClick={() => alert('Synchronizing cloud logs across nodes...')}>
            Sync Databases
          </button>
        </div>
      </section>

      {/* Bottom Grid Breakdown */}
      <div className="adm-split-grid">
        {/* Table Panel */}
        <div className="adm-card-panel">
          <div className="adm-card-header">
            <h3 className="adm-card-title">Franchise Membership Breakdown</h3>
            <span className="adm-view-all" onClick={() => setTab('gyms')}>View all</span>
          </div>

          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Gym Name</th>
                  <th>City</th>
                  <th>Members</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {gymStats.map((gym, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '700' }}>{gym.name}</td>
                    <td>{gym.city}</td>
                    <td>
                      <div className="adm-progress-cell">
                        <span className="adm-progress-label">{gym.membersCount}</span>
                        <div className="adm-progress-bar-wrap">
                          <div 
                            className="adm-progress-bar-fill" 
                            style={{ width: `${Math.min((gym.membersCount / Math.max(totalMembersCount, 1)) * 100, 100)}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`adm-badge ${gym.status}`}>
                        {gym.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Panel */}
        <div className="adm-card-panel">
          <div className="adm-card-header">
            <h3 className="adm-card-title">Quick Actions</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="adm-action-item" onClick={() => setTab('kyc')}>
              <div className="adm-action-left">
                <div className="adm-action-icon">
                  <ShieldCheckIcon size={18} color="#c62828" />
                </div>
                <div>
                  <div className="adm-action-title">Verify KYC Submissions</div>
                  <div className="adm-action-sub">{pendingKycCount} pending documents verification</div>
                </div>
              </div>
              <div className="adm-arrow-btn">›</div>
            </div>

            <div className="adm-action-item" onClick={() => setTab('gyms')}>
              <div className="adm-action-left">
                <div className="adm-action-icon">
                  <BuildingIcon size={18} color="#2e7d32" />
                </div>
                <div>
                  <div className="adm-action-title">Franchise Registrations</div>
                  <div className="adm-action-sub">Verify and approve franchise licenses</div>
                </div>
              </div>
              <div className="adm-arrow-btn">›</div>
            </div>

            <div className="adm-action-item" onClick={() => setTab('vendors')}>
              <div className="adm-action-left">
                <div className="adm-action-icon">
                  <StoreIcon size={18} color="#ef6c00" />
                </div>
                <div>
                  <div className="adm-action-title">Store Partner Catalog</div>
                  <div className="adm-action-sub">Check listings and store statuses</div>
                </div>
              </div>
              <div className="adm-arrow-btn">›</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
