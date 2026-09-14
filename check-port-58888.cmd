@echo off
powershell -NoProfile -Command "$c = Get-NetTCPConnection -LocalPort 58888 -State Listen -ErrorAction SilentlyContinue; if ($c) { Write-Host 'BUSY: port 58888 is in use by PID(s):' ($c.OwningProcess -join ', '); exit 1 } else { Write-Host 'FREE: port 58888 is available.'; exit 0 }"
exit /b %errorlevel%
