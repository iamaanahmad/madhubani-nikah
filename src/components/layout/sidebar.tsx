
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
  Settings,
} from 'lucide-react';
import { usePathname } from 'next-intl/navigation';
import { Logo } from '../shared/logo';
import { Separator } from '../ui/separator';
import { navLinks } from './nav-links';
import { useTranslations } from 'next-intl';
import { Link } from 'next-intl/navigation';

export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations('Header');

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <Separator />
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.endsWith(link.href)}
                tooltip={t(link.label as any)}
              >
                <Link href={link.href} className="text-base h-11">
                  <link.icon />
                  <span>{t(link.label as any)}</span>
                </Link>
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
              <Link href="/settings" className="text-base h-11">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
