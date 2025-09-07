'use client';

import { startTransition, useMemo, useOptimistic, useState, useEffect, Fragment } from 'react';
import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { chatModels } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

// Import lucide icons
import { 
  LayoutGrid, 
  HeartPulse, 
  ShoppingCart, 
  Cloud, 
  GraduationCap, 
  Home, 
  Plane, 
  Gamepad2,
} from 'lucide-react';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';

// Define industry groupings with icons
const industries = [
  { id: 'general', name: 'General', icon: LayoutGrid },
  { id: 'healthcare', name: 'Healthcare', icon: HeartPulse },
  { id: 'commerce', name: 'E-commerce', icon: ShoppingCart },
  { id: 'saas', name: 'SaaS', icon: Cloud },
  { id: 'edtech', name: 'EdTech', icon: GraduationCap },
  { id: 'real-estate', name: 'Real Estate', icon: Home },
  { id: 'travel', name: 'Travel & Hospitality', icon: Plane },
  { id: 'esports', name: 'Gaming & Esports', icon: Gamepad2 },
];

export function ModelSelector({
  selectedModelId,
  className,
}: {
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] = useOptimistic(selectedModelId);
  const [activeIndustry, setActiveIndustry] = useState<string>('');

  const selectedChatModel = useMemo(
    () => chatModels.find((chatModel) => chatModel.id === optimisticModelId),
    [optimisticModelId],
  );

  // Set initial active industry based on selected model
  useEffect(() => {
    if (!activeIndustry && selectedChatModel) {
      const industryKey = selectedChatModel.id.split('-')[1];
      if (industryKey) {
        const industry = industries.find(
          (ind) => ind.id === industryKey || industryKey.startsWith(ind.id),
        );
        if (industry) setActiveIndustry(industry.id);
      }
    }
  }, [activeIndustry, selectedChatModel]);

  // Get models for the active industry
  const industryModels = useMemo(() => {
    if (!activeIndustry) return [];
    return chatModels.filter((model) => 
      model.id.startsWith(`elle-${activeIndustry}`)
    );
  }, [activeIndustry]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button
          data-testid="model-selector"
          variant="outline"
          className="md:px-2 md:h-[34px]"
        >
          {selectedChatModel?.name || "elle-general-base"}
          <ChevronDownIcon/>
        </Button>

      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-[550px] max-sm:w-[calc(100vw-32px)] mr-4 p-0 overflow-hidden"
      >
        <div className="flex">
          {/* Industry List */}
          <div className="w-1/3 border-r">
            {industries.map((industry, index) => {
              const Icon = industry.icon;
              return (
                <Fragment key={industry.id}>
          <div
            className={cn(
              'p-3 cursor-pointer flex items-center transition-all duration-300 ease-out',
              'hover:bg-accent/70 hover:shadow-lg',
              activeIndustry === industry.id ? 'bg-accent rounded-lg' : ''
            )}
            onMouseEnter={() => setActiveIndustry(industry.id)}
          >
                    <Icon className="size-4 mr-2 shrink-0" />
                    <span className="truncate text-sm">{industry.name}</span>
                  </div>
                  
                  {index === 0 && (
                    <div 
                      className="border-b border-border/50 my-1 mx-2"
                      aria-hidden="true"
                    />
                  )}
                </Fragment>
              );
            })}
          </div>
          
          {/* Model List */}
          <div className="w-2/3 max-h-[400px] overflow-y-auto">
            {industryModels.map((model) => {
              const { id } = model;
              return (
                <DropdownMenuItem
                  data-testid={`model-selector-item-${id}`}
                  key={id}
                  onSelect={() => {
                    setOpen(false);
                    startTransition(() => {
                      setOptimisticModelId(id);
                      saveChatModelAsCookie(id);
                    });
                  }}
                  data-active={id === optimisticModelId}
                  asChild
                >
                  <button
                    type="button"
                    className="gap-4 group/item flex flex-row justify-between items-center w-full p-3 hover:bg-accent/50 hover:rounded-lg hover:shadow-md transition-colors duration-200"
                  >
                    <div className="flex flex-col gap-1 items-start">
                      <div className="text-sm">{model.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {model.description}
                      </div>
                    </div>

                    <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                      {id === optimisticModelId && <CheckCircleFillIcon />}
                    </div>
                  </button>
                </DropdownMenuItem>
              );
            })}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}