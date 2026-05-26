@echo off
title Path Traversal Demo - Kaloyan Mehandzhiyski

echo ==========================================
echo Path Traversal Demo - Node.js Application
echo Kaloyan Mehandzhiyski - 5MI0700025
echo ==========================================
echo.

echo Project endpoints:
echo - /download-vulnerable  - vulnerable implementation
echo - /download-secure      - secure implementation
echo.

echo Installing dependencies...
call npm install

if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed.
    echo Please check if Node.js and npm are installed correctly.
    pause
    exit /b 1
)

echo.
echo Starting application...
echo The application will be available at:
echo http://localhost:3000
echo.

timeout /t 2 /nobreak >nul
start "" "http://localhost:3000"

call npm start

echo.
echo Application stopped.
pause
