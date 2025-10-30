import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, File, ChevronRight, Home, FolderOpen, Settings } from "lucide-react";
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

  const { data: files = [], isLoading } = useQuery<FileWithOwner[]>({
    queryKey: ["/api/admin/s3-browse", currentPath],
    queryFn: async () => {
      const params = new URLSearchParams({ path: currentPath });
      const response = await fetch(`/api/admin/s3-browse?${params}`);
      if (!response.ok) throw new Error("Failed to fetch S3 content");
      return response.json();
    },
  });

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

      <main className="container mx-auto p-6 space-y-6">

      {/* Breadcrumb Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBreadcrumbClick("", -1)}
              data-testid="breadcrumb-home"
            >
              <Home className="h-4 w-4" />
            </Button>
            {pathSegments.map((segment, index) => (
              <div key={index} className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBreadcrumbClick(segment, index)}
                  data-testid={`breadcrumb-${segment}`}
                >
                  {segment}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* File/Folder List */}
      <Card>
        <CardHeader>
          <CardTitle>Contents</CardTitle>
          <CardDescription>
            {files.length === 0
              ? "No files or folders in this location"
              : `${folders.length} folder${folders.length !== 1 ? "s" : ""}, ${regularFiles.length} file${regularFiles.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              This folder is empty
            </div>
          ) : (
            <div className="space-y-1">
              {/* Folders First */}
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleFolderClick(folder)}
                  className="w-full flex items-center gap-4 p-3 rounded-md hover-elevate active-elevate-2 text-left"
                  data-testid={`folder-${folder.name}`}
                >
                  <Folder className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{folder.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Folder • Owner: {folder.ownerName} ({folder.ownerEmail})
                    </div>
                  </div>
                </button>
              ))}

              {/* Files */}
              {regularFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-3 rounded-md border"
                  data-testid={`file-${file.name}`}
                >
                  <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{file.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)} •{" "}
                      {file.mimeType || "Unknown type"} •{" "}
                      Uploaded {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">Owner:</span> {file.ownerName} ({file.ownerEmail})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </main>
    </div>
  );
}
