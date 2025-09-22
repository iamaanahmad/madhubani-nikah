'use client';

import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import { AppHeader } from './header';
import { AppSidebar } from './sidebar';

export default function MainLayout({children}: {children: React.ReactNode}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1">{children}</main>
      </div>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
    </SidebarProvider>
  );
}
