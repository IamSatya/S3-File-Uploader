import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { CountdownTimer } from '@/components/CountdownTimer';
import { WelcomeInstructions } from '@/components/WelcomeInstructions';
import { Breadcrumb } from '@/components/Breadcrumb';
import { FileCard } from '@/components/FileCard';
import { CreateFolderDialog } from '@/components/CreateFolderDialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { FileUploadZone } from '@/components/FileUploadZone';
import { FileSearchBar } from '@/components/FileSearchBar';
import { FolderPlus, Upload, LogOut, FolderOpen, Loader2 } from 'lucide-react';
import type { FileMetadata, TimerConfig } from '@shared/schema';

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPath, setCurrentPath] = useState('/');
  const [showInstructions, setShowInstructions] = useState(true);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileMetadata | null>(null);
  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  const { data: files = [], isLoading: filesLoading, error } = useQuery<FileMetadata[]>({
    queryKey: ['/api/files', currentPath, search, fileType, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({ path: currentPath });
      if (search) params.append('search', search);
      if (fileType && fileType !== 'all') params.append('fileType', fileType);
      if (dateRange && dateRange !== 'all') params.append('dateRange', dateRange);
      
      const response = await fetch(`/api/files?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch files');
      }
      return response.json();
    },
  });

  // Handle query errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const { data: timerConfig } = useQuery<TimerConfig>({
    queryKey: ['/api/timer-config'],
  });

  const uploadDisabled = timerConfig ? new Date(timerConfig.deadline) <= new Date() : false;

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      await apiRequest('POST', '/api/files/folder', { name, path: currentPath });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'], refetchType: 'all' });
      setShowCreateFolder(false);
      toast({
        title: "Success",
        description: "Folder created successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      formData.append('path', currentPath);
      
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'], refetchType: 'all' });
      toast({
        title: "Success",
        description: "Files uploaded successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to upload files",
        variant: "destructive",
      });
    },
  });

  const uploadFolderMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      formData.append('path', currentPath);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        formData.append('files', file);
        formData.append('relativePaths', (file as any).webkitRelativePath || file.name);
      }

      const response = await fetch('/api/files/upload-folder', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'], refetchType: 'all' });
      toast({
        title: "Success",
        description: "Folder uploaded successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to upload folder",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await apiRequest('DELETE', `/api/files/${fileId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'], refetchType: 'all' });
      setFileToDelete(null);
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const handleDownload = async (file: FileMetadata) => {
    try {
      const response = await fetch(`/api/files/download/${file.id}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFolderMutation.mutate(files);
    }
    e.target.value = '';
  };

  const getUserInitials = () => {
    if (!user) return '?';
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return '?';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
                <FolderOpen className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">HackFiles</h1>
            </div>

            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="button-user-menu">
                    <Avatar>
                      <AvatarImage src={user?.profileImageUrl || undefined} />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm">
                    <p className="font-semibold">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/api/logout" data-testid="button-logout">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <CountdownTimer />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {showInstructions && (
          <div className="mb-6">
            <WelcomeInstructions onClose={() => setShowInstructions(false)} />
          </div>
        )}

        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <Breadcrumb path={currentPath} onNavigate={setCurrentPath} />
              
              <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setShowCreateFolder(true)}
                variant="outline"
                disabled={uploadDisabled}
                data-testid="button-create-folder"
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                New Folder
              </Button>
              
              <Button
                asChild
                disabled={uploadDisabled}
                data-testid="button-upload-files"
              >
                <label className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                  <input
                    type="file"
                    multiple
                    onChange={(e) => e.target.files && uploadMutation.mutate(e.target.files)}
                    className="sr-only"
                    disabled={uploadDisabled}
                  />
                </label>
              </Button>

              <Button
                asChild
                disabled={uploadDisabled}
                data-testid="button-upload-folder"
              >
                <label className="cursor-pointer">
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Upload Folder
                  <input
                    type="file"
                    /* @ts-ignore - webkitdirectory is not in types but is widely supported */
                    webkitdirectory=""
                    directory=""
                    onChange={handleFolderSelect}
                    className="sr-only"
                    disabled={uploadDisabled}
                  />
                </label>
              </Button>
            </div>
            </div>
            
            <FileSearchBar
              search={search}
              onSearchChange={setSearch}
              fileType={fileType}
              onFileTypeChange={setFileType}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>

          {!uploadDisabled && (
            <FileUploadZone
              onUpload={(files) => uploadMutation.mutate(files)}
              isUploading={uploadMutation.isPending}
              disabled={uploadDisabled}
            />
          )}

          {filesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No files yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {uploadDisabled ? 'Upload deadline has passed' : 'Upload your first file or folder to get started'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onDownload={handleDownload}
                  onDelete={setFileToDelete}
                  onNavigate={(file) => setCurrentPath(file.path + file.name + '/')}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateFolderDialog
        open={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onConfirm={(name) => createFolderMutation.mutate(name)}
        isCreating={createFolderMutation.isPending}
      />

      <DeleteConfirmDialog
        open={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={() => fileToDelete && deleteMutation.mutate(fileToDelete.id)}
        file={fileToDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
