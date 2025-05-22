#!/bin/bash

echo "🚀 Preparing ThoughtKit for Vercel deployment..."

# Build the frontend
echo "📦 Building frontend..."
cd thinkaloudLM/frontend
npm install
npm run build
cd ../..

# Check if build was successful
if [ ! -d "thinkaloudLM/frontend/build" ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Frontend build successful!"

# Install Vercel CLI if not already installed
if ! command -v vercel &> /dev/null; then
    echo "📥 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🌐 Ready for Vercel deployment!"
echo "Run 'vercel' to deploy or 'vercel --prod' for production deployment" 