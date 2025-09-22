'use client';

import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Languages,
  LifeBuoy,
  LogOut,
  Settings,
  User,
} from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Logo } from '@/components/shared/logo';
import { currentUser } from '@/lib/data';
import Link from 'next/link';
import { navLinks } from './nav-links';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

export function AppHeader() {
  const t = useTranslations('Header');
  const loggedIn = false; // Placeholder for auth state
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  const handleLanguageChange = (newLocale: string) => {
    // This will replace the locale in the path and reload the page.
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.replace(newPath);
  };

  const translatedNavLinks = navLinks.map(link => ({
    ...link,
    label: t(link.label as any),
  }));

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-8">
      <div className="flex items-center gap-6">
        <SidebarTrigger className="md:hidden" />
        <Logo />
      </div>
      <nav className="hidden md:flex flex-1 items-center justify-center gap-4 text-sm font-medium">
        {translatedNavLinks.map(link => (
            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
            </Link>
        ))}
      </nav>
      <div className="flex items-center justify-end gap-2 md:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Languages className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">{t('language')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => handleLanguageChange('en')}>English</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleLanguageChange('hi')}>हिंदी</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleLanguageChange('ur')}>اردو</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button variant="outline" size="icon" asChild>
            <Link href="/help">
              <LifeBuoy className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Help & Support</span>
            </Link>
        </Button>
        
        {loggedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border">
                  <AvatarImage
                    src={currentUser.profilePicture.url}
                    alt={currentUser.name}
                    data-ai-hint={currentUser.profilePicture.hint}
                  />
                  <AvatarFallback>
                    {currentUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {currentUser.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild>
            <Link href="/login">{t('login')}</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
