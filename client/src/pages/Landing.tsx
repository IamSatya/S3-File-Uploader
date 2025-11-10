import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { FolderOpen } from 'lucide-react';
import { loginSchema, type LoginInput } from '@shared/schema';
import { HacktivateBackgroundLayout } from '@/components/HacktivateBackgroundLayout';

export default function Landing() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      return await apiRequest('POST', '/api/auth/login', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      navigate('/');
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: LoginInput) => {
    loginMutation.mutate(data);
  };

  return (
    <HacktivateBackgroundLayout>
      <header className="border-b backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
              <FolderOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">HackTIvate</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-white drop-shadow-lg">
              Welcome to HackTIvate 2025
            </h2>
            <p className="text-white/90 drop-shadow-md text-lg">
              Secure file management for hackathon participants
            </p>
          </div>

          <Card className="backdrop-blur-md bg-background/95">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">Login to Continue</h3>
                <p className="text-sm text-muted-foreground mt-1">Contact an administrator to create your account</p>
              </div>
              
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    {...loginForm.register('email')}
                    data-testid="input-login-email"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    {...loginForm.register('password')}
                    data-testid="input-login-password"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm">
            <p className="text-white/80 drop-shadow-md">Secure file management for HackTIvate 2025</p>
            <p className="mt-2 text-white/70 drop-shadow-md">Time-limited uploads • Private storage • Full control</p>
          </div>
        </div>
      </main>

      <footer className="border-t backdrop-blur-sm bg-background/80 py-6">
        <div className="container mx-auto px-4 text-center text-sm">
          <p className="text-white/80 drop-shadow-md">HackTIvate 2025 - Secure file management for hackathon participants</p>
        </div>
      </footer>
    </HacktivateBackgroundLayout>
  );
}
