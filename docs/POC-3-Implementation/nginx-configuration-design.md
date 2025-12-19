# nginx Configuration Design - POC-3

**Status:** Complete  
**Version:** 1.0  
**Date:** 2026-12-10  
**Purpose:** Define nginx reverse proxy configuration architecture

---

## Executive Summary

This document defines the nginx configuration architecture for POC-3. nginx will serve as the reverse proxy for all frontend and backend traffic, providing SSL/TLS termination, load balancing, rate limiting, security headers, and WebSocket support.

---

## 1. Architecture Overview

```
                                  Internet / Client
                                         │
                                         │ HTTPS (443)
                                         ▼
                              ┌────────────────────┐
                              │       nginx        │
                              │   Reverse Proxy    │
                              │   SSL/TLS Term.    │
                              │   Load Balancing   │
                              │   Rate Limiting    │
                              └─────────┬──────────┘
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            │                           │                           │
            ▼                           ▼                           ▼
    ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
    │  Frontend     │          │   API Gateway │          │   WebSocket   │
    │  (MFEs)       │          │   (Backend)   │          │   Upgrade     │
    │  /            │          │   /api/*      │          │   /ws         │
    └───────────────┘          └───────────────┘          └───────────────┘
            │                           │                           │
    ┌───────┴───────┐                   │                           │
    │               │                   ▼                           │
    ▼               ▼          ┌───────────────┐                    │
  Shell         Remote         │ API Gateway   │◄───────────────────┘
  :4200         MFEs           │ :3000         │
                :4201-4203     └───────────────┘
```

---

## 2. Upstream Configuration

### 2.1 API Gateway Upstream

```nginx
# Backend API Gateway (can be multiple instances for load balancing)
upstream api_gateway {
    least_conn;                          # Load balancing algorithm
    server localhost:3000 weight=1;      # Primary instance
    # server localhost:3010 weight=1;    # Additional instance (future)
    keepalive 32;                        # Connection pooling
}
```

### 2.2 Frontend MFE Upstreams

```nginx
# Shell App (Host MFE)
upstream shell_app {
    server localhost:4200;
    keepalive 16;
}

# Auth MFE (Remote)
upstream auth_mfe {
    server localhost:4201;
    keepalive 16;
}

# Payments MFE (Remote)
upstream payments_mfe {
    server localhost:4202;
    keepalive 16;
}

# Admin MFE (Remote)
upstream admin_mfe {
    server localhost:4203;
    keepalive 16;
}
```

---

## 3. SSL/TLS Configuration

### 3.1 Certificate Generation (Self-Signed for POC-3)

```bash
#!/bin/bash
# scripts/generate-ssl-certs.sh

SSL_DIR="nginx/ssl"
mkdir -p $SSL_DIR

# Generate private key
openssl genrsa -out $SSL_DIR/self-signed.key 2048

# Generate self-signed certificate
openssl req -new -x509 \
    -key $SSL_DIR/self-signed.key \
    -out $SSL_DIR/self-signed.crt \
    -days 365 \
    -subj "/C=US/ST=State/L=City/O=MFE-POC/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

# Generate DH parameters (for forward secrecy)
openssl dhparam -out $SSL_DIR/dhparam.pem 2048

echo "SSL certificates generated in $SSL_DIR"
```

### 3.2 SSL/TLS Settings

```nginx
# SSL/TLS Configuration
ssl_certificate /etc/nginx/ssl/self-signed.crt;
ssl_certificate_key /etc/nginx/ssl/self-signed.key;
ssl_dhparam /etc/nginx/ssl/dhparam.pem;

# Protocol versions (TLS 1.2+)
ssl_protocols TLSv1.2 TLSv1.3;

# Cipher suites
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

# Session settings
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;

# OCSP Stapling (disabled for self-signed)
# ssl_stapling on;
# ssl_stapling_verify on;
```

---

## 4. Rate Limiting Configuration

### 4.1 Rate Limit Zones

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;      # 100 req/min for API
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;      # 10 req/min for auth
limit_req_zone $binary_remote_addr zone=static_limit:10m rate=1000r/m;  # 1000 req/min for static
```

### 4.2 Rate Limit Application

```nginx
# API endpoints - 100 requests/minute with burst of 20
location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    limit_req_status 429;
    # ... proxy settings
}

# Auth endpoints - stricter: 10 requests/minute with burst of 5
location /api/auth/ {
    limit_req zone=auth_limit burst=5 nodelay;
    limit_req_status 429;
    # ... proxy settings
}

# Static assets - generous limit
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    limit_req zone=static_limit burst=100 nodelay;
    # ... cache settings
}
```

---

## 5. Security Headers

### 5.1 Global Security Headers

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Content Security Policy
add_header Content-Security-Policy "
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' wss: https:;
    frame-ancestors 'self';
    base-uri 'self';
    form-action 'self';
" always;

# Permissions Policy
add_header Permissions-Policy "
    camera=(),
    microphone=(),
    geolocation=(),
    payment=()
" always;

# HSTS (disabled for self-signed, enable in production)
# add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## 6. Compression Settings

```nginx
# Compression settings
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
gzip_proxied any;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/xml
    application/xml+rss
    application/x-javascript
    image/svg+xml;

