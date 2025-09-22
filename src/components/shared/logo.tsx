import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <Image src="/IconLogo.png" alt="Madhubani Nikah Logo" width={28} height={28} className="h-7 w-7" />
      <div className="flex flex-col">
        <h1 className="font-headline text-lg font-bold tracking-tight text-foreground">
          Madhubani Nikah
        </h1>
      </div>
    </Link>
  );
}
