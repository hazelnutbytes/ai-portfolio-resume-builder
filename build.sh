#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "--- 1. Installing Backend Dependencies ---"
pip install -r backend/requirements.txt

echo "--- 2. Building Frontend Production Bundle ---"
cd frontend
npm install
npm run build
cd ..

echo "--- 3. Initializing Database Schema & Profile Seed ---"
python backend/database/seed.py

echo "--- Deployment Build Succeeded! ---"
