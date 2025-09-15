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
  LayoutGrid,
  Heart,
  MessagesSquare,
  User,
  Settings,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Logo } from '../shared/logo';
import { Separator } from '../ui/separator';

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutGrid },
  { href: '/matches', label: 'Matches', icon: Heart },
  { href: '/messages', label: 'Messages', icon: MessagesSquare },
  { href: '/profile', label: 'Profile', icon: User },
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
