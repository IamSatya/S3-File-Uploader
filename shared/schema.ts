// Referencing javascript_log_in_with_replit and javascript_database blueprints
import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// File metadata table for tracking S3 files
export const fileMetadata = pgTable("file_metadata", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  s3Key: text("s3_key").notNull(), // Full S3 key including path
  path: text("path").notNull().default("/"), // Folder path (e.g., "/folder1/subfolder/")
  size: integer("size").notNull(), // File size in bytes
  mimeType: text("mime_type"),
  isFolder: boolean("is_folder").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_file_user_id").on(table.userId),
  index("idx_file_path").on(table.path),
  index("idx_file_user_path").on(table.userId, table.path),
]);

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  files: many(fileMetadata),
}));

export const fileMetadataRelations = relations(fileMetadata, ({ one }) => ({
  user: one(users, {
    fields: [fileMetadata.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertFileMetadataSchema = createInsertSchema(fileMetadata).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(255),
  path: z.string(),
});

// Select types
export type FileMetadata = typeof fileMetadata.$inferSelect;
export type InsertFileMetadata = z.infer<typeof insertFileMetadataSchema>;
export type CreateFolder = z.infer<typeof createFolderSchema>;

// Timer configuration
export const timerConfig = pgTable("timer_config", {
  id: varchar("id").primaryKey().default("default"),
  deadline: timestamp("deadline").notNull(), // Hackathon deadline
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type TimerConfig = typeof timerConfig.$inferSelect;
export type UpsertTimerConfig = typeof timerConfig.$inferInsert;
