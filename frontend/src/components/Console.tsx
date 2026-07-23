import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface Props { serverId: string; serverName?: string; }

export default function ConsoleTab({ serverId, serverName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const [cmd, setCmd] = useState('');
  const [connected, setConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      theme: {
        background: '#0a0a0a',
        foreground: '#d4d4d4',
        cursor: '#22c55e',
        cursorAccent: '#000',
        selectionBackground: 'rgba(34,197,94,0.2)',
        black: '#1a1a1a',
        brightBlack: '#555',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#d4d4d4',
        brightWhite: '#f8fafc',
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 12.5,
      lineHeight: 1.5,
      cursorBlink: true,
      cursorStyle: 'bar',
      allowProposedApi: true,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;

    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${location.host}/ws/console/${serverId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      term.writeln('\x1b[32m[Panel] Connected to server console. Type commands below.\x1b[0m');
      term.writeln('\x1b[90m─'.repeat(60) + '\x1b[0m');
    };
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'output') term.write(msg.data);
      if (msg.type === 'exit') {
        term.writeln('\x1b[90m─'.repeat(60) + '\x1b[0m');
        term.writeln('\x1b[33m[Panel] Process exited.\x1b[0m');
        setConnected(false);
      }
    };
    ws.onclose = () => {
      setConnected(false);
      term.writeln('\x1b[33m\r\n[Panel] Disconnected from console.\x1b[0m');
    };

    const observer = new ResizeObserver(() => fit.fit());
    if (containerRef.current) observer.observe(containerRef.current);

    return () => { ws.close(); term.dispose(); observer.disconnect(); };
  }, [serverId]);

  const sendCmd = () => {
    if (!cmd.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'input', data: cmd + '\n' }));
    setCmd('');
  };

  return (
    <div>
      <div className="console-container">
        {/* macOS-style header */}
        <div className="console-header">
          <div className="console-dots">
            <div className="console-dot console-dot-red" />
            <div className="console-dot console-dot-yellow" />
            <div className="console-dot console-dot-green" />
          </div>
          <div className="console-title">{serverName ?? 'server'} — bash</div>
          <div className="flex gap-2 items-center">
            <span className={`badge ${connected ? 'badge-online' : 'badge-offline'}`} style={{ fontSize: '0.6rem' }}>
              <span className="status-dot" />
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="console-body" ref={containerRef} />
      </div>

      {/* Command input */}
      <div className="console-input-row">
        <span className="console-prompt">$</span>
        <input
          ref={inputRef}
          className="console-input"
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendCmd()}
          placeholder={connected ? 'Enter Minecraft command…' : 'Server offline'}
          disabled={!connected}
        />
        <button className="btn btn-primary btn-sm" onClick={sendCmd} disabled={!connected || !cmd.trim()}>
          Send
        </button>
      </div>

      <div style={{ marginTop: 8, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
        Tip: Use <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>say Hello</span>, <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>list</span>, <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>stop</span>
      </div>
    </div>
  );
}
