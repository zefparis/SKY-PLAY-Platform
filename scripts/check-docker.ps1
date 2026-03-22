Write-Host "=== SKY PLAY Docker Validation ===" -ForegroundColor Cyan

Write-Host "`n[1/5] Validating docker-compose.yml..." -ForegroundColor Yellow
Set-Location "infrastructure/docker"
docker compose config | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Invalid docker-compose.yml" -ForegroundColor Red
    exit 1
}
Write-Host "OK YAML is valid" -ForegroundColor Green

Write-Host "`n[2/5] Starting services..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start services" -ForegroundColor Red
    exit 1
}
Write-Host "OK Services started" -ForegroundColor Green

Write-Host "`n[3/5] Waiting 5 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`n[4/5] Checking containers..." -ForegroundColor Yellow
docker ps --filter "name=skyplay" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host "`n[5/5] Verifying status..." -ForegroundColor Yellow
$postgres = docker ps --filter "name=skyplay_postgres" --filter "status=running" --quiet
$redis = docker ps --filter "name=skyplay_redis" --filter "status=running" --quiet

if ($postgres -and $redis) {
    Write-Host "`nOK - All services running" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nERROR - Some services not running" -ForegroundColor Red
    if (-not $postgres) { Write-Host "  - postgres: NOT RUNNING" -ForegroundColor Red }
    if (-not $redis) { Write-Host "  - redis: NOT RUNNING" -ForegroundColor Red }
    exit 1
}
