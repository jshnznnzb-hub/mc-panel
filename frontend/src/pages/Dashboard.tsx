import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../components/Toast';

interface Server {
  id: string; name: string; version: string; type: string;
  ram: number; port: number; status: string;
}

const MC_VERSIONS = ['1.21.4','1.21.3','1.21.1','1.20.6','1.20.4','1.20.1','1.19.4','1.18.2','1.17.1','1.16.5'];
const SERVER_TYPES = ['paper','purpur','vanilla'];
const TYPE_COLORS: Record<string,string> = { paper: 'var(--accent)', purpur: 'var(--purple)', vanilla: 'var(--blue)' };

function IconPlus() {
  return <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/></svg>;
}
function IconServer() {
  return <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v2.5A2.25 2.25 0 0 0 4.25 9h11.5A2.25 2.25 0 0 0 18 6.75v-2.5A2.25 2.25 0 0 0 15.75 2H4.25Zm0 9A2.25 2.25 0 0 0 2 13.25v2.5A2.25 2.25 0 0 0 4.25 18h11.5A2.25 2.25 0 0 0 18 15.75v-2.5A2.25 2.25 0 0 0 15.75 11H4.25Z" clipRule="evenodd"/></svg>;
}
function IconOnline() {
  return <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd"/></svg>;
}

function badgeCls(status: string) {
  if (status === 'online') return 'badge badge-online';
  if (status === 'offline') return 'badge badge-offline';
  if (status === 'launching') return 'badge badge-starting';
  return 'badge badge-unknown';
}

