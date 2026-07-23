# MC Panel

A self-hosted Minecraft server management panel. Built with Node.js, Express, React, and SQLite.

## Features

- 🖥 Create and manage multiple Minecraft servers (Paper / Purpur / Vanilla)
- 🔴 Real-time console via WebSocket + xterm.js
- 🔌 One-click plugin install from SpigotMC (Spiget API)
- 📁 File manager — browse, edit, upload, delete
- 💾 Backup servers as `.zip`
- 📊 CPU + RAM resource monitor (live charts)
- 🔐 JWT authentication (single admin)

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js 22+ · Express · TypeScript |
| Database | Node built-in `node:sqlite` (no compilation) |
| Frontend | React · Vite · TypeScript |
| Process mgr | PM2 |
| Console | node-pty + WebSocket + xterm.js |
| Plugins | Spiget API v2 |

---

## Deploy on Ubuntu Server

### Step 1 — Run install script

```bash
# On your Ubuntu server
git clone https://github.com/YOUR_USERNAME/YOUR_REPO /opt/mc-panel
cd /opt/mc-panel
bash install.sh
```

This will:
- Install Node.js 20, Java 21, PM2
- Install + build backend and frontend
- Create admin user (you'll be prompted)
- Start panel on port **4000** via PM2

Panel accessible at: `http://YOUR_SERVER_IP:4000`

---

### Step 2 — Point your domain

In your DNS provider, add an **A record**:

| Type | Name | Value |
|---|---|---|
| A | `panel` | `YOUR_SERVER_IP` |

e.g. `panel.yourdomain.com` → `123.456.789.0`

Wait for DNS to propagate (usually 1–5 min).

---

### Step 3 — Setup nginx + SSL

```bash
bash setup-domain.sh panel.yourdomain.com
```

This will:
- Install nginx + certbot
- Configure reverse proxy (HTTP + WebSocket)
- Obtain free Let's Encrypt SSL certificate
- Auto-redirect HTTP → HTTPS
- Setup auto-renewal cron

Panel accessible at: `https://panel.yourdomain.com` ✅

---

## Manual nginx setup (if needed)

```bash
# Install
apt install -y nginx certbot python3-certbot-nginx

# Copy config
cp nginx.conf.template /etc/nginx/sites-available/mc-panel
nano /etc/nginx/sites-available/mc-panel  # replace YOUR_DOMAIN

# Enable
ln -s /etc/nginx/sites-available/mc-panel /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Get SSL cert
certbot --nginx -d panel.yourdomain.com
```

---

## Default credentials

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin123` (set during install) |

**Change this on first login via the install script prompt.**

---

## Ports

| Service | Port | Notes |
|---|---|---|
| Panel backend | `4000` | Internal only (nginx proxies it) |
| Frontend dev | `5173` | Dev mode only |
| Minecraft servers | `25565+` | Auto-assigned, open in firewall |

Open Minecraft server ports in UFW:
```bash
ufw allow 25565:25575/tcp
```

---

## Development

```bash
# Clone repo
git clone ...
cd mincraft_panel

# Install deps
npm install
npm install --prefix backend
npm install --prefix frontend

# Run both servers
npm run dev
# Backend: http://localhost:4000
# Frontend: http://localhost:5173 (proxies /api to :4000)
```

---

## PM2 commands

```bash
pm2 list              # list all processes
pm2 logs mc-panel     # view panel logs
pm2 restart mc-panel  # restart panel
pm2 stop mc-panel     # stop panel
```

---

## File structure

```
mincraft_panel/
├── backend/
│   └── src/
│       ├── routes/      auth, servers, plugins, files, backups, stats
│       ├── services/    PM2, JAR downloader, WebSocket console, Spiget
│       ├── middleware/  JWT auth
│       └── db/          node:sqlite init
├── frontend/
│   └── src/
│       ├── pages/       Login, Dashboard, ServerDetail
│       └── components/  Console, Plugins, Files, Backups, Stats
├── .data/               server data, backups, DB (auto-created)
├── install.sh           Ubuntu deploy script
├── setup-domain.sh      Nginx + SSL setup
└── nginx.conf.template  Nginx config template
```
