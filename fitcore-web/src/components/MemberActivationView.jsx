import React, { useState, useEffect } from 'react';
import { LockIcon, EyeIcon, EyeOffIcon, AlertTriangleIcon, ShieldCheckIcon } from './common/Icons.jsx';
import Card from './common/Card.jsx';
import Button from './common/Button.jsx';
import bgVideo from '../assets/A_cinematic_luxury_fitness_club_named_FITCORE._The_video_begins_outside_a_stunning_modern_glass-fron_seed2324777742.mp4';

const API_BASE = 'http://localhost:7000/api/auth';

export default function MemberActivationView({ token, onActivationSuccess, onCancel }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [memberData, setMemberData] = useState(null);

  // Stepper state: 'verify_otp' -> 'create_password' -> 'done'
  const [step, setStep] = useState('verify_otp');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState('');

  // Password fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 1. Verify token on load
  useEffect(() => {
    const verifyToken = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_BASE}/verify-activation?token=${encodeURIComponent(token)}`);
        const json = await res.json();
        if (res.ok && json.success) {
          setMemberData(json.data);
          // Automatically trigger OTP send on invitation open
          sendOtp(json.data.phone);
        } else {
          setError(json.error || 'Invalid or expired invitation link.');
        }
      } catch {
        setError('Failed to connect to server. Please check your internet connection.');
      } finally {
        setLoading(false);
      }
    };
    if (token) verifyToken();
  }, [token]);

  const sendOtp = async (phone) => {
    try {
      setOtpLoading(true);
      setError('');
      const targetPhone = phone || memberData?.phone;
      const res = await fetch(`${API_BASE}/send-activation-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, phone: targetPhone })
      });
      const json = await res.json();
      setOtpLoading(false);
      if (res.ok && json.success) {
        setOtpSent(true);
        if (json.devOtp) setDevOtpHint(json.devOtp);
      } else {
        setError(json.error || 'Failed to dispatch verification OTP.');
      }
    } catch {
      setOtpLoading(false);
      setError('Network error sending OTP.');
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification OTP.');
      return;
    }
    setError('');
    setStep('create_password');
  };

  const handleCreatePasswordAndActivate = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/complete-activation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          phone: memberData.phone,
          otp: otp.trim(),
          newPassword: password
        })
      });
      const json = await res.json();
      setSubmitting(false);

      if (res.ok && json.success) {
        setSuccess(true);
        localStorage.setItem('fitcore_token', json.token);
        localStorage.setItem('fitcore_user', JSON.stringify(json.user));
        setTimeout(() => {
          if (onActivationSuccess) {
            onActivationSuccess(json.user);
          } else {
            window.location.href = '/';
          }
        }, 1500);
      } else {
        setError(json.error || 'Account activation failed.');
      }
    } catch {
      setSubmitting(false);
      setError('Network error during activation.');
    }
  };

  return (
    <div className="login-video-wrapper">
      <video className="bg-video" autoPlay loop muted playsInline>
        <source src={bgVideo} type="video/mp4" />
      </video>

      <div className="login-content-overlay" style={{ justifyContent: 'center', padding: '20px' }}>
        <Card>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#ffffff' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 16px auto', width: '36px', height: '36px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Verifying Your Invitation...</h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Connecting to your club server</p>
            </div>
          ) : error && !memberData ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#ffffff' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', margin: '0 auto 14px auto', border: '1px solid rgba(239, 68, 68, 0.4)' }}>⚠️</div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>Invitation Link Invalid</h3>
              <p style={{ fontSize: '13.5px', color: '#fca5a5', lineHeight: 1.5, marginBottom: '22px' }}>{error}</p>
              <Button onClick={() => { window.location.href = '/'; }}>Return to FitCore Portal</Button>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="login-header" style={{ marginBottom: '20px' }}>
                <div className="logo-container">
                  <div className="brand-logo-badge">FC</div>
                </div>
                <h1 className="brand-title" style={{ fontSize: '24px' }}>Welcome, {memberData?.memberName} 👋</h1>
                <div style={{ fontSize: '13.5px', color: '#cbd5e1', marginTop: '4px' }}>
                  Gym Club: <strong style={{ color: '#ffffff' }}>{memberData?.gymName}</strong>
                </div>
                <div className="secure-badge" style={{ marginTop: '10px' }}>
                  <span className="dot" /> INVITATION ACTIVE · {memberData?.plan}
                </div>
              </div>

              {/* Error Box */}
              {error && (
                <div className="error-alert" role="alert" style={{ marginBottom: '16px' }}>
                  <AlertTriangleIcon size={16} color="#ef4444" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success Box */}
              {success && (
                <div className="success-alert" role="alert" style={{ marginBottom: '16px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#6ee7b7' }}>
                  <ShieldCheckIcon size={18} color="#10b981" />
                  <span>Account Activated! Redirecting to your member dashboard...</span>
                </div>
              )}

              {/* STEP 1: Verify Mobile Number & OTP */}
              {step === 'verify_otp' && (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Registered Mobile Number</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>+91 {memberData?.phone}</div>
                  </div>

                  <div className="input-group">
                    <div className="label-row">
                      <label htmlFor="act-otp" style={{ color: '#ffffff' }}>Enter 6-Digit OTP</label>
                      <button
                        type="button"
                        onClick={() => sendOtp()}
                        disabled={otpLoading}
                        style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {otpLoading ? 'Sending...' : 'Resend OTP'}
                      </button>
                    </div>
                    <input
                      id="act-otp"
                      type="text"
                      maxLength={6}
                      required
                      placeholder="e.g. 847291"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 800, background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px' }}
                    />
                  </div>

                  {devOtpHint && (
                    <div style={{ fontSize: '11.5px', color: '#6ee7b7', background: 'rgba(16,185,129,0.12)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.25)' }}>
                      💡 Dev Simulator OTP: <strong>{devOtpHint}</strong>
                    </div>
                  )}

                  <Button type="submit" className="submit-btn" style={{ marginTop: '8px' }}>
                    Verify OTP →
                  </Button>
                </form>
              )}

              {/* STEP 2: Member Sets Their Own Secret Password */}
              {step === 'create_password' && (
                <form onSubmit={handleCreatePasswordAndActivate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '12px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#a5b4fc', textTransform: 'uppercase', fontWeight: 700 }}>Your Login Mobile Number</div>
                      <div style={{ fontSize: '17px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>+91 {memberData?.phone}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Member ID</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#cbd5e1' }}>{memberData?.memberId}</div>
                    </div>
                  </div>

                  <div className="input-group">
                    <label style={{ color: '#ffffff' }}>Create Your Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                      >
                        {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="input-group">
                    <label style={{ color: '#ffffff' }}>Confirm Password *</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px' }}
                    />
                  </div>

                  <Button type="submit" className="submit-btn" isLoading={submitting} disabled={submitting || success} style={{ marginTop: '8px' }}>
                    {success ? 'Account Activated!' : 'Activate My Account & Login →'}
                  </Button>
                </form>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
