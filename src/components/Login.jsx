import React, { useState } from 'react';
import axios from 'axios';
import { FiUser, FiLock, FiArrowRight, FiAlertCircle, FiClock, FiZap, FiCloud, FiMic, FiBarChart2 } from 'react-icons/fi';
import '../styles/Login.css';
import API_URL from '../config';

const FEATURES = [
  { icon: FiZap,      title: 'Instant Control',      desc: 'Turn your lights on or off from anywhere in the world' },
  { icon: FiMic,      title: 'Voice & AI Commands',  desc: 'Speak naturally in Hindi or English — NexHome understands' },
  { icon: FiCloud,    title: 'Weather Automation',   desc: 'Auto-control based on live temperature and weather data' },
  { icon: FiBarChart2,title: 'Usage Analytics',      desc: 'Track daily usage patterns and device activity history' },
];

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
      {/* Left panel */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-dot" />
          <span className="login-brand-name">NexHome</span>
        </div>

        <div className="login-tagline">
          <h2>Your home,<br />your control.</h2>
          <p>A smart IoT dashboard that puts your home in your hands — from anywhere, at any time.</p>
        </div>

        <div className="login-features">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="login-feature-item">
              <div className="login-feature-icon"><Icon size={14} /></div>
              <div>
                <p className="login-feature-title">{title}</p>
                <p className="login-feature-desc">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="login-credit">NexHome &copy; 2025</p>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h1>Sign in</h1>
            <p>Enter your credentials to access the dashboard</p>
          </div>

          {sessionExpired && !error && (
            <div className="login-notice expired">
              <FiClock size={13} />
              Session expired. Please sign in again.
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label>Username</label>
              <div className="input-wrap">
                <FiUser size={13} className="input-icon" />
                <input type="text" placeholder="Enter username" value={username}
                  onChange={(e) => setUsername(e.target.value)} required autoFocus />
              </div>
            </div>

            <div className="login-field">
              <label>Password</label>
              <div className="input-wrap">
                <FiLock size={13} className="input-icon" />
                <input type="password" placeholder="Enter password" value={password}
                  onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>

            {error && (
              <div className="login-notice error">
                <FiAlertCircle size={13} />{error}
              </div>
            )}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <span className="login-spinner" /> : <><span>Sign in</span><FiArrowRight size={14} /></>}
            </button>
          </form>

          <p className="login-hint">Default: <code>admin</code> / <code>admin</code></p>

          <div className="login-footer">
            <p className="login-footer-title">Developed by</p>
            <div className="login-team-lead">
              <span className="team-name">Aman Mishra</span>
              <span className="team-enr">&amp; his team</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
