@echo off
cd /d "%~dp0.."
C:\Users\rezni\cloudflared\cloudflared.exe tunnel --protocol auto --edge-ip-version 4 --no-autoupdate --no-prechecks --retries 20 run togomoscow >> ".cloudflared-http2.log" 2>&1
