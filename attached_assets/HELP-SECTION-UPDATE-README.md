# Help Section Update - Deployment Guide

## What Changed?

✅ **Help section is now collapsible** - Hidden by default, only shows when you click "Help"  
✅ **Help button added** - Top-right corner of the page  
✅ **Better explanations** - Written in simple, everyday language with emojis  

---

## Before & After

### Before:
- Big welcome card always visible on page
- Takes up lots of space
- Can't be hidden except by clicking X (and then it's gone forever)

### After:
- Clean page with no welcome card blocking content
- "Help" button in top-right corner
- Click "Help" → Instructions appear
- Click again → Instructions hide
- Can toggle anytime!

---

## Deploy to Your VPS

### Option 1: Automated (Partial)

```bash
# On your VPS
cd /var/www/hackfiles

# Create the script (copy from attached_assets/UPDATE-HELP-SECTION.sh)
nano UPDATE-HELP-SECTION.sh
# Paste the content, save with Ctrl+X, Y, Enter

# Make executable and run
chmod +x UPDATE-HELP-SECTION.sh
bash UPDATE-HELP-SECTION.sh
```

**Then follow the manual step shown by the script** (adding the Help button)

### Option 2: Fully Manual (Recommended - More Reliable)

#### Step 1: Update WelcomeInstructions.tsx

```bash
cd /var/www/hackfiles
nano client/src/components/WelcomeInstructions.tsx
```

Replace the **entire file** with the content from `attached_assets/WelcomeInstructions.tsx` (copy from Replit)

**Key changes:**
- Title: "How to Use HackFiles" (instead of "Welcome")
- Better descriptions with emojis
- More beginner-friendly language

#### Step 2: Update Dashboard.tsx

```bash
nano client/src/pages/Dashboard.tsx
```

**Change 1:** Add `HelpCircle` to imports (around line 21)

Find:
```typescript
import { FolderPlus, Upload, LogOut, FolderOpen, Loader2, CheckSquare, Settings, Database } from 'lucide-react';
```

Change to:
```typescript
import { FolderPlus, Upload, LogOut, FolderOpen, Loader2, CheckSquare, Settings, Database, HelpCircle } from 'lucide-react';
```

**Change 2:** Hide instructions by default (around line 30)

Find:
```typescript
const [showInstructions, setShowInstructions] = useState(true);
```

Change to:
```typescript
const [showInstructions, setShowInstructions] = useState(false);
```

**Change 3:** Add Help button (around line 432)

Find:
```typescript
<div className="flex items-center gap-4">
  <DropdownMenu>
```

Change to:
```typescript
<div className="flex items-center gap-4">
  <Button
    variant="outline"
    size="sm"
    onClick={() => setShowInstructions(!showInstructions)}
    data-testid="button-help"
  >
    <HelpCircle className="mr-2 h-4 w-4" />
    Help
  </Button>
  <DropdownMenu>
```

#### Step 3: Rebuild and Restart

```bash
npm run build
pm2 restart index
pm2 logs index --lines 10
```

---

## Testing

1. Visit: http://drive.technoidentity.org
2. Login
3. Look for **"Help" button** in top-right corner
4. Click it - instructions should appear
5. Click again - instructions should hide
6. Page should look cleaner with more space!

---

## What Users Will See

### New Help Section Explains:

📤 **Uploading Files** - Drag & drop OR click button  
📁 **Creating Folders** - Organize files into folders (code, docs, images, etc.)  
⬇️ **Downloading** - Click any file to download  
🗑️ **Deleting** - Use three dots menu → Delete  
⏰ **Upload Deadline** - What happens when timer hits zero  
🔒 **Privacy** - Your files are private (only you + admins can see)  

---

## Rollback

If something goes wrong:

```bash
cd /var/www/hackfiles
cp client/src/components/WelcomeInstructions.tsx.backup-help client/src/components/WelcomeInstructions.tsx
cp client/src/pages/Dashboard.tsx.backup-help client/src/pages/Dashboard.tsx
npm run build
pm2 restart index
```

---

**Need help?** Check the logs: `pm2 logs index`
