# HackFiles S3 Browser - VPS Deployment Guide

This package contains **7 deployment scripts** to add the S3 Browser feature to your VPS.

## 📦 What's Included

- **1-create-s3browser-page.sh** - Creates the new S3Browser.tsx page component
- **2-update-app-routing.sh** - Adds S3Browser route to App.tsx
- **3-add-s3-api-endpoint.sh** - Adds `/api/admin/s3-browse` endpoint to server
- **4-update-dashboard-nav.sh** - Adds S3 Browser link to Dashboard dropdown
- **5-update-admin-nav.sh** - Adds S3 Browser button to Admin page
- **6-rebuild-and-restart.sh** - Rebuilds and restarts the application
- **DEPLOY-ALL.sh** - Master script that runs all steps automatically

## 🚀 Quick Deployment (Recommended)

**Option 1: Automatic (All Steps at Once)**

```bash
# 1. Upload all .sh files to your VPS at /var/www/hackfiles/

# 2. SSH into your VPS
ssh root@drivetechnoidentity.org

# 3. Navigate to project directory
cd /var/www/hackfiles

# 4. Make scripts executable
chmod +x *.sh

# 5. Run the master deployment script
bash DEPLOY-ALL.sh
```

Done! The script will:
- ✅ Create automatic backup
- ✅ Deploy all files
- ✅ Rebuild the app
- ✅ Restart PM2

## 🔧 Manual Deployment (Step by Step)

**Option 2: Run Each Script Individually**

If you prefer to run each step manually:

```bash
cd /var/www/hackfiles

# Make all scripts executable
chmod +x *.sh

# Run each script in order
bash 1-create-s3browser-page.sh
bash 2-update-app-routing.sh
bash 3-add-s3-api-endpoint.sh
bash 4-update-dashboard-nav.sh
bash 5-update-admin-nav.sh
bash 6-rebuild-and-restart.sh
```

## 📝 What Each Script Does

### Script 1: Create S3Browser Page
Creates `client/src/pages/S3Browser.tsx` - the main browser component with:
- Folder navigation
- Breadcrumb navigation
- File/folder display with owner information
- Admin authentication guards

### Script 2: Update App Routing
Updates `client/src/App.tsx` to add the `/s3-browser` route

### Script 3: Add S3 API Endpoint
Adds the `/api/admin/s3-browse` endpoint to `server/routes.ts`:
- Filters files by path
- Enriches with user ownership data
- Admin-only access

### Script 4: Update Dashboard Navigation
Updates `client/src/pages/Dashboard.tsx`:
- Adds "S3 Browser" menu item in user dropdown
- Only visible to admin users

### Script 5: Update Admin Navigation
Updates `client/src/pages/Admin.tsx`:
- Adds "S3 Browser" button in header

### Script 6: Rebuild and Restart
- Runs `npm run build`
- Restarts PM2 process
- Shows deployment status

## 🔍 Testing After Deployment

1. Visit your site: http://drive.technoidentity.org
2. Login as admin: `admin@ti.com` / `Admin@123456`
3. Click your profile icon (top right)
4. Select **"S3 Browser"**
5. You should see the S3 folder explorer with all files and owners

## 📊 Features

✨ **What the S3 Browser provides:**
- Browse complete S3 bucket folder structure
- Navigate into folders by clicking them
- Breadcrumb navigation to go back
- See file owner's name and email for every file/folder
- Admin-only access with authentication gates
- Error handling with user-friendly messages

## 🛟 Troubleshooting

**Issue: Scripts won't run**
```bash
# Make them executable
chmod +x *.sh
```

**Issue: Build fails**
```bash
# Check Node.js version
node --version  # Should be v20+

# Check logs
pm2 logs index --lines 50
```

**Issue: "S3 Browser" link doesn't appear**
- Verify you're logged in as admin
- Check browser console for errors (F12)
- Clear browser cache and reload

**Issue: 404 error on /s3-browser**
- Ensure build completed successfully
- Check PM2 logs: `pm2 logs index`
- Restart PM2: `pm2 restart index`

**Issue: API errors**
- Check database connection
- Verify PostgreSQL is running
- Check environment variables in `.env`

## 🔄 Rollback Instructions

If something goes wrong, all original files are backed up:

```bash
cd /var/www/hackfiles

# Full backup created by DEPLOY-ALL.sh
tar -xzf backup-before-s3browser-YYYYMMDD-HHMMSS.tar.gz

# Individual file backups created by scripts
cp server/routes.ts.backup server/routes.ts
cp client/src/App.tsx.backup client/src/App.tsx
cp client/src/pages/Dashboard.tsx.backup client/src/pages/Dashboard.tsx
cp client/src/pages/Admin.tsx.backup client/src/pages/Admin.tsx

# Rebuild and restart
npm run build
pm2 restart index
```

## ✅ Verification Checklist

After deployment, verify:
- [ ] Application builds without errors
- [ ] PM2 shows process as "online"
- [ ] Can login as admin
- [ ] "S3 Browser" appears in profile dropdown
- [ ] Can navigate to /s3-browser
- [ ] Can see files and folders
- [ ] Can click folders to navigate
- [ ] Owner names display correctly

## 📞 Support

If you encounter issues:
1. Check the logs: `pm2 logs index --lines 50`
2. Verify all scripts ran successfully
3. Ensure PostgreSQL and S3 are accessible
4. Check environment variables in `.env`

---

**Ready to deploy? Run:** `bash DEPLOY-ALL.sh`
