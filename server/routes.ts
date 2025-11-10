import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import passport from "passport";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { uploadToS3, downloadFromS3, deleteFromS3, deleteFolder } from "./s3Client";
import { createFolderSchema, loginSchema, registerSchema, type RegisterInput } from "@shared/schema";
import { Readable } from "stream";
import { requireAdmin } from "./middleware/admin";

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to sanitize email for S3 paths
function sanitizeEmail(email: string): string {
  return email.replace(/[@.]/g, '_');
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Download route for deployment ZIP (with cache-busting)
  app.get('/download-deployment', (req, res) => {
    const filePath = '/home/runner/workspace/hackfiles-deployment.zip';
    
    // Prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.download(filePath, 'hackfiles-deployment.zip', (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(404).json({ message: 'File not found' });
      }
    });
  });

  // New versioned download endpoint to bypass proxy cache
  app.get('/download-deployment-v2', (req, res) => {
    const filePath = '/home/runner/workspace/hackfiles-deployment.zip';
    
    // Prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.download(filePath, 'hackfiles-deployment.zip', (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(404).json({ message: 'File not found' });
      }
    });
  });

  // Stream ZIP file directly with unique URL
  app.get('/get-deployment-package', async (req, res) => {
    const fs = await import('fs');
    const filePath = '/home/runner/workspace/hackfiles-deployment.zip';
    
    console.log('[DOWNLOAD] Request received for deployment package');
    
    try {
      const stat = fs.statSync(filePath);
      console.log(`[DOWNLOAD] File found, size: ${stat.size} bytes`);
      
      // Set headers for download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="hackfiles-deployment.zip"');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Stream file
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
      
      readStream.on('end', () => {
        console.log('[DOWNLOAD] File sent successfully');
      });
      
      readStream.on('error', (err) => {
        console.error('[DOWNLOAD] Stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming file' });
        }
      });
    } catch (err) {
      console.error('[DOWNLOAD] Error:', err);
      res.status(404).json({ message: 'File not found' });
    }
  });

  // Download admin update package
  app.get('/download-admin-update', async (req, res) => {
    const fs = await import('fs');
    const filePath = '/home/runner/workspace/hackfiles-admin-update.tar.gz';
    
    console.log('[DOWNLOAD] Admin update package requested');
    
    try {
      const stat = fs.statSync(filePath);
      console.log(`[DOWNLOAD] Admin update found, size: ${stat.size} bytes`);
      
      // Set headers for download
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', 'attachment; filename="hackfiles-admin-update.tar.gz"');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Stream file
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
      
      readStream.on('end', () => {
        console.log('[DOWNLOAD] Admin update sent successfully');
      });
      
      readStream.on('error', (err) => {
        console.error('[DOWNLOAD] Stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming file' });
        }
      });
    } catch (err) {
      console.error('[DOWNLOAD] Error:', err);
      res.status(404).json({ message: 'File not found' });
    }
  });

  // Download fixed routes.ts file for VPS deployment
  app.get('/download-routes-fixed', async (req, res) => {
    const fs = await import('fs');
    const filePath = '/home/runner/workspace/attached_assets/routes-FIXED.ts';
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="routes.ts"');
    res.setHeader('Cache-Control', 'no-store');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });

  // Download fixed index.ts file for VPS deployment
  app.get('/download-index-fixed', async (req, res) => {
    const fs = await import('fs');
    const filePath = '/home/runner/workspace/attached_assets/index-FIXED.ts';
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="index.ts"');
    res.setHeader('Cache-Control', 'no-store');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });

  // Download fixed Dashboard.tsx file for VPS deployment
  app.get('/download-dashboard-fixed', async (req, res) => {
    const fs = await import('fs');
    const filePath = '/home/runner/workspace/attached_assets/Dashboard-FIXED.tsx';
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="Dashboard.tsx"');
    res.setHeader('Cache-Control', 'no-store');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });

  // Auth routes
  // Note: Public registration removed - users must be created by admins via /api/admin/create-user
  
  app.post('/api/auth/login', (req, res, next) => {
    const result = loginSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: result.error.flatten().fieldErrors 
      });
    }

    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        console.error("Error during login:", err);
        return res.status(500).json({ message: "Login failed" });
      }

      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      req.login(user, (err) => {
        if (err) {
          console.error("Error establishing session:", err);
          return res.status(500).json({ message: "Login failed" });
        }

        // Don't send password back
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Error during logout:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const { password: _, ...userWithoutPassword } = req.user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Timer config routes
  app.get('/api/timer-config', async (req, res) => {
    try {
      let config = await storage.getTimerConfig();
      
      // If no config exists, create a default one (30 days from now)
      if (!config) {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 30);
        
        config = await storage.upsertTimerConfig({
          id: "default",
          deadline,
          isActive: true,
        });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error fetching timer config:", error);
      res.status(500).json({ message: "Failed to fetch timer config" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const [userStats, totalStats] = await Promise.all([
        storage.getUserStorageStats(),
        storage.getTotalStats(),
      ]);
      
      res.json({
        userStats,
        totalStats,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  app.get('/api/admin/timer', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const config = await storage.getTimerConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching timer config:", error);
      res.status(500).json({ message: "Failed to fetch timer config" });
    }
  });

  app.post('/api/admin/timer', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { deadline, isActive } = req.body;
      
      if (!deadline) {
        return res.status(400).json({ message: "Deadline is required" });
      }
      
      const config = await storage.upsertTimerConfig({
        id: "default",
        deadline: new Date(deadline),
        isActive: isActive !== undefined ? isActive : true,
      });
      
      res.json(config);
    } catch (error) {
      console.error("Error updating timer config:", error);
      res.status(500).json({ message: "Failed to update timer config" });
    }
  });

  app.post('/api/admin/create-user', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: result.error.flatten().fieldErrors 
        });
      }

      const { email, password, firstName, lastName } = result.data;
      const isAdmin = req.body.isAdmin === true;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isAdmin,
      });

      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Get all users (admin only)
  app.get('/api/admin/users', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send passwords back
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get all files (admin only)
  app.get('/api/admin/files', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const files = await storage.getAllFiles();
      res.json(files);
    } catch (error) {
      console.error("Error fetching all files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

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

  // Toggle user active status (admin only)
  app.patch('/api/admin/users/:userId/toggle-active', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }

      const user = await storage.updateUserActiveStatus(userId, isActive);
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Reset user password (admin only)
  app.post('/api/admin/users/:userId/reset-password', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { password } = req.body;

      if (!password || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user's password
      const user = await storage.updateUserPassword(userId, hashedPassword);
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error resetting user password:", error);
      res.status(500).json({ message: "Failed to reset user password" });
    }
  });

  // Delete user (admin only)
  app.delete('/api/admin/users/:userId', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;

      // Prevent admin from deleting themselves
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Check if uploads are allowed
  async function checkUploadAllowed() {
    const config = await storage.getTimerConfig();
    if (!config) return true;
    
    const now = new Date();
    const deadline = new Date(config.deadline);
    
    return now < deadline && config.isActive;
  }

  // File listing route with search and filtering
  app.get('/api/files', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const path = (req.query.path as string) || '/';
      const search = (req.query.search as string) || '';
      const fileType = (req.query.fileType as string) || '';
      const dateRange = (req.query.dateRange as string) || '';
      
      let files = await storage.getFilesByPath(userId, path);
      
      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        files = files.filter(file => 
          file.name.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply file type filter
      if (fileType && fileType !== 'all') {
        if (fileType === 'folder') {
          files = files.filter(file => file.isFolder);
        } else if (fileType === 'image') {
          files = files.filter(file => !file.isFolder && file.mimeType?.startsWith('image/'));
        } else if (fileType === 'document') {
          files = files.filter(file => !file.isFolder && (
            file.mimeType?.includes('pdf') ||
            file.mimeType?.includes('document') ||
            file.mimeType?.includes('text/')
          ));
        } else if (fileType === 'video') {
          files = files.filter(file => !file.isFolder && file.mimeType?.startsWith('video/'));
        } else if (fileType === 'audio') {
          files = files.filter(file => !file.isFolder && file.mimeType?.startsWith('audio/'));
        } else if (fileType === 'archive') {
          files = files.filter(file => !file.isFolder && (
            file.mimeType?.includes('zip') ||
            file.mimeType?.includes('compressed') ||
            file.mimeType?.includes('tar') ||
            file.mimeType?.includes('rar')
          ));
        }
      }
      
      // Apply date range filter
      if (dateRange && dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        if (dateRange === 'today') {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (dateRange === 'week') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (dateRange === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
          startDate = new Date(0); // Beginning of time
        }
        
        files = files.filter(file => {
          if (!file.createdAt) return false;
          const fileDate = new Date(file.createdAt);
          return fileDate >= startDate;
        });
      }
      
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  // File upload route
  app.post('/api/files/upload', isAuthenticated, upload.array('files'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const path = req.body.path || '/';
      const files = req.files as Express.Multer.File[];

      // Check if uploads are allowed
      const uploadAllowed = await checkUploadAllowed();
      if (!uploadAllowed) {
        return res.status(403).json({ message: "Upload deadline has passed" });
      }

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }

      const uploadedFiles = [];

      for (const file of files) {
        // Create S3 key: userId/path/filename
        const s3Key = `${userId}${path}${file.originalname}`;
        
        // Upload to S3
        await uploadToS3(s3Key, file.buffer, file.mimetype);
        
        // Save metadata to database
        const fileMetadata = await storage.createFile({
          userId,
          name: file.originalname,
          s3Key,
          path,
          size: file.size,
          mimeType: file.mimetype,
          isFolder: false,
        });
        
        uploadedFiles.push(fileMetadata);
      }

      res.json({ success: true, files: uploadedFiles });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  // Folder upload route
  app.post('/api/files/upload-folder', isAuthenticated, upload.array('files'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const basePath = req.body.path || '/';
      const files = req.files as Express.Multer.File[];
      
      // DEBUG: Log what we received
      console.log('[FOLDER-UPLOAD] req.body keys:', Object.keys(req.body));
      console.log('[FOLDER-UPLOAD] req.files length:', files?.length || 0);
      console.log('[FOLDER-UPLOAD] req.body:', JSON.stringify(req.body, null, 2));
      
      // Fix: FormData sends 'relativePaths[]' not 'relativePaths'
      const relativePaths = req.body['relativePaths[]'] || req.body.relativePaths;
      console.log('[FOLDER-UPLOAD] relativePaths:', relativePaths);

      // Check if uploads are allowed
      const uploadAllowed = await checkUploadAllowed();
      if (!uploadAllowed) {
        return res.status(403).json({ message: "Upload deadline has passed" });
      }

      if (!files || files.length === 0) {
        console.error('[FOLDER-UPLOAD] ERROR: No files received!');
        return res.status(400).json({ message: "No files provided" });
      }

      const uploadedFiles = [];
      const createdFolders = new Set<string>();

      // Parse relative paths array
      const paths = typeof relativePaths === 'string' ? [relativePaths] : relativePaths;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const relativePath = paths[i] || file.originalname;
        
        // Extract folder path from relative path
        const pathParts = relativePath.split('/');
        const filename = pathParts.pop()!;
        
        // Build folder structure
        let currentPath = basePath;
        for (const part of pathParts) {
          const folderPath = currentPath;
          const folderName = part;
          const fullPath = currentPath + folderName + '/';
          
          // Create folder metadata if not already created
          const folderKey = `${userId}${fullPath}`;
          if (!createdFolders.has(folderKey)) {
            try {
              await storage.createFile({
                userId,
                name: folderName,
                s3Key: folderKey,
                path: folderPath,
                size: 0,
                mimeType: null,
                isFolder: true,
              });
              createdFolders.add(folderKey);
            } catch (error) {
              // Folder might already exist, ignore error
            }
          }
          
          currentPath = fullPath;
        }
        
        // Upload file to S3
        const s3Key = `${userId}${currentPath}${filename}`;
        await uploadToS3(s3Key, file.buffer, file.mimetype);
        
        // Save file metadata
        const fileMetadata = await storage.createFile({
          userId,
          name: filename,
          s3Key,
          path: currentPath,
          size: file.size,
          mimeType: file.mimetype,
          isFolder: false,
        });
        
        uploadedFiles.push(fileMetadata);
      }

      res.json({ success: true, files: uploadedFiles });
    } catch (error) {
      console.error("Error uploading folder:", error);
      res.status(500).json({ message: "Failed to upload folder" });
    }
  });

  // Create folder route
  app.post('/api/files/folder', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { name, path } = createFolderSchema.parse(req.body);

      // Check if uploads are allowed
      const uploadAllowed = await checkUploadAllowed();
      if (!uploadAllowed) {
        return res.status(403).json({ message: "Upload deadline has passed" });
      }

      // Create folder metadata
      const s3Key = `${userId}${path}${name}/`;
      
      const folder = await storage.createFile({
        userId,
        name,
        s3Key,
        path,
        size: 0,
        mimeType: null,
        isFolder: true,
      });

      res.json(folder);
    } catch (error) {
      console.error("Error creating folder:", error);
      res.status(500).json({ message: "Failed to create folder" });
    }
  });

  // Download file route
  app.get('/api/files/download/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const fileId = req.params.id;

      const file = await storage.getFileById(fileId, userId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      if (file.isFolder) {
        return res.status(400).json({ message: "Cannot download a folder" });
      }

      // Download from S3
      const s3Stream = await downloadFromS3(file.s3Key);
      
      // Set headers
      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
      res.setHeader('Content-Length', file.size);

      // Stream the file
      if (s3Stream instanceof Readable) {
        s3Stream.pipe(res);
      } else {
        // Handle different response types
        const buffer = await streamToBuffer(s3Stream);
        res.send(buffer);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Delete file/folder route
  app.delete('/api/files/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const fileId = req.params.id;

      const file = await storage.getFileById(fileId, userId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      if (file.isFolder) {
        // Delete all files in the folder from S3 and database
        const folderPrefix = file.s3Key;
        await deleteFolder(folderPrefix);
        await storage.deleteFilesByPrefix(userId, file.path + file.name + '/');
      } else {
        // Delete single file from S3
        await deleteFromS3(file.s3Key);
      }

      // Delete metadata from database
      await storage.deleteFile(fileId, userId);

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Bulk delete route
  app.post('/api/files/bulk-delete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { fileIds } = req.body;
      
      if (!Array.isArray(fileIds) || fileIds.length === 0) {
        return res.status(400).json({ message: "Invalid file IDs" });
      }
      
      let deletedCount = 0;
      const errors: string[] = [];
      
      for (const fileId of fileIds) {
        try {
          const file = await storage.getFileById(fileId, userId);
          
          if (!file) {
            errors.push(`File ${fileId} not found`);
            continue;
          }
          
          if (file.isFolder) {
            const folderPrefix = file.s3Key;
            await deleteFolder(folderPrefix);
            await storage.deleteFilesByPrefix(userId, file.path + file.name + '/');
          } else {
            await deleteFromS3(file.s3Key);
          }
          
          await storage.deleteFile(fileId, userId);
          deletedCount++;
        } catch (error) {
          errors.push(`Failed to delete file ${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      res.json({ 
        message: `Deleted ${deletedCount} file(s)`,
        deletedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error in bulk delete:", error);
      res.status(500).json({ message: "Failed to delete files" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to convert stream to buffer
async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  
  if (stream.transformToByteArray) {
    const byteArray = await stream.transformToByteArray();
    return Buffer.from(byteArray);
  }

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}
