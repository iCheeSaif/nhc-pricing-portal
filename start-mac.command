#!/bin/bash
set -e
cd "$(dirname "$0")"
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 not found. Install Python 3.11+ from python.org and retry."
  read -r -p "Press Enter to exit...";exit 1
fi
if [ ! -d .venv ]; then python3 -m venv .venv; fi
source .venv/bin/activate
python -m pip install -r requirements.txt
( sleep 3; if command -v open >/dev/null 2>&1; then open 'http://127.0.0.1:8000'; fi ) &
echo "Pricing Portal is running at http://127.0.0.1:8000"
echo "Press Control+C to stop."
python -m uvicorn app:app --host 127.0.0.1 --port 8000
