@echo off
title AI Intelligence Hub - Backend Server
cd /d %~dp0\..
set PYTHONPATH=backend
echo Starting AI Intelligence Hub Backend on http://localhost:8000 ...
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
