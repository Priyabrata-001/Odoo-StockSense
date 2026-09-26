import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/auth.css';

const SignUp = () => {
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    loginId: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    // Clear field error on typing
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const result = await signup(
        formData.loginId,
        formData.email,
        formData.password,
        formData.confirmPassword
      );

      if (result.success) {
        navigate('/dashboard');
      } else {
        setErrors(result.errors || {});
        setLoading(false);
      }
    } catch {
      setErrors({ loginId: 'Signup failed. Please try again.' });
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <h1>StockSense</h1>
          <p>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="loginId">Login ID</label>
            <input
              className={`form-input ${errors.loginId ? 'error' : ''}`}
              type="text"
              id="loginId"
              placeholder="Enter Login ID (6-12 characters)"
              value={formData.loginId}
              onChange={handleChange}
              required
            />
            {errors.loginId && <span className="form-error">{errors.loginId}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email ID</label>
            <input
              className={`form-input ${errors.email ? 'error' : ''}`}
              type="email"
              id="email"
              placeholder="Enter Email ID"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="form-input-wrapper">
              <input
                className={`form-input ${errors.password ? 'error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Enter Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Re-enter Password</label>
            <div className="form-input-wrapper">
              <input
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                placeholder="Re-enter Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? '🙈' : '👁'}
              </button>
            </div>
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating account...' : 'SIGN UP'}
          </button>
        </form>

        <div className="auth-links">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
