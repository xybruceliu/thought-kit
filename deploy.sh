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

echo "🌐 Ready for Vercel deployment!"
echo "Run 'npx vercel' to deploy or 'npx vercel --prod' for production deployment"
echo "No need to install Vercel CLI globally - npx will handle it!" 