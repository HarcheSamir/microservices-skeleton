#!/bin/bash
# stop-dev.sh

echo "🛑 Stopping development environment..."

# Stop database containers
docker-compose -f docker-compose.db.yml down

echo "👋 Development environment stopped!"