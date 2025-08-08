#!/usr/bin/env bash
# RapidAI website local launcher
# Installs Node dependencies (if missing) and starts the site + CMS proxy
set -e

# Install dependencies only if node_modules is absent
if [ ! -d "node_modules" ]; then
  echo "Installing Node dependencies..."
  npm install
fi

# Ensure CMS proxy runs on port 8081 (used by config.yml local_backend)
if lsof -i :8081 > /dev/null; then
  echo "Restarting CMS proxy on port 8081"
  kill "$(lsof -ti :8081)" || true
  sleep 0.5
fi
echo "Starting CMS proxy on port 8081"
PORT=8081 npx netlify-cms-proxy-server &
# give the proxy a moment to boot
sleep 1

echo "Starting RapidAI site on http://localhost:5501"
npm run start
