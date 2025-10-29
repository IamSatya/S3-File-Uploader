import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FolderOpen, Clock, Shield, Download, Trash2 } from 'lucide-react';

export default function Landing() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
              <FolderOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">HackFiles</h1>
          </div>
          <Button onClick={handleLogin} size="lg" data-testid="button-login">
            Sign In
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
              Secure File Management for Hackathons
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload, organize, and manage your project files with ease. Built for hackathon participants who need reliable, time-limited file storage.
            </p>
            <div className="pt-4">
              <Button onClick={handleLogin} size="lg" className="text-lg h-12 px-8" data-testid="button-get-started">
                Get Started
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-16">
            <h3 className="text-3xl font-bold text-center mb-12">Features</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              <Card>
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 mb-4">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Easy Upload</CardTitle>
                  <CardDescription>
                    Drag and drop files or select entire folders to upload to S3
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 mb-4">
                    <FolderOpen className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Organize Files</CardTitle>
                  <CardDescription>
                    Create folders and organize your hackathon project files efficiently
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 mb-4">
                    <Download className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Download Anytime</CardTitle>
                  <CardDescription>
                    Download your files whenever you need them with a single click
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 mb-4">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Time-Limited Access</CardTitle>
                  <CardDescription>
                    Countdown timer ensures uploads close when the hackathon deadline arrives
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Private & Secure</CardTitle>
                  <CardDescription>
                    Your files are isolated - only you can access your uploaded content
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 mb-4">
                    <Trash2 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Full Control</CardTitle>
                  <CardDescription>
                    Delete files and folders you no longer need with ease
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section className="border-t">
          <div className="container mx-auto px-4 py-16 text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to get started?</h3>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Sign in now and start managing your hackathon files securely
            </p>
            <Button onClick={handleLogin} size="lg" data-testid="button-sign-in-footer">
              Sign In Now
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>HackFiles - Secure file management for hackathons</p>
        </div>
      </footer>
    </div>
  );
}
