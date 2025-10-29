import { useCallback, useState } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface FileUploadZoneProps {
  onUpload: (files: FileList) => void;
  isUploading: boolean;
  disabled: boolean;
}

export function FileUploadZone({ onUpload, isUploading, disabled }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled || isUploading) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onUpload(files);
    }
  }, [disabled, isUploading, onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(files);
    }
    e.target.value = '';
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      data-testid="file-upload-zone"
    >
      <Card
        className={`
          border-2 border-dashed transition-colors cursor-pointer
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}
        `}
      >
        <label className={`flex flex-col items-center justify-center gap-3 p-8 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
            className="sr-only"
            data-testid="input-file-upload"
          />
          
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <Upload className="h-6 w-6 text-primary" />
            )}
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm font-medium">
              {isUploading ? 'Uploading...' : disabled ? 'Upload Disabled' : 'Drop files here or click to browse'}
            </p>
            {!disabled && !isUploading && (
              <p className="text-xs text-muted-foreground">
                Select multiple files to upload
              </p>
            )}
          </div>
        </label>
      </Card>
    </div>
  );
}
