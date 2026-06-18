import React, { useState } from 'react';
import logoIcon from '../assets/Icone.png';
import passwordIcon from '../assets/Icons/Password.png';
import hideIcon from '../assets/Icons/hide.png';
import showIcon from '../assets/Icons/show.png';
import alertIcon from '../assets/Icons/Aleart.png';
import Card from './common/Card.jsx';
import Input from './common/Input.jsx';
import Button from './common/Button.jsx';
import bgVideo from '../assets/A_cinematic_luxury_fitness_club_named_FITCORE._The_video_begins_outside_a_stunning_modern_glass-fron_seed2324777742.mp4';

export default function Login({ onLoginSuccess }) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!mobileNumber) {
      setError('Mobile number is required.');
      return;
    }
    if (mobileNumber.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (mobileNumber === '8530292487' && password === 'Hello@123') {
        setSuccess(true);
        setTimeout(() => {
          onLoginSuccess();
        }, 1000);
      } else {
        setError('Invalid admin mobile number or password.');
      }
    }, 1200);
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
              <img src={logoIcon} alt="Logo" className="login-logo-img" />
            </div>
            <h1 className="brand-title">FITCORE</h1>
            <p className="brand-tagline">Gym Admin Dashboard</p>
            <div className="secure-badge">
              <span className="dot" /> SECURE GATEWAY
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-alert" role="alert">
                <img src={alertIcon} alt="Alert" className="alert-icon-img" /> {error}
              </div>
            )}

            {success && (
              <div className="success-alert" role="alert">
                Access Granted. Redirecting...
              </div>
            )}

            <Input
              id="admin-mobile"
              label="Admin Mobile Number"
              type="tel"
              placeholder="e.g. 8530292487"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              disabled={isLoading || success}
              autoComplete="tel"
              required
            />

            <Input
              id="admin-password"
              label="Password"
              icon={passwordIcon}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || success}
              autoComplete="current-password"
              required
              eyeAction={() => setShowPassword(!showPassword)}
              eyeIcon={showPassword ? hideIcon : showIcon}
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
    </div>
  );
}
