#!/bin/bash
# Step 5: Update Admin.tsx to add S3 Browser navigation
# Run this on your VPS: bash 5-update-admin-nav.sh

cd /var/www/hackfiles

# Create backup
cp client/src/pages/Admin.tsx client/src/pages/Admin.tsx.backup

# Update the imports line to add Database icon
sed -i "s/import { Users, HardDrive, Files, Clock, UserPlus, FolderOpen, ShieldCheck } from \"lucide-react\";/import { Users, HardDrive, Files, Clock, UserPlus, FolderOpen, ShieldCheck, Database } from \"lucide-react\";/" client/src/pages/Admin.tsx

# Now update the header section to add S3 Browser button
cat > /tmp/admin-header-patch.txt << 'PATCHCODE'
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold" data-testid="text-admin-title">Admin Dashboard</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/s3-browser')} data-testid="button-s3-browser">
                <Database className="mr-2 h-4 w-4" />
                S3 Browser
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} data-testid="button-back-to-dashboard">
                <FolderOpen className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>
PATCHCODE

# Replace the header section
sed -i '/<header className="border-b">/,/<\/header>/{
    /<header className="border-b">/r /tmp/admin-header-patch.txt
    d
}' client/src/pages/Admin.tsx

echo "✅ Admin.tsx navigation updated!"
echo "📝 Backup saved as: client/src/pages/Admin.tsx.backup"
