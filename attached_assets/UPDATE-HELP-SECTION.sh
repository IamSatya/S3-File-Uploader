#!/bin/bash
# Update Help Section to be Collapsible with Better Explanations
# Run this on your VPS: bash UPDATE-HELP-SECTION.sh

cd /var/www/hackfiles

echo "📝 Updating Help Section..."

# Backup files
cp client/src/components/WelcomeInstructions.tsx client/src/components/WelcomeInstructions.tsx.backup-help
cp client/src/pages/Dashboard.tsx client/src/pages/Dashboard.tsx.backup-help

# Update WelcomeInstructions component
cat > client/src/components/WelcomeInstructions.tsx << 'WELCOME_END'
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
          <CardTitle className="text-xl">How to Use HackFiles</CardTitle>
          <CardDescription className="mt-1">
            Everything you need to know about managing your files
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
        <div className="grid gap-4 text-sm">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Upload className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold">📤 Uploading Files</p>
              <p className="text-muted-foreground">
                Simply drag files from your computer and drop them anywhere on this page. Or click the "Upload Files" button to browse and select files from your computer.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <FolderPlus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold">📁 Creating Folders</p>
              <p className="text-muted-foreground">
                Click the "New Folder" button to create folders. This helps you organize your files - like creating separate folders for code, documents, and images. You can create folders inside folders too!
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Download className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold">⬇️ Downloading Files</p>
              <p className="text-muted-foreground">
                Click on any file to download it back to your computer instantly. It's that simple!
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Trash2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold">🗑️ Deleting Files</p>
              <p className="text-muted-foreground">
                Click the three dots (⋮) next to any file or folder, then select "Delete" to remove it. Don't worry - we'll ask you to confirm before deleting anything!
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold">⏰ Upload Deadline</p>
              <p className="text-muted-foreground">
                See the timer at the top? When it reaches zero, you won't be able to upload new files anymore (hackathon rules!). But don't worry - you can still download and view your existing files anytime.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold">🔒 Privacy & Security</p>
              <p className="text-muted-foreground">
                Your files are completely private - only you can see them. No one else (except admins if needed) can access your uploaded files.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
WELCOME_END

echo "✅ WelcomeInstructions.tsx updated!"

# Update Dashboard.tsx - Add HelpCircle import
sed -i "s/import { FolderPlus, Upload, LogOut, FolderOpen, Loader2, CheckSquare, Settings, Database } from 'lucide-react';/import { FolderPlus, Upload, LogOut, FolderOpen, Loader2, CheckSquare, Settings, Database, HelpCircle } from 'lucide-react';/" client/src/pages/Dashboard.tsx

# Change showInstructions default to false
sed -i "s/const \[showInstructions, setShowInstructions\] = useState(true);/const [showInstructions, setShowInstructions] = useState(false);/" client/src/pages/Dashboard.tsx

echo "✅ Dashboard.tsx imports updated!"
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "You need to add the Help button in Dashboard.tsx manually"
echo ""
echo "In client/src/pages/Dashboard.tsx, find this section (around line 432):"
echo '  <div className="flex items-center gap-4">'
echo '    <DropdownMenu>'
echo ""
echo "Add this BEFORE the <DropdownMenu>:"
echo '  <Button'
echo '    variant="outline"'
echo '    size="sm"'
echo '    onClick={() => setShowInstructions(!showInstructions)}'
echo '    data-testid="button-help"'
echo '  >'
echo '    <HelpCircle className="mr-2 h-4 w-4" />'
echo '    Help'
echo '  </Button>'
echo ""
echo "Then rebuild:"
echo "  npm run build"
echo "  pm2 restart index"
echo ""
