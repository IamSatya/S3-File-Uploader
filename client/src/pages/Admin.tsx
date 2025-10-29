import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, HardDrive, Files, Clock } from "lucide-react";
import type { TimerConfig } from "@shared/schema";

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
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold" data-testid="text-admin-title">Admin Dashboard</h1>
            <Button variant="outline" onClick={() => navigate('/')} data-testid="button-back-to-dashboard">
              Back to Dashboard
            </Button>
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
    </div>
  );
}
