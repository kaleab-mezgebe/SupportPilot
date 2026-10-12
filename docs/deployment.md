# SupportPilot Production Deployment Guide

This guide details the steps to deploy **SupportPilot** in a production environment using Docker Compose, PostgreSQL with `pgvector`, ASP.NET Core 8 backend, and a production-built React/Vite frontend served by Nginx.

---

## 1. System Requirements

| Component | Minimum | Recommended |
| :--- | :--- | :--- |
| **CPU** | 2 vCPU | 4+ vCPU |
| **RAM** | 4 GB | 8+ GB |
| **Disk Space** | 20 GB SSD | 50+ GB NVMe SSD |
| **OS** | Linux (Ubuntu 22.04 LTS / Debian 12 / RHEL 9) | Ubuntu 24.04 LTS |
| **Runtime** | Docker Engine 24+ & Docker Compose v2.20+ | Docker Engine 26+ |

---

## 2. Environment Variables Configuration

Create a `.env` file in the root directory next to `docker-compose.prod.yml`:

```bash
# Database Configuration
POSTGRES_USER=supportpilot_prod
POSTGRES_PASSWORD=generate_a_strong_random_db_password_here_min_24_chars
POSTGRES_DB=supportpilot_production

# JWT Authentication
JWT_SECRET_KEY=generate_a_cryptographically_secure_key_at_least_32_characters_long!
JWT_ISSUER=SupportPilot.Api
JWT_AUDIENCE=SupportPilot.Client

# Host Port Exposure
PORT=80
```

---

## 3. Production Deployment via Docker Compose

### Step 1: Clone the repository and configure environment
```bash
git clone https://github.com/your-org/supportpilot.git /opt/supportpilot
cd /opt/supportpilot
cp .env.example .env # edit with production credentials
```

### Step 2: Validate the Compose Configuration
```bash
docker compose -f docker-compose.prod.yml config
```

### Step 3: Build and Start Services
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Step 4: Verify Service Health
```bash
docker compose -f docker-compose.prod.yml ps
```
All containers (`supportpilot-postgres-prod`, `supportpilot-backend-prod`, `supportpilot-frontend-prod`) should report state `healthy` or `up`.

### Step 5: Test Health Endpoints
```bash
# Backend health endpoint
curl -f http://localhost:8080/health
curl -f http://localhost:8080/api/health

# Frontend reverse proxy check
curl -I http://localhost/
```

---

## 4. Reverse Proxy & SSL Setup (Certbot / Nginx Host)

In enterprise deployments, place a host-level Nginx or Traefik reverse proxy in front of Docker to terminate TLS (HTTPS).

Sample Host `/etc/nginx/sites-available/supportpilot.conf`:

```nginx
server {
    listen 80;
    server_name support.yourcompany.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name support.yourcompany.com;

    ssl_certificate /etc/letsencrypt/live/support.yourcompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/support.yourcompany.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Forward to SupportPilot Docker Frontend (which reverse-proxies API & WebSockets)
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

Enable SSL certificate with Certbot:
```bash
sudo certbot --nginx -d support.yourcompany.com
```

---

## 5. Zero-Downtime Rolling Updates

To deploy new code without terminating active ticket threads or SignalR connections abruptly:

```bash
# 1. Pull latest git changes
git pull origin main

# 2. Build new images in background
docker compose -f docker-compose.prod.yml build

# 3. Deploy new containers with minimal downtime
docker compose -f docker-compose.prod.yml up -d --no-deps backend
docker compose -f docker-compose.prod.yml up -d --no-deps frontend

# 4. Prune dangling build layers
docker image prune -f
```

---

## 6. Monitoring and Logs

View real-time logs across the stack:
```bash
# View backend application logs
docker compose -f docker-compose.prod.yml logs -f backend

# View database query and connection logs
docker compose -f docker-compose.prod.yml logs -f postgres

# View web server access logs
docker compose -f docker-compose.prod.yml logs -f frontend
```
