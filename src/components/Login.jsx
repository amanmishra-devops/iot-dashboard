import React, { useState } from 'react';
import axios from 'axios';
import { FiUser, FiLock, FiArrowRight, FiAlertCircle, FiClock } from 'react-icons/fi';
import '../styles/Login.css';
import API_URL from '../config';

export default function Login({ onLoginSuccess, sessionExpired }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/login`, { username, password });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        onLoginSuccess(res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">

        {/* Brand */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <div className="login-brand-dot" />
          </div>
          <div className="login-brand-name">NexHome</div>
          <div className="login-brand-badge">PROJECT · NIT AGARTALA · PRODUCTION ENGINEERING</div>
        </div>

        {/* Section heading */}
        {/* <div className="login-section-title">
          <h2>Sign in to your account</h2>
          <p>Enter your credentials to continue</p>
        </div> */}

        {/* Notices */}
        {sessionExpired && !error && (
          <div className="login-notice expired">
            <FiClock size={13} />
            Session expired. Please sign in again.
          </div>
        )}

        {/* Form */}
        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-field">
            <label>Username</label>
            <div className="input-wrap">
              <FiUser size={13} className="input-icon" />
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="login-field">
            <label>Password</label>
            <div className="input-wrap">
              <FiLock size={13} className="input-icon" />
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="login-notice error">
              <FiAlertCircle size={13} />{error}
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading
              ? <span className="login-spinner" />
              : <><span>Sign in</span><FiArrowRight size={14} /></>
            }
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <span className="login-footer-year">© 2026 NexHome</span>
          <span className="login-footer-credit">By <span>Aman Mishra</span> &amp; his team</span>
        </div>

      </div>
    </div>
  );
}
