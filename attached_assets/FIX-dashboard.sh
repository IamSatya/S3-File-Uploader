#!/bin/bash
# Fix for Dashboard.tsx - Complete file replacement
# Run this on your VPS: bash FIX-dashboard.sh

cd /var/www/hackfiles

# Restore from backup first
if [ -f "client/src/pages/Dashboard.tsx.backup" ]; then
    echo "📝 Restoring from backup..."
    cp client/src/pages/Dashboard.tsx.backup client/src/pages/Dashboard.tsx
fi

# Now apply the fixes manually by replacing specific lines
# Update imports
sed -i "s/import { FolderPlus, Upload, LogOut, FolderOpen, Loader2, CheckSquare, Settings } from 'lucide-react';/import { FolderPlus, Upload, LogOut, FolderOpen, Loader2, CheckSquare, Settings, Database } from 'lucide-react';/" client/src/pages/Dashboard.tsx

# Find and replace the menu section - using a more careful approach
# Create a temp file with the exact replacement
cat > /tmp/menu-section.txt << 'MENUEND'
                  <DropdownMenuSeparator />
                  {user?.isAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/admin')} data-testid="link-admin">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/s3-browser')} data-testid="link-s3-browser">
                        <Database className="mr-2 h-4 w-4" />
                        S3 Browser
                      </DropdownMenuItem>
                    </>
                  )}
MENUEND

# Use perl instead of sed for more reliable multi-line replacement
perl -i -pe 'BEGIN{undef $/;} s/\s*<DropdownMenuSeparator \/>\s*\{user\?\.isAdmin && \(\s*<DropdownMenuItem onClick=\{\(\) => navigate\('"'"'\/admin'"'"'\)\} data-testid="link-admin">\s*<Settings className="mr-2 h-4 w-4" \/>\s*Admin Dashboard\s*<\/DropdownMenuItem>\s*\)\}/`cat /tmp/menu-section.txt`/s' client/src/pages/Dashboard.tsx

echo "✅ Dashboard.tsx fixed!"
