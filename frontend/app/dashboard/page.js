// ==============================================================================
// Dashboard Page (frontend/app/dashboard/page.js) - Client Component
// ==============================================================================
// The main monitoring dashboard:
// 1. Shows total monitors, online/offline count, and average response latency.
// 2. Form to add new websites/APIs to monitor.
// 3. List of monitors with live health status pills (UP / DOWN / PENDING).
// 4. Actions: Pause/Resume, Delete, and View Ping History logs (Heartbeats).
// ==============================================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getToken,
  getUser,
  removeToken,
  apiGetMonitors,
  apiCreateMonitor,
  apiToggleMonitor,
  apiDeleteMonitor,
  apiGetHeartbeats
} from '../../lib/api';

export default function DashboardPage() {
  const router = useRouter();

  // State management
  const [user, setUserState] = useState(null);
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);

  // New monitor form state
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  // Heartbeats (history) modal state
  const [selectedMonitor, setSelectedMonitor] = useState(null);
  const [heartbeats, setHeartbeats] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 1. Check Authentication on Mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const cachedUser = getUser();
    if (cachedUser) {
      setUserState(cachedUser);
    }

    loadMonitors();
  }, [router]);

  // 2. Fetch monitors from Express backend
  async function loadMonitors() {
    setLoading(true);
    try {
      const data = await apiGetMonitors();
      if (data.monitors) {
        setMonitors(data.monitors);
        setIsCached(data.cached || false);
      }
    } catch (err) {
      console.error('Error fetching monitors:', err);
    } finally {
      setLoading(false);
    }
  }

  // 3. Handle Add New Monitor
  async function handleAddMonitor(e) {
    e.preventDefault();
    setFormError('');
    setCreating(true);

    try {
      const data = await apiCreateMonitor(newTitle, newUrl);

      if (data.error) {
        setFormError(data.error);
        setCreating(false);
        return;
      }

      // Reset form and reload monitors list
      setNewTitle('');
      setNewUrl('');
      await loadMonitors();
    } catch (err) {
      setFormError('Failed to create monitor. Ensure backend is running.');
    } finally {
      setCreating(false);
    }
  }

  // 4. Toggle Pause / Resume
  async function handleToggle(id) {
    try {
      await apiToggleMonitor(id);
      loadMonitors();
    } catch (err) {
      console.error('Error toggling monitor:', err);
    }
  }

  // 5. Delete Monitor
  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this monitor?')) return;

    try {
      await apiDeleteMonitor(id);
      loadMonitors();
    } catch (err) {
      console.error('Error deleting monitor:', err);
    }
  }

  // 6. View Ping History (Heartbeats)
  async function handleViewHistory(monitor) {
    setSelectedMonitor(monitor);
    setLoadingHistory(true);
    try {
      const data = await apiGetHeartbeats(monitor.id);
      setHeartbeats(data.heartbeats || []);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }

  // 7. Logout handler
  function handleLogout() {
    removeToken();
    router.push('/login');
  }

  // Quick statistics calculation
  const totalMonitors = monitors.length;
  const onlineCount = monitors.filter((m) => m.status === 'UP').length;
  const offlineCount = monitors.filter((m) => m.status === 'DOWN').length;
  const avgLatency =
    totalMonitors > 0
      ? Math.round(
          monitors.reduce((acc, m) => acc + (m.lastResponseTime || 0), 0) /
            totalMonitors
        )
      : 0;

  return (
    <div>
      {/* Top Navbar */}
      <header className="navbar">
        <div className="nav-brand">
          <span>📡</span>
          <span>PulseWatch</span>
        </div>
        <div className="nav-actions">
          {user && <span className="user-badge">👤 {user.name}</span>}
          <button onClick={loadMonitors} className="btn btn-secondary btn-sm">
            🔄 Refresh
          </button>
          <button onClick={handleLogout} className="btn btn-danger btn-sm">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container">
        {/* Stats Row (Using Simple Flexbox) */}
        <div className="stats-container">
          <div className="stat-box">
            <div className="stat-title">Total Monitors</div>
            <div className="stat-value">{totalMonitors}</div>
          </div>

          <div className="stat-box">
            <div className="stat-title">Online Websites</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              {onlineCount}
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-title">Offline Websites</div>
            <div className="stat-value" style={{ color: offlineCount > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
              {offlineCount}
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-title">Average Latency</div>
            <div className="stat-value">{avgLatency} ms</div>
          </div>
        </div>

        {/* Add Monitor Section */}
        <section
          className="stat-box"
          style={{ marginBottom: '32px', backgroundColor: 'var(--bg-card)' }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
            ➕ Add Website to Monitor
          </h2>

          {formError && <div className="alert-error">{formError}</div>}

          <form
            onSubmit={handleAddMonitor}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}
          >
            <input
              type="text"
              placeholder="Friendly Name (e.g. My Blog)"
              className="form-input"
              style={{ flex: '1 1 200px' }}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
            <input
              type="url"
              placeholder="URL (e.g. https://example.com)"
              className="form-input"
              style={{ flex: '2 1 300px' }}
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
              style={{ padding: '12px 24px' }}
            >
              {creating ? 'Adding...' : 'Start Monitoring'}
            </button>
          </form>
        </section>

        {/* Monitors List Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Your Monitors</h2>
          {isCached && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '4px' }}>
              ⚡ Served from Redis Cache
            </span>
          )}
        </div>

        {/* Loading Spinner / Empty State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading monitors...
          </div>
        ) : monitors.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius)',
              border: '1px dashed var(--border)'
            }}
          >
            <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              You don't have any monitors yet.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Add your first website above to start automatic health checking!
            </p>
          </div>
        ) : (
          /* Monitors List (Simple Flexbox Column) */
          <div className="monitors-list">
            {monitors.map((m) => (
              <div key={m.id} className="monitor-card">
                {/* Left: Status Badge & Info */}
                <div className="monitor-info">
                  {/* Status Badge Pill */}
                  <span
                    className={`badge ${
                      m.status === 'UP'
                        ? 'badge-up'
                        : m.status === 'DOWN'
                        ? 'badge-down'
                        : 'badge-pending'
                    }`}
                  >
                    <span className="badge-dot"></span>
                    {m.status}
                  </span>

                  <div className="monitor-details">
                    <h3>{m.name}</h3>
                    <a href={m.url} target="_blank" rel="noreferrer">
                      {m.url} ↗
                    </a>
                  </div>
                </div>

                {/* Right: Latency & Actions */}
                <div className="monitor-meta">
                  <span className="latency-pill">
                    ⏱️ {m.lastResponseTime ? `${m.lastResponseTime}ms` : 'Waiting check...'}
                  </span>

                  <div className="monitor-actions">
                    {/* Pause / Resume Button */}
                    <button
                      onClick={() => handleToggle(m.id)}
                      className="btn btn-secondary btn-sm"
                      title={m.isActive ? 'Pause monitoring' : 'Resume monitoring'}
                    >
                      {m.isActive ? '⏸️ Pause' : '▶️ Resume'}
                    </button>

                    {/* View History Button */}
                    <button
                      onClick={() => handleViewHistory(m)}
                      className="btn btn-secondary btn-sm"
                    >
                      📊 History
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="btn btn-danger btn-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* History Modal Popup */}
      {selectedMonitor && (
        <div className="modal-overlay" onClick={() => setSelectedMonitor(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>
                📊 Ping History: {selectedMonitor.name}
              </h3>
              <button
                onClick={() => setSelectedMonitor(null)}
                className="btn btn-secondary btn-sm"
              >
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
              Showing the latest heartbeat pings checked by our BullMQ background worker.
            </p>

            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                Loading history...
              </div>
            ) : heartbeats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                No check logs recorded yet. Next check runs in 60s!
              </div>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {heartbeats.map((h) => (
                  <div key={h.id} className="history-row">
                    <span
                      style={{
                        color: h.status === 'UP' ? 'var(--success)' : 'var(--danger)',
                        fontWeight: '600'
                      }}
                    >
                      {h.status === 'UP' ? '🟢 UP' : '🔴 DOWN'}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      ⏱️ {h.responseTime}ms
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {new Date(h.checkedAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
