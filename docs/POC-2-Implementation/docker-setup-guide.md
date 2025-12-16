# Docker Setup Guide - POC-2

**Status:** Complete  
**Date:** 2026-01-XX  
**Phase:** Phase 1 - Planning & Setup

---

## Overview

This guide explains how to set up and use Docker Compose for local development infrastructure (PostgreSQL and Redis) in POC-2.

---

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v2.x (included with Docker Desktop)

**Verify installation:**

```bash
docker --version
docker-compose --version
```

---

## Quick Start

### 1. Start Services

```bash
# Start PostgreSQL and Redis in background
docker-compose up -d

# Or start with logs visible
docker-compose up
```

### 2. Verify Services

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Test PostgreSQL connection
docker-compose exec postgres psql -U postgres -d mfe_poc2 -c "SELECT version();"

# Test Redis connection
docker-compose exec redis redis-cli ping
```

### 3. Stop Services

```bash
# Stop services (keeps data)
docker-compose stop

# Stop and remove containers (keeps data)
docker-compose down

# Stop and remove containers + volumes (deletes data)
docker-compose down -v
```

---

## Services

### PostgreSQL

- **Image:** `postgres:16`
- **Container:** `mfe-postgres`
- **Port:** `5432`
- **Database:** `mfe_poc2`
- **User:** `postgres`
- **Password:** `postgres` (development only)

**Connection String:**

```
postgresql://postgres:postgres@localhost:5432/mfe_poc2
```

**Health Check:**

- Checks every 10 seconds
- Uses `pg_isready` command
- 5 retries before marking unhealthy

### Redis

- **Image:** `redis:7-alpine`
- **Container:** `mfe-redis`
- **Port:** `6379`
- **No password** (development only)

**Connection String:**

```
redis://localhost:6379
```

**Health Check:**

- Checks every 10 seconds
- Uses `redis-cli ping`
- 5 retries before marking unhealthy

---

## Volumes

Data is persisted in Docker volumes:

- `postgres_data` - PostgreSQL data directory
- `redis_data` - Redis data directory

**View volumes:**

```bash
docker volume ls | grep mfe
```

**Remove volumes (deletes all data):**

```bash
docker-compose down -v
```

---

## Network

All services are connected via a bridge network: `mfe-network`

**View network:**

```bash
docker network ls | grep mfe
```

---

## Environment Variables

See `.env.example` for all environment variables with example values.

See `.env.required` for a checklist of all required environment variables (without values).

**Setup:**

1. Copy `.env.example` to `.env`
2. Fill in all required values (refer to `.env.required` for checklist)
3. Update values as needed for your environment

**Key variables for Docker Compose:**

- `POSTGRES_USER` - PostgreSQL username (default: `postgres`)
- `POSTGRES_PASSWORD` - PostgreSQL password (default: `postgres`)
- `POSTGRES_DB` - Database name (default: `mfe_poc2`)

---

## Common Tasks

### Access PostgreSQL

```bash
# Interactive shell
docker-compose exec postgres psql -U postgres -d mfe_poc2

# Run SQL command
docker-compose exec postgres psql -U postgres -d mfe_poc2 -c "SELECT * FROM users;"
```

### Access Redis

```bash
# Interactive shell
docker-compose exec redis redis-cli

# Run Redis command
docker-compose exec redis redis-cli ping
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart postgres
```

### Reset Database

```bash
# Stop and remove volumes (deletes all data)
docker-compose down -v

# Start fresh
docker-compose up -d
```

---

## Troubleshooting

### Port Already in Use

If port 5432 or 6379 is already in use:

1. **Check what's using the port:**

   ```bash
   # macOS/Linux
   lsof -i :5432
   lsof -i :6379

   # Windows
   netstat -ano | findstr :5432
   ```

2. **Stop conflicting service or change port in docker-compose.yml**

### Services Not Starting

1. **Check Docker Desktop is running**
2. **Check logs:**
   ```bash
   docker-compose logs
   ```
3. **Check health status:**
   ```bash
   docker-compose ps
   ```

### Connection Refused

1. **Verify services are running:**
   ```bash
   docker-compose ps
   ```
2. **Check health checks:**
   ```bash
   docker inspect mfe-postgres | grep -A 10 Health
   docker inspect mfe-redis | grep -A 10 Health
   ```
3. **Wait for services to be healthy** (health checks have 10s start period)

### Data Persistence Issues

1. **Check volumes exist:**
   ```bash
   docker volume ls | grep mfe
   ```
2. **Inspect volume:**
   ```bash
   docker volume inspect mfe-postgres_data
   ```

---

## Production Considerations

⚠️ **This Docker Compose setup is for local development only.**

For production:

- Use managed database services (AWS RDS, Google Cloud SQL, etc.)
- Use managed Redis (AWS ElastiCache, Google Cloud Memorystore, etc.)
- Use strong passwords and secrets management
- Enable SSL/TLS connections
- Configure proper network security
- Use environment-specific configurations
- Set up backups and monitoring

---

## Next Steps

After Docker Compose is running:

1. **Set up Prisma schema** (Task 1.1.3)
2. **Run database migrations**
3. **Seed database** (if needed)
4. **Start backend services** (Phase 2)

---

## Related Documentation

- [`environment-configuration.md`](./environment-configuration.md) - Environment variables reference
- [`implementation-plan.md`](./implementation-plan.md) - Full implementation plan
- [`task-list.md`](./task-list.md) - Task tracking

---

**Last Updated:** 2026-01-XX
