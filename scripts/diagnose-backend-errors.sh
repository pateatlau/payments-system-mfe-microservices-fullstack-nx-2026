#!/bin/bash

# Diagnostic script for backend service errors
# Helps identify common issues with api-gateway and profile-service

set -e

echo "=== Backend Service Diagnostics ==="
echo ""

# Check RabbitMQ
echo "1. Checking RabbitMQ..."
if docker ps | grep -q mfe-rabbitmq; then
  echo "   ✅ RabbitMQ container is running"
  RABBITMQ_STATUS=$(docker exec mfe-rabbitmq rabbitmq-diagnostics -q ping 2>&1)
  if [ $? -eq 0 ]; then
    echo "   ✅ RabbitMQ is healthy"
  else
    echo "   ❌ RabbitMQ is not responding: $RABBITMQ_STATUS"
  fi
  
  # Check credentials
  echo "   Checking RabbitMQ credentials..."
  RABBITMQ_USER=$(docker exec mfe-rabbitmq rabbitmqctl list_users 2>/dev/null | grep admin || echo "")
  if [ -n "$RABBITMQ_USER" ]; then
    echo "   ✅ Admin user exists"
  else
    echo "   ⚠️  Admin user might not exist"
  fi
else
  echo "   ❌ RabbitMQ container is not running"
  echo "   Run: pnpm infra:start"
fi

echo ""

# Check Profile Database
echo "2. Checking Profile Database..."
if docker ps | grep -q mfe-profile-db; then
  echo "   ✅ Profile database container is running"
  DB_CHECK=$(docker exec mfe-profile-db pg_isready -U postgres -d profile_db 2>&1)
  if echo "$DB_CHECK" | grep -q "accepting connections"; then
    echo "   ✅ Profile database is accepting connections"
  else
    echo "   ❌ Profile database is not ready: $DB_CHECK"
  fi
else
  echo "   ❌ Profile database container is not running"
  echo "   Run: pnpm infra:start"
fi

echo ""

# Check Environment Variables
echo "3. Checking Environment Variables..."
if [ -f .env ]; then
  echo "   ✅ .env file exists"
  
  if grep -q "RABBITMQ_URL" .env; then
    RABBITMQ_URL=$(grep "RABBITMQ_URL" .env | cut -d '=' -f2)
    echo "   RABBITMQ_URL: $RABBITMQ_URL"
    if echo "$RABBITMQ_URL" | grep -q "admin:admin"; then
      echo "   ✅ RabbitMQ URL has correct credentials (admin:admin)"
    elif echo "$RABBITMQ_URL" | grep -q "guest:guest"; then
      echo "   ⚠️  RabbitMQ URL uses guest:guest (should be admin:admin)"
      echo "      Update .env: RABBITMQ_URL=amqp://admin:admin@localhost:5672"
    else
      echo "   ⚠️  RabbitMQ URL format unclear"
    fi
  else
    echo "   ⚠️  RABBITMQ_URL not set in .env (will use default)"
  fi
  
  if grep -q "PROFILE_DATABASE_URL" .env; then
    PROFILE_DB_URL=$(grep "PROFILE_DATABASE_URL" .env | cut -d '=' -f2)
    echo "   PROFILE_DATABASE_URL: $PROFILE_DB_URL"
  else
    echo "   ⚠️  PROFILE_DATABASE_URL not set in .env (will use default)"
  fi
else
  echo "   ⚠️  .env file not found"
fi

echo ""

# Check Prisma Clients
echo "4. Checking Prisma Clients..."
if [ -d "apps/profile-service/node_modules/.prisma/profile-client" ]; then
  echo "   ✅ Profile Prisma client is generated"
else
  echo "   ❌ Profile Prisma client is not generated"
  echo "   Run: pnpm db:profile:generate"
fi

echo ""

# Check Build Status
echo "5. Checking Build Status..."
if [ -d "dist/apps/api-gateway" ]; then
  echo "   ✅ API Gateway is built"
else
  echo "   ⚠️  API Gateway not built (will build on serve)"
fi

if [ -d "dist/apps/profile-service" ]; then
  echo "   ✅ Profile Service is built"
else
  echo "   ⚠️  Profile Service not built (will build on serve)"
fi

echo ""

# Recommendations
echo "=== Recommendations ==="
echo ""
echo "If API Gateway is failing:"
echo "  1. Ensure RabbitMQ is running: pnpm infra:start"
echo "  2. Update .env: RABBITMQ_URL=amqp://admin:admin@localhost:5672"
echo "  3. Check RabbitMQ connection: docker exec mfe-rabbitmq rabbitmqctl status"
echo ""
echo "If Profile Service is failing:"
echo "  1. Ensure profile_db is running: pnpm infra:start"
echo "  2. Generate Prisma client: pnpm db:profile:generate"
echo "  3. Run migrations: pnpm db:profile:migrate"
echo "  4. Check database connection: docker exec mfe-profile-db pg_isready -U postgres -d profile_db"
echo ""
echo "To see actual error messages, run:"
echo "  pnpm dev:api-gateway    # In one terminal"
echo "  pnpm dev:profile-service # In another terminal"
echo ""
