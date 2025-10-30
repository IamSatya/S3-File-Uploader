#!/bin/bash
# Step 6: Rebuild and restart the application
# Run this on your VPS: bash 6-rebuild-and-restart.sh

cd /var/www/hackfiles

echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🔄 Restarting PM2..."
    pm2 restart index
    
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Check logs: pm2 logs index --lines 20"
    echo "  2. Visit: http://drive.technoidentity.org"
    echo "  3. Login as: admin@ti.com / Admin@123456"
    echo "  4. Click: Profile Icon → 'S3 Browser'"
    echo ""
else
    echo "❌ Build failed! Check the errors above."
    echo "📝 Your original files are backed up with .backup extension"
    exit 1
fi
