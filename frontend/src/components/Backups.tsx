import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useToast } from './Toast';

interface Backup { filename: string; size: number; created: number; }
interface Props { serverId: string; }

function fmtSize(b: number) { return `${(b/1_048_576).toFixed(1)} MB`; }
function fmtDate(ms: number) {
  const d = new Date(ms);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function IconArchive() {
  return <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15"><path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z"/><path fillRule="evenodd" d="M2 7.5h16l-.811 7.71a2 2 0 0 1-1.99 1.79H4.802a2 2 0 0 1-1.99-1.79L2 7.5ZM7 11a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2H8a1 1 0 0 1-1-1Z" clipRule="evenodd"/></svg>;
}
function IconDownload() {
  return <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z"/><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z"/></svg>;
}
function IconTrash() {
  return <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd"/></svg>;
}

export default function BackupsTab({ serverId }: Props) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  const load = async () => {
    const res = await api.get(`/backups/${serverId}`);
    setBackups(res.data);
  };

  useEffect(() => { load(); }, [serverId]);

  const create = async () => {
    setCreating(true);
    try {
      const res = await api.post(`/backups/${serverId}`);
      await load();
      toast.success(`Backup created: ${res.data.filename}`);
    } catch {
      toast.error('Backup failed');
    } finally {
      setCreating(false);
    }
  };

  const del = async (filename: string) => {
    if (!confirm(`Delete backup "${filename}"?`)) return;
    await api.delete(`/backups/${serverId}/${filename}`);
    await load();
    toast.success('Backup deleted');
  };

  const totalSize = backups.reduce((a, b) => a + b.size, 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {backups.length} backup{backups.length !== 1 ? 's' : ''} · {fmtSize(totalSize)} total
          </div>
        </div>
        <button className="btn btn-primary" onClick={create} disabled={creating}>
          {creating
            ? <><span className="loading-spinner" style={{ width: 13, height: 13 }} /> Creating…</>
            : <><IconArchive /> Create Backup</>
          }
        </button>
      </div>

      {backups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💾</div>
          <div className="empty-state-title">No backups yet</div>
          <div className="empty-state-sub">Create a backup to save your server state</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {backups.map((b, i) => (
            <div key={b.filename} className="backup-card animate-in" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="backup-icon"><IconArchive /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-mono text-sm" style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.filename}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)', marginTop: 3 }}>
                  {fmtSize(b.size)} · {fmtDate(b.created)}
                </div>
              </div>
              <a
                className="btn btn-ghost btn-sm"
                href={`/api/backups/${serverId}/download/${b.filename}`}
                download
              >
                <IconDownload /> Download
              </a>
              <button className="btn btn-ghost-danger btn-sm" onClick={() => del(b.filename)}>
                <IconTrash />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
