#!/bin/bash
# Step 4: Update Dashboard.tsx to add S3 Browser navigation
# Run this on your VPS: bash 4-update-dashboard-nav.sh

cd /var/www/hackfiles

# Create backup
cp client/src/pages/Dashboard.tsx client/src/pages/Dashboard.tsx.backup

# Update the imports line to add Database icon
sed -i "s/import { FolderPlus, Upload, LogOut, FolderOpen, Loader2, CheckSquare, Settings } from 'lucide-react';/import { FolderPlus, Upload, LogOut, FolderOpen, Loader2, CheckSquare, Settings, Database } from 'lucide-react';/" client/src/pages/Dashboard.tsx

# Now add the S3 Browser menu item after Admin Dashboard menu item
# This is a bit complex with sed, so we'll use a temporary file

cat > /tmp/dashboard-nav-patch.txt << 'PATCHCODE'
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
                  <DropdownMenuItem onClick={async () => {
PATCHCODE

# Replace the old section with the new one
sed -i '/DropdownMenuSeparator/,/DropdownMenuItem onClick={async () => {/{
    /DropdownMenuSeparator/r /tmp/dashboard-nav-patch.txt
    d
}' client/src/pages/Dashboard.tsx

echo "✅ Dashboard.tsx navigation updated!"
echo "📝 Backup saved as: client/src/pages/Dashboard.tsx.backup"
