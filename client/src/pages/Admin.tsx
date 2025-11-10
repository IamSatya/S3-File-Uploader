import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, HardDrive, Files, Clock, UserPlus, FolderOpen, ShieldCheck, Database, Key, Trash2 } from "lucide-react";
import { registerSchema, resetPasswordSchema, type RegisterInput, type TimerConfig, type User, type FileMetadata, type ResetPasswordInput } from "@shared/schema";
import { HacktivateBackgroundLayout } from "@/components/HacktivateBackgroundLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface UserStats {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  totalFiles: number;
  totalSize: number;
}

interface TotalStats {
  totalUsers: number;
  totalFiles: number;
  totalSize: number;
}

interface AdminStats {
  userStats: UserStats[];
  totalStats: TotalStats;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [deadline, setDeadline] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<Omit<User, 'password'> | null>(null);
  const [userToDelete, setUserToDelete] = useState<Omit<User, 'password'> | null>(null);

  const createUserForm = useForm<RegisterInput & { isAdmin: boolean }>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      isAdmin: false,
    },
  });

  const resetPasswordForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
    },
  });

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access the admin dashboard",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [authLoading, user, navigate, toast]);

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    enabled: !!user?.isAdmin,
  });

  const { data: timerConfig, isLoading: timerLoading, error: timerError } = useQuery<TimerConfig>({
    queryKey: ['/api/admin/timer'],
    enabled: !!user?.isAdmin,
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery<Omit<User, 'password'>[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!user?.isAdmin,
  });

  const { data: allFiles, isLoading: filesLoading } = useQuery<FileMetadata[]>({
    queryKey: ['/api/admin/files'],
    enabled: !!user?.isAdmin,
  });

  // Handle API errors (403, 401, etc.)
  useEffect(() => {
    if (statsError || timerError) {
      toast({
        title: "Access Denied",
        description: "Failed to load admin data. You may not have admin privileges.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [statsError, timerError, navigate, toast]);

  useEffect(() => {
    if (timerConfig) {
      const date = new Date(timerConfig.deadline);
      setDeadline(date.toISOString().slice(0, 16));
      setIsActive(timerConfig.isActive);
    }
  }, [timerConfig]);

  const updateTimerMutation = useMutation({
    mutationFn: async (data: { deadline: string; isActive: boolean }) => {
      return await apiRequest('POST', '/api/admin/timer', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/timer'] });
      queryClient.invalidateQueries({ queryKey: ['/api/timer-config'] });
      toast({
        title: "Success",
        description: "Timer configuration updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update timer configuration",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: RegisterInput & { isAdmin: boolean }) => {
      return await apiRequest('POST', '/api/admin/create-user', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      createUserForm.reset();
      setShowCreateUser(false);
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const toggleUserMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      return await apiRequest('PATCH', `/api/admin/users/${userId}/toggle-active`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      return await apiRequest('POST', `/api/admin/users/${userId}/reset-password`, { password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setUserToResetPassword(null);
      resetPasswordForm.reset();
      toast({
        title: "Success",
        description: "Password reset successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('DELETE', `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setUserToDelete(null);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleUpdateTimer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deadline) {
      toast({
        title: "Error",
        description: "Please set a deadline",
        variant: "destructive",
      });
      return;
    }
    updateTimerMutation.mutate({ deadline, isActive });
  };

  const handleCreateUser = (data: RegisterInput) => {
    const isAdmin = (createUserForm.getValues() as any).isAdmin === true;
    createUserMutation.mutate({ ...data, isAdmin });
  };

  const handleResetPassword = (data: ResetPasswordInput) => {
    if (!userToResetPassword) return;
    resetPasswordMutation.mutate({
      userId: userToResetPassword.id,
      password: data.password,
    });
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    deleteUserMutation.mutate(userToDelete.id);
  };

  // Show loading while checking auth or fetching data
  if (authLoading || statsLoading || timerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  // Don't render if not admin (will redirect via useEffect)
  if (!user?.isAdmin) {
    return null;
  }

  return (
    <HacktivateBackgroundLayout>
      <header className="border-b backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold" data-testid="text-admin-title">Admin Dashboard</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/s3-browser')} data-testid="button-s3-browser">
                <Database className="mr-2 h-4 w-4" />
                S3 Browser
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} data-testid="button-back-to-dashboard">
                <FolderOpen className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-users">
                  {stats?.totalStats.totalUsers || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Files</CardTitle>
                <Files className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-files">
                  {stats?.totalStats.totalFiles || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-storage">
                  {formatBytes(stats?.totalStats.totalSize || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timer Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timer Configuration
              </CardTitle>
              <CardDescription>
                Manage the hackathon deadline and upload restrictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateTimer} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    data-testid="input-deadline"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    data-testid="switch-is-active"
                  />
                  <Label htmlFor="isActive">Timer Active</Label>
                </div>

                <Button
                  type="submit"
                  disabled={updateTimerMutation.isPending}
                  data-testid="button-update-timer"
                >
                  {updateTimerMutation.isPending ? 'Updating...' : 'Update Timer'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Create User */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Create New User
                  </CardTitle>
                  <CardDescription>
                    Manually create user accounts with email and password
                  </CardDescription>
                </div>
                <Button
                  variant={showCreateUser ? "outline" : "default"}
                  onClick={() => setShowCreateUser(!showCreateUser)}
                  data-testid="button-toggle-create-user"
                >
                  {showCreateUser ? 'Cancel' : 'Create User'}
                </Button>
              </div>
            </CardHeader>
            {showCreateUser && (
              <CardContent>
                <form onSubmit={createUserForm.handleSubmit(handleCreateUser)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="create-firstName">First Name</Label>
                      <Input
                        id="create-firstName"
                        {...createUserForm.register('firstName')}
                        data-testid="input-create-firstName"
                      />
                      {createUserForm.formState.errors.firstName && (
                        <p className="text-sm text-destructive">{createUserForm.formState.errors.firstName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="create-lastName">Last Name</Label>
                      <Input
                        id="create-lastName"
                        {...createUserForm.register('lastName')}
                        data-testid="input-create-lastName"
                      />
                      {createUserForm.formState.errors.lastName && (
                        <p className="text-sm text-destructive">{createUserForm.formState.errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-email">Email</Label>
                    <Input
                      id="create-email"
                      type="email"
                      {...createUserForm.register('email')}
                      data-testid="input-create-email"
                    />
                    {createUserForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{createUserForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-password">Password</Label>
                    <Input
                      id="create-password"
                      type="password"
                      {...createUserForm.register('password')}
                      data-testid="input-create-password"
                    />
                    {createUserForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{createUserForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="create-isAdmin"
                      checked={createUserForm.watch('isAdmin' as any)}
                      onCheckedChange={(checked) => createUserForm.setValue('isAdmin' as any, checked)}
                      data-testid="switch-create-isAdmin"
                    />
                    <Label htmlFor="create-isAdmin">Admin User</Label>
                  </div>

                  <Button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    data-testid="button-submit-create-user"
                  >
                    {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                  </Button>
                </form>
              </CardContent>
            )}
          </Card>

          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts and login access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-center p-2">Role</th>
                      <th className="text-center p-2">Status</th>
                      <th className="text-center p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                          Loading users...
                        </td>
                      </tr>
                    ) : allUsers && allUsers.length > 0 ? (
                      allUsers.map((usr) => (
                        <tr
                          key={usr.id}
                          className="border-b hover-elevate"
                          data-testid={`row-user-${usr.id}`}
                        >
                          <td className="p-2">
                            {usr.firstName && usr.lastName
                              ? `${usr.firstName} ${usr.lastName}`
                              : 'Unknown'}
                          </td>
                          <td className="p-2 text-muted-foreground">{usr.email}</td>
                          <td className="p-2 text-center">
                            {usr.isAdmin ? (
                              <Badge variant="default" data-testid={`badge-admin-${usr.id}`}>Admin</Badge>
                            ) : (
                              <Badge variant="secondary" data-testid={`badge-user-${usr.id}`}>User</Badge>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            {usr.isActive ? (
                              <Badge variant="default" className="bg-green-600 hover:bg-green-700" data-testid={`badge-active-${usr.id}`}>
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="destructive" data-testid={`badge-inactive-${usr.id}`}>
                                Disabled
                              </Badge>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleUserMutation.mutate({ userId: usr.id, isActive: !usr.isActive })}
                                disabled={toggleUserMutation.isPending || usr.id === user?.id}
                                data-testid={`button-toggle-${usr.id}`}
                              >
                                {usr.isActive ? 'Disable' : 'Enable'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setUserToResetPassword(usr);
                                  resetPasswordForm.reset();
                                }}
                                disabled={resetPasswordMutation.isPending}
                                data-testid={`button-reset-password-${usr.id}`}
                              >
                                <Key className="mr-2 h-4 w-4" />
                                Reset Password
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setUserToDelete(usr)}
                                disabled={deleteUserMutation.isPending || usr.id === user?.id}
                                data-testid={`button-delete-${usr.id}`}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* All Files View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                All Files (S3 Content)
              </CardTitle>
              <CardDescription>
                View all files uploaded by all users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">File Name</th>
                      <th className="text-left p-2">S3 Path</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-right p-2">Size</th>
                      <th className="text-left p-2">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filesLoading ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                          Loading files...
                        </td>
                      </tr>
                    ) : allFiles && allFiles.length > 0 ? (
                      allFiles
                        .filter(file => !file.isFolder)
                        .map((file) => (
                          <tr
                            key={file.id}
                            className="border-b hover-elevate"
                            data-testid={`row-file-${file.id}`}
                          >
                            <td className="p-2 font-medium">{file.name}</td>
                            <td className="p-2 text-muted-foreground font-mono text-sm">
                              {file.s3Key}
                            </td>
                            <td className="p-2 text-muted-foreground text-sm">
                              {file.isFolder ? 'Folder' : (file.mimeType || 'Unknown')}
                            </td>
                            <td className="p-2 text-right">{formatBytes(file.size)}</td>
                            <td className="p-2 text-muted-foreground text-sm">
                              {file.createdAt ? new Date(file.createdAt).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                          No files found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* User Storage Stats */}
          <Card>
            <CardHeader>
              <CardTitle>User Storage Statistics</CardTitle>
              <CardDescription>
                Storage usage breakdown by user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">User</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-right p-2">Files</th>
                      <th className="text-right p-2">Storage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.userStats.map((user) => (
                      <tr
                        key={user.userId}
                        className="border-b hover-elevate"
                        data-testid={`row-user-${user.userId}`}
                      >
                        <td className="p-2">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : 'Unknown'}
                        </td>
                        <td className="p-2 text-muted-foreground">{user.email || 'N/A'}</td>
                        <td className="p-2 text-right" data-testid={`text-files-${user.userId}`}>
                          {user.totalFiles}
                        </td>
                        <td className="p-2 text-right" data-testid={`text-storage-${user.userId}`}>
                          {formatBytes(user.totalSize)}
                        </td>
                      </tr>
                    ))}
                    {(!stats?.userStats || stats.userStats.length === 0) && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-muted-foreground">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Reset Password Dialog */}
      <Dialog open={!!userToResetPassword} onOpenChange={(open) => !open && setUserToResetPassword(null)}>
        <DialogContent data-testid="dialog-reset-password">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {userToResetPassword?.firstName} {userToResetPassword?.lastName} ({userToResetPassword?.email})
            </DialogDescription>
          </DialogHeader>
          <Form {...resetPasswordForm}>
            <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
              <FormField
                control={resetPasswordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter new password (min 8 characters)"
                        {...field}
                        data-testid="input-new-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUserToResetPassword(null)}
                  data-testid="button-cancel-reset"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  data-testid="button-submit-reset"
                >
                  {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent data-testid="dialog-delete-user">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.firstName} {userToDelete?.lastName} ({userToDelete?.email})? This action cannot be undone and will delete all user files.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setUserToDelete(null)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HacktivateBackgroundLayout>
  );
}
