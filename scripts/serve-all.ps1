# РЎСѓРїРµСЂРІРёР·РѕСЂ СЃС‚РµРєР° togomoscow. Р”РµСЂР¶РёС‚ Р±СЌРєРµРЅРґ, С„СЂРѕРЅС‚РµРЅРґ Рё РџРћРЎРўРћРЇРќРќР«Р™ С‚СѓРЅРЅРµР»СЊ
# (РёРјРµРЅРѕРІР°РЅРЅС‹Р№ Cloudflare tunnel -> https://app.togomoscow.ru).
# Р—Р°РїСѓСЃРєР°РµС‚СЃСЏ РџР»Р°РЅРёСЂРѕРІС‰РёРєРѕРј РїСЂРё РІС…РѕРґРµ РІ СЃРёСЃС‚РµРјСѓ (install-autostart.ps1)
# РёР»Рё РІСЂСѓС‡РЅСѓСЋ: powershell -ExecutionPolicy Bypass -File scripts\serve-all.ps1

$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent $PSScriptRoot
$node = "$env:USERPROFILE\nodejs"
$cf   = "$env:USERPROFILE\cloudflared\cloudflared.exe"
$env:Path = "$node;$env:Path"

$logDir = "$root\.logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$cfLog = "$root\.cloudflared.log"
$cfOut = "$root\.cloudflared.out"
$STABLE = 'https://app.togomoscow.ru'
$MENU_URL = "$STABLE/?v=242"
$BOOT_URL = "$MENU_URL&health=supervisor"
$script:bound = $false
# cooldowns so a slow/failing start isn't retried every loop (avoids process pile-up)
$script:beStart = [datetime]::MinValue
$script:feStart = [datetime]::MinValue
$script:tunnelStart = [datetime]::MinValue
$script:tunnelFailures = 0
$script:lastIngest = [datetime]::MinValue
$script:lastMenu = Get-Date  # heavy crawl в†’ weekly cadence, not on every restart
$script:beProc = $null
$script:dockerStart = [datetime]::MinValue

