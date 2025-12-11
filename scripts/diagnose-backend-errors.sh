#!/bin/bash

# Diagnostic script for backend service errors
# Checks all backend services, databases, infrastructure, and configurations

set -e

echo "=== Backend Service Diagnostics ==="
echo ""

# =============================================================================
# 1. Infrastructure Services
# =============================================================================

echo "1. Checking Infrastructure Services..."
echo ""

# RabbitMQ
echo "   RabbitMQ:"
if docker ps | grep -q mfe-rabbitmq; then
  echo "      ✅ Container is running"
  RABBITMQ_STATUS=$(docker exec mfe-rabbitmq rabbitmq-diagnostics -q ping 2>&1)
  if [ $? -eq 0 ]; then
    echo "      ✅ Service is healthy"
  else
    echo "      ❌ Service is not responding: $RABBITMQ_STATUS"
  fi
  
  # Check credentials
  RABBITMQ_USER=$(docker exec mfe-rabbitmq rabbitmqctl list_users 2>/dev/null | grep admin || echo "")
  if [ -n "$RABBITMQ_USER" ]; then
    echo "      ✅ Admin user exists"
  else
    echo "      ⚠️  Admin user might not exist"
  fi
else
  echo "      ❌ Container is not running"
  echo "      Run: pnpm infra:start"
fi

echo ""

# Redis
echo "   Redis:"
if docker ps | grep -q mfe-redis; then
  echo "      ✅ Container is running"
  REDIS_STATUS=$(docker exec mfe-redis redis-cli ping 2>&1)
  if echo "$REDIS_STATUS" | grep -q "PONG"; then
    echo "      ✅ Service is healthy"
  else
    echo "      ❌ Service is not responding: $REDIS_STATUS"
  fi
else
  echo "      ❌ Container is not running"
  echo "      Run: pnpm infra:start"
fi

echo ""

# =============================================================================
# 2. Database Services
# =============================================================================

echo "2. Checking Database Services..."
echo ""

