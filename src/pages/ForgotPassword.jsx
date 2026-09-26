import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/auth.css';

const ForgotPassword = () => {
  const { isAuthenticated, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Step 1: Look up user by Login ID or Email
  const handleIdentify = (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your Login ID or Email.');
      return;
    }

    setLoading(true);

    // Simulate OTP send (skip actual lookup — just move to step 2)
    setTimeout(() => {
      setStep(2);
      setSuccess('OTP has been sent to your registered email.');
      setLoading(false);
      setTimeout(() => setSuccess(''), 4000);
    }, 800);
  };

  // Step 2: Verify OTP (mocked — accepts any 6-digit number for hackathon MVP)
  const handleVerifyOTP = (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setStep(3);
      setSuccess('');
      setLoading(false);
    }, 600);
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(identifier.trim(), newPassword);

      if (result.success) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setLoading(false);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(result.message || 'Failed to reset password.');
        setLoading(false);
      }
    } catch {
      setError('Failed to reset password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h1>Reset Password</h1>
          <p>Recover your StockSense account</p>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <span>1</span>
          </div>
          <div className={`step-line ${step > 1 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <span>2</span>
          </div>
          <div className={`step-line ${step > 2 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <span>3</span>
          </div>
        </div>

        {error && (
          <div className="auth-message error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="auth-message success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            {success}
          </div>
        )}

        {/* Step 1: Identify */}
        {step === 1 && (
          <form onSubmit={handleIdentify} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="identifier">Login ID or Email</label>
              <input
                className="form-input"
                type="text"
                id="identifier"
                placeholder="Enter Login ID or Email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Sending OTP...' : 'SEND OTP'}
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="otp">Enter OTP</label>
              <input
                className="form-input otp-input"
                type="text"
                id="otp"
                placeholder="● ● ● ● ● ●"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
              />
              <span className="form-hint">Enter the 6-digit code sent to your email</span>
            </div>
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Verifying...' : 'VERIFY OTP'}
            </button>
            <button
              type="button"
              className="auth-secondary-btn"
              onClick={() => { setStep(1); setError(''); setOtp(''); }}
            >
              ← Back
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">New Password</label>
              <div className="form-input-wrapper">
                <input
                  className="form-input"
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  tabIndex={-1}
                >
                  {showNewPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirmNewPassword">Confirm New Password</label>
              <div className="form-input-wrapper">
                <input
                  className="form-input"
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  id="confirmNewPassword"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  tabIndex={-1}
                >
                  {showConfirmNewPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Resetting...' : 'RESET PASSWORD'}
            </button>
          </form>
        )}

        <div className="auth-links">
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
