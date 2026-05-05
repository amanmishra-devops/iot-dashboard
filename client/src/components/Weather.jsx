import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FiMapPin, FiWind, FiDroplet, FiThermometer, FiSearch, FiRefreshCw, FiX, FiZap } from 'react-icons/fi';
import { WiDaySunny, WiNightClear, WiCloudy, WiRain, WiThunderstorm, WiSnow, WiFog, WiDayRainMix, WiNightRain } from 'react-icons/wi';
import '../styles/Weather.css';
import API_URL from '../config';

const OWM_KEY = process.env.REACT_APP_WEATHER_API_KEY;

function WeatherIcon({ main, icon, size = 68 }) {
  const isNight = icon && icon.endsWith('n');
  const props = { size, className: 'weather-icon-svg' };
  switch (main) {
    case 'Thunderstorm': return <WiThunderstorm {...props} />;
    case 'Drizzle':      return <WiDayRainMix {...props} />;
    case 'Rain':         return isNight ? <WiNightRain {...props} /> : <WiRain {...props} />;
    case 'Snow':         return <WiSnow {...props} />;
    case 'Fog':
    case 'Mist':
    case 'Haze':         return <WiFog {...props} />;
    case 'Clouds':       return <WiCloudy {...props} />;
    case 'Clear':        return isNight ? <WiNightClear {...props} /> : <WiDaySunny {...props} />;
    default:             return <WiDaySunny {...props} />;
  }
}

const RULE_META = {
  rain:  { label: 'Rain / Storm',  desc: 'Turn light ON when it rains or storms outside', Icon: WiRain },
  hot:   { label: 'Hot Day',       desc: 'Turn light ON when temperature exceeds 35°C',   Icon: WiDaySunny },
  night: { label: 'Night Time',    desc: 'Turn light ON automatically after sunset',       Icon: WiNightClear },
};

