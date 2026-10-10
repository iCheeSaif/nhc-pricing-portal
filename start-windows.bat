@echo off
cd /d "%~dp0"
where py >nul 2>&1
if errorlevel 1 (
 echo Python Launcher not found. Install Python 3.11 or newer.
 pause
 exit /b 1
)
if not exist .venv py -3 -m venv .venv
call .venv\Scripts\activate.bat
python -m pip install -r requirements.txt
start "Pricing Portal" http://127.0.0.1:8000
echo Pricing Portal starts at http://127.0.0.1:8000
python -m uvicorn app:app --host 127.0.0.1 --port 8000
pause
