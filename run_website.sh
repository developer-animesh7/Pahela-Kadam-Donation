#!/bin/bash
echo "=========================================================="
echo "              PAHELA KADAM - DEV PORTAL"
echo "      Narayani Charitable Trust Donation Platform"
echo "=========================================================="
echo ""
echo "[1/2] Launching default web browser at http://localhost:8002 ..."
open http://localhost:8002

echo "[2/2] Starting local HTTP server on port 8002..."
echo ""
echo "* Note: Terminate this script/process to stop the server *"
echo "=========================================================="
python3 -m http.server 8002
