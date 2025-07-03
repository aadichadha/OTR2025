#!/bin/bash

echo "🧹 Cleaning node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

echo "📦 Installing dependencies with exact versions..."
npm install --legacy-peer-deps

echo "🔧 Building with production mode..."
npm run build:simple

echo "✅ Clean install and build complete!"
echo "📊 Build artifacts created in dist/ directory" 