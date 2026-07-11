@echo off
title Pahela Kadam - Local Dev Server
echo ==========================================================
echo               PAHELA KADAM - DEV PORTAL
echo       Narayani Charitable Trust Donation Platform
echo ==========================================================
echo.
echo [1/2] Launching default web browser at http://localhost:8000 ...
start http://localhost:8000

echo [2/2] Starting local HTTP server on port 8000...
echo.
echo * Note: Close this command prompt window to stop the server *
echo ==========================================================
python -m http.server 8000
