// Referencing javascript_log_in_with_replit blueprint
import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { uploadToS3, downloadFromS3, deleteFromS3, deleteFolder } from "./s3Client";
import { createFolderSchema } from "@shared/schema";
import { Readable } from "stream";

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
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

  app.post('/api/timer-config', isAuthenticated, async (req: any, res) => {
    try {
      const { deadline, isActive } = req.body;
      
      const config = await storage.upsertTimerConfig({
        id: "default",
        deadline: new Date(deadline),
        isActive: isActive ?? true,
      });
      
      res.json(config);
    } catch (error) {
      console.error("Error updating timer config:", error);
      res.status(500).json({ message: "Failed to update timer config" });
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

  // File listing route
  app.get('/api/files', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const path = (req.query.path as string) || '/';
      
      const files = await storage.getFilesByPath(userId, path);
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  // File upload route
  app.post('/api/files/upload', isAuthenticated, upload.array('files'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const basePath = req.body.path || '/';
      const files = req.files as Express.Multer.File[];
      const relativePaths = req.body.relativePaths;

      // Check if uploads are allowed
      const uploadAllowed = await checkUploadAllowed();
      if (!uploadAllowed) {
        return res.status(403).json({ message: "Upload deadline has passed" });
      }

      if (!files || files.length === 0) {
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
