@echo off
setlocal

echo Building Next.js for production...
call npm run build || exit /b

echo.
echo Building Docker image...
call docker build -t python-sandbox-image .

echo.
echo Starting WebSocket server in a new window...
start "Python Sandbox WebSocket Server" node server.js

echo.
echo Starting Next.js production server...
echo Open http://localhost:3000 in your browser.
call npm run start
