# Deployment Guide

## GitHub Secrets Setup

Vào **Repository → Settings → Secrets and variables → Actions → New repository secret**

### Required Secrets:

| Secret Name | Mô tả | Ví dụ |
|-------------|-------|-------|
| `DOCKER_USERNAME` | Docker Hub username | `yourusername` |
| `DOCKER_PASSWORD` | Docker Hub password/token | `dckr_pat_xxxxx` |
| `PRODUCTION_HOST` | EC2 Public IP | `54.123.45.67` |
| `PRODUCTION_USER` | EC2 SSH user | `ubuntu` |
| `PRODUCTION_SSH_KEY` | EC2 Private Key (PEM content) | *(xem bên dưới)* |

---

## Cách thêm SSH Key (PEM) vào GitHub Secrets

### Bước 1: Copy nội dung file PEM
```bash
cat ~/path/to/your-key.pem
```

### Bước 2: Tạo Secret trong GitHub
1. Vào repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `PRODUCTION_SSH_KEY`
4. Value: **Paste toàn bộ nội dung** file PEM (bao gồm cả `-----BEGIN RSA PRIVATE KEY-----` và `-----END RSA PRIVATE KEY-----`)
5. Click **Add secret**

### Ví dụ nội dung PEM:
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1234567890abcdef...
...nhiều dòng...
abcdef1234567890==
-----END RSA PRIVATE KEY-----
```

> ⚠️ **Quan trọng:** Copy **TOÀN BỘ** nội dung, bao gồm dòng BEGIN và END

---

## EC2 Setup

### 1. Install Docker & Docker Compose
```bash
# Update
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout và login lại để apply docker group
```

### 2. Clone Repository
```bash
cd ~
git clone https://github.com/your-username/project-management.git
cd project-management
```

### 3. Setup Environment
```bash
# Copy và edit env file
cp .env.production.example .env.production
nano .env.production
```

### 4. Start Infrastructure (lần đầu)
```bash
docker compose -f docker-compose.prod.yml up -d redis zookeeper kafka
```

---

## GitHub Actions Workflows

### Build (`Actions → Build Docker Images`)
- **app-api** - Build API service
- **notification** - Build notification service
- **cronjob-worker** - Build cronjob service
- **all** - Build tất cả

### Deploy (`Actions → Deploy to Production`)
- **app-api** - Deploy API
- **notification** - Deploy notification
- **cronjob-worker** - Deploy cronjob
- **all** - Deploy tất cả services
- **infrastructure** - Deploy Redis, Kafka, Zookeeper

### Rollback (`Actions → Rollback`)
- Rollback về version trước đó

---

## Quy trình Deploy

```
1. Push code → main branch
2. Actions → Build Docker Images → Run workflow → Chọn app
3. Build xong → Actions → Deploy to Production → Run workflow → Chọn app
4. Nếu lỗi → Actions → Rollback → Chọn app
```

---

## Security Groups (AWS)

Mở các ports sau trong EC2 Security Group:

| Port | Service | Source |
|------|---------|--------|
| 22 | SSH | Your IP |
| 3000 | app-api | 0.0.0.0/0 |
| 3002 | notification | 0.0.0.0/0 |
| 80 | HTTP (nginx) | 0.0.0.0/0 |
| 443 | HTTPS (nginx) | 0.0.0.0/0 |

---

## Monitoring

### Check logs
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f app-api
```

### Check status
```bash
docker compose -f docker-compose.prod.yml ps
```

### Health check
```bash
curl http://localhost:3000/health
```
