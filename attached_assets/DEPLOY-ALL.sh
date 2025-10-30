#!/bin/bash
# Master Deployment Script - Runs all updates automatically
# Run this on your VPS: bash DEPLOY-ALL.sh

set -e  # Exit on any error

echo "================================================"
echo "  HackFiles S3 Browser - Complete Deployment"
echo "================================================"
echo ""

cd /var/www/hackfiles

# Create a backup of everything first
echo "📦 Step 0: Creating full backup..."
tar -czf backup-before-s3browser-$(date +%Y%m%d-%H%M%S).tar.gz server client
echo "✅ Backup created!"
echo ""

# Run each deployment script
echo "📝 Step 1: Creating S3Browser page..."
bash 1-create-s3browser-page.sh
echo ""

echo "📝 Step 2: Updating App routing..."
bash 2-update-app-routing.sh
echo ""

echo "📝 Step 3: Adding S3 API endpoint..."
bash 3-add-s3-api-endpoint.sh
echo ""

echo "📝 Step 4: Updating Dashboard navigation..."
bash 4-update-dashboard-nav.sh
echo ""

echo "📝 Step 5: Updating Admin navigation..."
bash 5-update-admin-nav.sh
echo ""

echo "📝 Step 6: Rebuilding and restarting..."
bash 6-rebuild-and-restart.sh

echo ""
echo "================================================"
echo "  ✅ Deployment Complete!"
echo "================================================"
