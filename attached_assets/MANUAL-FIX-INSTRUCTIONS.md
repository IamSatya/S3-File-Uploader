# URGENT FIX: S3 Browser API Call Issue

## The Problem

The S3 Browser is calling the API incorrectly. React Query is joining the URL like:
- ❌ `/api/admin/s3-browse/` (wrong)
- ✅ `/api/admin/s3-browse?path=/` (correct)

## Quick Fix (2 minutes)

### On Your VPS:

```bash
cd /var/www/hackfiles
nano client/src/pages/S3Browser.tsx
```

### Find these lines (around line 42-45):

```typescript
  const { data: files = [], isLoading, error } = useQuery<FileWithOwner[]>({
    queryKey: ["/api/admin/s3-browse", currentPath],
    enabled: !!user?.isAdmin,
  });
```

### Replace with:

```typescript
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
```

### Save and rebuild:

```bash
# Save in nano: Ctrl+X, then Y, then Enter

# Rebuild
npm run build

# Restart
pm2 restart index

# Test
pm2 logs index --lines 10
```

## Test It Works

1. Visit: http://drive.technoidentity.org
2. Login as admin: `admin@ti.com` / `Admin@123456`
3. Click Profile Icon → "S3 Browser"
4. ✅ You should now see your files!

## What Changed?

Added a `queryFn` that properly passes the `path` parameter as a query string instead of joining it with the URL.

Before: `/api/admin/s3-browse/folder/subfolder/`  
After: `/api/admin/s3-browse?path=/folder/subfolder/`

---

**Need help?** Check the logs: `pm2 logs index`
