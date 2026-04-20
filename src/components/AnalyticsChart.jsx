import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';
import '../styles/Analytics.css';
import API_URL from '../config';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsChart({ token }) {
  const [chartData, setChartData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { dailyData, stats: statsData } = response.data;

      setChartData({
        labels: dailyData.map((d) => d.date),
        datasets: [
          {
            label: 'Hours ON',
            data: dailyData.map((d) => d.hoursOn),
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.06)',
            tension: 0.4,
          },
        ],
      });

      setStats(statsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="card"><p style={{fontSize:12,color:'#333'}}>Loading...</p></div>;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#2a2b2e' }, ticks: { color: '#5f6368', font: { family: 'Poppins', size: 11 } } },
      y: { grid: { color: '#2a2b2e' }, ticks: { color: '#5f6368', font: { family: 'Poppins', size: 11 } } },
    },
  };

  return (
    <div className="analytics-card">
      <p className="card-label">Usage Analytics — 7 Days</p>
      {stats && (
        <div className="stats-summary">
          <div className="stat">
            <p className="label">Total Hours ON</p>
            <p className="value">{stats.totalHours.toFixed(1)}h</p>
          </div>
          <div className="stat">
            <p className="label">Avg per Day</p>
            <p className="value">{stats.avgPerDay.toFixed(1)}h</p>
          </div>
          <div className="stat">
            <p className="label">Total Commands</p>
            <p className="value">{stats.totalCommands}</p>
          </div>
        </div>
      )}
      {chartData && (
        <div className="chart-container">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
}
