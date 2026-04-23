import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPower, FiClock, FiZap } from 'react-icons/fi';
import '../styles/ActivityLog.css';
import API_URL from '../config';

export default function ActivityLog({ token, onUnauth }) {
  const [logs, setLogs] = useState([]);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data.logs || []);
    } catch (err) {
      if (err.response?.status === 401 && onUnauth) onUnauth();
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatDate = (ts) => new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  const formatTime = (ts) => new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata', hour12: true });

  return (
    <div className="log-card">
      <div className="log-table-header">
        <span>#</span>
        <span>Action</span>
        <span>Method</span>
        <span>Date</span>
        <span>Time</span>
      </div>

      <div className="log-list">
        {logs.length === 0 && (
          <div className="no-logs">
            <FiClock size={24} />
            <p>No activity recorded yet</p>
          </div>
        )}
        {logs.map((log, idx) => (
          <div key={idx} className={`log-row ${log.action}`}>
            <span className="log-index">{logs.length - idx}</span>
            <div className="log-action-cell">
              <div className={`log-badge ${log.action}`}>
                <FiPower size={10} />
                {log.action.toUpperCase()}
              </div>
            </div>
            <div className="log-method-cell">
              <FiZap size={11} className="log-method-icon" />
              <span>{log.method}</span>
            </div>
            <span className="log-date">{formatDate(log.timestamp)}</span>
            <span className="log-time">{formatTime(log.timestamp)}</span>
          </div>
        ))}
      </div>

      {logs.length > 0 && (
        <div className="log-footer">
          {logs.length} total events &nbsp;·&nbsp; auto-refreshes every 10s
        </div>
      )}
    </div>
  );
}
