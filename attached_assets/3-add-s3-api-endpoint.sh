#!/bin/bash
# Step 3: Add S3 Browse API endpoint to server/routes.ts
# Run this on your VPS: bash 3-add-s3-api-endpoint.sh

cd /var/www/hackfiles

# Find the line number where we need to insert the new endpoint
# It should be right before the "Toggle user active status" endpoint

# Create a backup
cp server/routes.ts server/routes.ts.backup

# Create the new endpoint code
cat > /tmp/s3-browse-endpoint.txt << 'ENDCODE'

  // Browse S3 bucket structure (admin only)
  app.get('/api/admin/s3-browse', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const path = (req.query.path as string) || '/';
      
      // Get all files from database
      const allFiles = await storage.getAllFiles();
      
      // Get all users for ownership info
      const allUsers = await storage.getAllUsers();
      const userMap = new Map(allUsers.map(u => [u.id, u]));
      
      // Filter files at the current path level
      const filesAtPath = allFiles.filter(file => file.path === path);
      
      // Enrich with user information
      const enrichedFiles = filesAtPath.map(file => {
        const owner = userMap.get(file.userId);
        return {
          ...file,
          ownerEmail: owner?.email || 'Unknown',
          ownerName: owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown'
        };
      });
      
      res.json(enrichedFiles);
    } catch (error) {
      console.error("Error browsing S3:", error);
      res.status(500).json({ message: "Failed to browse S3" });
    }
  });
ENDCODE

# Insert the code before the "Toggle user active status" line
sed -i '/\/\/ Toggle user active status (admin only)/r /tmp/s3-browse-endpoint.txt' server/routes.ts

echo "✅ S3 Browse API endpoint added to routes.ts!"
echo "📝 Backup saved as: server/routes.ts.backup"
