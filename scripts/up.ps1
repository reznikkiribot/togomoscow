# Starts the local togomoscow stack and the stable Cloudflare named tunnel.
# The tunnel is pinned to IPv4 and lets cloudflared choose QUIC or HTTP/2,
# because different VPNs block different transports.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$node = "$env:USERPROFILE\nodejs"
$cf = "$env:USERPROFILE\cloudflared\cloudflared.exe"
$env:Path = "$node;$env:Path"

$log = "$root\.cloudflared.log"
$out = "$root\.cloudflared.out"
$stableUrl = 'https://app.togomoscow.ru/tg-boot-222?v=222'

Write-Host 'Docker (Postgres + MinIO)...' -ForegroundColor Cyan
docker compose -f "$root\docker-compose.yml" up -d | Out-Null

Write-Host 'Backend + frontend...' -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', "npm --prefix `"$root\backend`" run start:dev"
Start-Process powershell -ArgumentList '-NoExit', '-Command', "npm --prefix `"$root\frontend`" run serve"

Write-Host 'Cloudflare named tunnel (auto transport + IPv4)...' -ForegroundColor Cyan
Remove-Item $log, $out -Force -ErrorAction SilentlyContinue
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Process -FilePath $cf `
  -ArgumentList 'tunnel', '--protocol', 'auto', '--edge-ip-version', '4', '--no-autoupdate', '--no-prechecks', '--retries', '20', 'run', 'togomoscow' `
  -RedirectStandardError $log -RedirectStandardOutput $out -WindowStyle Hidden

Write-Host 'Waiting for frontend...' -ForegroundColor Cyan
for ($i = 0; $i -lt 30; $i++) {
  try { Invoke-WebRequest 'http://localhost:5173/' -TimeoutSec 2 -UseBasicParsing | Out-Null; break }
  catch { Start-Sleep 2 }
}

Write-Host "Binding bot menu -> $stableUrl" -ForegroundColor Cyan
node "$root\scripts\set-menu-button.mjs" $stableUrl

Write-Host 'Ready. Open @togomoscow_bot and use the menu button.' -ForegroundColor Green
