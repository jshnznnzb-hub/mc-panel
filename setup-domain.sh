#!/bin/bash
# ============================================================
#  MC Panel — Nginx + SSL Setup Script
#  Run AFTER install.sh
#  Usage: bash setup-domain.sh panel.yourdomain.com
# ============================================================

set -e
GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC}   $1"; }
err()  { echo -e "${RED}[ERR]${NC}  $1"; exit 1; }

DOMAIN="${1:-}"
PANEL_PORT=4000

[ -z "$DOMAIN" ] && err "Usage: bash setup-domain.sh your.domain.com"

# 1. Install nginx + certbot
log "Installing nginx and certbot..."
apt install -y nginx certbot python3-certbot-nginx

# 2. Write nginx config (HTTP first, certbot upgrades to HTTPS)
NGINX_CONF="/etc/nginx/sites-available/mc-panel"

log "Writing nginx config for $DOMAIN..."
cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend + API — proxy everything to panel backend
    location / {
        proxy_pass         http://127.0.0.1:$PANEL_PORT;
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }

    # WebSocket console — must pass Upgrade header
    location /ws/ {
        proxy_pass         http://127.0.0.1:$PANEL_PORT;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    \$http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host       \$host;
        proxy_read_timeout 3600s;
    }
}
EOF

# 3. Enable site
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/mc-panel
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx
ok "Nginx configured for $DOMAIN"

# 4. Obtain SSL cert (Let's Encrypt)
log "Obtaining SSL certificate for $DOMAIN..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos \
  --email "admin@$DOMAIN" --redirect

ok "========================================"
ok " Panel now accessible at:"
ok " https://$DOMAIN"
ok "========================================"

# 5. Auto-renew cron
log "Setting up certbot auto-renewal..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | crontab -
ok "Auto-renewal cron set (runs daily at 3am)"
