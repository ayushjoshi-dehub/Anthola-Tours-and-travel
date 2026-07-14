#!/bin/bash
set -e

echo "=== Building Anthola Full Stack ==="

echo "=== Step 1: Installing Frontend Dependencies ==="
cd anthola_fullstack/frontend
npm install

echo "=== Step 2: Building Frontend with Vite ==="
export VITE_API_BASE_URL=https://anthola-tours-and-travel.onrender.com
export VITE_SOCKET_URL=https://anthola-tours-and-travel.onrender.com
npm run build
echo "=== Frontend build complete. Checking dist folder ==="
ls -la dist/ || echo "WARNING: dist folder not found!"
echo "=== Copying frontend build to public/ for Vercel ==="
cd ../..
mkdir -p public
cp -r anthola_fullstack/frontend/dist/* public/
ls -la public/ || echo "WARNING: public folder not found!"

echo "=== Step 3: Installing Backend Dependencies ==="
cd anthola_fullstack/backend
npm install

echo "=== Build Complete ==="
