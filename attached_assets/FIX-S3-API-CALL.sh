#!/bin/bash
# Fix S3Browser API call issue
# The query was not passing the path parameter correctly
# Run this on your VPS: bash FIX-S3-API-CALL.sh

cd /var/www/hackfiles

echo "🔧 Fixing S3Browser API call..."

# Backup original file
cp client/src/pages/S3Browser.tsx client/src/pages/S3Browser.tsx.backup-api-fix

# Find and replace the useQuery section
# The issue: queryKey array was being joined with "/" instead of passing as query param
# We need to add a custom queryFn

cat > /tmp/s3browser-fix.txt << 'QUERYFIX'
  const { data: files = [], isLoading, error } = useQuery<FileWithOwner[]>({
    queryKey: ["/api/admin/s3-browse", currentPath],
    queryFn: async () => {
      const params = new URLSearchParams({ path: currentPath });
      const res = await fetch(`/api/admin/s3-browse?${params}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch S3 content");
      }
      return res.json();
    },
    enabled: !!user?.isAdmin,
  });
QUERYFIX

# Use perl for multi-line replacement
perl -i -pe 'BEGIN{undef $/;} s/const \{ data: files = \[\], isLoading, error \} = useQuery<FileWithOwner\[\]>\(\{\s*queryKey: \[.*?\],\s*enabled: !!\w+\?\.isAdmin,\s*\}\);/`cat \/tmp\/s3browser-fix.txt`/s' client/src/pages/S3Browser.tsx

echo "✅ S3Browser.tsx updated!"
echo ""
echo "🔨 Rebuilding application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🔄 Restarting PM2..."
    pm2 restart index
    
    echo ""
    echo "✅ Fix deployed successfully!"
    echo ""
    echo "📋 Test the fix:"
    echo "  1. Visit: http://drive.technoidentity.org"
    echo "  2. Login as admin"
    echo "  3. Click Profile → 'S3 Browser'"
    echo "  4. You should now see your files!"
    echo ""
else
    echo "❌ Build failed! Restoring backup..."
    cp client/src/pages/S3Browser.tsx.backup-api-fix client/src/pages/S3Browser.tsx
    exit 1
fi
