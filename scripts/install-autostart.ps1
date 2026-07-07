# Регистрирует супервизор как задачу Планировщика, которая запускается при входе
# в систему и держит стек живым до выключения компьютера. Прав администратора
# не требует (задача уровня текущего пользователя). Запуск один раз:
#   powershell -ExecutionPolicy Bypass -File scripts\install-autostart.ps1
#
# Удалить автозапуск: Unregister-ScheduledTask -TaskName 'togomoscow-dev' -Confirm:$false

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$serve = "$root\scripts\serve-all.ps1"

$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -NoProfile -File `"$serve`""

$trigger = New-ScheduledTaskTrigger -AtLogOn

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero) `
  -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName 'togomoscow-dev' `
  -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null

Write-Host "Задача 'togomoscow-dev' зарегистрирована (запуск при входе в систему)." -ForegroundColor Green
Start-ScheduledTask -TaskName 'togomoscow-dev'
Write-Host "Запущена сейчас. Логи: $root\.logs\supervisor.log" -ForegroundColor Green