# Brotli compression (if module available)
# brotli on;
# brotli_comp_level 6;
# brotli_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml;
```

---

## 7. Caching Headers

### 7.1 Static Asset Caching

```nginx
# Static assets - long cache
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# HTML files - no cache
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
}

# JSON files - short cache
location ~* \.json$ {
    expires 5m;
    add_header Cache-Control "public, max-age=300";
}
```

### 7.2 API Response Caching

```nginx
# API caching (optional, for specific endpoints)
location /api/public/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    proxy_cache_lock on;
    add_header X-Cache-Status $upstream_cache_status;
    # ... proxy settings
}
```

---

## 8. WebSocket Proxy Configuration

```nginx
# WebSocket configuration
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

# WebSocket location
location /ws {
    proxy_pass http://api_gateway;
    proxy_http_version 1.1;

    # WebSocket headers
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Timeouts for WebSocket
    proxy_read_timeout 86400s;    # 24 hours
    proxy_send_timeout 86400s;    # 24 hours

    # Disable buffering for WebSocket
    proxy_buffering off;
}
```

---

## 9. Complete nginx.conf

```nginx
# nginx/nginx.conf
# POC-3 nginx Configuration

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    # Performance settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;
    limit_req_zone $binary_remote_addr zone=static_limit:10m rate=1000r/m;

    # Proxy cache (optional)
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

    # WebSocket upgrade map
    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml application/xml+rss image/svg+xml;

    # Upstream definitions
    upstream api_gateway {
        least_conn;
        server host.docker.internal:3000;
        keepalive 32;
    }

    upstream shell_app {
        server host.docker.internal:4200;
        keepalive 16;
    }

    upstream auth_mfe {
        server host.docker.internal:4201;
        keepalive 16;
    }

    upstream payments_mfe {
        server host.docker.internal:4202;
        keepalive 16;
    }

    upstream admin_mfe {
        server host.docker.internal:4203;
        keepalive 16;
    }

    # HTTP server - redirect to HTTPS
    server {
        listen 80;
        server_name localhost;
        return 301 https://$host$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name localhost;

        # SSL/TLS Configuration
        ssl_certificate /etc/nginx/ssl/self-signed.crt;
        ssl_certificate_key /etc/nginx/ssl/self-signed.key;
        ssl_dhparam /etc/nginx/ssl/dhparam.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_session_tickets off;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # API endpoints
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            limit_req_status 429;

            proxy_pass http://api_gateway;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Connection "";

            proxy_connect_timeout 30s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Auth endpoints (stricter rate limiting)
        location /api/auth/ {
            limit_req zone=auth_limit burst=5 nodelay;
            limit_req_status 429;

            proxy_pass http://api_gateway;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Connection "";
        }

        # WebSocket endpoint
        location /ws {
            proxy_pass http://api_gateway;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
            proxy_buffering off;
        }

        # Health check
        location /health {
            proxy_pass http://api_gateway/health;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
        }

        # Remote MFE entry points (for development)
        location /remoteEntry.js {
            proxy_pass http://shell_app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
        }

        # Auth MFE assets
        location ~ ^/auth-mfe/ {
            proxy_pass http://auth_mfe;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
        }

        # Payments MFE assets
        location ~ ^/payments-mfe/ {
            proxy_pass http://payments_mfe;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
        }

        # Admin MFE assets
        location ~ ^/admin-mfe/ {
            proxy_pass http://admin_mfe;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
        }

        # Static assets with caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            limit_req zone=static_limit burst=100 nodelay;
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;

            # Try shell first, then other MFEs
            proxy_pass http://shell_app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
        }

        # Shell app (default)
        location / {
            proxy_pass http://shell_app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;

            # Disable caching for HTML
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
        }

        # Error pages
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/share/nginx/html;
        }
    }
}
```

---

## 10. Docker Configuration

### 10.1 nginx Service in Docker Compose

```yaml
# docker-compose.yml (nginx service)
nginx:
  image: nginx:latest
  container_name: mfe-nginx
  ports:
    - '80:80'
    - '443:443'
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/ssl:/etc/nginx/ssl:ro
  depends_on:
    - api-gateway
  healthcheck:
    test: ['CMD', 'curl', '-f', 'http://localhost/health']
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 10s
  restart: unless-stopped
  networks:
    - mfe-network
  extra_hosts:
    - 'host.docker.internal:host-gateway'
```

---

## 11. Verification Checklist

- [x] API Gateway upstream defined
- [x] MFE upstreams defined
- [x] SSL/TLS config defined
- [x] Rate limiting defined
- [x] Security headers defined
- [x] Compression defined
- [x] Caching headers defined
- [x] WebSocket proxy defined
- [x] Complete nginx.conf created

---

**Last Updated:** 2026-12-10  
**Status:** Complete  
**Next Steps:** Use this configuration in Phase 2 (nginx Setup)
