@echo off
setlocal
rem Windows launcher: serve a data directory on 127.0.0.1 and open the practice page.
rem The page reads interview-bank.json at runtime, so it must be opened over http, not by double-clicking.
rem Usage: scripts\serve.bat [data-dir] [port]
rem   data-dir defaults to %INTERVIEW_REVIEW_DATA%; port defaults to 8080.
rem   To stop the server, close the "interview-review server" window.
set "DATA=%~1"
if "%DATA%"=="" set "DATA=%INTERVIEW_REVIEW_DATA%"
if "%DATA%"=="" (
  echo Usage: scripts\serve.bat ^<data-dir^> [port]   or set INTERVIEW_REVIEW_DATA
  exit /b 1
)
set "PORT=%~2"
if "%PORT%"=="" set "PORT=8080"
if not exist "%DATA%\interview-practice.html" (
  echo No interview-practice.html in "%DATA%". Deploy first: node scripts\deploy.mjs "%DATA%"
  exit /b 1
)
set "PY="
where py >nul 2>nul && set "PY=py -3"
if not defined PY where python >nul 2>nul && set "PY=python"
if not defined PY (
  echo Python 3 not found. Install it from https://www.python.org/ and tick "Add python.exe to PATH".
  exit /b 1
)
netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul && (
  echo Port %PORT% is already in use, opening the page without starting a new server.
  goto open
)
start "interview-review server (close this window to stop)" /D "%DATA%" %PY% -m http.server %PORT% --bind 127.0.0.1
timeout /t 2 /nobreak >nul
:open
start "" "http://127.0.0.1:%PORT%/interview-practice.html"
