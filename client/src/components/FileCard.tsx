import { MoreVertical, Download, Trash2, Folder, FileText, Image as ImageIcon, Video, Music, FileArchive, File, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatFileSize, formatDate } from '@/lib/formatUtils';
import type { FileMetadata } from '@shared/schema';

interface FileCardProps {
  file: FileMetadata;
  onDownload: (file: FileMetadata) => void;
  onDelete: (file: FileMetadata) => void;
  onNavigate: (file: FileMetadata) => void;
  onPreview?: (file: FileMetadata) => void;
  isSelected?: boolean;
  onSelect?: (file: FileMetadata, selected: boolean) => void;
  selectionMode?: boolean;
}

function getFileIcon(mimeType: string | null, isFolder: boolean) {
  if (isFolder) return Folder;
  
  if (!mimeType) return FileText;
  
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return FileArchive;
  if (mimeType.includes('text/')) return FileText;
  
  return File;
}

export function FileCard({ file, onDownload, onDelete, onNavigate, onPreview, isSelected, onSelect, selectionMode }: FileCardProps) {
  const Icon = getFileIcon(file.mimeType, file.isFolder);
  const iconColor = file.isFolder ? 'text-primary' : 'text-muted-foreground';

  const isPreviewable = !file.isFolder && (
    file.mimeType?.startsWith('image/') ||
    file.mimeType === 'application/pdf' ||
    file.mimeType?.startsWith('text/') ||
    file.mimeType === 'application/json' ||
    file.name.endsWith('.md') ||
    file.name.endsWith('.txt') ||
    file.name.endsWith('.json') ||
    file.name.endsWith('.js') ||
    file.name.endsWith('.ts') ||
    file.name.endsWith('.tsx') ||
    file.name.endsWith('.jsx') ||
    file.name.endsWith('.css') ||
    file.name.endsWith('.html')
  );

  const handleClick = () => {
    if (selectionMode && onSelect) {
      onSelect(file, !isSelected);
    } else if (file.isFolder) {
      onNavigate(file);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (onSelect) {
      onSelect(file, checked);
    }
  };

  return (
    <Card
      className={`hover-elevate ${file.isFolder && !selectionMode ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={handleClick}
      data-testid={`file-card-${file.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {selectionMode && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              data-testid={`checkbox-select-${file.id}`}
              className="mt-3"
            />
          )}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted ${iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="font-medium text-sm leading-none truncate" title={file.name} data-testid={`file-name-${file.id}`}>
                {file.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                {!file.isFolder && <span data-testid={`file-size-${file.id}`}>{formatFileSize(file.size)}</span>}
                {!file.isFolder && <span>•</span>}
                <span data-testid={`file-date-${file.id}`}>{formatDate(file.createdAt!)}</span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                data-testid={`button-menu-${file.id}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isPreviewable && onPreview && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(file);
                  }}
                  data-testid={`button-preview-${file.id}`}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </DropdownMenuItem>
              )}
              {!file.isFolder && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(file);
                  }}
                  data-testid={`button-download-${file.id}`}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(file);
                }}
                className="text-destructive focus:text-destructive"
                data-testid={`button-delete-${file.id}`}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
