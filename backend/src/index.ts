import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { WebSocketServer } from 'ws';

import './db'; // init DB + seed admin
import authRouter from './routes/auth';
import serversRouter from './routes/servers';
import pluginsRouter from './routes/plugins';
import filesRouter from './routes/files';
import backupsRouter from './routes/backups';
import statsRouter from './routes/stats';
import { setupConsoleWS } from './services/console';

const PORT = parseInt(process.env.PORT || '4000', 10);

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/servers', serversRouter);
app.use('/api/plugins', pluginsRouter);
app.use('/api/files', filesRouter);
app.use('/api/backups', backupsRouter);
app.use('/api/stats', statsRouter);

// Serve frontend in production
const FRONTEND_DIST = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(FRONTEND_DIST));
app.get('*', (_req, res) => res.sendFile(path.join(FRONTEND_DIST, 'index.html')));

// HTTP server + WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/console' });

// Override path matching — accept any /ws/console/* path
const wssAny = new WebSocketServer({ noServer: true });
setupConsoleWS(wssAny);

server.on('upgrade', (request, socket, head) => {
  if (request.url?.startsWith('/ws/console/')) {
    wssAny.handleUpgrade(request, socket, head, (ws) => {
      wssAny.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`[Panel] Running at http://0.0.0.0:${PORT}`);
});
