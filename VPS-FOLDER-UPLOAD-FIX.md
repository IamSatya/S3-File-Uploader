# VPS Folder Upload Fix - Complete Guide

## Problem
Folder uploads work in Replit dev environment but fail on VPS with "No files provided" error.
Backend logs show: `files received: 0`

## Root Causes
1. **package.json build script is broken** (has duplicate --tree-shaking flags)
2. **Multer needs file size limits** to handle folder uploads properly
3. **Nginx may have upload size restrictions** (if you're using nginx as reverse proxy)

---

## STEP 1: Fix package.json Build Script

On your VPS at `/var/www/hackfiles`, run:

```bash
cd /var/www/hackfiles

# Backup current package.json
cp package.json package.json.backup

# Fix the build script - remove duplicates and add tree-shaking=false correctly
sed -i 's/"build": "vite build.*"/"build": "vite build \&\& esbuild server\/index.ts --platform=node --packages=external --bundle --format=esm --tree-shaking=false --target=node18 --outdir=dist"/' package.json

# Verify the fix
grep '"build"' package.json
```

Expected output:
```
"build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --tree-shaking=false --target=node18 --outdir=dist",
```

---

## STEP 2: Add Multer File Size Limits

Edit `server/routes.ts` and find this line (around line 14):

```typescript
const upload = multer({ storage: multer.memoryStorage() });
```

Replace it with:

```typescript
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 1000, // Max 1000 files per upload
    fields: 1000, // Max 1000 form fields (for relativePaths array)
  }
});
```

---

## STEP 3: Check Nginx Configuration (if applicable)

If you're using Nginx as a reverse proxy, you need to allow large uploads.

Edit your nginx config (usually `/etc/nginx/sites-available/your-site`):

```nginx
server {
    ...
    
    # Add these lines inside your server block
    client_max_body_size 500M;  # Allow up to 500MB total upload
    client_body_timeout 300s;   # 5 minute timeout for large uploads
    
    ...
}
```

Then reload nginx:
```bash
sudo nginx -t  # Test config
sudo systemctl reload nginx
```

---

## STEP 4: Rebuild and Redeploy

```bash
cd /var/www/hackfiles

# Stop PM2
pm2 stop hackfiles

# Delete old broken build
rm -rf dist/

# Fresh build with fixed script
npm run build

# Verify build succeeded
ls -lh dist/index.js

# Restart PM2
pm2 restart hackfiles

# Wait 3 seconds then check logs
sleep 3
pm2 logs hackfiles --lines 20 --nostream
```

---

## STEP 5: Test Folder Upload

1. Go to https://drive.technoidentity.org
2. Click "Upload Folder"
3. Select a folder with multiple files
4. Watch the upload progress

If it still fails, check the logs again:
```bash
pm2 logs hackfiles --lines 30 --nostream
```

You should now see:
- `[upload-folder] files received: X` (where X > 0)
- `[upload-folder] relativePaths count: X`

---

## Verification Commands

```bash
# 1. Verify package.json is fixed
grep '"build"' /var/www/hackfiles/package.json

# 2. Verify multer config in routes.ts
grep -A 5 "const upload = multer" /var/www/hackfiles/server/routes.ts

# 3. Check if nginx has size limits (if using nginx)
sudo nginx -T | grep client_max_body_size

# 4. Test the endpoint manually with curl
curl -X POST https://drive.technoidentity.org/api/files/upload-folder \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -F "path=/" \
  -F "files=@/path/to/test/file.txt" \
  -F "relativePaths[]=file.txt"
```

---

## Expected Result

After these fixes:
- ✅ Folder uploads should work
- ✅ Multiple files uploaded simultaneously
- ✅ Backend logs show correct file counts
- ✅ Files stored in S3 with proper folder structure

---

## If It Still Doesn't Work

Run this debug script to capture detailed info:

```bash
cd /var/www/hackfiles

echo "=== Package.json build script ===" 
grep '"build"' package.json

echo ""
echo "=== Multer config ==="
grep -A 8 "const upload = multer" server/routes.ts

echo ""
echo "=== PM2 logs (last 30 lines) ==="
pm2 logs hackfiles --lines 30 --nostream

echo ""
echo "=== Nginx upload limits (if applicable) ==="
sudo nginx -T 2>/dev/null | grep -E "client_max_body_size|client_body_timeout" || echo "Nginx not found or no config"
```

Send me the complete output of this script.
