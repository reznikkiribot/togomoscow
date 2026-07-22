# Starts the local togomoscow stack in separate windows.
# Cloudflare is pinned to IPv4 and can choose QUIC or HTTP/2 per VPN route.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$cloudflared = "$env:USERPROFILE\cloudflared\cloudflared.exe"

Write-Host 'Docker (Postgres + MinIO)...' -ForegroundColor Cyan
docker compose -f "$root\docker-compose.yml" up -d

Write-Host 'Starting backend, frontend and Cloudflare tunnel...' -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', "npm --prefix `"$root\backend`" run start:dev"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "npm --prefix `"$root\frontend`" run serve"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "& `"$cloudflared`" tunnel --protocol auto --edge-ip-version 4 --no-autoupdate --no-prechecks --retries 20 run togomoscow"

Write-Host ''
Write-Host 'Ready. Stable URL: https://app.togomoscow.ru/?v=242' -ForegroundColor Green
