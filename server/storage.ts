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
  // User operations (IMPORTANT - mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT - mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
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
}

export const storage = new DatabaseStorage();
