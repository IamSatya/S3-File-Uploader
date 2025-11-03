# Admin Features - Password Reset & Delete User

## Overview
This document provides code implementation for admin password reset and delete user features.

## Features Implemented

### 1. Password Reset by Admin
**Location**: Admin Panel → User Management Table

**How it works**:
- Admin clicks "Reset Password" button for any user
- Dialog opens with password input field
- Minimum 8 characters validation
- Password is hashed using bcrypt before storage
- User can login immediately with new password

**API Endpoint**: `POST /api/admin/users/:userId/reset-password`
**Request Body**: `{ password: string }`
**Security**: Admin-only access, bcrypt hashing with salt rounds=10

### 2. Delete User by Admin
**Location**: Admin Panel → User Management Table

**How it works**:
- Admin clicks red "Delete" button for any user
- Confirmation dialog appears with warning
- On confirmation, user and all files are deleted
- Admin cannot delete their own account

**API Endpoint**: `DELETE /api/admin/users/:userId`
**Security**: Admin-only access, prevents self-deletion
**Cascade**: All user files are deleted via database constraint

## Code Changes

### Backend Changes

#### 1. server/storage.ts
```typescript
// Added to IStorage interface
deleteUser(userId: string): Promise<void>;

// Added to DatabaseStorage class
async deleteUser(userId: string): Promise<void> {
  // Files cascade deleted via DB constraint
  await db.delete(users).where(eq(users.id, userId));
}
```

#### 2. server/routes.ts
```typescript
// Delete user endpoint (admin only)
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
```

### Frontend Changes

#### client/src/pages/Admin.tsx

**Added State**:
```typescript
const [userToDelete, setUserToDelete] = useState<Omit<User, 'password'> | null>(null);
```

**Added Mutation**:
```typescript
const deleteUserMutation = useMutation({
  mutationFn: async (userId: string) => {
    return await apiRequest('DELETE', `/api/admin/users/${userId}`);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    setUserToDelete(null);
    toast({ title: "Success", description: "User deleted successfully" });
  },
  onError: (error: any) => {
    toast({
      title: "Error",
      description: error.message || "Failed to delete user",
      variant: "destructive",
    });
  },
});
```

**Added UI**:
- Delete button in user table (red destructive variant)
- Confirmation dialog with warning message
- Disabled for current admin user

## Usage

### Reset Password
1. Login as admin (admin@ti.com / Admin@123456)
2. Go to Admin panel
3. Find user in User Management table
4. Click "Reset Password" button
5. Enter new password (min 8 chars)
6. Click "Reset Password"
7. User can now login with new password

### Delete User
1. Login as admin
2. Go to Admin panel
3. Find user in User Management table
4. Click red "Delete" button
5. Confirm deletion in dialog
6. User and all files are permanently deleted

## Security Notes

✅ **Password Reset**:
- Admin-only access (isAuthenticated + requireAdmin middleware)
- bcrypt hashing before storage (salt rounds = 10)
- Minimum 8 character validation
- No plain text passwords stored

✅ **Delete User**:
- Admin-only access
- Cannot delete own account
- Confirmation dialog prevents accidents
- Database cascade deletes all user files
- Invalidates cache after deletion

## Database Schema Impact

No database schema changes required. Uses existing:
- `users.password` field for password reset
- Cascade delete constraint on `file_metadata.user_id` foreign key

## Testing

Test the features:
1. Create a test user via Admin panel
2. Reset their password and login as that user
3. Delete the test user (as admin)
4. Verify user cannot login
5. Verify all files are deleted

## PostgreSQL Direct Queries

If you need to reset password via SQL:

```sql
-- Generate hash (using Node.js)
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('NewPassword123', 10).then(hash => console.log(hash));"

-- Update user password
UPDATE users 
SET password = '$2b$10$PASTE_BCRYPT_HASH_HERE'
WHERE email = 'user@example.com';

-- Delete user (and cascade delete files)
DELETE FROM users WHERE email = 'user@example.com';
```

## Notes

- All user files stored in S3 should be manually cleaned up if needed
- The backend only deletes database records
- Consider adding S3 cleanup in production
- Admin credentials: admin@ti.com / Admin@123456
