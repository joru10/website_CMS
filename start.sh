#!/usr/bin/env bash
# RapidAI website local launcher
# Installs Node dependencies (if missing) and starts the site + CMS proxy
set -e

# Install dependencies only if node_modules is absent
if [ ! -d "node_modules" ]; then
  echo "Installing Node dependencies..."
  npm install
fi

# Check if CMS proxy is already running on port 8081
if lsof -i :8081 > /dev/null; then
  echo "CMS proxy is already running on port 8081. Using existing instance."
  echo "Starting RapidAI site on http://localhost:5501"
  npm run start
else
  echo "Starting RapidAI site on http://localhost:5501 with CMS proxy on port 8082"
  PORT=8082 npx netlify-cms-proxy-server &
  npm run start
fi
