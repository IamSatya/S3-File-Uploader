import { Search, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

interface FileSearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  fileType: string;
  onFileTypeChange: (value: string) => void;
  dateRange: string;
  onDateRangeChange: (value: string) => void;
}

export function FileSearchBar({ 
  search, 
  onSearchChange, 
  fileType, 
  onFileTypeChange,
  dateRange,
  onDateRangeChange 
}: FileSearchBarProps) {
  const getDateRangeLabel = () => {
    if (!dateRange || dateRange === 'all') return 'All dates';
    if (dateRange === 'today') return 'Today';
    if (dateRange === 'week') return 'This week';
    if (dateRange === 'month') return 'This month';
    return 'All dates';
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
          data-testid="input-search-files"
        />
      </div>
      
      <Select value={fileType} onValueChange={onFileTypeChange}>
        <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-file-type">
          <SelectValue placeholder="All file types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All file types</SelectItem>
          <SelectItem value="folder">Folders</SelectItem>
          <SelectItem value="image">Images</SelectItem>
          <SelectItem value="document">Documents</SelectItem>
          <SelectItem value="video">Videos</SelectItem>
          <SelectItem value="audio">Audio</SelectItem>
          <SelectItem value="archive">Archives</SelectItem>
        </SelectContent>
      </Select>

      <Select value={dateRange} onValueChange={onDateRangeChange}>
        <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-date-range">
          <Calendar className="mr-2 h-4 w-4" />
          <SelectValue placeholder="All dates" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All dates</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">This week</SelectItem>
          <SelectItem value="month">This month</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
