import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPower, FiMenu } from 'react-icons/fi';
import Sidebar from './Sidebar';
import ChatAI from './ChatAI';
import Weather from './Weather';
import AnalyticsChart from './AnalyticsChart';
import ActivityLog from './ActivityLog';
import '../styles/Dashboard.css';
import API_URL from '../config';

function PageHeader({ title, subtitle, relayState }) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {relayState !== undefined && (
        <div className="page-header-right">
          <div className="header-chip">
            <span className={`chip-dot ${relayState}`} />
            Device {relayState.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ token, onLogout }) {
  const [active, setActive] = useState('device');
  const [relayState, setRelayState] = useState('off');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState('');

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch once on mount to sync initial state
  useEffect(() => {
    axios.get(`${API_URL}/relay`, authHeaders)
      .then(res => setRelayState(res.data.state))
      .catch(err => { if (err.response?.status === 401) onLogout(); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleRelay = async (cmd) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/${cmd}`, {}, authHeaders);
      setRelayState(res.data.state);
      setLastAction(`Manual ${cmd.toUpperCase()}`);
    } catch (err) {
      if (err.response?.status === 401) onLogout();
    } finally {
      setLoading(false);
    }
  };

  const SECTIONS = {
    device: (
      <div className="section-wrap">
        <PageHeader title="Light Control" subtitle="Manually control your connected light via relay" relayState={relayState} />
        <div className="device-page">
          <div className="device-panel">
            <div className="device-state-block">
              <div className={`device-circle ${relayState}`}>
                <FiPower size={34} strokeWidth={1.5} />
              </div>
              <p className="device-state-text">{relayState === 'on' ? 'Light ON' : 'Light OFF'}</p>
              <p className="device-state-meta">{lastAction || 'No recent command'}</p>
            </div>
            <div className="device-actions">
              <button className="action-btn on" onClick={() => toggleRelay('on')} disabled={loading || relayState === 'on'}>Turn ON</button>
              <button className="action-btn off" onClick={() => toggleRelay('off')} disabled={loading || relayState === 'off'}>Turn OFF</button>
            </div>
            <div className="device-info-grid">
              <div className="info-tile"><p className="info-label">Status</p><p className={`info-value ${relayState}`}>{relayState.toUpperCase()}</p></div>
              <div className="info-tile"><p className="info-label">Protocol</p><p className="info-value">HTTP Polling</p></div>
              <div className="info-tile"><p className="info-label">Controller</p><p className="info-value">ESP32</p></div>
              <div className="info-tile"><p className="info-label">Cloud</p><p className="info-value">AWS EC2</p></div>
            </div>
          </div>
        </div>
      </div>
    ),
    weather: (
      <div className="section-wrap">
        <PageHeader title="Weather" subtitle="Live weather data and auto-control settings" />
        <div className="section-body centered"><Weather token={token} onUnauth={onLogout} /></div>
      </div>
    ),
    ai: <ChatAI token={token} onUnauth={onLogout} onRelayChange={setRelayState} />,
    analytics: (
      <div className="section-wrap">
        <PageHeader title="Analytics" subtitle="7-day device usage statistics and trends" />
        <div className="section-body"><AnalyticsChart token={token} onUnauth={onLogout} /></div>
      </div>
    ),
    logs: (
      <div className="section-wrap">
        <PageHeader title="Activity Log" subtitle="Complete history of all device commands" />
        <div className="section-body"><ActivityLog token={token} onUnauth={onLogout} /></div>
      </div>
    ),
  };

  return (
    <div className="app-layout">
      <Sidebar
        active={active} setActive={setActive}
        relayState={relayState} onLogout={onLogout}
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
      />
      <main className="main-content">
        <button className="hamburger" onClick={() => setSidebarOpen(true)}>
          <FiMenu size={20} />
        </button>
        {SECTIONS[active]}
      </main>
    </div>
  );
}
