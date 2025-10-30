import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, File, ChevronRight, Home, FolderOpen, Settings, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FileWithOwner {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  size: number | null;
  mimeType: string | null;
  userId: string;
  ownerEmail: string;
  ownerName: string;
  createdAt: string;
}

export default function S3Browser() {
  const [currentPath, setCurrentPath] = useState("/");
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access the S3 browser",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [authLoading, user, navigate, toast]);

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

  // Handle API errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load S3 content. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const formatFileSize = (bytes: number | null) => {
    if (bytes === null) return "—";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleFolderClick = (folder: FileWithOwner) => {
    setCurrentPath(folder.path + folder.name + "/");
  };

  const handleBreadcrumbClick = (pathSegment: string, index: number) => {
    if (index === -1) {
      setCurrentPath("/");
    } else {
      const pathParts = currentPath.split("/").filter(Boolean);
      const newPath = "/" + pathParts.slice(0, index + 1).join("/") + "/";
      setCurrentPath(newPath);
    }
  };

  const pathSegments = currentPath.split("/").filter(Boolean);

  const folders = files.filter((f) => f.isFolder);
  const regularFiles = files.filter((f) => !f.isFolder);

  // Show loading while checking auth
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading S3 browser...</div>
        </div>
      </div>
    );
  }

  // Don't render if not admin (will redirect via useEffect)
  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-s3-browser-title">S3 Bucket Explorer</h1>
              <p className="text-sm text-muted-foreground">
                Browse all files and folders uploaded by users
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/admin')} data-testid="button-admin">
                <Settings className="mr-2 h-4 w-4" />
                Admin
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} data-testid="button-dashboard">
                <FolderOpen className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Current Path
            </CardTitle>
            <CardDescription>
              <div className="flex items-center gap-1 flex-wrap mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBreadcrumbClick("", -1)}
                  className="h-7 px-2"
                  data-testid="breadcrumb-root"
                >
                  <Home className="h-4 w-4" />
                </Button>
                {pathSegments.map((segment, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBreadcrumbClick(segment, index)}
                      className="h-7 px-2"
                      data-testid={`breadcrumb-${segment}`}
                    >
                      {segment}
                    </Button>
                  </div>
                ))}
              </div>
            </CardDescription>
          </CardHeader>

          <CardContent>
            {files.length === 0 && !isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No files or folders in this location</p>
              </div>
            ) : (
              <div className="space-y-6">
                {folders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Folders</h3>
                    <div className="grid gap-2">
                      {folders.map((folder) => (
                        <button
                          key={folder.id}
                          onClick={() => handleFolderClick(folder)}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                          data-testid={`folder-${folder.name}`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Folder className="h-5 w-5 text-blue-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{folder.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Owner: {folder.ownerName} ({folder.ownerEmail})
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {regularFiles.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Files</h3>
                    <div className="grid gap-2">
                      {regularFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                          data-testid={`file-${file.name}`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <File className="h-5 w-5 text-gray-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{file.name}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>Owner: {file.ownerName} ({file.ownerEmail})</span>
                                <span>•</span>
                                <span>{formatFileSize(file.size)}</span>
                                {file.mimeType && (
                                  <>
                                    <span>•</span>
                                    <span>{file.mimeType}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
