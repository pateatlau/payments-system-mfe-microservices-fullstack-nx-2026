# nginx Configuration Guide - POC-3

**Status:** Complete  
**Version:** 1.0  
**Date:** 2026-12-11  
**Purpose:** Complete guide for setting up and configuring nginx reverse proxy for POC-3

---

## Overview

This guide covers the complete setup and configuration of nginx as a reverse proxy for POC-3, including SSL/TLS termination, load balancing, rate limiting, security headers, WebSocket support, and caching.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [SSL/TLS Certificate Setup](#ssltls-certificate-setup)
4. [Configuration Overview](#configuration-overview)
5. [Upstream Configuration](#upstream-configuration)
6. [SSL/TLS Configuration](#ssltls-configuration)
7. [Security Headers](#security-headers)
8. [Rate Limiting](#rate-limiting)
9. [WebSocket Proxy](#websocket-proxy)
10. [Caching Configuration](#caching-configuration)
11. [Testing and Validation](#testing-and-validation)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Infrastructure Requirements

- Docker Desktop running
- Ports available: 80, 443
- At least 2GB RAM for nginx container

### Service Requirements

- API Gateway running on port 3000
- Frontend MFEs running on ports 4200-4203
- All services accessible from nginx container

---

## Installation

### Docker Compose Setup

nginx is included in the Docker Compose configuration:

```yaml
# docker-compose.yml
services:
  nginx:
    image: nginx:alpine
    container_name: payments-nginx
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - api-gateway
    restart: unless-stopped
```

### Start nginx

```bash
# Start nginx with Docker Compose
docker-compose up -d nginx

# Check nginx status
docker-compose ps nginx

# View nginx logs
docker-compose logs -f nginx
```

---

## SSL/TLS Certificate Setup

### Generate Self-Signed Certificates (Development)

```bash
# Run the certificate generation script
./scripts/generate-ssl-certs.sh

# Or manually:
mkdir -p nginx/ssl
cd nginx/ssl

# Generate private key
openssl genrsa -out self-signed.key 2048

# Generate certificate signing request
openssl req -new -key self-signed.key -out self-signed.csr \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in self-signed.csr \
  -signkey self-signed.key -out self-signed.crt

# Generate DH parameters (for forward secrecy)
openssl dhparam -out dhparam.pem 2048
```

### Production Certificates

For production, use Let's Encrypt or your certificate authority:

```bash
# Using certbot (Let's Encrypt)
certbot certonly --standalone -d yourdomain.com

# Certificates will be in:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

---

## Configuration Overview

The nginx configuration is located at `nginx/nginx.conf` and includes:

- **Upstream definitions** - Backend services and frontend MFEs
- **HTTP to HTTPS redirect** - Port 80 redirects to 443
- **SSL/TLS configuration** - TLS 1.2+, modern cipher suites
- **Security headers** - X-Frame-Options, CSP, etc.
- **Rate limiting** - API, Auth, Static endpoints
- **WebSocket proxy** - `/ws` endpoint with upgrade headers
- **Caching headers** - Static assets, API responses
- **Load balancing** - Least connection algorithm

---

## Upstream Configuration

### API Gateway Upstream

```nginx
upstream api_gateway {
    least_conn;                          # Load balancing algorithm
    server localhost:3000 weight=1;      # Primary instance
    keepalive 32;                        # Connection pooling
}
```

### Frontend MFE Upstreams

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

## SSL/TLS Configuration

### Protocol Versions

```nginx
# Only TLS 1.2 and TLS 1.3 (secure protocols)
ssl_protocols TLSv1.2 TLSv1.3;
```

### Cipher Suites

```nginx
# Modern, secure cipher suites
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
```

### Session Configuration

```nginx
# Session timeout and cache
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;  # Disable tickets for forward secrecy
```

### Certificate Configuration

```nginx
ssl_certificate /etc/nginx/ssl/self-signed.crt;
ssl_certificate_key /etc/nginx/ssl/self-signed.key;
ssl_dhparam /etc/nginx/ssl/dhparam.pem;
```

---

## Security Headers

### Required Security Headers

```nginx
# Prevent clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# Prevent MIME type sniffing
add_header X-Content-Type-Options "nosniff" always;

# Enable XSS protection
add_header X-XSS-Protection "1; mode=block" always;

# Referrer policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Content Security Policy (relaxed for development)
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:; frame-ancestors 'self';" always;

# HSTS (disabled for self-signed certificates, enable in production)
# add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## Rate Limiting

### Rate Limiting Zones

```nginx
# API: 100 requests/minute per IP
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;

# Auth: 10 requests/minute per IP (stricter for auth endpoints)
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;

# Static: 1000 requests/minute per IP (generous for assets)
limit_req_zone $binary_remote_addr zone=static_limit:10m rate=1000r/m;
```

### Applying Rate Limits

```nginx
# Auth endpoints - stricter rate limiting
location /api/auth/ {
    limit_req zone=auth_limit burst=5 nodelay;
    limit_req_status 429;
    # ... proxy settings
}

# API endpoints - standard rate limiting
location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    limit_req_status 429;
    # ... proxy settings
}

# Static assets - generous rate limiting
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    limit_req zone=static_limit burst=100 nodelay;
    # ... caching settings
}
```

---

## WebSocket Proxy

### WebSocket Upgrade Map

```nginx
# Map HTTP upgrade header to connection upgrade
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}
```

### WebSocket Location

```nginx
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

    # Timeouts for WebSocket (24 hours)
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;

    # Disable buffering for WebSocket
    proxy_buffering off;
}
```

---

## Caching Configuration

### Static Asset Caching

```nginx
# Static assets - long cache (1 year, immutable)
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

# JSON files - short cache (5 minutes)
location ~* \.json$ {
    expires 5m;
    add_header Cache-Control "public, max-age=300";
}
```

### API Response Caching (Optional)

```nginx
# Proxy cache configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

# Public API endpoints - cache for 5 minutes
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

## Testing and Validation

### Test nginx Configuration

```bash
# Test configuration syntax
docker-compose exec nginx nginx -t

# Expected output:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Test HTTP to HTTPS Redirect

```bash
# Should redirect to HTTPS
curl -I http://localhost/

# Expected: HTTP/1.1 301 Moved Permanently
# Location: https://localhost/
```

### Test HTTPS Connection

```bash
# Test HTTPS connection (ignore self-signed certificate warning)
curl -k https://localhost/

# Test API Gateway routing
curl -k https://localhost/api/health
```

### Test Security Headers

```bash
# Check security headers
curl -k -I https://localhost/ | grep -i "x-frame-options\|x-content-type-options\|x-xss-protection\|referrer-policy\|content-security-policy"
```

### Test Rate Limiting

```bash
# Make rapid requests to trigger rate limiting
for i in {1..15}; do
  curl -k https://localhost/api/auth/login \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}' \
    -w "\nStatus: %{http_code}\n"
done

# Should see 429 Too Many Requests after exceeding limit
```

### Test WebSocket Proxy

```bash
# Test WebSocket connection (requires valid JWT token)
wscat -c wss://localhost/ws?token=YOUR_JWT_TOKEN
```

### Run Security Validation Tests

```bash
# Run comprehensive security tests
pnpm test:security:validation
```

---

## Troubleshooting

### Common Issues

#### 1. nginx Configuration Syntax Error

**Error:**

```
nginx: [emerg] unexpected end of file
```

**Solution:**

```bash
# Check configuration syntax
docker-compose exec nginx nginx -t

# Check for missing semicolons, braces, or quotes
```

#### 2. SSL Certificate Not Found

**Error:**

```
SSL: certificate file not found
```

**Solution:**

```bash
# Generate certificates
./scripts/generate-ssl-certs.sh

# Verify certificates exist
ls -la nginx/ssl/
```

#### 3. Upstream Connection Refused

**Error:**

```
502 Bad Gateway
```

**Solution:**

```bash
# Check if backend services are running
docker-compose ps

# Check service logs
docker-compose logs api-gateway

# Verify service ports are accessible
curl http://localhost:3000/api/health
```

#### 4. WebSocket Connection Fails

**Error:**

```
WebSocket connection closed immediately
```

**Solution:**

- Verify WebSocket upgrade headers are set correctly
- Check API Gateway WebSocket server is running
- Verify JWT token is valid
- Check nginx WebSocket timeout settings

#### 5. Rate Limiting Too Strict

**Issue:**

```
429 Too Many Requests for normal usage
```

**Solution:**

- Adjust rate limiting zones in nginx.conf
- Increase `rate` value (e.g., `100r/m` to `200r/m`)
- Increase `burst` value (e.g., `burst=20` to `burst=50`)

### Viewing Logs

```bash
# View nginx access logs
docker-compose exec nginx tail -f /var/log/nginx/access.log

# View nginx error logs
docker-compose exec nginx tail -f /var/log/nginx/error.log

# View all nginx logs
docker-compose logs -f nginx
```

### Reloading Configuration

```bash
# Reload nginx configuration without downtime
docker-compose exec nginx nginx -s reload

# Or restart nginx container
docker-compose restart nginx
```

---

## Production Considerations

### 1. Real SSL Certificates

Replace self-signed certificates with Let's Encrypt or CA-signed certificates:

```nginx
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

### 2. Enable HSTS

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### 3. Stricter CSP

Tighten Content Security Policy for production:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:; frame-ancestors 'none';" always;
```

### 4. Logging Configuration

Configure log rotation and centralized logging:

```nginx
# Log rotation
access_log /var/log/nginx/access.log main;
error_log /var/log/nginx/error.log warn;

# Or send to syslog
# access_log syslog:server=localhost:514 main;
```

### 5. Performance Tuning

```nginx
# Increase worker connections for high traffic
events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

---

## Additional Resources

- **Configuration File:** `nginx/nginx.conf`
- **SSL Certificate Script:** `scripts/generate-ssl-certs.sh`
- **Design Document:** `docs/POC-3-Implementation/nginx-configuration-design.md`
- **Security Tests:** `scripts/security/security-validation.test.ts`

---

**Last Updated:** 2026-12-11  
**Status:** Complete
