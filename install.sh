#!/bin/bash
set -e

# ============================================================
#  MC Panel — Ubuntu Install Script
# ============================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC}   $1"; }
err()  { echo -e "${RED}[ERR]${NC}  $1"; exit 1; }

INSTALL_DIR="/opt/mc-panel"
PANEL_PORT=4000

log "=== MC Panel Installer ==="

# 1. System update
log "Updating system packages..."
apt update -y && apt upgrade -y

# 2. Install dependencies
log "Installing curl, git, unzip..."
apt install -y curl git unzip openjdk-21-jre-headless

# 3. Node.js 20
if ! command -v node &>/dev/null; then
  log "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
ok "Node.js $(node -v)"

# 4. PM2
if ! command -v pm2 &>/dev/null; then
  log "Installing PM2..."
  npm install -g pm2
fi
ok "PM2 installed"

# 5. Clone panel
if [ -d "$INSTALL_DIR" ]; then
  log "Updating existing install..."
  git -C "$INSTALL_DIR" pull
else
  log "Cloning MC Panel..."
  git clone https://github.com/YOUR_USERNAME/YOUR_REPO "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# 6. Install backend deps
log "Installing backend dependencies..."
cd backend && npm install --production=false
log "Building backend..."
npm run build
cd ..

# 7. Install & build frontend
log "Installing frontend dependencies..."
cd frontend && npm install
log "Building frontend..."
npm run build
cd ..

# 8. Admin credentials
echo ""
read -p "Admin username [admin]: " ADMIN_USER
ADMIN_USER="${ADMIN_USER:-admin}"
read -s -p "Admin password: " ADMIN_PASS
echo ""

# 9. Start with PM2
log "Starting panel with PM2..."
cd backend
ADMIN_USER="$ADMIN_USER" ADMIN_PASS="$ADMIN_PASS" PORT="$PANEL_PORT" \
  pm2 start dist/index.js --name mc-panel \
  --env production \
  -- --env ADMIN_USER="$ADMIN_USER" ADMIN_PASS="$ADMIN_PASS"

pm2 save
pm2 startup | tail -1 | bash || true

# 10. Firewall
if command -v ufw &>/dev/null; then
  log "Opening port $PANEL_PORT in UFW..."
  ufw allow "$PANEL_PORT/tcp" || true
fi

echo ""
ok "========================================"
ok " MC Panel running at:"
ok " http://$(hostname -I | awk '{print $1}'):$PANEL_PORT"
ok " Login: $ADMIN_USER / [your password]"
ok "========================================"