function Test-Port($p) {
  try { $c = New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1', $p); $c.Close(); return $true }
  catch { return $false }
}
function Heartbeat($m) {
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $m" | Out-File "$logDir\supervisor.log" -Append -Encoding utf8
}
function Ensure-Docker {
  docker info *> $null
  if ($LASTEXITCODE -eq 0) { return $true }
  try { Start-Service 'com.docker.service' -ErrorAction SilentlyContinue } catch {}
  $desktop = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
  if ((Test-Path $desktop) -and -not (Get-Process 'Docker Desktop' -ErrorAction SilentlyContinue)) {
    Start-Process -FilePath $desktop -ArgumentList '--minimized' -WindowStyle Hidden
  }
  return $false
}
function Test-PublicMiniApp {
  if (-not (Test-Port 5173)) { return $false }
  try {
    $probe = "const https=require('https'); https.get(process.argv[1], res=>{let s=''; res.on('data', d=>s+=d); res.on('end', ()=>process.exit(res.statusCode>=200&&res.statusCode<300&&s.includes('boot-open')&&s.includes('html-img')?0:1));}).on('error', ()=>process.exit(1));"
    & "$node\node.exe" -e $probe $BOOT_URL *> $null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

# (Re)starts the named Cloudflare tunnel; binds the bot menu once.
function Start-Tunnel {
  Heartbeat 'restarting named tunnel'
  $script:tunnelStart = Get-Date
  $script:tunnelFailures = 0
  Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
  Start-Sleep -Seconds 1
  Remove-Item $cfLog, $cfOut -Force -ErrorAction SilentlyContinue
  Start-Process -FilePath $cf -ArgumentList 'tunnel', '--protocol', 'auto', '--edge-ip-version', '4', '--no-autoupdate', '--no-prechecks', '--retries', '20', 'run', 'togomoscow' `
    -RedirectStandardError $cfLog -RedirectStandardOutput $cfOut -WindowStyle Hidden

  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    if (Test-PublicMiniApp) { break }
  }
  if (-not $script:bound) {
    node "$root\scripts\set-menu-button.mjs" $MENU_URL *> "$logDir\menu.log"
    $script:bound = $true
    Heartbeat "tunnel up: $STABLE (menu bound)"
  }
}

Heartbeat 'supervisor started (named tunnel)'
Ensure-Docker | Out-Null
docker compose -f "$root\docker-compose.yml" up -d *> $null

while ($true) {
  if (-not (Test-Port 5432) -and ((Get-Date) - $script:dockerStart).TotalSeconds -gt 60) {
    $script:dockerStart = Get-Date
    if (Ensure-Docker) { docker compose -f "$root\docker-compose.yml" up -d *> $null }
  }
  # Do not spawn Nest while Postgres is down: `nest --watch` stays alive after
  # P1001, and the old port-only check leaked another process every 45 seconds.
  if ((Test-Port 5432) -and -not (Test-Port 3000) -and ((Get-Date) - $script:beStart).TotalSeconds -gt 45) {
    $script:beStart = Get-Date
    Heartbeat 'starting backend'
    if ($script:beProc -and -not $script:beProc.HasExited) {
      Stop-Process -Id $script:beProc.Id -Force -ErrorAction SilentlyContinue
    }
    $script:beProc = Start-Process -FilePath "$node\node.exe" `
      -ArgumentList 'node_modules/@nestjs/cli/bin/nest.js', 'start', '--watch' `
      -WorkingDirectory "$root\backend" -WindowStyle Hidden `
      -RedirectStandardOutput "$logDir\backend.out.log" -RedirectStandardError "$logDir\backend.err.log" -PassThru
  }
  if (-not (Test-Port 5173) -and ((Get-Date) - $script:feStart).TotalSeconds -gt 90) {
    $script:feStart = Get-Date
    Heartbeat 'starting frontend (build + preview)'
    Start-Process -FilePath "$node\npm.cmd" -ArgumentList 'run', 'serve' `
      -WorkingDirectory "$root\frontend" -WindowStyle Hidden `
      -RedirectStandardOutput "$logDir\frontend.out.log" -RedirectStandardError "$logDir\frontend.err.log"
  }

  # Novinki (venue-events) parsing is PAUSED — the whole "Новинки" feature is off for
  # now. To re-enable, restore the ingest-events + ai-enrich-events Start-Process calls
  # here (and re-add loadEvents() in Home.tsx / dedupedItemEvents in ListingDetail.tsx).
  # Taste profiles (recsys) are unrelated → kept running every 6h.
  if (((Get-Date) - $script:lastIngest).TotalHours -gt 6 -and (Test-Port 3000)) {
    $script:lastIngest = Get-Date
    Heartbeat 'ai taste profiles (novinki ingest paused)'
    # AI taste profiles per user (Ollama) — powers the recommendation feed ranking
    Start-Process -FilePath "$node\node.exe" -ArgumentList "`"$root\backend\prisma\build-taste-profiles.mjs`"", '100' `
      -WindowStyle Hidden -RedirectStandardOutput "$logDir\ai-taste.out.log" -RedirectStandardError "$logDir\ai-taste.err.log"
  }

  # weekly: refresh chain menus (cascade engine: __NEXT_DATA__ / Playwright XHR) в†’ import
  if (((Get-Date) - $script:lastMenu).TotalDays -gt 7 -and (Test-Port 3000)) {
    $script:lastMenu = Get-Date
    Heartbeat 'menu refresh (crawl top chains + import)'
    Start-Process -FilePath "$node\node.exe" -ArgumentList "`"$root\backend\prisma\menu-refresh.mjs`"", '40' `
      -WindowStyle Hidden -RedirectStandardOutput "$logDir\menu-refresh.out.log" -RedirectStandardError "$logDir\menu-refresh.err.log"
  }

  $cfProc = Get-Process cloudflared -ErrorAction SilentlyContinue
  $ok = $false
  $ok = Test-PublicMiniApp
  if ($ok) {
    $script:tunnelFailures = 0
  } else {
    $script:tunnelFailures += 1
    Heartbeat "tunnel health check failed ($script:tunnelFailures)"
  }
  $restartDueToFailures = $script:tunnelFailures -ge 8 -and ((Get-Date) - $script:tunnelStart).TotalSeconds -gt 300
  if ((-not $cfProc) -or $restartDueToFailures) {
    if (Test-Port 5173) { Start-Tunnel }
  }

  Start-Sleep -Seconds 15
}


























