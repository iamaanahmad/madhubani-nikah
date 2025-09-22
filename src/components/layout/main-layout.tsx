'use client';

import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import { AppHeader } from './header';
import { AppSidebar } from './sidebar';

export default function MainLayout({children}: {children: React.ReactNode}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
    </SidebarProvider>
  );
}