export default function Dashboard() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', version: '1.21.4', type: 'paper', ram: 1024 });
  const [createError, setCreateError] = useState('');
  const toast = useToast();

  const load = async () => {
    try {
      const res = await api.get('/servers');
      setServers(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Poll status every 5s
  useEffect(() => {
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const onlineCount  = servers.filter(s => s.status === 'online').length;
  const offlineCount = servers.filter(s => s.status === 'offline' || s.status === 'unknown').length;
  const totalRam     = servers.reduce((a, s) => a + s.ram, 0);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await api.post('/servers', form);
      setShowModal(false);
      setForm({ name: '', version: '1.21.4', type: 'paper', ram: 1024 });
      await load();
      toast.success(`Server "${form.name}" created!`);
    } catch (err: any) {
      setCreateError(err.response?.data?.error || 'Failed to create server');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Manage your Minecraft servers</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <IconPlus /> New Server
          </button>
        </div>
      </div>

      {/* Bento Stats */}
      <div className="bento-row">
        <div className="bento-stat">
          <div className="bento-stat-icon" style={{ background: 'var(--accent-dim)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <svg viewBox="0 0 20 20" fill="var(--accent)" width="15" height="15"><path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v2.5A2.25 2.25 0 0 0 4.25 9h11.5A2.25 2.25 0 0 0 18 6.75v-2.5A2.25 2.25 0 0 0 15.75 2H4.25Zm0 9A2.25 2.25 0 0 0 2 13.25v2.5A2.25 2.25 0 0 0 4.25 18h11.5A2.25 2.25 0 0 0 18 15.75v-2.5A2.25 2.25 0 0 0 15.75 11H4.25Z" clipRule="evenodd"/></svg>
          </div>
          <div className="bento-stat-label">Total Servers</div>
          <div className="bento-stat-value">{servers.length}</div>
          <div className="bento-stat-sub">configured</div>
        </div>
        <div className="bento-stat">
          <div className="bento-stat-icon" style={{ background: 'var(--accent-dim)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <svg viewBox="0 0 20 20" fill="var(--accent)" width="15" height="15"><circle cx="10" cy="10" r="8"/></svg>
          </div>
          <div className="bento-stat-label">Online</div>
          <div className="bento-stat-value" style={{ color: 'var(--accent)' }}>{onlineCount}</div>
          <div className="bento-stat-sub">running now</div>
        </div>
        <div className="bento-stat">
          <div className="bento-stat-icon" style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <svg viewBox="0 0 20 20" fill="var(--red)" width="15" height="15"><circle cx="10" cy="10" r="8"/></svg>
          </div>
          <div className="bento-stat-label">Offline</div>
          <div className="bento-stat-value" style={{ color: 'var(--red)' }}>{offlineCount}</div>
          <div className="bento-stat-sub">stopped</div>
        </div>
        <div className="bento-stat">
          <div className="bento-stat-icon" style={{ background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <svg viewBox="0 0 20 20" fill="var(--blue)" width="15" height="15"><path d="M3.75 3a.75.75 0 0 0-.75.75v.5c0 .414.336.75.75.75H4c6.075 0 11 4.925 11 11v.25c0 .414.336.75.75.75h.5a.75.75 0 0 0 .75-.75V16C17 8.82 11.18 3 4 3h-.25Z"/><path d="M3 8.75A.75.75 0 0 1 3.75 8H4a8 8 0 0 1 8 8v.25a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75V16a6 6 0 0 0-6-6h-.25A.75.75 0 0 1 3 9.25v-.5ZM7 15a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/></svg>
          </div>
          <div className="bento-stat-label">Allocated RAM</div>
          <div className="bento-stat-value">{totalRam >= 1024 ? `${(totalRam/1024).toFixed(1)}` : totalRam}</div>
          <div className="bento-stat-sub">{totalRam >= 1024 ? 'GB total' : 'MB total'}</div>
        </div>
      </div>

      {/* Server Grid */}
      {loading ? (
        <div className="loading"><span className="loading-spinner" /> Loading servers…</div>
      ) : servers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⛏</div>
          <div className="empty-state-title">No servers yet</div>
          <div className="empty-state-sub">Click "New Server" to create your first Minecraft server</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
            <IconPlus /> Create First Server
          </button>
        </div>
      ) : (
        <div className="servers-grid">
          {servers.map((s) => (
            <Link key={s.id} to={`/servers/${s.id}`} className="server-card">
              <div className="server-card-glow" />
              <div className="server-card-header">
                <div>
                  <div className="server-card-name">{s.name}</div>
                  <div className="server-card-type" style={{ color: TYPE_COLORS[s.type] ?? 'var(--text-muted)' }}>
                    {s.type.toUpperCase()}
                  </div>
                </div>
                <span className={badgeCls(s.status)}>
                  <span className="status-dot" />
                  {s.status}
                </span>
              </div>
              <div className="server-card-meta">
                <span className="server-meta-pill">v{s.version}</span>
                <span className="server-meta-pill">{s.ram} MB</span>
                <span className="server-meta-pill">:{s.port}</span>
              </div>
              <div className="server-card-actions">
                <span className="btn btn-ghost btn-sm" style={{ pointerEvents: 'none', flex: 1, justifyContent: 'center' }}>
                  Manage →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">New Minecraft Server</div>
            <form className="modal-form" onSubmit={create}>
              <div className="form-group">
                <label>Server Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Survival World"
                  required
                  autoFocus
                />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Version</label>
                  <select value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })}>
                    {MC_VERSIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Server Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {SERVER_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>RAM Allocation (MB)</label>
                <select value={form.ram} onChange={(e) => setForm({ ...form, ram: parseInt(e.target.value) })}>
                  {[512,1024,2048,3072,4096,6144,8192,12288,16384].map(v => (
                    <option key={v} value={v}>{v >= 1024 ? `${v/1024} GB` : `${v} MB`}</option>
                  ))}
                </select>
              </div>
              {createError && (
                <div className="error-msg">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
                  {createError}
                </div>
              )}
              {creating && (
                <div className="loading" style={{ padding: '8px 0', justifyContent: 'flex-start' }}>
                  <span className="loading-spinner" />
                  <span>Downloading {form.type} JAR for v{form.version}…</span>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)} disabled={creating}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating…' : 'Create Server'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
