
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function VerifiedBadge() {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Image
          src="/verified.svg"
          alt="Verified Account"
          width={20}
          height={20}
          className="h-5 w-5"
        />
      </TooltipTrigger>
      <TooltipContent>
        <p>This profile has been verified by our team.</p>
      </TooltipContent>
    </Tooltip>
  );
}
