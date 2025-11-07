#!/bin/bash
# Quick setup script for Simple CDN

set -e

echo "🚀 Simple CDN Setup"
echo "===================="
echo ""

# Check for required tools
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

echo "✅ Docker and docker-compose found"
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists. Skipping .env creation."
    echo "   If you want to reset, delete .env and run this script again."
else
    echo "Creating .env file from template..."
    cp .env.example .env

    # Generate random session secret
    SESSION_SECRET=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)

    # Replace placeholders in .env
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/generate-a-random-secret-at-least-32-chars/$SESSION_SECRET/" .env
    else
        # Linux
        sed -i "s/generate-a-random-secret-at-least-32-chars/$SESSION_SECRET/" .env
    fi

    echo "✅ Created .env file with random SESSION_SECRET"
fi

echo ""
echo "⚠️  IMPORTANT: You need to set your admin password!"
echo ""
echo "Run this command to generate a password hash:"
echo ""
echo "  cd backend && bun install && echo -n 'your-password' | bun run hash-password"
echo ""
echo "Then copy the hash to .env file:"
echo "  ADMIN_PASSWORD_HASH=<paste-hash-here>"
echo ""

read -p "Have you set ADMIN_PASSWORD_HASH in .env? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please set ADMIN_PASSWORD_HASH in .env first, then run this script again."
    exit 1
fi

echo ""
echo "Building and starting services..."
echo ""

docker-compose up -d --build

echo ""
echo "✅ Services started!"
echo ""
echo "Waiting for services to be healthy..."
sleep 5

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Access your Simple CDN:"
echo "  Admin Panel: http://localhost:8080"
echo "  Health Check: http://localhost:8080/healthz"
echo "  Metrics: http://localhost:8080/metrics"
echo ""
echo "View logs:"
echo "  docker-compose logs -f"
echo ""
echo "Stop services:"
echo "  docker-compose down"
echo ""
