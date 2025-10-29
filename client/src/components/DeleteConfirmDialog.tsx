import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { FileMetadata } from '@shared/schema';

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  file: FileMetadata | null;
  isDeleting: boolean;
}

export function DeleteConfirmDialog({ open, onClose, onConfirm, file, isDeleting }: DeleteConfirmDialogProps) {
  if (!file) return null;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent data-testid="dialog-delete-confirm">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle>Delete {file.isFolder ? 'Folder' : 'File'}?</AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="pt-2">
            Are you sure you want to delete <span className="font-semibold">{file.name}</span>?
            {file.isFolder && <span className="block mt-1">This will delete all files and folders inside it.</span>}
            <span className="block mt-2 text-destructive">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} data-testid="button-cancel-delete">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
