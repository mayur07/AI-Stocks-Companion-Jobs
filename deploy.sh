#!/bin/bash

echo "🚀 Deploying AI Stocks Companion Jobs to Render..."
echo "=================================================="

# Check if we're in the jobs directory
if [ ! -f "scheduler.js" ]; then
    echo "❌ Error: Please run this script from the jobs directory"
    exit 1
fi

# Check if all required files exist
echo "📋 Checking required files..."
required_files=("scheduler.js" "package.json" "render.yaml" "Procfile")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file is missing"
        exit 1
    fi
done

echo ""
echo "📦 Files ready for deployment:"
echo "✅ scheduler.js - Main application"
echo "✅ package.json - Dependencies"
echo "✅ render.yaml - Render configuration"
echo "✅ Procfile - Process configuration"
echo "✅ services/ - All service files"
echo ""

echo "🎯 Next steps:"
echo "1. Commit and push your changes to GitHub"
echo "2. Go to https://render.com"
echo "3. Create a new Background Worker"
echo "4. Connect your GitHub repository"
echo "5. Set Root Directory to 'jobs'"
echo "6. Deploy!"
echo ""

echo "📱 Your service will:"
echo "• Monitor financial news every 30 minutes"
echo "• Send WhatsApp alerts to +14802082917"
echo "• Send email alerts to mayur.mathurkar7@gmail.com"
echo "• Run continuously in the cloud"
echo ""

echo "🔧 Configuration files created:"
echo "• render.yaml - For automatic deployment"
echo "• Procfile - For process management"
echo "• DEPLOY_TO_RENDER.md - Detailed deployment guide"
echo ""

echo "✅ Ready for deployment!"
