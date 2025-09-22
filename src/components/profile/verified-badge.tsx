import { ShieldCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function VerifiedBadge() {
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <ShieldCheck className="h-5 w-5 fill-current" />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>This profile has been verified by our team.</p>
      </TooltipContent>
    </Tooltip>
  );
}
