import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import {
  UsersIcon,
  ShieldCheckIcon,
  BoltIcon,
  CheckCircleIcon,
  EditIcon,
  MailIcon,
  PhoneIcon,
  BuildingIcon
} from '../common/Icons';

export default function SuperAdminProfileView({ onProfileUpdated }) {
  const getInitialUser = () => JSON.parse(localStorage.getItem('fitcore_user') || '{}');
  const storedUser = getInitialUser();
  
  // Profile form state
  const [name, setName] = useState(storedUser.name || 'FitCore Super Admin');
  const [email, setEmail] = useState(storedUser.email || 'admin@fitcore.in');
  const [phone, setPhone] = useState(
    storedUser.phone && /^\d+$/.test(storedUser.phone) ? storedUser.phone : '9999999999'
  );
  const [address, setAddress] = useState(storedUser.address || 'FitCore Technology HQ, Nagpur, Maharashtra');
  const [designation, setDesignation] = useState(storedUser.designation || 'Chief Platform Administrator');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // Status & Feedback
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastNotification({ message, type });
    setTimeout(() => setToastNotification(null), 4000);
  };

  // Load latest profile from database on mount
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('fitcore_token');
        const res = await fetch(API_ENDPOINTS.ADMIN_PROFILE, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        const data = await res.json();
        if (isMounted && data.success && data.data) {
          const u = data.data;
          if (u.name) setName(u.name);
          if (u.email) setEmail(u.email);
          if (u.phone) {
            const numOnly = u.phone.replace(/\D/g, '');
            setPhone(numOnly || '9999999999');
          }
          if (u.address) setAddress(u.address);
          if (u.designation) setDesignation(u.designation);
          
          // Update localStorage
          const curr = JSON.parse(localStorage.getItem('fitcore_user') || '{}');
          const updatedStorage = { ...curr, ...u };
          localStorage.setItem('fitcore_user', JSON.stringify(updatedStorage));
        }
      } catch (err) {
        console.error('Error fetching admin profile:', err);
      }
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, []);

  // Handle Profile Update Form Submission
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Full name is required.', 'error');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    setIsSavingProfile(true);
    try {
      const token = localStorage.getItem('fitcore_token');
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: cleanPhone,
        address: address.trim(),
        designation: designation.trim()
      };

      const res = await fetch(API_ENDPOINTS.ADMIN_PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setIsSavingProfile(false);

      if (res.ok && data.success) {
        showToast('Super Administrator profile details updated successfully! ✓', 'success');
        const updatedUser = { ...storedUser, ...data.data };
        localStorage.setItem('fitcore_user', JSON.stringify(updatedUser));
        if (typeof onProfileUpdated === 'function') {
          onProfileUpdated(updatedUser);
        }
      } else {
        showToast(data.error || 'Failed to update profile details.', 'error');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setIsSavingProfile(false);
      showToast('Network error connecting to backend API.', 'error');
    }
  };

  // Handle Password Change Form Submission
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match. Please re-type correctly.', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem('fitcore_token');
      const payload = {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim()
      };

      const res = await fetch(API_ENDPOINTS.ADMIN_CHANGE_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setIsChangingPassword(false);

      if (res.ok && data.success) {
        showToast('Account password changed successfully in Database! ✓', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordFields(false);
      } else {
        showToast(data.error || 'Failed to change account password.', 'error');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setIsChangingPassword(false);
      showToast('Network error while resetting password.', 'error');
    }
  };

  const avatarInitials = (name || 'Super Admin')
    .trim()
    .split(/\s+/)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const formattedPhone = phone.replace(/\D/g, '').length === 10
    ? `+91 ${phone.replace(/\D/g, '').slice(0, 5)} ${phone.replace(/\D/g, '').slice(5)}`
    : `+91 ${phone}`;

  return (
    <div className="adm-view-container superadmin-profile-view">
      {/* Toast Notification Banner */}
      {toastNotification && (
        <div className={`adm-toast-banner ${toastNotification.type}`}>
          <span className="toast-icon">{toastNotification.type === 'success' ? '✓' : '⚠️'}</span>
          <span className="toast-text">{toastNotification.message}</span>
          <button className="toast-close" onClick={() => setToastNotification(null)}>✕</button>
        </div>
      )}

      {/* Top Header */}
      <div className="adm-view-header-bar profile-header-bar">
        <div className="adm-view-title">
          <div className="title-with-pill">
            <h1>Super Administrator Profile & Security</h1>
            <span className="live-status-pill approved">
              <span className="status-dot-pulse" /> Root Admin Active
            </span>
          </div>
          <p className="adm-view-subtitle">Manage root security credentials, administrative contacts, and platform authority</p>
        </div>
      </div>

      {/* Hero Passport Profile Card */}
      <div className="admin-profile-hero-card">
        <div className="profile-hero-inner">
          <div className="profile-avatar-wrapper">
            <div className="profile-hero-avatar">
              {avatarInitials || 'SA'}
            </div>
            <div className="profile-role-dot" title="Root Super Administrator Online" />
          </div>

          <div className="profile-hero-details">
            <div className="profile-badge-row">
              <span className="admin-rank-badge">
                👑 ROOT SUPER ADMINISTRATOR
              </span>
              <span className="admin-verified-badge">
                <CheckCircleIcon size={13} color="#10b981" /> Full Ecosystem Authority
              </span>
              <span className="admin-designation-badge">
                💼 {designation || 'Chief Administrator'}
              </span>
            </div>
            
            <h2 className="profile-hero-name">{name}</h2>

            <div className="profile-meta-pills-row">
              <div className="profile-meta-item">
                <span className="meta-icon"><MailIcon size={14} color="#64748b" /></span>
                <span className="meta-text">{email}</span>
              </div>
              <div className="profile-meta-item">
                <span className="meta-icon"><PhoneIcon size={14} color="#64748b" /></span>
                <span className="meta-text">{formattedPhone}</span>
              </div>
              <div className="profile-meta-item location-item">
                <span className="meta-icon"><BuildingIcon size={14} color="#64748b" /></span>
                <span className="meta-text">{address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split Forms */}
      <div className="profile-forms-grid">
        {/* Left Column: Admin Profile Info */}
        <div className="profile-form-card">
          <div className="panel-header-custom">
            <div className="panel-icon-circle indigo">
              <UsersIcon size={18} color="#4f46e5" />
            </div>
            <div>
              <h3 className="panel-title-text">Administrator Account Details</h3>
              <p className="panel-subtitle-text">Update contact details, designation, and official HQ address</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="profile-form-body">
            <div className="profile-form-group">
              <label className="profile-input-label">Full Name *</label>
              <input 
                type="text" 
                name="name"
                autoComplete="name"
                className="profile-input-field" 
                placeholder="e.g. FitCore Root Administrator"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-input-label">Official Designation</label>
              <input 
                type="text" 
                name="designation"
                autoComplete="organization-title"
                className="profile-input-field" 
                placeholder="e.g. Chief Executive / Platform Director"
                value={designation} 
                onChange={(e) => setDesignation(e.target.value)} 
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-input-label">Registered Mobile Number (Login ID) *</label>
              <div className="input-with-prefix">
                <span className="input-prefix-tag">+91</span>
                <input 
                  type="tel" 
                  name="tel"
                  autoComplete="tel"
                  maxLength={10}
                  className="profile-input-field with-prefix" 
                  placeholder="9999999999 (10 Digits)"
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                  required 
                />
              </div>
            </div>

            <div className="profile-form-group">
              <label className="profile-input-label">Primary Notification Email</label>
              <input 
                type="email" 
                name="email"
                autoComplete="email"
                className="profile-input-field" 
                placeholder="e.g. admin@fitcore.in"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-input-label">Official Headquarters Address</label>
              <textarea 
                name="address"
                autoComplete="street-address"
                className="profile-input-field textarea-field" 
                rows="2"
                placeholder="e.g. FitCore Technology HQ, Civil Lines, Nagpur, Maharashtra - 440001"
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
              />
            </div>

            <div className="form-submit-row">
              <button 
                type="submit" 
                className="profile-save-btn"
                disabled={isSavingProfile}
              >
                <EditIcon size={15} color="#ffffff" />
                <span>{isSavingProfile ? 'Saving Changes to Database...' : 'Save Profile Changes ✓'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Security & Change Password */}
        <div className="profile-form-card">
          <div className="panel-header-custom">
            <div className="panel-icon-circle amber">
              <ShieldCheckIcon size={18} color="#d97706" />
            </div>
            <div>
              <h3 className="panel-title-text">Security & Password Management</h3>
              <p className="panel-subtitle-text">Change master password and encryption authentication</p>
            </div>
          </div>

          {/* Security Overview Callout */}
          <div className="profile-security-alert">
            <div className="security-alert-head">
              <BoltIcon size={16} color="#d97706" />
              <strong>Root Access Security Notice</strong>
            </div>
            <p className="security-alert-desc">
              Your Super Administrator account has master write and delete permissions over all franchise gyms, SaaS revenue packages, and user accounts. Please use a strong password.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="profile-form-body">
            <div className="profile-form-group">
              <label className="profile-input-label">Current Master Password *</label>
              <input 
                type={showPasswordFields ? 'text' : 'password'}
                name="current-password"
                autoComplete="current-password"
                className="profile-input-field" 
                placeholder="Enter current master password"
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)} 
                required 
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-input-label">New Master Password *</label>
              <input 
                type={showPasswordFields ? 'text' : 'password'}
                name="new-password"
                autoComplete="new-password"
                className="profile-input-field" 
                placeholder="Min 6 characters (e.g. FitCore@Master2026)"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-input-label">Confirm New Password *</label>
              <input 
                type={showPasswordFields ? 'text' : 'password'}
                name="confirm-new-password"
                autoComplete="new-password"
                className="profile-input-field" 
                placeholder="Re-type new master password"
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
            </div>

            <div className="password-options-row">
              <label className="show-password-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={showPasswordFields} 
                  onChange={(e) => setShowPasswordFields(e.target.checked)} 
                />
                <span>Show Passwords</span>
              </label>

              {newPassword && confirmPassword && (
                <span className={`password-match-status ${newPassword === confirmPassword ? 'match' : 'mismatch'}`}>
                  {newPassword === confirmPassword ? '✓ Passwords Match' : '✕ Passwords Do Not Match'}
                </span>
              )}
            </div>

            <div className="form-submit-row">
              <button 
                type="submit" 
                className="profile-password-btn"
                disabled={isChangingPassword}
              >
                <ShieldCheckIcon size={15} color="#ffffff" />
                <span>{isChangingPassword ? 'Updating Master Password...' : 'Update Master Password ✓'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
