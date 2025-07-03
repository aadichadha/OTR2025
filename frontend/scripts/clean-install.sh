#!/bin/bash
rm -rf node_modules package-lock.json
echo "Cleaned node_modules and package-lock.json."
npm install --legacy-peer-deps
echo "Reinstalled dependencies with legacy peer deps."
npm run build:simple 