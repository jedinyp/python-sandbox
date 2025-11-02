#!/bin/bash
set -e

echo "Building Next.js for production..."
npm run build

echo ""
echo "Building Docker image..."
docker build -t python-sandbox-image .

echo ""
echo "Starting WebSocket server in the background..."
node server.js &
SERVER_PID=$!
echo "WebSocket server started with PID: $SERVER_PID"

trap "echo 'Stopping WebSocket server...'; kill $SERVER_PID" EXIT

echo ""
echo "Starting Next.js production server..."
echo "Open http://localhost:3000 in your browser."
npm run start
