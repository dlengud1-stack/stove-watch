@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 22.13 or newer, then open this file again.
  pause
  exit /b 1
)
node scripts/build.mjs
if errorlevel 1 goto failed
echo Open http://localhost:4197 in your browser.
node scripts/preview.mjs
:failed
pause
