# HackTIvate VPS Complete Fix Guide

## Problem Summary
1. **Build Issue**: esbuild strips `registerRoutes` function → "(void 0) is not a function"
2. **Folder Upload Bug**: Backend reads wrong FormData key → "No files provided"

---

## Solution (Run on VPS)

### Step 1: Fix package.json Build Script

```bash
cd /var/www/hackfiles

# Backup original
cp package.json package.json.backup

# Fix build script (add --tree-shaking=false)
sed -i 's/"build": "vite build && esbuild server\/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"/"build": "vite build && esbuild server\/index.ts --platform=node --packages=external --bundle --format=esm --tree-shaking=false --outdir=dist"/' package.json

# Verify
grep '"build"' package.json
```

**Expected output:**
```
"build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --tree-shaking=false --outdir=dist",
```

---

### Step 2: Fix server/routes.ts (Line 640)

```bash
cd /var/www/hackfiles

# Backup original
cp server/routes.ts server/routes.ts.backup

# Fix the folder upload bug
sed -i '640s/const relativePaths = req.body.relativePaths;/const relativePaths = req.body[\x27relativePaths[]\x27] || req.body.relativePaths;/' server/routes.ts

# Verify the fix
sed -n '640p' server/routes.ts
```

**Expected output:**
```
      const relativePaths = req.body['relativePaths[]'] || req.body.relativePaths;
```

---

### Step 3: Clean Rebuild

```bash
cd /var/www/hackfiles

# Clean old build
rm -rf dist/

# Rebuild with tree-shaking disabled
npm run build

# Check for warnings (should see NONE about registerRoutes)
echo "✅ If build completed with no warnings, you're good!"
```

---

### Step 4: Restart PM2

```bash
pm2 restart hackfiles

# Wait 2 seconds
sleep 2

# Check logs
pm2 logs hackfiles --lines 30 --nostream
```

**Expected output:**
```
✅ 10:XX:XX AM [express] serving on port 5000
```

**NOT this:**
```
❌ TypeError: (void 0) is not a function
```

---

### Step 5: Test Folder Upload

1. **Login to your app** at http://your-vps-ip:5000
2. **Click "Upload Folder"**
3. **Select a folder** (it will show folder name, NOT individual files - this is normal!)
4. **Upload should succeed** with toast notification

---

## Browser Folder Upload UX (Normal Behavior)

⚠️ **Important**: When you click "Upload Folder":
- ✅ You select the **entire folder at once**
- ❌ You **DON'T browse into** the folder like File Explorer
- ✅ Browser shows **folder name only**, not individual files
- ✅ All files upload automatically with preserved structure

**This is how browsers work** - it's not a bug!

---

## Troubleshooting

### If Build Still Fails
```bash
# Check esbuild installed
npm list esbuild

# Reinstall if needed
npm install esbuild --save-dev

# Try again
rm -rf dist/ && npm run build
```

### If Folder Upload Still Fails
```bash
# Check the fix was applied
sed -n '640p' server/routes.ts

# Should show:
# const relativePaths = req.body['relativePaths[]'] || req.body.relativePaths;
```

### If Still Stuck
```bash
# Get build logs
npm run build 2>&1 | tee build.log

# Get PM2 logs
pm2 logs hackfiles --lines 50 --nostream > pm2.log

# Share build.log and pm2.log for debugging
```

---

## Quick One-Liner Fix (All Steps)

```bash
cd /var/www/hackfiles && \
  sed -i 's/"build": "vite build && esbuild server\/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"/"build": "vite build && esbuild server\/index.ts --platform=node --packages=external --bundle --format=esm --tree-shaking=false --outdir=dist"/' package.json && \
  sed -i '640s/const relativePaths = req.body.relativePaths;/const relativePaths = req.body[\x27relativePaths[]\x27] || req.body.relativePaths;/' server/routes.ts && \
  rm -rf dist/ && \
  npm run build && \
  pm2 restart hackfiles && \
  sleep 2 && \
  pm2 logs hackfiles --lines 20 --nostream
```

---

## Success Indicators

✅ **Build**: No "registerRoutes" warnings  
✅ **PM2 Logs**: "serving on port 5000"  
✅ **No Errors**: No "(void 0) is not a function"  
✅ **Folder Upload**: Success toast, files appear in list  

---

## Summary

- **Root Cause 1**: esbuild tree-shaking removed `registerRoutes`
- **Fix 1**: Add `--tree-shaking=false` to build script
- **Root Cause 2**: FormData sends `relativePaths[]`, backend reads `relativePaths`
- **Fix 2**: Read both `req.body['relativePaths[]']` and fallback to `req.body.relativePaths`
