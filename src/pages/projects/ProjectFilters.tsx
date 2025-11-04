import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';

interface ProjectFiltersProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  onFilterClick?: () => void;
}

export function ProjectFilters({
  searchTerm = '',
  onSearchChange,
  onFilterClick
}: ProjectFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-full md:w-auto">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher projet..."
          className="pl-8 w-full md:w-[250px]"
          value={searchTerm}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={onFilterClick}
      >
        <Filter className="h-4 w-4" />
      </Button>
    </div>
  );
}
