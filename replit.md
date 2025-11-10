# HackTIvate - Hackathon File Manager

## Overview

HackTIvate is a secure, time-limited file management platform designed specifically for HackTIvate 2025 participants. It provides file upload, organization, and sharing capabilities with a countdown timer that enforces access deadlines. The application features a modern, clean interface with a beautiful HackTIvate 2025 branded background across all pages, built with a focus on productivity and clarity.

The platform allows users to authenticate via Replit Auth, upload files and folders to AWS S3, organize content in a nested folder structure, and manage files with a deadline-based access control system.

## Recent Changes

**November 10, 2025**: Security improvements and folder upload fix
- **Security**: Removed public self-registration - all users must be created by administrators
- Landing page now shows login-only form with message to contact admin for account creation
- Admin dashboard retains full user creation functionality (`/api/admin/create-user`)
- **Folder Upload Fix**: Preserves FileList when input is cleared using DataTransfer API
  - Root cause: `e.target.value = ''` was clearing the FileList before mutation could access files
  - Solution: Convert FileList to Array, create new DataTransfer object to preserve files
- Backend uses `relativePaths[]` array syntax for FormData (required by multer)
- Build process requires `--tree-shaking=false` to prevent esbuild from stripping registerRoutes
- UI improvements: Added card container to navigation area for better visibility against background

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tool**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR and optimized production builds
- Wouter for lightweight client-side routing

**UI Component Library**
- shadcn/ui (New York style) with Radix UI primitives for accessible, unstyled components
- Tailwind CSS for utility-first styling with custom design tokens
- Inter font for primary text and JetBrains Mono for monospace content (file sizes, timestamps, timer display)
- `HacktivateBackgroundLayout` component - Shared layout wrapper providing consistent background image, dark overlay, and z-index stacking across all pages

**State Management**
- TanStack Query (React Query) for server state management, caching, and data synchronization
- Local component state with React hooks for UI-specific state

**Design System**
- HackTIvate 2025 branded background image on all pages with dark overlay
- Frosted glass effect (backdrop-blur-sm bg-background/80) on headers
- Linear + Notion-inspired productivity interface
- Neutral color palette as base color scheme
- Consistent spacing system using Tailwind units (2, 4, 6, 8, 12)
- Responsive grid layouts for file displays (1-4 columns based on breakpoint)
- Custom hover and active elevation states for interactive elements

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for the REST API server
- Session-based authentication using express-session with PostgreSQL session store

**API Design**
- RESTful endpoints for file operations, user management, and timer configuration
- Multer middleware for multipart form-data handling during file uploads
- Authentication middleware protecting all file and user routes

**File Storage Strategy**
- AWS S3 for object storage with presigned URLs for secure file downloads
- File metadata stored in PostgreSQL, actual file content in S3
- S3 key structure: `{userId}/{path}/{filename}` for logical organization
- Folder representation: metadata entries with `isFolder: true` flag

### Database Architecture

**ORM & Schema Management**
- Drizzle ORM for type-safe database queries and schema definitions
- Neon serverless PostgreSQL with WebSocket support for connection pooling
- Schema-first approach with Zod integration for runtime validation

**Data Models**
- **Users Table**: Stores user profiles from Replit Auth (id, email, name, profile image)
- **Sessions Table**: PostgreSQL-backed session storage for authentication (required for Replit Auth)
- **File Metadata Table**: Tracks files and folders (id, userId, name, s3Key, path, size, mimeType, isFolder)
- **Timer Config Table**: Global hackathon deadline configuration (id, deadline, isActive)

**Database Relations**
- User → File Metadata (one-to-many with cascade delete)
- Path-based folder hierarchy using string paths (e.g., "/folder1/subfolder/")

### Authentication & Authorization

**Replit Auth Integration**
- OpenID Connect (OIDC) discovery flow with Passport.js strategy
- Automatic user profile creation/update on first login
- Session management with secure HTTP-only cookies (7-day TTL)
- Mandatory session and user tables for Replit Auth compatibility

**Access Control**
- **Admin-only user creation**: Public registration disabled, all users must be created by administrators
- User-scoped file access: all file operations filtered by authenticated userId
- Time-based upload restrictions: uploads disabled when timer deadline expires
- No file sharing between users (strict user isolation)

### External Dependencies

**Cloud Services**
- **AWS S3**: Primary object storage for uploaded files
  - Requires: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET_NAME
  - Operations: PutObject, GetObject, DeleteObject, ListObjectsV2
  - Presigned URLs with configurable expiration for secure downloads

- **Neon PostgreSQL**: Serverless PostgreSQL database
  - Requires: DATABASE_URL environment variable
  - WebSocket connections for serverless compatibility
  - Connection pooling via @neondatabase/serverless

- **Replit Auth**: OAuth/OIDC authentication provider
  - Requires: REPL_ID, ISSUER_URL, SESSION_SECRET
  - Handles user identity and profile management

**Third-Party Libraries**
- **React Query**: Async state management with automatic refetching and caching
- **Radix UI**: Headless component primitives for accessibility
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form + Zod**: Form validation with type-safe schemas

### Development & Deployment

**Development Workflow**
- Hot module replacement via Vite for rapid iteration
- TypeScript strict mode for compile-time type safety
- Path aliases (@/, @shared/, @assets/) for clean imports
- Replit-specific plugins: runtime error overlay, cartographer, dev banner

**Production Build**
- Client: Vite builds to dist/public with asset optimization
- Server: esbuild bundles server code to dist/index.js with external packages
- Database migrations: Drizzle Kit pushes schema changes to PostgreSQL

**Environment Configuration**
- Required variables: DATABASE_URL, AWS credentials, Replit Auth tokens, SESSION_SECRET
- Deployment target: Node.js server with PostgreSQL and S3 connectivity