# Auth Database
echo "   Auth Database (auth_db:5432):"
if docker ps | grep -q mfe-auth-db; then
  echo "      ✅ Container is running"
  DB_CHECK=$(docker exec mfe-auth-db pg_isready -U postgres -d auth_db 2>&1)
  if echo "$DB_CHECK" | grep -q "accepting connections"; then
    echo "      ✅ Database is accepting connections"
    # Check if tables exist
    TABLE_COUNT=$(docker exec mfe-auth-db psql -U postgres -d auth_db -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name NOT LIKE '_prisma%';" 2>&1)
    if [ "$TABLE_COUNT" -gt 0 ]; then
      echo "      ✅ Database has tables ($TABLE_COUNT tables)"
    else
      echo "      ⚠️  Database has no tables (run migrations)"
    fi
  else
    echo "      ❌ Database is not ready: $DB_CHECK"
  fi
else
  echo "      ❌ Container is not running"
  echo "      Run: pnpm infra:start"
fi

echo ""

# Payments Database
echo "   Payments Database (payments_db:5433):"
if docker ps | grep -q mfe-payments-db; then
  echo "      ✅ Container is running"
  DB_CHECK=$(docker exec mfe-payments-db pg_isready -U postgres -d payments_db 2>&1)
  if echo "$DB_CHECK" | grep -q "accepting connections"; then
    echo "      ✅ Database is accepting connections"
    TABLE_COUNT=$(docker exec mfe-payments-db psql -U postgres -d payments_db -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name NOT LIKE '_prisma%';" 2>&1)
    if [ "$TABLE_COUNT" -gt 0 ]; then
      echo "      ✅ Database has tables ($TABLE_COUNT tables)"
    else
      echo "      ⚠️  Database has no tables (run migrations)"
    fi
  else
    echo "      ❌ Database is not ready: $DB_CHECK"
  fi
else
  echo "      ❌ Container is not running"
  echo "      Run: pnpm infra:start"
fi

echo ""

# Admin Database
echo "   Admin Database (admin_db:5434):"
if docker ps | grep -q mfe-admin-db; then
  echo "      ✅ Container is running"
  DB_CHECK=$(docker exec mfe-admin-db pg_isready -U postgres -d admin_db 2>&1)
  if echo "$DB_CHECK" | grep -q "accepting connections"; then
    echo "      ✅ Database is accepting connections"
    TABLE_COUNT=$(docker exec mfe-admin-db psql -U postgres -d admin_db -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name NOT LIKE '_prisma%';" 2>&1)
    if [ "$TABLE_COUNT" -gt 0 ]; then
      echo "      ✅ Database has tables ($TABLE_COUNT tables)"
    else
      echo "      ⚠️  Database has no tables (run migrations)"
    fi
  else
    echo "      ❌ Database is not ready: $DB_CHECK"
  fi
else
  echo "      ❌ Container is not running"
  echo "      Run: pnpm infra:start"
fi

echo ""

# Profile Database
echo "   Profile Database (profile_db:5435):"
if docker ps | grep -q mfe-profile-db; then
  echo "      ✅ Container is running"
  DB_CHECK=$(docker exec mfe-profile-db pg_isready -U postgres -d profile_db 2>&1)
  if echo "$DB_CHECK" | grep -q "accepting connections"; then
    echo "      ✅ Database is accepting connections"
    TABLE_COUNT=$(docker exec mfe-profile-db psql -U postgres -d profile_db -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name NOT LIKE '_prisma%';" 2>&1)
    if [ "$TABLE_COUNT" -gt 0 ]; then
      echo "      ✅ Database has tables ($TABLE_COUNT tables)"
    else
      echo "      ⚠️  Database has no tables (run migrations)"
    fi
  else
    echo "      ❌ Database is not ready: $DB_CHECK"
  fi
else
  echo "      ❌ Container is not running"
  echo "      Run: pnpm infra:start"
fi

echo ""

# =============================================================================
# 3. Environment Variables
# =============================================================================

echo "3. Checking Environment Variables..."
echo ""

if [ -f .env ]; then
  echo "   ✅ .env file exists"
  echo ""
  
  # RabbitMQ URL
  if grep -q "^RABBITMQ_URL" .env; then
    RABBITMQ_URL=$(grep "^RABBITMQ_URL" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    echo "   RABBITMQ_URL: $RABBITMQ_URL"
    if echo "$RABBITMQ_URL" | grep -q "admin:admin"; then
      echo "      ✅ Has correct credentials (admin:admin)"
    elif echo "$RABBITMQ_URL" | grep -q "guest:guest"; then
      echo "      ⚠️  Uses guest:guest (should be admin:admin)"
      echo "         Update .env: RABBITMQ_URL=amqp://admin:admin@localhost:5672"
    elif echo "$RABBITMQ_URL" | grep -q "@"; then
      echo "      ⚠️  Has credentials but format unclear"
    else
      echo "      ⚠️  Missing credentials"
      echo "         Update .env: RABBITMQ_URL=amqp://admin:admin@localhost:5672"
    fi
  else
    echo "   ⚠️  RABBITMQ_URL not set in .env (will use default)"
  fi
  
  echo ""
  
  # Database URLs
  echo "   Database URLs:"
  
  if grep -q "^AUTH_DATABASE_URL" .env; then
    AUTH_DB_URL=$(grep "^AUTH_DATABASE_URL" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    echo "      ✅ AUTH_DATABASE_URL is set"
  else
    echo "      ⚠️  AUTH_DATABASE_URL not set (will use default)"
  fi
  
  if grep -q "^PAYMENTS_DATABASE_URL" .env; then
    PAYMENTS_DB_URL=$(grep "^PAYMENTS_DATABASE_URL" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    echo "      ✅ PAYMENTS_DATABASE_URL is set"
  else
    echo "      ⚠️  PAYMENTS_DATABASE_URL not set (will use default)"
  fi
  
  if grep -q "^ADMIN_DATABASE_URL" .env; then
    ADMIN_DB_URL=$(grep "^ADMIN_DATABASE_URL" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    echo "      ✅ ADMIN_DATABASE_URL is set"
  else
    echo "      ⚠️  ADMIN_DATABASE_URL not set (will use default)"
  fi
  
  if grep -q "^PROFILE_DATABASE_URL" .env; then
    PROFILE_DB_URL=$(grep "^PROFILE_DATABASE_URL" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    echo "      ✅ PROFILE_DATABASE_URL is set"
  else
    echo "      ⚠️  PROFILE_DATABASE_URL not set (will use default)"
  fi
  
  echo ""
  
  # JWT Secret
  if grep -q "^JWT_SECRET" .env; then
    JWT_SECRET=$(grep "^JWT_SECRET" .env | cut -d '=' -f2)
    if [ -n "$JWT_SECRET" ] && [ "$JWT_SECRET" != "your-secret-key-change-in-production" ]; then
      echo "   ✅ JWT_SECRET is set (not default)"
    else
      echo "   ⚠️  JWT_SECRET is default or empty (should be changed in production)"
    fi
  else
    echo "   ⚠️  JWT_SECRET not set in .env (will use default)"
  fi
else
  echo "   ⚠️  .env file not found"
  echo "      Create .env file from .env.example"
fi

echo ""

# =============================================================================
# 4. Prisma Clients
# =============================================================================

echo "4. Checking Prisma Clients..."
echo ""

# Auth Service Prisma Client
if [ -d "apps/auth-service/node_modules/.prisma/auth-client" ]; then
  echo "   ✅ Auth Service Prisma client is generated"
else
  echo "   ❌ Auth Service Prisma client is not generated"
  echo "      Run: pnpm db:auth:generate"
fi

# Payments Service Prisma Client
if [ -d "apps/payments-service/node_modules/.prisma/payments-client" ]; then
  echo "   ✅ Payments Service Prisma client is generated"
else
  echo "   ❌ Payments Service Prisma client is not generated"
  echo "      Run: pnpm db:payments:generate"
fi

# Admin Service Prisma Client
if [ -d "apps/admin-service/node_modules/.prisma/admin-client" ]; then
  echo "   ✅ Admin Service Prisma client is generated"
else
  echo "   ❌ Admin Service Prisma client is not generated"
  echo "      Run: pnpm db:admin:generate"
fi

# Profile Service Prisma Client
if [ -d "apps/profile-service/node_modules/.prisma/profile-client" ]; then
  echo "   ✅ Profile Service Prisma client is generated"
else
  echo "   ❌ Profile Service Prisma client is not generated"
  echo "      Run: pnpm db:profile:generate"
fi

echo ""

# =============================================================================
# 5. Build Status
# =============================================================================

echo "5. Checking Build Status..."
echo ""

# API Gateway
if [ -d "dist/apps/api-gateway" ]; then
  echo "   ✅ API Gateway is built"
else
  echo "   ⚠️  API Gateway not built (will build on serve)"
fi

# Auth Service
if [ -d "dist/apps/auth-service" ]; then
  echo "   ✅ Auth Service is built"
else
  echo "   ⚠️  Auth Service not built (will build on serve)"
fi

# Payments Service
if [ -d "dist/apps/payments-service" ]; then
  echo "   ✅ Payments Service is built"
else
  echo "   ⚠️  Payments Service not built (will build on serve)"
fi

# Admin Service
if [ -d "dist/apps/admin-service" ]; then
  echo "   ✅ Admin Service is built"
else
  echo "   ⚠️  Admin Service not built (will build on serve)"
fi

# Profile Service
if [ -d "dist/apps/profile-service" ]; then
  echo "   ✅ Profile Service is built"
else
  echo "   ⚠️  Profile Service not built (will build on serve)"
fi

echo ""

# =============================================================================
# 6. Service Ports
# =============================================================================

echo "6. Checking Service Ports..."
echo ""

check_port() {
  local port=$1
  local service=$2
  if lsof -i :$port >/dev/null 2>&1; then
    echo "   ✅ Port $port is in use ($service)"
  else
    echo "   ⚠️  Port $port is not in use ($service)"
  fi
}

check_port 3000 "API Gateway"
check_port 3001 "Auth Service"
check_port 3002 "Payments Service"
check_port 3003 "Admin Service"
check_port 3004 "Profile Service"

echo ""

# =============================================================================
# Recommendations
# =============================================================================

echo "=== Recommendations ==="
echo ""

echo "If any service is failing:"
echo ""
echo "1. Start Infrastructure:"
echo "   pnpm infra:start"
echo ""
echo "2. Generate Prisma Clients:"
echo "   pnpm db:auth:generate"
echo "   pnpm db:payments:generate"
echo "   pnpm db:admin:generate"
echo "   pnpm db:profile:generate"
echo ""
echo "3. Run Migrations:"
echo "   pnpm db:auth:migrate"
echo "   pnpm db:payments:migrate"
echo "   pnpm db:admin:migrate"
echo "   pnpm db:profile:migrate"
echo ""
echo "4. Update .env file:"
echo "   RABBITMQ_URL=amqp://admin:admin@localhost:5672"
echo ""
echo "5. Build Services:"
echo "   pnpm build:backend"
echo ""
echo "6. Start Services:"
echo "   pnpm dev:backend"
echo ""
echo "To see actual error messages for specific services:"
echo "   pnpm dev:api-gateway"
echo "   pnpm dev:auth-service"
echo "   pnpm dev:payments-service"
echo "   pnpm dev:admin-service"
echo "   pnpm dev:profile-service"
echo ""
