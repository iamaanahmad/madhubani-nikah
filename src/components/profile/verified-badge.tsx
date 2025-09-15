import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function VerifiedBadge() {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge variant="outline" className="border-green-600 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 gap-1 pl-1.5 pr-2">
          <ShieldCheck className="h-3.5 w-3.5" />
          Verified
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>This profile has been verified by our team.</p>
      </TooltipContent>
    </Tooltip>
  );
}
