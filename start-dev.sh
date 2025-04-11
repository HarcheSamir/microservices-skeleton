#!/bin/bash
# start-dev.sh

echo "🚀 Starting development environment..."

# Check if containers are running
if ! docker ps | grep -q "auth-db" || ! docker ps | grep -q "book-db"; then
  echo "📦 Starting database containers..."
  docker compose -f docker-compose.db.yml up -d
  echo "⏳ Waiting for databases to be ready..."
  sleep 5
else
  echo "📦 Database containers already running"
fi

echo "✅ Databases ready! Now start each service in its own terminal:"
