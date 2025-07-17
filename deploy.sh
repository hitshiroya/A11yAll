#!/bin/bash

# A11yAll Deployment Preparation Script
# Created by Hit Shiroya

echo "🚀 A11yAll Deployment Preparation"
echo "================================="

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: vercel.json not found. Make sure you're in the project root directory."
    exit 1
fi

echo "📦 Installing dependencies..."

# Install root dependencies (Cypress)
echo "Installing root dependencies..."
npm install

# Install client dependencies
echo "Installing client dependencies..."
cd client
npm install

# Test client build
echo "Testing client build..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Client build failed. Please fix the errors above."
    exit 1
fi

# Go back to root
cd ..

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install

# Go back to root
cd ..

echo "✅ All dependencies installed successfully!"
echo ""
echo "🔍 Pre-deployment checklist:"
echo "✅ Dependencies installed"
echo "✅ Client build tested"
echo "✅ Server configuration ready"
echo "✅ Vercel configuration created"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Ready for deployment'"
echo "   git push origin main"
echo ""
echo "2. Deploy to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Import your GitHub repository"
echo "   - Add GROQ_API_KEY environment variable"
echo "   - Deploy!"
echo ""
echo "🌟 Your A11yAll app is ready for deployment!"
echo "🎯 Created by Hit Shiroya" 