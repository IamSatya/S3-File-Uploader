import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileMetadata } from '@shared/schema';
import { Loader2, FileQuestion } from 'lucide-react';
import { useState, useEffect } from 'react';

interface FilePreviewModalProps {
  file: FileMetadata | null;
  onClose: () => void;
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [textContent, setTextContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isImage = file?.mimeType?.startsWith('image/');
  const isPDF = file?.mimeType === 'application/pdf';
  const isText = file?.mimeType?.startsWith('text/') || 
                 file?.mimeType === 'application/json' ||
                 file?.name.endsWith('.md') ||
                 file?.name.endsWith('.txt') ||
                 file?.name.endsWith('.json') ||
                 file?.name.endsWith('.js') ||
                 file?.name.endsWith('.ts') ||
                 file?.name.endsWith('.tsx') ||
                 file?.name.endsWith('.jsx') ||
                 file?.name.endsWith('.css') ||
                 file?.name.endsWith('.html');
  
  const canPreview = isImage || isPDF || isText;

  useEffect(() => {
    if (!file || file.isFolder) return;
    
    let currentUrl = '';
    
    async function loadPreview() {
      if (!file) return;
      
      setLoading(true);
      setError(null);
      setPreviewUrl('');
      setTextContent('');
      
      try {
        if (isImage || isPDF) {
          const response = await fetch(`/api/files/download/${file.id}`);
          if (!response.ok) throw new Error('Failed to load file');
          
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          currentUrl = url;
          setPreviewUrl(url);
        } else if (isText) {
          const response = await fetch(`/api/files/download/${file.id}`);
          if (!response.ok) throw new Error('Failed to load file');
          
          const text = await response.text();
          setTextContent(text);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preview');
      } finally {
        setLoading(false);
      }
    }

    if (canPreview) {
      loadPreview();
    }

    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [file?.id, canPreview, isImage, isPDF, isText]);

  if (!file) return null;

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="dialog-file-preview">
        <DialogHeader>
          <DialogTitle data-testid="text-preview-title">{file.name}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}

          {!loading && !error && !canPreview && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Preview not available for this file type
              </p>
            </div>
          )}

          {!loading && !error && isImage && previewUrl && (
            <div className="flex items-center justify-center p-4">
              <img 
                src={previewUrl} 
                alt={file.name} 
                className="max-w-full max-h-[70vh] object-contain rounded-md"
                data-testid="img-preview"
              />
            </div>
          )}

          {!loading && !error && isPDF && previewUrl && (
            <iframe
              src={previewUrl}
              className="w-full h-[70vh] border-0 rounded-md"
              title={file.name}
              data-testid="iframe-pdf-preview"
            />
          )}

          {!loading && !error && isText && textContent && (
            <pre className="p-4 bg-muted rounded-md text-sm overflow-auto font-mono" data-testid="pre-text-preview">
              {textContent}
            </pre>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