export default function Weather({ token }) {
  const [weather, setWeather] = useState(null);
  const [rules, setRules] = useState([]);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoCity, setAutoCity] = useState('');
  const [lastCheck, setLastCheck] = useState(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchAutomation = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/automation`, { headers: { Authorization: `Bearer ${token}` } });
      setRules(res.data.rules);
      setAutoEnabled(res.data.enabled);
      setAutoCity(res.data.city);
      setLastCheck(res.data.last_check);
    } catch {}
  }, [token]);

  // Fetch default weather + automation on mount
  useEffect(() => { fetchWeather(); fetchAutomation(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced city search via OWM Geocoding API
  useEffect(() => {
    if (!query || query.length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await axios.get(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=6&appid=${OWM_KEY}`
        );
        setSuggestions(res.data);
        setShowDropdown(res.data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const fetchWeather = async (city = selectedCity, showSpin = false) => {
    if (showSpin) setRefreshing(true);
    setError('');
    try {
      const params = city ? { city: city.name + (city.country ? `,${city.country}` : '') } : {};
      const res = await axios.get(`${API_URL}/weather`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setWeather(res.data);
    } catch (e) {
      setError(e.response?.status === 404 ? 'City not found.' : 'Failed to fetch weather.');
    } finally {
      if (showSpin) setRefreshing(false);
    }
  };

  const handleSelect = (city) => {
    setSelectedCity(city);
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    fetchWeather(city);
  };

  const handleClear = () => {
    setSelectedCity(null);
    setQuery('');
    setSuggestions([]);
    fetchWeather(null);
  };

  const toggleAutomation = async () => {
    try {
      const res = await axios.post(
        `${API_URL}/automation/toggle`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAutoEnabled(res.data.enabled);
    } catch {}
  };

  const toggleRule = async (ruleId) => {
    try {
      const res = await axios.post(
        `${API_URL}/automation/${ruleId}/toggle`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: res.data.enabled ? 1 : 0 } : r));
    } catch {}
  };

  const setAutomationCity = async () => {
    if (!selectedCity) return;
    const cityStr = selectedCity.name + (selectedCity.country ? `,${selectedCity.country}` : '');
    try {
      await axios.post(
        `${API_URL}/automation/city`,
        { city: cityStr },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAutoCity(cityStr);
    } catch {}
  };

  return (
    <div className="weather-wrap">
      {/* Search */}
      <div className="city-search-wrap" ref={wrapRef}>
        <div className="city-search">
          <FiSearch size={13} className="search-icon" />
          {selectedCity ? (
            <div className="selected-city-pill">
              <FiMapPin size={11} />
              <span>{selectedCity.name}{selectedCity.state ? `, ${selectedCity.state}` : ''}, {selectedCity.country}</span>
              <button className="clear-city" onClick={handleClear}><FiX size={11} /></button>
            </div>
          ) : (
            <input
              type="text"
              placeholder="Search city — e.g. Mumbai, Tokyo, London..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              autoComplete="off"
            />
          )}
          {loadingSearch && <span className="search-spinner" />}
          <button
            type="button"
            className="refresh-btn"
            onClick={() => fetchWeather(selectedCity, true)}
            title="Refresh"
          >
            <FiRefreshCw size={12} className={refreshing ? 'spinning' : ''} />
          </button>
        </div>

        {/* Dropdown suggestions */}
        {showDropdown && suggestions.length > 0 && (
          <ul className="city-dropdown">
            {suggestions.map((c, i) => (
              <li key={i} className="city-option" onClick={() => handleSelect(c)}>
                <FiMapPin size={11} className="city-option-icon" />
                <div>
                  <span className="city-option-name">{c.name}</span>
                  {c.state && <span className="city-option-state">, {c.state}</span>}
                  <span className="city-option-country"> · {c.country}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="weather-error">{error}</p>}

      {!weather && !error && (
        <div className="weather-card">
          <p style={{ fontSize: 13, color: '#5f6368' }}>Loading weather...</p>
        </div>
      )}

      {weather && (
        <div className="weather-card">
          <div className="weather-top">
            <div className="weather-icon-wrap">
              <WeatherIcon main={weather.main} icon={weather.icon} size={72} />
            </div>
            <div className="weather-primary">
              <div className="weather-temp-row">
                <span className="weather-temp">{Math.round(weather.temperature)}</span>
                <span className="weather-unit">&deg;C</span>
              </div>
              <p className="weather-desc">{weather.description}</p>
              <p className="weather-loc">
                <FiMapPin size={11} />
                {weather.location}{weather.country ? `, ${weather.country}` : ''}
              </p>
            </div>
          </div>

          <div className="weather-stats">
            <div className="weather-stat">
              <FiThermometer size={14} className="stat-icon" />
              <div>
                <p className="stat-label">Feels Like</p>
                <p className="stat-val">{Math.round(weather.feels_like ?? weather.temperature)}&deg;C</p>
              </div>
            </div>
            <div className="weather-stat">
              <FiDroplet size={14} className="stat-icon" />
              <div>
                <p className="stat-label">Humidity</p>
                <p className="stat-val">{weather.humidity}%</p>
              </div>
            </div>
            <div className="weather-stat">
              <FiWind size={14} className="stat-icon" />
              <div>
                <p className="stat-label">Wind</p>
                <p className="stat-val">{weather.wind_speed} m/s</p>
              </div>
            </div>
          </div>

          {/* Automation Rules */}
          <div className="automation-section">
            <div className="automation-header">
              <div>
                <p className="automation-title"><FiZap size={13} /> Smart Automation</p>
                <p className="automation-sub">
                  {autoEnabled ? 'Checks weather every 5 min and applies active rules' : 'Enable to start weather-based light control'}
                </p>
              </div>
              <div className="automation-master">
                {autoEnabled && lastCheck?.time && (
                  <span className="automation-last-check">
                    {lastCheck.time} · {lastCheck.temp}&deg;C · {lastCheck.condition}
                  </span>
                )}
                <label className="toggle-switch">
                  <input type="checkbox" checked={autoEnabled} onChange={toggleAutomation} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className={`automation-rules ${!autoEnabled ? 'disabled' : ''}`}>
              {rules.map(rule => {
                const meta = RULE_META[rule.id];
                if (!meta) return null;
                const { Icon } = meta;
                return (
                  <div key={rule.id} className={`automation-rule ${rule.enabled ? 'active' : ''}`}>
                    <div className="rule-icon"><Icon size={22} /></div>
                    <div className="rule-info">
                      <p className="rule-name">{rule.name}</p>
                      <p className="rule-desc">{rule.description}</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={!!rule.enabled} onChange={() => toggleRule(rule.id)} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                );
              })}
            </div>

            <div className="automation-city-row">
              <span className="automation-city-label">
                <FiMapPin size={11} /> Monitoring: <strong>{autoCity || 'New Delhi'}</strong>
              </span>
              {selectedCity && (
                <button className="set-auto-city-btn" onClick={setAutomationCity}>
                  Use {selectedCity.name} for automation
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
