import React, { useState } from 'react';
import './SuperAdminDashboard.css';
import NotificationsView from './views/NotificationsView.jsx';

import { API_ENDPOINTS } from '../config/api';
import {
  BoltIcon,
  BuildingIcon,
  UsersIcon,
  ShieldCheckIcon,
  StoreIcon,
  BellIcon,
  ServerIcon,
  DatabaseIcon,
  LogoutIcon,
  SearchIcon,
  LocationPinIcon,
  CreditCardIcon,
  MenuIcon,
  CloseIcon
} from './common/Icons';

// Super Admin Views
import NextGenGymHubView from './views/NextGenGymHubView.jsx';
import SuperAdminGymsView from './views/SuperAdminGymsView.jsx';
import SuperAdminMembersView from './views/SuperAdminMembersView.jsx';
import SuperAdminKycView from './views/SuperAdminKycView.jsx';
import SuperAdminVendorsView from './views/SuperAdminVendorsView.jsx';
import SuperAdminRevenueView from './views/SuperAdminRevenueView.jsx';
import FranchiseDetailView from './views/FranchiseDetailView.jsx';
import SuperAdminProfileView from './views/SuperAdminProfileView.jsx';
import GymAdminDashboard from './GymAdminDashboard.jsx';

const INITIAL_TRAINERS = [];
const INITIAL_PLANS = [];
const INITIAL_CLASSES = [];
const INITIAL_NOTIFICATIONS = [];

