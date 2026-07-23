import pty from 'node-pty';
import WebSocket, { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import db from '../db';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '..', '.data', 'servers');

interface Session {
  pty: pty.IPty;
  clients: Set<WebSocket>;
}

const sessions = new Map<string, Session>();

export function setupConsoleWS(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    // URL: /ws/console/:serverId
    const match = req.url?.match(/\/ws\/console\/([a-f0-9-]+)/);
    if (!match) { ws.close(); return; }
    const serverId = match[1];

    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId) as any;
    if (!server) { ws.close(); return; }

    // Reuse existing session or spawn new pty
    if (!sessions.has(serverId)) {
      const dir = path.join(DATA_DIR, serverId);
      const p = pty.spawn('java', [
        `-Xmx${server.ram}M`, '-Xms512M', '-jar', 'server.jar', '--nogui',
      ], {
        name: 'xterm-color',
        cwd: dir,
        env: process.env as Record<string, string>,
      });

      const session: Session = { pty: p, clients: new Set() };
      sessions.set(serverId, session);

      p.onData((data: string) => {
        for (const client of session.clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'output', data }));
          }
        }
      });

      p.onExit(() => {
        for (const client of session.clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'exit' }));
            client.close();
          }
        }
        sessions.delete(serverId);
      });
    }

    const session = sessions.get(serverId)!;
    session.clients.add(ws);

    ws.on('message', (msg: WebSocket.RawData) => {
      try {
        const parsed = JSON.parse(msg.toString()) as { type: string; data?: string };
        if (parsed.type === 'input' && parsed.data) {
          session.pty.write(parsed.data);
        }
      } catch {}
    });

    ws.on('close', () => {
      session.clients.delete(ws);
    });
  });
}

export function killConsole(serverId: string) {
  const session = sessions.get(serverId);
  if (session) {
    session.pty.kill();
    sessions.delete(serverId);
  }
}
