'use client';

import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import { AppHeader } from './header';
import { AppSidebar } from './sidebar';
import { AppFooter } from './footer';
import { InstallPwaPrompt } from '../shared/install-pwa-prompt';

export default function MainLayout({children}: {children: React.ReactNode}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1">{children}</main>
        <AppFooter />
        <InstallPwaPrompt />
      </div>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
    </SidebarProvider>
  );
}