export default function Dashboard({ onLogout }) {
  const storedUser = JSON.parse(localStorage.getItem('fitcore_user') || '{}');
  const userRole = storedUser.role || 'super_admin';

  // Human-readable role label
  const roleLabels = {
    super_admin: 'Super Administrator',
    admin: 'Administrator',
    gym_owner: 'Gym Owner',
    owner: 'Gym Owner',
    gym_admin: 'Gym Admin',
    member: 'Member',
    vendor: 'Vendor',
  };
  const roleLabel = roleLabels[userRole] || 'Gym Owner';

  // Avatar initial from stored user, fallback to first letter of name
  const avatarInitial = storedUser.avatar || (storedUser.name ? storedUser.name.slice(0,2).toUpperCase() : 'AD');

  // Central states from the database
  const [gyms, setGyms] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedGymId, setSelectedGymId] = useState('all');
  const [inspectedGym, setInspectedGym] = useState(null);
  const [showGymDropdown, setShowGymDropdown] = useState(false);
  const gymDropdownRef = React.useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Centralized notifications and trainers
  const [trainers] = useState(INITIAL_TRAINERS);
  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [classes] = useState(INITIAL_CLASSES);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (gymDropdownRef.current && !gymDropdownRef.current.contains(e.target)) {
        setShowGymDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamically generated menus with clean vector SVG icons
  const superAdminMenu = [
    { id: 'dashboard', label: 'Studio Command Hub', icon: <BoltIcon size={18} color="currentColor" /> },
    { id: 'gyms', label: 'Franchise Gyms', icon: <BuildingIcon size={18} color="currentColor" /> },
    { id: 'revenue', label: 'Platform SaaS Revenue', icon: <CreditCardIcon size={18} color="currentColor" /> },
    { id: 'members', label: 'Members Network', icon: <UsersIcon size={18} color="currentColor" /> },
    { id: 'kyc', label: 'KYC Verification', icon: <ShieldCheckIcon size={18} color="currentColor" /> },
    { id: 'vendors', label: 'Partner Stores', icon: <StoreIcon size={18} color="currentColor" /> },
    { id: 'notifications', label: 'Broadcast Alerts', icon: <BellIcon size={18} color="currentColor" /> },
    { id: 'profile', label: 'Admin Security Profile', icon: <ShieldCheckIcon size={18} color="currentColor" /> },
  ];

  const menuItems = superAdminMenu;

  const fetchData = async () => {
    try {
      setError('');

      const token = localStorage.getItem('fitcore_token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const [gymsRes, membersRes, vendorsRes, notifsRes, configRes] = await Promise.all([
        fetch(API_ENDPOINTS.ADMIN_GYMS, { headers }),
        fetch(API_ENDPOINTS.ADMIN_MEMBERS, { headers }),
        fetch(API_ENDPOINTS.ADMIN_VENDORS, { headers }),
        fetch(API_ENDPOINTS.NOTIFICATIONS, { headers }),
        fetch(API_ENDPOINTS.ADMIN_CONFIG, { headers })
      ]);

      const [gymsData, membersData, vendorsData, notifsData, configData] = await Promise.all([
        gymsRes.ok ? gymsRes.json() : { success: false, data: [] },
        membersRes.ok ? membersRes.json() : { success: false, data: [] },
        vendorsRes.ok ? vendorsRes.json() : { success: false, data: [] },
        notifsRes.ok ? notifsRes.json() : { success: false, data: [] },
        configRes.ok ? configRes.json() : { success: false, data: {} }
      ]);

      if (gymsData.success && Array.isArray(gymsData.data)) {
        setGyms(gymsData.data);
      }
      if (membersData.success && Array.isArray(membersData.data)) {
        setMembers(membersData.data);
      }
      if (vendorsData.success && Array.isArray(vendorsData.data)) {
        setVendors(vendorsData.data);
      }
      if (notifsData.success && Array.isArray(notifsData.data)) {
        setNotifications(notifsData.data);
      }
      if (configData.success && configData.data?.packages) {
        setPlans(configData.data.packages);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      setError('Failed to connect to the backend server. Please verify the API is running on port 7000.');
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    let isMounted = true;
    const initFetch = async () => {
      try {
        const token = localStorage.getItem('fitcore_token');
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };

        const [gymsRes, membersRes, vendorsRes, notifsRes, configRes] = await Promise.all([
          fetch(API_ENDPOINTS.ADMIN_GYMS, { headers }),
          fetch(API_ENDPOINTS.ADMIN_MEMBERS, { headers }),
          fetch(API_ENDPOINTS.ADMIN_VENDORS, { headers }),
          fetch(API_ENDPOINTS.NOTIFICATIONS, { headers }),
          fetch(API_ENDPOINTS.ADMIN_CONFIG, { headers })
        ]);

        const [gymsData, membersData, vendorsData, notifsData, configData] = await Promise.all([
          gymsRes.ok ? gymsRes.json() : { success: false, data: [] },
          membersRes.ok ? membersRes.json() : { success: false, data: [] },
          vendorsRes.ok ? vendorsRes.json() : { success: false, data: [] },
          notifsRes.ok ? notifsRes.json() : { success: false, data: [] },
          configRes.ok ? configRes.json() : { success: false, data: {} }
        ]);

        if (isMounted) {
          if (gymsData.success && Array.isArray(gymsData.data)) setGyms(gymsData.data);
          if (membersData.success && Array.isArray(membersData.data)) setMembers(membersData.data);
          if (vendorsData.success && Array.isArray(vendorsData.data)) setVendors(vendorsData.data);
          if (notifsData.success && Array.isArray(notifsData.data)) setNotifications(notifsData.data);
          if (configData.success && configData.data?.packages) setPlans(configData.data.packages);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading dashboard:', err);
          setError('Failed to connect to the backend server. Please verify the API is running on port 7000.');
          setIsLoading(false);
        }
      }
    };
    initFetch();
    return () => { isMounted = false; };
  }, []);

  const handleInspectGym = (gym) => {
    setInspectedGym(gym);
    setActiveTab('gym-detail');
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <NextGenGymHubView 
            gyms={gyms} 
            vendors={vendors} 
            members={members} 
            trainers={trainers}
            classes={classes}
            plans={plans}
            selectedGymId={selectedGymId}
            setSelectedGymId={setSelectedGymId}
            setTab={setActiveTab} 
            onRefresh={fetchData} 
            onInspectGym={handleInspectGym}
          />
        );
      case 'gyms':
        return (
          <SuperAdminGymsView 
            gyms={gyms} 
            setGyms={setGyms} 
            members={members} 
            onRefresh={fetchData} 
            onInspectGym={handleInspectGym}
          />
        );
      case 'gym-detail':
        return (
          <FranchiseDetailView 
            gym={inspectedGym || gyms[0]} 
            members={members} 
            trainers={trainers} 
            onBack={() => setActiveTab('gyms')} 
            onEditGym={() => {
              setActiveTab('gyms');
            }}
          />
        );
      case 'revenue':
        return <SuperAdminRevenueView gyms={gyms} plans={plans} onRefresh={fetchData} setTab={setActiveTab} />;
      case 'members':
        return <SuperAdminMembersView members={members} setMembers={setMembers} gyms={gyms} plans={plans} />;
      case 'kyc':
        return <SuperAdminKycView vendors={vendors} gyms={gyms} members={members} setVendors={setVendors} onRefresh={fetchData} />;
      case 'vendors':
        return <SuperAdminVendorsView vendors={vendors} setVendors={setVendors} onRefresh={fetchData} />;
      case 'notifications':
        return <NotificationsView notifications={notifications} setNotifications={setNotifications} members={members} trainers={trainers} />;
      case 'profile':
        return (
          <SuperAdminProfileView 
            onProfileUpdated={() => {
              if (typeof fetchData === 'function') fetchData();
            }} 
          />
        );
      default:
        return (
          <NextGenGymHubView 
            gyms={gyms} 
            vendors={vendors} 
            members={members} 
            trainers={trainers}
            classes={classes}
            selectedGymId={selectedGymId}
            setSelectedGymId={setSelectedGymId}
            setTab={setActiveTab} 
            onRefresh={fetchData} 
            onInspectGym={handleInspectGym}
          />
        );
    }
  };

  // Role-based access: admin, gym_owner, owner or gym_admin role -> Gym Admin Dashboard only
  if (userRole === 'admin' || userRole === 'gym_owner' || userRole === 'gym_admin' || userRole === 'owner') {
    return (
      <GymAdminDashboard
        user={storedUser}
        allGyms={gyms}
        onLogout={onLogout}
      />
    );
  }

  // super_admin role -> Super Admin Dashboard only (no switching)

  return (
    <div className="adm-dashboard-root">
      {/* Mobile Backdrop Overlay */}
      {isMobileNavOpen && (
        <div 
          className="adm-mobile-backdrop active" 
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <aside className={`adm-sidebar ${isMobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="adm-logo-area">
          <div className="adm-logo-text">
            FitCore <span className="adm-logo-dot" />
          </div>
          <button 
            className="adm-mobile-close-btn"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Close Sidebar"
          >
            <CloseIcon size={18} color="#64748b" />
          </button>
        </div>

        <nav className="adm-nav-list">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`adm-nav-item ${(activeTab === item.id || (item.id === 'gyms' && activeTab === 'gym-detail')) ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileNavOpen(false);
              }}
            >
              <span className="adm-nav-icon-wrap">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-divider" />

        <div className="adm-sidebar-footer">
          <div className="adm-system-badge">
            <h4>Ecosystem Status</h4>
            <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ServerIcon size={13} color="#10b981" /> Server: Healthy
            </p>
            <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DatabaseIcon size={13} color="#10b981" /> MongoDB: Connected
            </p>
            <p style={{ marginTop: '4px', fontSize: '9px', opacity: 0.6 }}>Console: v1.2.0</p>
          </div>

          <button className="adm-nav-item logout-btn" onClick={onLogout} style={{ marginTop: '16px', justifyContent: 'center', backgroundColor: 'var(--adm-accent-sage-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogoutIcon size={15} color="currentColor" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Viewport Container */}
      <div className="adm-main-body">
        {/* Unified Single Top Header */}
        <header className="adm-header">
          <div className="adm-header-left">
            {/* Hamburger button for mobile */}
            <button 
              className="adm-mobile-menu-trigger" 
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              aria-label="Open Navigation Menu"
            >
              <MenuIcon size={20} color="#0f172a" />
            </button>

            <div className="adm-search-wrap">
              <span className="adm-search-icon">
                <SearchIcon size={14} color="#94a3b8" />
              </span>
              <input type="text" className="adm-search-input" placeholder="Global system search..." />
            </div>

            {/* Custom Luxury Franchise Switcher Dropdown */}
            {(() => {
              const selectedGym = gyms.find(g => (g.id === selectedGymId || g._id === selectedGymId));
              return (
                <div className="custom-franchise-dropdown-wrap" ref={gymDropdownRef}>
                  <button 
                    type="button"
                    className={`custom-franchise-trigger ${showGymDropdown ? 'active' : ''}`}
                    onClick={() => setShowGymDropdown(!showGymDropdown)}
                  >
                    <div className="trigger-icon-box">
                      <BuildingIcon size={16} color={selectedGymId === 'all' ? '#4f46e5' : '#06b6d4'} />
                    </div>
                    <div className="trigger-text-block">
                      <span className="trigger-sub-label">FRANCHISE LOCATION</span>
                      <span className="trigger-main-title">
                        {selectedGym ? selectedGym.name : `All Indian Franchises (${gyms.length} Clubs)`}
                      </span>
                    </div>
                    <span className={`trigger-chevron ${showGymDropdown ? 'rotated' : ''}`}>▾</span>
                  </button>

                  {showGymDropdown && (
                    <div className="custom-franchise-menu animate-dropdown-fade">
                      <div className="franchise-menu-header">
                        <span>SELECT CLUB LOCATION</span>
                        <span className="franchise-count-tag">{gyms.length} Clubs</span>
                      </div>

                      <div className="franchise-options-list">
                        {/* All Franchises Option */}
                        <div 
                          className={`franchise-option-item ${selectedGymId === 'all' ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedGymId('all');
                            setShowGymDropdown(false);
                          }}
                        >
                          <div className="opt-avatar all-india">
                            <BuildingIcon size={15} color="#4f46e5" />
                          </div>
                          <div className="opt-meta">
                            <span className="opt-name">All Indian Franchises Network</span>
                            <span className="opt-sub">Aggregated Pan-India Telemetry ({gyms.length} Clubs)</span>
                          </div>
                          {selectedGymId === 'all' && <span className="opt-check">✓</span>}
                        </div>

                        <div className="franchise-menu-divider" />

                        {/* Individual Gyms */}
                        {gyms.map((gym) => {
                          const gymId = gym.id || gym._id;
                          const isSelected = selectedGymId === gymId;
                          const initials = (gym.name || 'FC').substring(0, 2).toUpperCase();

                          return (
                            <div 
                              key={gymId}
                              className={`franchise-option-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                setSelectedGymId(gymId);
                                setShowGymDropdown(false);
                              }}
                            >
                              <div className="opt-avatar gym-avatar">{initials}</div>
                              <div className="opt-meta">
                                <span className="opt-name">{gym.name}</span>
                                <span className="opt-sub" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <LocationPinIcon size={11} color="#ef4444" /> {gym.city || 'India'} · {gym.capacity || 250} Cap · <em className="opt-plan">{(gym.plan || 'PRO').toUpperCase()}</em>
                                </span>
                              </div>
                              {isSelected && <span className="opt-check">✓</span>}
                            </div>
                          );
                        })}
                      </div>

                      <div className="franchise-menu-footer">
                        <button 
                          className="franchise-quick-onboard-btn"
                          onClick={() => {
                            setActiveTab('gyms');
                            setShowGymDropdown(false);
                          }}
                        >
                          <span>+ Register New Franchise</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="adm-header-right">


            <button className="hub-btn-glow header-onboard-btn" onClick={() => setActiveTab('gyms')}>
              <span>+ Onboard Franchise</span>
            </button>

            <div className="adm-clock">
              📅 {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            
            <div style={{ position: 'relative' }}>
              <div 
                className="adm-icon-btn" 
                onClick={() => setShowNotiDropdown(!showNotiDropdown)}
                style={{ cursor: 'pointer' }}
              >
                🔔
                {notifications.length > 0 && <span className="adm-icon-badge" />}
              </div>

              {showNotiDropdown && (
                <div className="adm-noti-dropdown">
                  <div className="adm-noti-header">
                    <h4>Broadcast Alerts</h4>
                    {notifications.length > 0 && (
                      <button 
                        className="adm-noti-clear-btn" 
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('fitcore_token');
                            const res = await fetch('http://localhost:7000/api/notifications/clear', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              }
                            });
                            if (res.ok) {
                              setNotifications([]);
                              alert('All notifications cleared!');
                            }
                          } catch (err) {
                            console.error('Error clearing notifications:', err);
                            alert('Error clearing notifications.');
                          }
                        }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="adm-noti-list">
                    {notifications.length === 0 ? (
                      <div className="adm-noti-empty">
                        <span style={{ fontSize: '24px' }}>🔔</span>
                        <span>No new notifications</span>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className="adm-noti-item"
                          onClick={() => {
                            alert(`Notification detail:\nTitle: ${n.title}\nMessage: ${n.message}\nTarget: ${n.target}\nChannel: ${n.type}`);
                            setShowNotiDropdown(false);
                          }}
                        >
                          <div className="adm-noti-title-row">
                            <span className="adm-noti-item-title">{n.title}</span>
                            <span className="adm-noti-item-time">{n.date}</span>
                          </div>
                          <p className="adm-noti-item-text">{n.message}</p>
                          <div className="adm-noti-item-badges">
                            <span className="adm-badge approved" style={{ fontSize: '8px', padding: '2px 6px' }}>{n.type}</span>
                            <span className="adm-badge pending" style={{ fontSize: '8px', padding: '2px 6px' }}>{n.target}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="adm-noti-footer">
                    <span 
                      className="adm-noti-viewall-btn" 
                      onClick={() => { setActiveTab('notifications'); setShowNotiDropdown(false); }}
                    >
                      View All Logs
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div 
              className={`adm-profile-badge ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
              style={{ cursor: 'pointer' }}
              title="Click to manage Super Admin Profile & Master Password"
            >
              <div className="adm-profile-avatar" style={{ background: '#4f46e5', color: '#ffffff', fontWeight: 800 }}>{avatarInitial}</div>
              <div className="adm-profile-info">
                <span className="adm-profile-name">{storedUser?.name || 'FitCore Admin'}</span>
                <span className="adm-profile-role">{roleLabel}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic viewport area */}
        <main className="adm-viewport">
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--adm-text-sub)' }}>
              <div className="loader" style={{ border: '4px solid var(--adm-border)', borderTop: '4px solid var(--adm-accent-sage)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '12px', fontWeight: '600' }}>Synchronizing Ecosystem Database...</p>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--adm-danger)' }}>
              <h2>⚠️ Database Sync Failed</h2>
              <p>{error}</p>
              <button className="adm-btn primary" onClick={fetchData} style={{ marginTop: '16px' }}>Retry Connection</button>
            </div>
          ) : (
            renderActiveView()
          )}
        </main>
      </div>
    </div>
  );
}
