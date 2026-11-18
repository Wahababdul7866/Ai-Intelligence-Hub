@echo off
title AI Intelligence Hub - Frontend Server
cd /d %~dp0\..\frontend
echo Starting AI Intelligence Hub Frontend on http://localhost:5173 ...
npm run dev
pause
