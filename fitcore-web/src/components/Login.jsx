import React, { useState } from 'react';
import { LockIcon, EyeIcon, EyeOffIcon, AlertTriangleIcon } from './common/Icons.jsx';
import Card from './common/Card.jsx';
import Input from './common/Input.jsx';
import Button from './common/Button.jsx';
import bgVideo from '../assets/A_cinematic_luxury_fitness_club_named_FITCORE._The_video_begins_outside_a_stunning_modern_glass-fron_seed2324777742.mp4';
import { API_ENDPOINTS } from '../config/api.js';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Email address or Phone number is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;
    if (!emailRegex.test(email) && !phoneRegex.test(email)) {
      setError('Please enter a valid email address or 10-digit phone number.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setIsLoading(true);
    try {
      // Use general login endpoint for member and admin logins
      const response = await fetch(`${API_ENDPOINTS.AUTH_LOGIN || 'http://localhost:7000/api/auth/login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: email, password }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (!response.ok || !data.success) {
        setError(data.error || 'Incorrect credentials. Please try again.');
        return;
      }

      // Check if this is member's first login with temporary password
      if (data.user?.isFirstLogin || data.user?.mustChangePassword) {
        setShowSetPasswordModal(true);
        return;
      }

      // Save token and user details
      localStorage.setItem('fitcore_token', data.token);
      localStorage.setItem('fitcore_user', JSON.stringify(data.user));

      setSuccess(true);
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 1000);
    } catch (err) {
      setIsLoading(false);
      setError('Failed to connect to the backend server. Please verify the API is running on http://localhost:7000');
    }
  };

  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:7000/api/auth/set-first-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: email,
          tempPassword: password,
          newPassword: newPassword
        })
      });
      const data = await res.json();
      setIsLoading(false);

      if (res.ok && data.success) {
        setPasswordChangeSuccess(true);
        setTimeout(async () => {
          // Re-login with new password
          setPassword(newPassword);
          setShowSetPasswordModal(false);
          setPasswordChangeSuccess(false);
          
          const loginRes = await fetch('http://localhost:7000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: email, password: newPassword })
          });
          const loginData = await loginRes.json();
          if (loginRes.ok && loginData.success) {
            localStorage.setItem('fitcore_token', loginData.token);
            localStorage.setItem('fitcore_user', JSON.stringify(loginData.user));
            setSuccess(true);
            setTimeout(() => onLoginSuccess(loginData.user), 800);
          }
        }, 1200);
      } else {
        setError(data.error || 'Failed to update password.');
      }
    } catch {
      setIsLoading(false);
      setError('Network error updating password.');
    }
  };

  return (
    <div className="login-video-wrapper">
      {/* Background Video */}
      <video className="bg-video" autoPlay loop muted playsInline>
        <source src={bgVideo} type="video/mp4" />
      </video>

      {/* Dark tint overlay and centered card */}
      <div className="login-content-overlay">
        <Card>
          {/* Brand Header */}
          <div className="login-header">
            <div className="logo-container">
              <div className="brand-logo-badge">FC</div>
            </div>
            <h1 className="brand-title">FITCORE</h1>
            <p className="brand-tagline">Gym Portal</p>
            <div className="secure-badge">
              <span className="dot" /> SECURE GATEWAY
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-alert" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '13px', marginBottom: '16px' }}>
                <AlertTriangleIcon size={16} color="#ef4444" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="success-alert" role="alert">
                Access Granted. Redirecting...
              </div>
            )}

            <Input
              id="admin-email"
              label="Email Address or Phone Number"
              type="text"
              placeholder="e.g. fitcore@gmail.com or 9000000000"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || success}
              autoComplete="username"
              required
            />

            <Input
              id="admin-password"
              label="Password"
              icon={<LockIcon size={16} color="#94a3b8" />}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || success}
              autoComplete="current-password"
              required
              eyeAction={() => setShowPassword(!showPassword)}
              eyeIcon={showPassword ? <EyeOffIcon size={18} color="#94a3b8" /> : <EyeIcon size={18} color="#94a3b8" />}
              forgotLink={
                <a href="#forgot" className="forgot-link" onClick={(e) => e.preventDefault()}>
                  Forgot password?
                </a>
              }
            />

            <Button
              id="login-submit-btn"
              type="submit"
              className="submit-btn"
              isLoading={isLoading}
              disabled={isLoading || success}
            >
              {success ? 'Redirecting...' : 'Access Admin Portal →'}
            </Button>
          </form>
        </Card>
      </div>

      {/* First-Time Login Password Reset Modal */}
      {showSetPasswordModal && (
        <div className="admin-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '440px', width: '100%', padding: '30px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', color: '#0f172a' }}>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 10px auto' }}>🔒</div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 900 }}>Set Your New Password</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.4 }}>
                This is your first login. Please create a secure permanent password for your FitCore account.
              </p>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            {passwordChangeSuccess ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '14px', borderRadius: '12px', textAlign: 'center', fontWeight: 700, fontSize: '14px' }}>
                ✓ Password updated! Logging you in...
              </div>
            ) : (
              <form onSubmit={handleSetNewPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowSetPasswordModal(false)}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{ flex: 2, padding: '10px', borderRadius: '10px', background: '#4f46e5', border: 'none', color: '#ffffff', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {isLoading ? 'Saving...' : 'Set Password & Login →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
