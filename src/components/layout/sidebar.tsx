'use client';

import * as React from 'react';
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Home,
  Search,
  Heart,
  BookOpen,
  Info,
  LifeBuoy,
  Settings,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Logo } from '../shared/logo';
import { Separator } from '../ui/separator';

const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search Profiles', icon: Search },
  { href: '/stories', label: 'Success Stories', icon: Heart },
  { href: '/guidance', label: 'Islamic Guidance', icon: BookOpen },
  { href: '/about', label: 'About Us', icon: Info },
  { href: '/help', label: 'Help', icon: LifeBuoy },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <SidebarMenu>
          {links.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === link.href}
                tooltip={link.label}
              >
                <a href={link.href}>
                  <link.icon />
                  <span>{link.label}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <Separator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <a href="/settings">
                <Settings />
                <span>Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
