import { Button } from '@/components/ui/button';
import { Download, Trash2, X } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onDownload: () => void;
  onDelete: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  isDownloading?: boolean;
}

export function BulkActionBar({ 
  selectedCount, 
  onDownload, 
  onDelete, 
  onCancel,
  isDeleting,
  isDownloading 
}: BulkActionBarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-card border rounded-lg shadow-lg p-4 flex items-center gap-4">
        <span className="text-sm font-medium" data-testid="text-selected-count">
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
        </span>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            disabled={isDownloading || isDeleting}
            data-testid="button-bulk-download"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={isDownloading || isDeleting}
            data-testid="button-bulk-delete"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isDownloading || isDeleting}
            data-testid="button-bulk-cancel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
