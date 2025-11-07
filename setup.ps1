# Quick setup script for Simple CDN (Windows PowerShell)

Write-Host "🚀 Simple CDN Setup" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

# Check for required tools
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerInstalled) {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

$composeInstalled = Get-Command docker-compose -ErrorAction SilentlyContinue
if (-not $composeInstalled) {
    Write-Host "❌ docker-compose is not installed. Please install docker-compose first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker and docker-compose found" -ForegroundColor Green
Write-Host ""

# Check if .env exists
if (Test-Path .env) {
    Write-Host "⚠️  .env file already exists. Skipping .env creation." -ForegroundColor Yellow
    Write-Host "   If you want to reset, delete .env and run this script again." -ForegroundColor Yellow
} else {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env

    # Generate random session secret
    $sessionSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})

    # Replace placeholder in .env
    (Get-Content .env) -replace 'generate-a-random-secret-at-least-32-chars', $sessionSecret | Set-Content .env

    Write-Host "✅ Created .env file with random SESSION_SECRET" -ForegroundColor Green
}

Write-Host ""
Write-Host "⚠️  IMPORTANT: You need to set your admin password!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Run this command to generate a password hash:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  bun install" -ForegroundColor White
Write-Host "  echo 'your-password' | bun run hash-password" -ForegroundColor White
Write-Host ""
Write-Host "Then copy the hash to .env file:" -ForegroundColor Cyan
Write-Host "  ADMIN_PASSWORD_HASH=<paste-hash-here>" -ForegroundColor White
Write-Host ""

$response = Read-Host "Have you set ADMIN_PASSWORD_HASH in .env? (y/N)"

if ($response -ne 'y' -and $response -ne 'Y') {
    Write-Host "❌ Please set ADMIN_PASSWORD_HASH in .env first, then run this script again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Building and starting services..." -ForegroundColor Yellow
Write-Host ""

docker-compose up -d --build

Write-Host ""
Write-Host "✅ Services started!" -ForegroundColor Green
Write-Host ""
Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Access your Simple CDN:" -ForegroundColor Cyan
Write-Host "  Admin Panel: http://localhost:8080" -ForegroundColor White
Write-Host "  Health Check: http://localhost:8080/healthz" -ForegroundColor White
Write-Host "  Metrics: http://localhost:8080/metrics" -ForegroundColor White
Write-Host ""
Write-Host "View logs:" -ForegroundColor Cyan
Write-Host "  docker-compose logs -f" -ForegroundColor White
Write-Host ""
Write-Host "Stop services:" -ForegroundColor Cyan
Write-Host "  docker-compose down" -ForegroundColor White
Write-Host ""
