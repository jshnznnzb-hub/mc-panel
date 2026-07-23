import React, { useEffect, useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '../api/client';

interface Stats { cpu: number; memory: number; status: string; }
interface DataPoint { time: string; cpu: number; ram: number; }
interface Props { serverId: string; }

const TOOLTIP_STYLE = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 11,
  color: 'var(--text-primary)',
};

export default function StatsTab({ serverId }: Props) {
  const [stats, setStats] = useState<Stats>({ cpu: 0, memory: 0, status: 'unknown' });
  const [history, setHistory] = useState<DataPoint[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = async () => {
    try {
      const res = await api.get(`/stats/${serverId}`);
      const s: Stats = res.data;
      setStats(s);
      setHistory((prev) => [
        ...prev.slice(-49),
        { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), cpu: s.cpu, ram: s.memory },
      ]);
    } catch {}
  };

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [serverId]);

  const badgeCls = stats.status === 'online' ? 'badge-online' : stats.status === 'offline' ? 'badge-offline' : 'badge-unknown';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stat cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-dim)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <svg viewBox="0 0 20 20" fill="var(--accent)"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd"/></svg>
          </div>
          <div>
            <div className="stat-label">Status</div>
            <div style={{ marginTop: 4 }}>
              <span className={`badge ${badgeCls}`}><span className="status-dot" />{stats.status}</span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <svg viewBox="0 0 20 20" fill="var(--blue)"><path d="M3.196 12.87l-.825.483a.75.75 0 0 0 0 1.294l7.25 4.25a.75.75 0 0 0 .758 0l7.25-4.25a.75.75 0 0 0 0-1.294l-.825-.484-5.666 3.322a2.25 2.25 0 0 1-2.276 0L3.196 12.87Z"/><path d="M3.196 8.87l-.825.483a.75.75 0 0 0 0 1.294l7.25 4.25a.75.75 0 0 0 .758 0l7.25-4.25a.75.75 0 0 0 0-1.294l-.825-.484-5.666 3.322a2.25 2.25 0 0 1-2.276 0L3.196 8.87Z"/><path d="M10.38 1.103a.75.75 0 0 0-.76 0l-7.25 4.25a.75.75 0 0 0 0 1.294l7.25 4.25a.75.75 0 0 0 .76 0l7.25-4.25a.75.75 0 0 0 0-1.294l-7.25-4.25Z"/></svg>
          </div>
          <div>
            <div className="stat-label">CPU Usage</div>
            <div className="stat-value" style={{ color: stats.cpu > 80 ? 'var(--red)' : stats.cpu > 50 ? 'var(--yellow)' : 'var(--text-primary)' }}>
              {stats.cpu.toFixed(1)}<span className="stat-unit">%</span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--purple-dim)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <svg viewBox="0 0 20 20" fill="var(--purple)"><path d="M10.362 1.093a.75.75 0 0 0-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925ZM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0 0 18 14.25V6.443ZM9.25 18.693v-8.25l-7.25-4v7.807a.75.75 0 0 0 .388.657l6.862 3.786Z"/></svg>
          </div>
          <div>
            <div className="stat-label">RAM Usage</div>
            <div className="stat-value" style={{ color: 'var(--purple)' }}>
              {stats.memory}<span className="stat-unit"> MB</span>
            </div>
          </div>
        </div>
      </div>

      {/* CPU Chart */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">CPU % — Last 50 polls (3s interval)</div>
          <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{stats.cpu.toFixed(1)}%</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={history} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#475569' }} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#475569' }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v.toFixed(1)}%`, 'CPU']} />
            <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} fill="url(#cpuGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* RAM Chart */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">RAM MB — Last 50 polls</div>
          <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--purple)' }}>{stats.memory} MB</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={history} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#475569' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: '#475569' }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v} MB`, 'RAM']} />
            <Area type="monotone" dataKey="ram" stroke="#a855f7" strokeWidth={2} fill="url(#ramGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
