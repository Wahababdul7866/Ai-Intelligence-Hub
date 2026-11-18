#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

echo "======================================================="
echo "         LAUNCHING AI INTELLIGENCE HUB"
echo "         100% Free and Local Open-Source AI/ML"
echo "======================================================="

export PYTHONPATH="backend"
echo "Starting Backend on http://localhost:8000 ..."
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "Starting Frontend on http://localhost:5173 ..."
cd frontend && npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
