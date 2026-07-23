import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useToast } from './Toast';

interface Plugin { id: number; name: string; tag: string; downloads: number; rating: number; iconUrl: string | null; version: string; testedVersions: string[]; }
interface Installed { name: string; size: number; modified: number; }
interface Props { serverId: string; }

function IconPlugin() {
  return <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fillRule="evenodd" d="M4 2a2 2 0 0 0-2 2v11a3 3 0 1 0 6 0V4a2 2 0 0 0-2-2H4Zm1 14a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm-1-4a1 1 0 0 1 1 1H3a1 1 0 0 1 1-1Zm6-8a2 2 0 1 1 4 0v.5a.5.5 0 0 0 .5.5H16a2 2 0 0 1 2 2v5.268a2 2 0 0 1-.634 1.455l-1.634 1.495a2 2 0 0 1-1.366.532h-4.732A2 2 0 0 1 8 15.268V6a2 2 0 0 1 2-2Z" clipRule="evenodd" /></svg>;
}
function IconSearch() {
  return <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg>;
}
function IconTrash() {
  return <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>;
}

function StarRating({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="10" height="10" viewBox="0 0 20 20" fill={i < filled ? 'var(--yellow)' : 'var(--border)'}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
        </svg>
      ))}
    </span>
  );
}

function fmtDL(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n/1_000).toFixed(1)}K`;
  return String(n);
}
function fmtSize(b: number) {
  if (b > 1048576) return `${(b/1048576).toFixed(1)} MB`;
  return `${(b/1024).toFixed(0)} KB`;
}

export default function PluginsTab({ serverId }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Plugin[]>([]);
  const [installed, setInstalled] = useState<Installed[]>([]);
  const [searching, setSearching] = useState(false);
  const [installing, setInstalling] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'installed'>('search');
  const toast = useToast();

  const loadInstalled = async () => {
    const res = await api.get(`/plugins/${serverId}`);
    setInstalled(res.data);
  };

  useEffect(() => { loadInstalled(); }, [serverId]);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const res = await api.get(`/plugins/search?q=${encodeURIComponent(query)}`);
      setResults(res.data);
      if (res.data.length === 0) toast.info('No plugins found for that query');
    } catch {
      toast.error('Failed to search plugins');
    } finally {
      setSearching(false);
    }
  };

  const install = async (plugin: Plugin) => {
    setInstalling(plugin.id);
    try {
      await api.post(`/plugins/${serverId}/install`, { resourceId: plugin.id });
      await loadInstalled();
      toast.success(`${plugin.name} installed! Restart server to activate.`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Install failed');
    } finally {
      setInstalling(null);
    }
  };

  const remove = async (name: string) => {
    if (!confirm(`Delete ${name}?`)) return;
    await api.delete(`/plugins/${serverId}/${name}`);
    await loadInstalled();
    toast.success(`${name} removed`);
  };

  const alreadyInstalled = (name: string) => installed.some(i => i.name.startsWith(name.replace(/[^a-zA-Z0-9_-]/g, '_')));

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`btn ${activeTab === 'search' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setActiveTab('search')}>
          <IconSearch /> Search SpigotMC
        </button>
        <button className={`btn ${activeTab === 'installed' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => { setActiveTab('installed'); loadInstalled(); }}>
          <IconPlugin /> Installed ({installed.length})
        </button>
      </div>

      {activeTab === 'search' && (
        <>
          <div className="search-bar">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="Search plugins (e.g. EssentialsX, WorldEdit, LuckPerms)…"
            />
            <button className="btn btn-primary" onClick={search} disabled={searching || !query.trim()}>
              {searching ? <><span className="loading-spinner" style={{ width: 12, height: 12 }} /> Searching…</> : <><IconSearch /> Search</>}
            </button>
          </div>

          {results.length === 0 && !searching && (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ fontSize: '2rem' }}>🔌</div>
              <div className="empty-state-title">Search for plugins</div>
              <div className="empty-state-sub">Find and install plugins from SpigotMC</div>
            </div>
          )}

          <div className="plugin-list">
            {results.map((p) => (
              <div key={p.id} className="plugin-card">
                {p.iconUrl ? (
                  <img src={p.iconUrl} alt={p.name} className="plugin-icon" />
                ) : (
                  <div className="plugin-icon-placeholder"><IconPlugin /></div>
                )}
                <div className="plugin-info">
                  <div className="plugin-name">{p.name}</div>
                  <div className="plugin-tag">{p.tag}</div>
                  <div className="plugin-meta">
                    <span className="plugin-meta-item"><StarRating rating={p.rating} /> {p.rating.toFixed(1)}</span>
                    <span className="plugin-meta-item">
                      <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z"/><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z"/></svg>
                      {fmtDL(p.downloads)}
                    </span>
                    {p.version && <span className="plugin-meta-item">v{p.version}</span>}
                  </div>
                  {p.testedVersions?.length > 0 && (
                    <div className="plugin-versions">
                      {p.testedVersions.slice(0, 5).map((v) => <span key={v} className="version-tag">{v}</span>)}
                    </div>
                  )}
                </div>
                <button
                  className={`btn btn-sm ${alreadyInstalled(p.name) ? 'btn-ghost' : 'btn-primary'}`}
                  onClick={() => install(p)}
                  disabled={installing === p.id}
                  style={{ flexShrink: 0 }}
                >
                  {installing === p.id
                    ? <><span className="loading-spinner" style={{ width: 11, height: 11 }} /> Installing…</>
                    : alreadyInstalled(p.name) ? 'Reinstall' : 'Install'
                  }
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'installed' && (
        <>
          {installed.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No plugins installed</div>
              <div className="empty-state-sub">Search for plugins to install them</div>
            </div>
          ) : (
            <div className="plugin-list">
              {installed.map((p) => (
                <div key={p.name} className="plugin-card">
                  <div className="plugin-icon-placeholder"><IconPlugin /></div>
                  <div className="plugin-info">
                    <div className="plugin-name">{p.name}</div>
                    <div className="plugin-meta">
                      <span className="plugin-meta-item">{fmtSize(p.size)}</span>
                      <span className="plugin-meta-item">{new Date(p.modified).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button className="btn btn-ghost-danger btn-sm" onClick={() => remove(p.name)}>
                    <IconTrash /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
