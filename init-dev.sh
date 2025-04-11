#!/bin/bash
# init-dev.sh

echo "⚙️ Setting up development environment..."

# Start databases only
docker compose -f docker-compose.db.yml up -d

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 10

# Run migrations and seed data for auth-service
echo "🗄️ Setting up auth-service database..."
cd auth-service

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the database
npx prisma db seed

cd ..

# Run migrations and seed data for book-service
echo "🗄️ Setting up book-service database..."
cd book-service

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the database
npx prisma db seed

cd ..


echo "✅ Development environment setup complete!"
