import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ChevronsUpDown } from 'lucide-react';

export type MultiSelectOption = {
  value: string;
  label: string;
};

type Props = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
};

export const MultiSelect: React.FC<Props> = ({ options, value, onChange, placeholder, className }) => {
  const selected = new Set(value);

  const toggle = (v: string) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(Array.from(next));
  };

  const selectedLabels = options.filter(o => selected.has(o.value)).map(o => o.label);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('justify-between w-full', className)}>
          <div className="flex gap-1 flex-wrap items-center overflow-hidden">
            {selectedLabels.length === 0 ? (
              <span className="text-muted-foreground text-sm">{placeholder || 'Sélectionner…'}</span>
            ) : (
              selectedLabels.slice(0, 3).map(l => <Badge key={l} variant="secondary">{l}</Badge>)
            )}
            {selectedLabels.length > 3 ? <Badge variant="secondary">+{selectedLabels.length - 3}</Badge> : null}
          </div>
          <ChevronsUpDown className="h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-2 w-[320px]">
        <ScrollArea className="h-64">
          <div className="space-y-1">
            {options.map(opt => (
              <label
                key={opt.value}
                className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted cursor-pointer"
              >
                <Checkbox checked={selected.has(opt.value)} onCheckedChange={() => toggle(opt.value)} />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
