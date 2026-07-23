import pm2 from 'pm2';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '..', '.data', 'servers');

function pmConnect(): Promise<void> {
  return new Promise((resolve, reject) => pm2.connect((err) => err ? reject(err) : resolve()));
}

export async function startServer(server: { id: string; ram: number; port: number }) {
  await pmConnect();
  const dir = path.join(DATA_DIR, server.id);
  return new Promise<void>((resolve, reject) => {
    pm2.start(
      {
        name: `mc-${server.id}`,
        script: 'java',
        args: [`-Xmx${server.ram}M`, `-Xms512M`, '-jar', 'server.jar', '--nogui'],
        cwd: dir,
        autorestart: false,
      },
      (err) => {
        pm2.disconnect();
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export async function stopServer(id: string) {
  await pmConnect();
  return new Promise<void>((resolve) => {
    pm2.delete(`mc-${id}`, () => {
      pm2.disconnect();
      resolve();
    });
  });
}

export async function restartServer(id: string) {
  await pmConnect();
  return new Promise<void>((resolve, reject) => {
    pm2.restart(`mc-${id}`, (err) => {
      pm2.disconnect();
      if (err) reject(err);
      else resolve();
    });
  });
}

export function getServerStatus(id: string): string {
  // Sync check via pm2 list cache — best-effort
  try {
    // We return unknown here; real status via /stats polling
    return 'unknown';
  } catch {
    return 'offline';
  }
}

export async function getServerStats(id: string): Promise<{ cpu: number; memory: number; status: string }> {
  await pmConnect();
  return new Promise((resolve) => {
    pm2.describe(`mc-${id}`, (err, list) => {
      pm2.disconnect();
      if (err || !list || list.length === 0) {
        resolve({ cpu: 0, memory: 0, status: 'offline' });
        return;
      }
      const proc = list[0];
      resolve({
        cpu: proc.monit?.cpu ?? 0,
        memory: Math.round((proc.monit?.memory ?? 0) / 1024 / 1024),
        status: proc.pm2_env?.status ?? 'unknown',
      });
    });
  });
}
