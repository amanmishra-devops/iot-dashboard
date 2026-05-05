import React from 'react';
import { FiPower, FiWind, FiMessageSquare, FiBarChart2, FiList, FiLogOut } from 'react-icons/fi';
import '../styles/Sidebar.css';

const NAV = [
  { id: 'device',    icon: FiPower,         label: 'Light Control'  },
  { id: 'weather',   icon: FiWind,          label: 'Weather'        },
  { id: 'ai',        icon: FiMessageSquare, label: 'AI Assistant'   },
  { id: 'analytics', icon: FiBarChart2,     label: 'Analytics'      },
  { id: 'logs',      icon: FiList,          label: 'Activity Log'   },
];

export default function Sidebar({ active, setActive, relayState, onLogout, isOpen, onClose }) {
  const handleNav = (id) => {
    setActive(id);
    onClose?.();
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-logo">
          <span className={`brand-dot ${relayState}`} />
        </div>
        <div>
          <div className="brand-name">NexHome</div>
          <div className="brand-tag">IoT Dashboard</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-section-label">Navigation</p>
        {NAV.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`nav-item ${active === id ? 'active' : ''}`}
            onClick={() => handleNav(id)}
          >
            <Icon size={15} className="nav-icon" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="relay-status-mini">
          <span className={`status-dot ${relayState}`} />
          <span className="status-text">Device {relayState.toUpperCase()}</span>
        </div>
        <div className="sidebar-credit">
          <p className="sidebar-credit-label">Developed by</p>
          <div className="sidebar-credit-row">
            <span className="sidebar-credit-name lead">Aman Mishra</span>
            <span className="sidebar-credit-enr lead">&amp; his team</span>
          </div>
        </div>
        <button className="sidebar-logout" onClick={onLogout}>
          <FiLogOut size={15} /> Logout
        </button>
      </div>
    </aside>
    </>
  );
}
