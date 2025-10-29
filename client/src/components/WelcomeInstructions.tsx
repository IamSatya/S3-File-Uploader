import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Upload, FolderPlus, Download, Trash2, Clock, Shield } from 'lucide-react';

interface WelcomeInstructionsProps {
  onClose: () => void;
}

export function WelcomeInstructions({ onClose }: WelcomeInstructionsProps) {
  return (
    <Card className="border-primary/20" data-testid="welcome-instructions">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl">Welcome to HackFiles!</CardTitle>
          <CardDescription className="mt-1">
            Your secure file management platform for the hackathon
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          data-testid="button-close-instructions"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Upload className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Upload Files & Folders</p>
              <p className="text-muted-foreground">
                Drag and drop files directly, or click the upload buttons to select files and entire folders
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <FolderPlus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Organize with Folders</p>
              <p className="text-muted-foreground">
                Create nested folders to keep your hackathon project organized
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Download className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Download Anytime</p>
              <p className="text-muted-foreground">
                Click on any file to download it instantly
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Trash2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Manage Your Files</p>
              <p className="text-muted-foreground">
                Delete files and folders you no longer need using the menu button
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Time-Limited Uploads</p>
              <p className="text-muted-foreground">
                Watch the countdown timer - uploads will be disabled when the deadline is reached
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Your Files Are Private</p>
              <p className="text-muted-foreground">
                Only you can see and access your uploaded files
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
