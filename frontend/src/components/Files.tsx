import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useToast } from './Toast';

interface FileEntry { name: string; type: 'file' | 'dir'; size: number; }
interface Props { serverId: string; }

function IconFolder() {
  return <svg viewBox="0 0 20 20" fill="currentColor"><path d="M3.75 3A1.75 1.75 0 0 0 2 4.75v3.26A3.235 3.235 0 0 1 3.75 7.5h12.5c.28 0 .55.025.812.072A1.75 1.75 0 0 0 15.25 6h-4.836a.25.25 0 0 1-.177-.073L9.314 4.5h-5.57A.25.25 0 0 1 3.5 4.25V4A.25.25 0 0 1 3.75 3.75H16.25A.25.25 0 0 1 16.5 4v1.214A1.75 1.75 0 0 0 15.25 5H3.75A1.75 1.75 0 0 0 2 6.75V15a1.75 1.75 0 0 0 1.75 1.75h12.5A1.75 1.75 0 0 0 18 15V8.25A1.75 1.75 0 0 0 16.25 6.5H3.75A.25.25 0 0 0 3.5 6.75v8.5a.25.25 0 0 0 .25.25h12.5a.25.25 0 0 0 .25-.25V8.25a.25.25 0 0 0-.25-.25H3.75Z"/></svg>;
}
function IconFile() {
  return <svg viewBox="0 0 20 20" fill="currentColor"><path d="M3 3.5A1.5 1.5 0 0 1 4.5 2h6.879a1.5 1.5 0 0 1 1.06.44l4.122 4.12A1.5 1.5 0 0 1 17 7.622V16.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 16.5v-13Z"/></svg>;
}
function IconUp() {
  return <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fillRule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clipRule="evenodd"/></svg>;
}
function IconSave() {
  return <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M13.75 1.5H4A2.5 2.5 0 0 0 1.5 4v12A2.5 2.5 0 0 0 4 18.5h12A2.5 2.5 0 0 0 18.5 16V6.75L13.75 1.5ZM7.75 3h4.5v3a.75.75 0 0 0 1.5 0V3H14l3 3v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3.75Z"/></svg>;
}
function IconTrash() {
  return <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd"/></svg>;
}

function fmtSize(b: number) {
  if (b > 1_048_576) return `${(b / 1_048_576).toFixed(1)} MB`;
  if (b > 1_024)     return `${(b / 1_024).toFixed(0)} KB`;
  return `${b} B`;
}

export default function FilesTab({ serverId }: Props) {
  const [path, setPath] = useState('/');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [editing, setEditing] = useState<{ path: string; content: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = async (p: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/files/${serverId}?path=${encodeURIComponent(p)}`);
      setEntries(res.data);
    } catch {
      toast.error('Failed to load directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(path); }, [path]);

  const navigate = (name: string) => {
    setPath(path === '/' ? `/${name}` : `${path}/${name}`);
  };

  const goUp = () => {
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    setPath(parts.length ? `/${parts.join('/')}` : '/');
  };

  const openFile = async (name: string) => {
    const filePath = path === '/' ? `/${name}` : `${path}/${name}`;
    try {
      const res = await api.get(`/files/${serverId}/read?path=${encodeURIComponent(filePath)}`);
      setEditing({ path: filePath, content: res.data.content });
    } catch {
      toast.error('Cannot read file (binary or too large)');
    }
  };

  const saveFile = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.put(`/files/${serverId}/write`, { filePath: editing.path, content: editing.content });
      toast.success('File saved');
    } catch {
      toast.error('Failed to save file');
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (name: string, type: string) => {
    const filePath = path === '/' ? `/${name}` : `${path}/${name}`;
    if (!confirm(`Delete ${name}?`)) return;
    await api.delete(`/files/${serverId}/delete`, { data: { filePath } });
    await load(path);
    toast.success(`${name} deleted`);
  };

  // Breadcrumb segments
  const segments = path.split('/').filter(Boolean);

  if (editing) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>← Back</button>
          <span className="font-mono text-xs" style={{ color: 'var(--text-muted)', flex: 1 }}>{editing.path}</span>
          <button className="btn btn-primary btn-sm" onClick={saveFile} disabled={saving}>
            {saving ? <><span className="loading-spinner" style={{ width: 11, height: 11 }} /> Saving…</> : <><IconSave /> Save</>}
          </button>
        </div>
        <textarea
          className="code-editor"
          style={{ height: 520, width: '100%' }}
          value={editing.content}
          onChange={(e) => setEditing({ ...editing, content: e.target.value })}
          spellCheck={false}
        />
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      <div className="file-browser">
        <div className="file-toolbar">
          {path !== '/' && (
            <button className="btn btn-ghost btn-sm" onClick={goUp} title="Go up">
              <IconUp />
            </button>
          )}
          <div className="breadcrumb">
            <span className="breadcrumb-seg" onClick={() => setPath('/')} style={{ color: path === '/' ? 'var(--text-primary)' : undefined }}>root</span>
            {segments.map((seg, i) => {
              const segPath = '/' + segments.slice(0, i + 1).join('/');
              const isLast = i === segments.length - 1;
              return (
                <React.Fragment key={segPath}>
                  <span className="breadcrumb-sep">/</span>
                  {isLast
                    ? <span className="breadcrumb-current">{seg}</span>
                    : <span className="breadcrumb-seg" onClick={() => setPath(segPath)}>{seg}</span>
                  }
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="file-list">
          {loading ? (
            <div className="loading" style={{ padding: 24 }}>
              <span className="loading-spinner" /> Loading…
            </div>
          ) : sorted.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-state-title">Empty directory</div>
            </div>
          ) : (
            sorted.map((e) => (
              <div
                key={e.name}
                className={`file-row file-type-${e.type}`}
                onClick={() => e.type === 'dir' ? navigate(e.name) : openFile(e.name)}
              >
                <div className="file-row-icon">
                  {e.type === 'dir' ? <IconFolder /> : <IconFile />}
                </div>
                <div className="file-row-name">{e.name}</div>
                {e.type === 'file' && <div className="file-row-size">{fmtSize(e.size)}</div>}
                <div className="file-row-actions" onClick={(ev) => ev.stopPropagation()}>
                  <button className="btn btn-ghost-danger btn-sm" onClick={() => deleteEntry(e.name, e.type)}>
                    <IconTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
