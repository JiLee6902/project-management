#!/bin/bash
set -e

# ===========================================
# Hetzner Server Initial Setup Script
# Run: ssh root@46.224.149.73 < setup-server.sh
# ===========================================

SERVER_IP="46.224.149.73"

echo "========================================="
echo "  Setting up Hetzner Server"
echo "========================================="

# 1. Update system
echo "[1/6] Updating system..."
apt update && apt upgrade -y

# 2. Install Docker (if not installed)
if ! command -v docker &> /dev/null; then
    echo "[2/6] Installing Docker..."
    apt install -y docker.io docker-compose-v2
    systemctl enable docker
    systemctl start docker
else
    echo "[2/6] Docker already installed"
fi

# 3. Setup firewall
echo "[3/6] Configuring firewall..."
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # API (temporary, remove after nginx setup)
ufw --force enable

# 4. Create app directory
echo "[4/6] Creating app directory..."
mkdir -p ~/app

# 5. Install Nginx (reverse proxy)
echo "[5/6] Installing Nginx..."
apt install -y nginx
systemctl enable nginx

# Create Nginx config for API
cat > /etc/nginx/sites-available/pm-api << 'NGINX'
server {
    listen 80;
    server_name _;

    # API proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket for notifications
    location /socket.io/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/pm-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 6. Setup swap (for 8GB RAM server)
echo "[6/6] Setting up swap..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "vm.swappiness=10" >> /etc/sysctl.conf
    sysctl -p
fi

echo ""
echo "========================================="
echo "  Server setup complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Copy .env.production to ~/app/"
echo "2. Copy docker-compose.prod.yml to ~/app/"
echo "3. Update GitHub Secrets:"
echo "   - PRODUCTION_HOST=${SERVER_IP}"
echo "   - PRODUCTION_USER=root"
echo "   - PRODUCTION_SSH_KEY=(private key)"
echo "4. Run 'Build Docker Images' workflow on GitHub"
echo "5. Run 'Deploy to Production' > 'infrastructure' first"
echo "6. Run 'Deploy to Production' > 'all'"
echo ""
