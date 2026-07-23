import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../components/Toast';
import ConsoleTab from '../components/Console';
import PluginsTab from '../components/Plugins';
import FilesTab from '../components/Files';
import BackupsTab from '../components/Backups';
import StatsTab from '../components/Stats';

interface Server {
  id: string; name: string; version: string; type: string;
  ram: number; port: number; status: string;
}

type Tab = 'console' | 'plugins' | 'files' | 'backups' | 'stats';

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  console: <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path fillRule="evenodd" d="M2 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5Zm3.293 1.293a1 1 0 0 1 1.414 0l3 3a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1-1.414-1.414L7.586 10 5.293 7.707a1 1 0 0 1 0-1.414ZM11 12a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2h-3Z" clipRule="evenodd" /></svg>,
  plugins: <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z"/><path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z"/></svg>,
  files: <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path d="M3.75 3A1.75 1.75 0 0 0 2 4.75v3.26A3.235 3.235 0 0 1 3.75 7.5h12.5c.28 0 .55.025.812.072A1.75 1.75 0 0 0 15.25 6h-4.836a.25.25 0 0 1-.177-.073L9.314 4.5h-5.57A.25.25 0 0 1 3.5 4.25V4A.25.25 0 0 1 3.75 3.75H16.25A.25.25 0 0 1 16.5 4v1.214A1.75 1.75 0 0 0 15.25 5H3.75A1.75 1.75 0 0 0 2 6.75V15a1.75 1.75 0 0 0 1.75 1.75h12.5A1.75 1.75 0 0 0 18 15V8.25A1.75 1.75 0 0 0 16.25 6.5H3.75A.25.25 0 0 0 3.5 6.75v8.5a.25.25 0 0 0 .25.25h12.5a.25.25 0 0 0 .25-.25V8.25a.25.25 0 0 0-.25-.25H3.75Z"/></svg>,
  backups: <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z"/><path fillRule="evenodd" d="M2 7.5h16l-.811 7.71a2 2 0 0 1-1.99 1.79H4.802a2 2 0 0 1-1.99-1.79L2 7.5ZM7 11a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2H8a1 1 0 0 1-1-1Z" clipRule="evenodd"/></svg>,
  stats: <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path d="M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 3 0v-13A1.5 1.5 0 0 0 15.5 2ZM9.5 6A1.5 1.5 0 0 0 8 7.5v9a1.5 1.5 0 0 0 3 0v-9A1.5 1.5 0 0 0 9.5 6ZM3.5 10A1.5 1.5 0 0 0 2 11.5v5a1.5 1.5 0 0 0 3 0v-5A1.5 1.5 0 0 0 3.5 10Z"/></svg>,
};

const TYPE_COLOR: Record<string, string> = {
  paper: 'var(--accent)', purpur: 'var(--purple)', vanilla: 'var(--blue)',
};

export default function ServerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [server, setServer] = useState<Server | null>(null);
  const [tab, setTab] = useState<Tab>('console');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await api.get(`/servers/${id}`);
      setServer(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => { const t = setInterval(load, 5000); return () => clearInterval(t); }, [id]);

  const action = async (type: 'start' | 'stop' | 'restart') => {
    setActionLoading(type);
    try {
      await api.post(`/servers/${id}/${type}`);
      await load();
      toast.success(`Server ${type === 'start' ? 'started' : type === 'stop' ? 'stopped' : 'restarted'}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to ${type} server`);
    } finally {
      setActionLoading(null);
    }
  };

  const del = async () => {
    if (!confirm(`Permanently delete server "${server?.name}"?\n\nThis will remove all server files and backups.`)) return;
    await api.delete(`/servers/${id}`);
    toast.success('Server deleted');
    navigate('/');
  };

  if (loading || !server) {
    return <div className="loading"><span className="loading-spinner" /> Loading server…</div>;
  }

  const statusCls = server.status === 'online' ? 'badge-online' : server.status === 'offline' ? 'badge-offline' : 'badge-unknown';

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')} style={{ marginTop: 4 }}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" /></svg>
            Back
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div className="page-title">{server.name}</div>
              <span className={`badge ${statusCls}`}><span className="status-dot" />{server.status}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <span className="server-meta-pill" style={{ color: TYPE_COLOR[server.type] ?? 'var(--text-muted)', borderColor: TYPE_COLOR[server.type] ?? 'var(--border-subtle)' }}>
                {server.type.toUpperCase()}
              </span>
              <span className="server-meta-pill">v{server.version}</span>
              <span className="server-meta-pill">{server.ram} MB RAM</span>
              <span className="server-meta-pill">Port {server.port}</span>
            </div>
          </div>
        </div>

        <div className="page-actions" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={() => action('start')} disabled={!!actionLoading}>
            {actionLoading === 'start' ? <span className="loading-spinner" style={{ width: 11, height: 11 }} /> : (
              <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.344-5.891a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z"/></svg>
            )} Start
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => action('restart')} disabled={!!actionLoading}>
            {actionLoading === 'restart' ? <span className="loading-spinner" style={{ width: 11, height: 11 }} /> : (
              <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V3.198a.75.75 0 0 0-1.5 0v2.433l-.31-.31a7 7 0 0 0-11.712 3.138.75.75 0 1 0 1.449.39 5.5 5.5 0 0 1 9.2-2.466l.312.311h-2.433a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .531-.22Z" clipRule="evenodd" /></svg>
            )} Restart
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => action('stop')} disabled={!!actionLoading}>
            {actionLoading === 'stop' ? <span className="loading-spinner" style={{ width: 11, height: 11 }} /> : (
              <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path d="M5.75 3A2.75 2.75 0 0 0 3 5.75v8.5A2.75 2.75 0 0 0 5.75 17h8.5A2.75 2.75 0 0 0 17 14.25v-8.5A2.75 2.75 0 0 0 14.25 3h-8.5Z"/></svg>
            )} Stop
          </button>
          <button className="btn btn-ghost-danger btn-sm" onClick={del}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5Z" clipRule="evenodd" /></svg>
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {(Object.keys(TAB_ICONS) as Tab[]).map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {TAB_ICONS[t]}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'console'  && <ConsoleTab serverId={server.id} serverName={server.name} />}
      {tab === 'plugins'  && <PluginsTab serverId={server.id} />}
      {tab === 'files'    && <FilesTab   serverId={server.id} />}
      {tab === 'backups'  && <BackupsTab serverId={server.id} />}
      {tab === 'stats'    && <StatsTab   serverId={server.id} />}
    </div>
  );
}
