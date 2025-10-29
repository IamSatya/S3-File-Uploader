// Referencing javascript_database and javascript_log_in_with_replit blueprints
import {
  users,
  fileMetadata,
  timerConfig,
  type User,
  type UpsertUser,
  type FileMetadata,
  type InsertFileMetadata,
  type TimerConfig,
  type UpsertTimerConfig,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // File operations
  createFile(file: InsertFileMetadata): Promise<FileMetadata>;
  getFilesByPath(userId: string, path: string): Promise<FileMetadata[]>;
  getFileById(id: string, userId: string): Promise<FileMetadata | undefined>;
  deleteFile(id: string, userId: string): Promise<void>;
  deleteFilesByPrefix(userId: string, pathPrefix: string): Promise<void>;
  
  // Timer operations
  getTimerConfig(): Promise<TimerConfig | undefined>;
  upsertTimerConfig(config: UpsertTimerConfig): Promise<TimerConfig>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getUserStorageStats(): Promise<{ userId: string; email: string | null; firstName: string | null; lastName: string | null; totalFiles: number; totalSize: number }[]>;
  getTotalStats(): Promise<{ totalUsers: number; totalFiles: number; totalSize: number }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // File operations
  async createFile(file: InsertFileMetadata): Promise<FileMetadata> {
    const [created] = await db
      .insert(fileMetadata)
      .values(file)
      .returning();
    return created;
  }

  async getFilesByPath(userId: string, path: string): Promise<FileMetadata[]> {
    return await db
      .select()
      .from(fileMetadata)
      .where(and(eq(fileMetadata.userId, userId), eq(fileMetadata.path, path)))
      .orderBy(fileMetadata.isFolder, fileMetadata.name);
  }

  async getFileById(id: string, userId: string): Promise<FileMetadata | undefined> {
    const [file] = await db
      .select()
      .from(fileMetadata)
      .where(and(eq(fileMetadata.id, id), eq(fileMetadata.userId, userId)));
    return file;
  }

  async deleteFile(id: string, userId: string): Promise<void> {
    await db
      .delete(fileMetadata)
      .where(and(eq(fileMetadata.id, id), eq(fileMetadata.userId, userId)));
  }

  async deleteFilesByPrefix(userId: string, pathPrefix: string): Promise<void> {
    // This is a simple implementation - for production, you'd want a more efficient query
    const files = await db
      .select()
      .from(fileMetadata)
      .where(eq(fileMetadata.userId, userId));
    
    for (const file of files) {
      if (file.path.startsWith(pathPrefix) || file.s3Key.startsWith(pathPrefix)) {
        await db
          .delete(fileMetadata)
          .where(eq(fileMetadata.id, file.id));
      }
    }
  }

  // Timer operations
  async getTimerConfig(): Promise<TimerConfig | undefined> {
    const [config] = await db
      .select()
      .from(timerConfig)
      .where(eq(timerConfig.id, "default"));
    return config;
  }

  async upsertTimerConfig(config: UpsertTimerConfig): Promise<TimerConfig> {
    const [updated] = await db
      .insert(timerConfig)
      .values(config)
      .onConflictDoUpdate({
        target: timerConfig.id,
        set: {
          ...config,
          updatedAt: new Date(),
        },
      })
      .returning();
    return updated;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserStorageStats() {
    const allUsers = await db.select().from(users);
    
    const stats = await Promise.all(
      allUsers.map(async (user) => {
        const files = await db
          .select()
          .from(fileMetadata)
          .where(and(eq(fileMetadata.userId, user.id), eq(fileMetadata.isFolder, false)));
        
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        
        return {
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          totalFiles: files.length,
          totalSize,
        };
      })
    );
    
    return stats;
  }

  async getTotalStats() {
    const allUsers = await db.select().from(users);
    const allFiles = await db
      .select()
      .from(fileMetadata)
      .where(eq(fileMetadata.isFolder, false));
    
    const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0);
    
    return {
      totalUsers: allUsers.length,
      totalFiles: allFiles.length,
      totalSize,
    };
  }
}

export const storage = new DatabaseStorage();
