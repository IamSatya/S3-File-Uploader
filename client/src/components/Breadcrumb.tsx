import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
}

export function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  const segments = path === '/' ? [] : path.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-1 text-sm" data-testid="breadcrumb">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate('/')}
        className="h-8 gap-2 px-2"
        data-testid="breadcrumb-home"
      >
        <Home className="h-4 w-4" />
        <span>Home</span>
      </Button>

      {segments.map((segment, index) => {
        const segmentPath = '/' + segments.slice(0, index + 1).join('/') + '/';
        const isLast = index === segments.length - 1;

        return (
          <div key={segmentPath} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Button
              variant={isLast ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onNavigate(segmentPath)}
              className="h-8 px-2"
              data-testid={`breadcrumb-${segment}`}
            >
              {decodeURIComponent(segment)}
            </Button>
          </div>
        );
      })}
    </nav>
  );
}
