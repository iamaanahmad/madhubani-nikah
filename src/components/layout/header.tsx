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
  Moon,
  Settings,
  User,
  Home,
  Search,
  Heart,
  BookOpen,
  Info,
} from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Logo } from '@/components/shared/logo';
import { currentUser } from '@/lib/data';
import Link from 'next/link';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search Profiles', icon: Search },
  { href: '/stories', label: 'Success Stories', icon: Heart },
  { href: '/guidance', label: 'Islamic Guidance', icon: BookOpen },
  { href: '/about', label: 'About Us', icon: Info },
  { href: '/help', label: 'Help', icon: LifeBuoy },
];

export function AppHeader() {
  const loggedIn = false; // Placeholder for auth state

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-8">
      <SidebarTrigger className="md:hidden" />
      <div className="flex items-center gap-6">
        <div className="hidden md:block">
          <Logo />
        </div>
      </div>
      <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
        {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
            </Link>
        ))}
      </nav>
      <div className="flex w-full items-center justify-end gap-2 md:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Languages className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Switch language</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>English</DropdownMenuItem>
            <DropdownMenuItem>हिंदी</DropdownMenuItem>
            <DropdownMenuItem>اردو</DropdownMenuItem>
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
                    Guardian Account
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
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
