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
  ShieldCheck,
  User,
} from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Logo } from '@/components/shared/logo';
import { navLinks } from './nav-links';
import { Link, usePathname, useRouter } from '@i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

export function AppHeader() {
  const t = useTranslations('Header');
  const { user, logout } = useAuth();
  const { profile } = useProfile(user?.$id);
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  
  const loggedIn = !!user;

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, {locale: newLocale});
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || 'Logout failed');
    }
  };

  const translatedNavLinks = navLinks.map(link => ({
    ...link,
    label: t(link.label as any),
  }));

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-8">
      <div className="flex items-center gap-2 md:gap-6">
        <SidebarTrigger className="md:hidden" />
        <Logo />
      </div>
      <nav className="hidden flex-1 md:flex items-center justify-center gap-4 text-sm font-medium">
        {translatedNavLinks.map(link => (
            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
            </Link>
        ))}
      </nav>
      <div className="flex flex-1 items-center justify-end gap-2 md:flex-initial">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" id="language-switcher">
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
        
        {loggedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border">
                  <AvatarImage
                    src={profile?.profilePictureUrl}
                    alt={user?.name || 'User'}
                  />
                  <AvatarFallback>
                    {(user?.name || profile?.name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || profile?.name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/profile/${profile?.$id || user?.$id}`}>
                    <User className="mr-2" />
                    <span>My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                 <Link href="/profile/verify">
                    <ShieldCheck className="mr-2" />
                    <span>Get Verified</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                    <Settings className="mr-2" />
                    <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
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
