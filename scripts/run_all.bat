@echo off
title AI Intelligence Hub Launcher
cd /d %~dp0\..
echo =======================================================
echo          LAUNCHING AI INTELLIGENCE HUB
echo          100%% Free and Local Open-Source AI/ML
echo =======================================================
echo.
echo Launching Backend Server on http://localhost:8000 ...
start "AI Hub Backend" cmd /k "scripts\run_backend.bat"

timeout /t 3 /nobreak >nul

echo Launching Frontend Web App on http://localhost:5173 ...
start "AI Hub Frontend" cmd /k "scripts\run_frontend.bat"

echo.
echo All services launched! Opening browser...
start http://localhost:5173
