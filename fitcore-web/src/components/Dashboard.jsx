import React, { useState } from 'react';
import './SuperAdminDashboard.css';
import DashboardView from './views/DashboardView.jsx';
import MembersView from './views/MembersView.jsx';
import TrainersView from './views/TrainersView.jsx';
import PlansView from './views/PlansView.jsx';
import AttendanceView from './views/AttendanceView.jsx';
import PaymentsView from './views/PaymentsView.jsx';
import WorkoutsView from './views/WorkoutsView.jsx';
import DietsView from './views/DietsView.jsx';
import ClassesView from './views/ClassesView.jsx';
import NotificationsView from './views/NotificationsView.jsx';
import ReportsView from './views/ReportsView.jsx';
import SettingsView from './views/SettingsView.jsx';
import ProfileView from './views/ProfileView.jsx';

import { API_ENDPOINTS, API_URL } from '../config/api';
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
  LocationPinIcon
} from './common/Icons';

// Super Admin Views
import NextGenGymHubView from './views/NextGenGymHubView.jsx';
import SuperAdminDashboardView from './views/SuperAdminDashboardView.jsx';
import SuperAdminGymsView from './views/SuperAdminGymsView.jsx';
import SuperAdminMembersView from './views/SuperAdminMembersView.jsx';
import SuperAdminKycView from './views/SuperAdminKycView.jsx';
import SuperAdminVendorsView from './views/SuperAdminVendorsView.jsx';
import FranchiseDetailView from './views/FranchiseDetailView.jsx';
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
    member: 'Member',
    vendor: 'Vendor',
  };
  const roleLabel = roleLabels[userRole] || 'Administrator';

  // Avatar initial from stored user, fallback to first letter of name
  const avatarInitial = storedUser.avatar || (storedUser.name ? storedUser.name.slice(0,2).toUpperCase() : 'AD');

  // Central states from the database
  const [gyms, setGyms] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedGymId, setSelectedGymId] = useState('all');
  const [showGymDropdown, setShowGymDropdown] = useState(false);
  const gymDropdownRef = React.useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Centralized notifications and trainers
  const [trainers, setTrainers] = useState(INITIAL_TRAINERS);
  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [classes, setClasses] = useState(INITIAL_CLASSES);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);

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

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('dashboard');

  const [gymConfig] = useState({
    name: 'FITCORE SYSTEM HUB',
    logo: '',
    hours: '06:00 AM - 10:00 PM',
    branches: 'Nagpur Franchises',
    subscription: 'Enterprise Active',
    taxRate: '18% GST',
    roles: roleLabel,
  });

  const [ownerProfile] = useState({
    name: storedUser.name || 'FitCore Admin',
    phone: storedUser.phone || '',
    role: roleLabel,
    email: storedUser.email || '',
    address: 'FitCore Headquarters'
  });

  // Dynamically generated menus with clean vector SVG icons
  const superAdminMenu = [
    { id: 'dashboard', label: 'Studio Command Hub', icon: <BoltIcon size={18} color="currentColor" /> },
    { id: 'gyms', label: 'Franchise Gyms', icon: <BuildingIcon size={18} color="currentColor" /> },
    { id: 'members', label: 'Members Network', icon: <UsersIcon size={18} color="currentColor" /> },
    { id: 'kyc', label: 'KYC Verification', icon: <ShieldCheckIcon size={18} color="currentColor" /> },
    { id: 'vendors', label: 'Partner Stores', icon: <StoreIcon size={18} color="currentColor" /> },
    { id: 'notifications', label: 'Broadcast Alerts', icon: <BellIcon size={18} color="currentColor" /> },
  ];

  const menuItems = superAdminMenu;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const token = localStorage.getItem('fitcore_token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const [gymsRes, membersRes, vendorsRes, notifsRes] = await Promise.all([
        fetch(API_ENDPOINTS.ADMIN_GYMS, { headers }),
        fetch(API_ENDPOINTS.ADMIN_MEMBERS, { headers }),
        fetch(API_ENDPOINTS.ADMIN_VENDORS, { headers }),
        fetch(API_ENDPOINTS.NOTIFICATIONS, { headers })
      ]);

      const [gymsData, membersData, vendorsData, notifsData] = await Promise.all([
        gymsRes.ok ? gymsRes.json() : { success: false, data: [] },
        membersRes.ok ? membersRes.json() : { success: false, data: [] },
        vendorsRes.ok ? vendorsRes.json() : { success: false, data: [] },
        notifsRes.ok ? notifsRes.json() : { success: false, data: [] }
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

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      setError('Failed to connect to the backend server. Please verify the API is running on port 7000.');
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
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
            onEditGym={(gym) => {
              setActiveTab('gyms');
            }}
          />
        );
      case 'members':
        return <SuperAdminMembersView members={members} setMembers={setMembers} gyms={gyms} plans={plans} />;
      case 'kyc':
        return <SuperAdminKycView vendors={vendors} setVendors={setVendors} onRefresh={fetchData} />;
      case 'vendors':
        return <SuperAdminVendorsView vendors={vendors} setVendors={setVendors} onRefresh={fetchData} />;
      case 'notifications':
        return <NotificationsView notifications={notifications} setNotifications={setNotifications} members={members} trainers={trainers} />;
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

  // Role-based access: admin, gym_owner or gym_admin role -> Gym Admin Dashboard only
  if (userRole === 'admin' || userRole === 'gym_owner' || userRole === 'gym_admin') {
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
      {/* Sidebar navigation */}
      <aside className="adm-sidebar">
        <div className="adm-logo-area">
          FitCore <span className="adm-logo-dot" />
        </div>

        <nav className="adm-nav-list">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`adm-nav-item ${(activeTab === item.id || (item.id === 'gyms' && activeTab === 'gym-detail')) ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
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

            <div className="adm-profile-badge">
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
